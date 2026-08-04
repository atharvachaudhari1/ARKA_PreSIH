import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
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
    include: { team_memberships: true }
  });
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { decision } = body;
  if (!decision || !["accept", "reject"].includes(decision)) {
    return NextResponse.json({ error: "Invalid decision. Must be accept or reject." }, { status: 400 });
  }

  const joinRequest = await prisma.joinRequest.findUnique({
    where: { id: id },
    include: {
      team: { include: { event: true, memberships: { include: { user: true } } } },
      requester: { include: { team_memberships: true } }
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
            payload: { user_name: currentUser.name }
          }
        });
      }
      return req;
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

        // Check if this accept would make it mathematically impossible to meet the female quota
        const currentCount = freshTeam.memberships.length;
        const maxCount = freshTeam.event.team_size_max;
        
        const newCount = currentCount + 1;
        const remainingSlots = maxCount - newCount;
        
        let verifiedFemaleCount = freshTeam.memberships.filter(
          (m: any) => m.user.counts_toward_female_quota && m.user.verification_status === "verified"
        ).length;
        
        if (joinRequest.requester.counts_toward_female_quota && joinRequest.requester.verification_status === "verified") {
          verifiedFemaleCount += 1;
        }

        const stillNeeded = freshTeam.event.min_female_required - verifiedFemaleCount;
        
        if (stillNeeded > remainingSlots) {
           throw new Error(`Cannot accept this request. Your team would have ${remainingSlots} slots left, but still needs ${stillNeeded} verified female member(s) to meet the event quota.`);
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

        // 3. Cascade-expire all other pending requests FOR THIS USER
        const userOtherRequests = await tx.joinRequest.findMany({
          where: {
            requester_id: joinRequest.requester_id,
            status: "pending",
            id: { not: joinRequest.id }
          }
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

        // Send notifications for expired requests
        for (const req of userOtherRequests) {
          await tx.notification.create({
            data: {
              user_id: req.requester_id,
              type: "request_expired_other_team_joined",
              team_id: req.team_id,
              payload: {}
            }
          });
        }

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
              payload: { user_name: currentUser.name }
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

          for (const tr of otherTeamRequests) {
            await tx.notification.create({
              data: {
                user_id: tr.requester_id,
                type: "team_now_full",
                team_id: joinRequest.team_id,
                payload: { team_name: joinRequest.team.name }
              }
            });
          }
        }

        return req;
      });

      return NextResponse.json({ joinRequest: updated });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
  }
}
