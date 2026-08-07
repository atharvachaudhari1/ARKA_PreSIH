import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { recomputeNeededFemaleCount } from "@/lib/teamQuota";
import { sendEmail } from "@/lib/email";
import { scheduleAfter } from "@/lib/scheduleAfter";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const currentUser = await prisma.user.findUnique({
    where: { auth_user_id: authUser.id },
    include: { team_memberships: { where: { team: { status: { not: 'dissolved' } } } } }
  });
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { decision, slot_id } = body;
  if (!decision || !["accept", "reject"].includes(decision)) {
    return NextResponse.json({ error: "Invalid decision. Must be accept or reject." }, { status: 400 });
  }

  const joinRequest = await prisma.joinRequest.findUnique({
    where: { id: id },
    include: {
      team: { include: { event: true, memberships: { include: { user: true } } } },
      requester: { include: { team_memberships: { where: { team: { status: { not: 'dissolved' } } } } } }
    }
  });

  if (!joinRequest) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (joinRequest.status !== "pending") return NextResponse.json({ error: "Request is no longer pending." }, { status: 400 });

  // Caller MUST be the leader of this team OR the invited user (depending on direction)
  let isAuthorized = false;
  if (joinRequest.direction === "user_to_team") {
    const leaderMembership = currentUser.team_memberships.find(m => m.team_id === joinRequest.team_id && m.role === "leader");
    if (leaderMembership) isAuthorized = true;
  } else if (joinRequest.direction === "team_to_user") {
    if (currentUser.id === joinRequest.requester_id) isAuthorized = true;
  }

  if (!isAuthorized) return NextResponse.json({ error: "You are not authorized to make this decision." }, { status: 403 });

  if (decision === "reject") {
    const updated = await prisma.$transaction(async (tx) => {
      const req = await tx.joinRequest.update({
        where: { id: joinRequest.id },
        data: {
          status: "rejected",
          final_decision_by: currentUser.id,
          resolved_at: new Date(),
        }
      });
      // Trigger notification to the other party
      if (joinRequest.direction === "user_to_team") {
        await tx.notification.create({
          data: {
            user_id: joinRequest.requester_id,
            type: "request_rejected",
            team_id: joinRequest.team_id,
            payload: { team_name: joinRequest.team.name }
          }
        });
      } else {
        await tx.notification.create({
          data: {
            user_id: joinRequest.team.leader_id,
            type: "request_rejected",
            team_id: joinRequest.team_id,
            payload: { team_name: joinRequest.team.name, user_name: currentUser.name }
          }
        });
      }
      return req;
    });
    // Email the affected party about the rejection (does not block the response)
    scheduleAfter(async () => {
      if (joinRequest.direction === "user_to_team") {
        if (joinRequest.requester.email) {
          await sendEmail({
            to: joinRequest.requester.email,
            subject: `Update on your request to ${joinRequest.team.name}`,
            html: `<p>Hello ${joinRequest.requester.name}!</p><p>Your request to join the team <strong>${joinRequest.team.name}</strong> was not accepted.</p><p>Don't worry — browse other open teams on TeamUp to find your team.</p>`
          });
        }
      } else {
        const teamLeader = joinRequest.team.memberships?.find((m: any) => m.role === "leader");
        if (teamLeader?.user?.email) {
          await sendEmail({
            to: teamLeader.user.email,
            subject: `${joinRequest.requester.name} declined your invite`,
            html: `<p>Hello!</p><p>${joinRequest.requester.name} declined the invitation to join <strong>${joinRequest.team.name}</strong>.</p><p>You can invite other members from your team dashboard.</p>`
          });
        }
      }
    });
    return NextResponse.json({ joinRequest: updated });
  }

  if (decision === "accept") {
    if (joinRequest.team.status === "full") {
      return NextResponse.json({ error: "Your team is already full." }, { status: 400 });
    }
    if (joinRequest.requester.team_memberships.length > 0) {
      return NextResponse.json({ error: "This user has already joined another team." }, { status: 400 });
    }

    try {
      const updated = await prisma.$transaction(async (tx) => {
        // 0. Fetch fresh team state to prevent concurrent over-commitment
        const freshTeam = await tx.team.findUnique({
          where: { id: joinRequest.team_id },
          include: { event: true, memberships: { include: { user: true } } }
        });
        if (!freshTeam) throw new Error("Team not found");
        if (freshTeam.status === "full") throw new Error("Your team is already full.");

        // 0.5 Fetch fresh user state to prevent 1-team rule race condition
        const freshUser = await tx.user.findUnique({
          where: { id: joinRequest.requester_id },
          include: { team_memberships: { where: { team: { status: { not: 'dissolved' } } }, select: { id: true } } }
        });
        if (!freshUser || freshUser.team_memberships.length > 0) {
           throw new Error("This user has already joined another team.");
        }

        // Check if this accept would make it mathematically impossible to meet the female quota
        const currentCount = freshTeam.memberships.length;
        const maxCount = freshTeam.event.team_size_max;
        
        const newCount = currentCount + 1;
        const remainingSlots = maxCount - newCount;
        
        let femaleCount = freshTeam.memberships.filter(
          (m: any) => m.user.counts_toward_female_quota
        ).length;
        
        if (joinRequest.requester.counts_toward_female_quota) {
          femaleCount += 1;
        }

        const stillNeeded = freshTeam.event.min_female_required - femaleCount;
        
        if (stillNeeded > remainingSlots) {
           throw new Error(`Cannot accept this request. Your team would have ${remainingSlots} slots left, but still needs ${stillNeeded} female member(s) to meet the event quota.`);
        }

        // 1. Mark request as accepted
        const req = await tx.joinRequest.update({
          where: { id: joinRequest.id },
          data: {
            status: "accepted",
            final_decision_by: currentUser.id,
            resolved_at: new Date(),
          }
        });

        // 2. Add user to team
        await tx.teamMembership.create({
          data: {
            team_id: joinRequest.team_id,
            user_id: joinRequest.requester_id,
            role: "member",
          }
        });

        // 2.25 Recompute female quota requirement now that membership changed
        await recomputeNeededFemaleCount(tx, joinRequest.team_id);

        // 2.5 Claim a slot
        let targetSlot = null;
        if (slot_id) {
          targetSlot = await tx.teamSlot.findUnique({ where: { id: slot_id } });
          if (targetSlot && (targetSlot.team_id !== joinRequest.team_id || targetSlot.is_filled)) {
            targetSlot = null;
          }
        }
        if (!targetSlot) {
          targetSlot = await tx.teamSlot.findFirst({
            where: { team_id: joinRequest.team_id, is_filled: false }
          });
        }
        if (targetSlot) {
          await tx.teamSlot.update({
            where: { id: targetSlot.id },
            data: { is_filled: true, filled_by_user_id: joinRequest.requester_id }
          });
        }

        // 3. Cascade-expire all other pending requests FOR THIS USER
        const userOtherRequests = await tx.joinRequest.findMany({
          where: {
            requester_id: joinRequest.requester_id,
            status: "pending",
            id: { not: joinRequest.id }
          },
          include: { team: { select: { leader_id: true, name: true } } }
        });
        
        await tx.joinRequest.updateMany({
          where: {
            requester_id: joinRequest.requester_id,
            status: "pending",
            id: { not: joinRequest.id }
          },
          data: {
            status: "expired",
            expired_reason: "requester_joined_another_team",
            resolved_at: new Date(),
          }
        });

        // Send notifications for expired requests (to the team leader of the expired request)
        await Promise.all(
          userOtherRequests.map((req) =>
            tx.notification.create({
              data: {
                user_id: req.team.leader_id,
                type: "request_expired_other_team_joined",
                team_id: req.team_id,
                payload: { team_name: req.team.name, user_name: freshUser.name }
              }
            })
          )
        );

        // 4. Notify the other party they were accepted
        if (joinRequest.direction === "user_to_team") {
          await tx.notification.create({
            data: {
              user_id: joinRequest.requester_id,
              type: "request_accepted",
              team_id: joinRequest.team_id,
              payload: { team_name: joinRequest.team.name }
            }
          });
        } else {
          await tx.notification.create({
            data: {
              user_id: joinRequest.team.leader_id,
              type: "request_accepted",
              team_id: joinRequest.team_id,
              payload: { team_name: joinRequest.team.name, user_name: currentUser.name }
            }
          });
        }
        // 5. Check team capacity
        const finalCount = currentCount + 1; // including the new member
        if (finalCount >= freshTeam.event.team_size_max) {
          // Team is now full
          await tx.team.update({
            where: { id: joinRequest.team_id },
            data: { status: "full" }
          });

          // Expire all other pending requests FOR THIS TEAM
          const otherTeamRequests = await tx.joinRequest.findMany({
            where: { team_id: joinRequest.team_id, status: "pending" }
          });

          await tx.joinRequest.updateMany({
            where: { team_id: joinRequest.team_id, status: "pending" },
            data: {
              status: "expired",
              expired_reason: "team_full",
              resolved_at: new Date(),
            }
          });

          await Promise.all(
            otherTeamRequests.map((tr) =>
              tx.notification.create({
                data: {
                  user_id: tr.requester_id,
                  type: "team_now_full",
                  team_id: joinRequest.team_id,
                  payload: { team_name: joinRequest.team.name }
                }
              })
            )
          );
        }

        return req;
      });

      // Email the affected party about the acceptance (does not block the response)
      scheduleAfter(async () => {
        if (joinRequest.direction === "user_to_team") {
          if (joinRequest.requester.email) {
            await sendEmail({
              to: joinRequest.requester.email,
              subject: `You're in! Accepted into ${joinRequest.team.name}`,
              html: `<p>Hello ${joinRequest.requester.name}!</p><p>Great news — your request to join <strong>${joinRequest.team.name}</strong> has been <strong>accepted</strong>.</p><p>Log in to TeamUp to see your team dashboard.</p>`
            });
          }
        } else {
          const teamLeader = joinRequest.team.memberships?.find((m: any) => m.role === "leader");
          if (teamLeader?.user?.email) {
            await sendEmail({
              to: teamLeader.user.email,
              subject: `${joinRequest.requester.name} joined your team!`,
              html: `<p>Hello!</p><p>${joinRequest.requester.name} accepted your invite and joined <strong>${joinRequest.team.name}</strong>.</p><p>View your updated team on TeamUp.</p>`
            });
          }
        }
      });

      return NextResponse.json({ joinRequest: updated });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
  }
}
