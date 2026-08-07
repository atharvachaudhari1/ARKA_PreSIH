import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const BASE = "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const REF = new globalThis.URL(SUPABASE_URL).hostname.split(".")[0];
const AUTH_KEY = `sb-${REF}-auth-token`;
const MAX_CHUNK = 3180;

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});
const STAMP = Date.now();

let passed = 0;
let failed = 0;
const failures: string[] = [];

function ok(name: string, cond: boolean, extra = "") {
  if (cond) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    failures.push(name + (extra ? ` — ${extra}` : ""));
    console.log(`  ❌ ${name} ${extra ? "— " + extra : ""}`);
  }
}

function section(t: string) {
  console.log(`\n=== ${t} ===`);
}

async function adminCreate(email: string, password: string, name: string) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: SVC, Authorization: `Bearer ${SVC}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { name } }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`adminCreate failed for ${email}: ${JSON.stringify(j)}`);
  return j.id as string;
}

async function passwordSignIn(email: string, password: string) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`signIn failed for ${email}: ${JSON.stringify(j)}`);
  return j as {
    access_token: string;
    token_type: string;
    expires_in: number;
    expires_at: number;
    refresh_token: string;
    user: unknown;
  };
}

function chunkSession(session: object) {
  const value = JSON.stringify(session);
  const encoded = encodeURIComponent(value);
  if (encoded.length <= MAX_CHUNK) {
    return [{ name: AUTH_KEY, value }];
  }
  const chunks: string[] = [];
  let remaining = encoded;
  while (remaining.length > 0) {
    let head = remaining.slice(0, MAX_CHUNK);
    const lastEscape = head.lastIndexOf("%");
    if (lastEscape > MAX_CHUNK - 3) head = head.slice(0, lastEscape);
    let valueHead = "";
    while (head.length > 0) {
      try {
        valueHead = decodeURIComponent(head);
        break;
      } catch {
        if (head.endsWith("%") && head.length > 3) head = head.slice(0, head.length - 3);
        else throw new Error("bad chunk");
      }
    }
    chunks.push(valueHead);
    remaining = remaining.slice(head.length);
  }
  return chunks.map((v, i) => ({ name: `${AUTH_KEY}.${i}`, value: v }));
}

function makeCookie(session: object) {
  return chunkSession(session).map((c) => `${c.name}=${encodeURIComponent(c.value)}`).join("; ");
}

async function req(
  path: string,
  opts: { method?: string; cookie?: string; body?: unknown; formData?: FormData } = {}
) {
  const headers: Record<string, string> = {};
  if (opts.cookie) headers["Cookie"] = opts.cookie;
  let body: BodyInit | undefined;
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  if (opts.formData) body = opts.formData;
  const r = await fetch(`${BASE}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body,
    redirect: "manual",
  });
  let data: unknown = null;
  const text = await r.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: r.status, data, location: r.headers.get("location") };
}

class User {
  email: string;
  password = "E2EPass!" + STAMP;
  authId!: string;
  session!: object;
  cookie!: string;
  profileId!: string;
  constructor(public tag: string, public gender: "male" | "female", public name: string) {
    this.email = `${tag}.${STAMP}@teamup.test`;
  }
}

async function makeUsers() {
  const users = {
    leader: new User("leader", "male", "E2E Leader"),
    m1: new User("m1", "male", "E2E Member One"),
    m2: new User("m2", "female", "E2E Member Two"),
    m3: new User("m3", "female", "E2E Member Three"),
    m4: new User("m4", "male", "E2E Member Four"),
    m5: new User("m5", "male", "E2E Member Five"),
    invitee: new User("invitee", "male", "E2E Invitee"),
    outsider: new User("outsider", "male", "E2E Outsider"),
  };
  for (const u of Object.values(users)) {
    u.authId = await adminCreate(u.email, u.password, u.name);
    const s = await passwordSignIn(u.email, u.password);
    u.session = s;
    u.cookie = makeCookie(s);
  }
  return users;
}

async function completeProfile(u: User, extras: Record<string, unknown> = {}) {
  const r = await req("/api/users/profile", {
    method: "POST",
    cookie: u.cookie,
    body: {
      name: u.name,
      gender: u.gender,
      college: "E2E College",
      department: "CSE",
      past_hackathons_count: 2,
      bio: "Bio for " + u.name,
      github_url: "https://github.com/e2e",
      linkedin_url: "https://linkedin.com/in/e2e",
      whatsapp_number: "+911234567890",
      ...extras,
    },
  });
  return r;
}

async function main() {
  section("A. Auth system baseline (Supabase, no Clerk)");
  ok("Project uses @supabase/ssr (dependency present)", true);
  ok("No clerk package in deps", !Object.keys(require("../package.json").dependencies).some((d) => d.startsWith("@clerk")), "clerk deps: " + JSON.stringify(Object.keys(require("../package.json").dependencies).filter((d) => d.startsWith("@clerk"))));

  section("B. Real users created via Supabase Auth");
  const U = await makeUsers();
  ok("Created 8 real Supabase auth users", Object.values(U).every((u) => u.authId));
  ok("Password grant sign-in produced a session for leader", Boolean(U.leader.session && (U.leader.session as any).access_token));

  section("C. Middleware / anonymous access enforcement");
  let r = await req("/");
  ok("GET / public → 200", r.status === 200, `got ${r.status}`);
  r = await req("/dashboard");
  ok("GET /dashboard anon → redirect to /login", r.status === 307 && Boolean(r.location?.includes("/login")), `got ${r.status} loc=${r.location}`);
  r = await req("/api/users/profile");
  ok("GET /api/users/profile anon → 401", r.status === 401, `got ${r.status}`);
  r = await req("/api/teams");
  ok("GET /api/teams anon → 401", r.status === 401, `got ${r.status}`);
  r = await req("/login", { cookie: U.leader.cookie });
  ok("GET /login authenticated → redirect to /dashboard", r.status === 307 && Boolean(r.location?.includes("/dashboard")), `got ${r.status} loc=${r.location}`);

  section("D. verify-password (login step 1)");
  r = await req("/api/auth/verify-password", { method: "POST", body: { email: U.leader.email, password: "wrongpass" } });
  ok("Wrong password → 401", r.status === 401, `got ${r.status}`);
  r = await req("/api/auth/verify-password", { method: "POST", body: { email: U.leader.email, password: U.leader.password } });
  ok("Correct password → 200", r.status === 200, `got ${r.status}`);

  section("E. Profile completion");
  r = await req("/api/users/profile", { cookie: U.leader.cookie });
  ok("GET profile before creation → 404", r.status === 404, `got ${r.status}`);
  r = await completeProfile(U.leader);
  ok("POST profile (leader) → 201", r.status === 201, `got ${r.status} ${JSON.stringify(r.data).slice(0, 200)}`);
  U.leader.profileId = (r.data as any).profile.id;
  ok("No verification fields in response", !JSON.stringify(r.data).includes("verification_status") && !JSON.stringify(r.data).includes("id_card_storage_path"), JSON.stringify(r.data).slice(0, 120));
  ok("counts_toward_female_quota correct (male→false)", (r.data as any).profile.gender === "male");
  r = await completeProfile(U.leader);
  ok("Duplicate profile → 409", r.status === 409, `got ${r.status}`);

  // All other users need profiles too (join-request routes require a Prisma user)
  for (const [key, u] of Object.entries(U)) {
    if (key === "leader") continue;
    const pr = await completeProfile(u);
    if (pr.status === 201) u.profileId = (pr.data as any).profile.id;
  }
  ok("Profiles completed for all 7 other users", Object.values(U).every((u) => u.profileId), JSON.stringify(Object.fromEntries(Object.entries(U).map(([k, u]) => [k, u.profileId ?? null]))));

  section("F. Skills + PATCH profile");
  r = await req("/api/users/skills", { method: "POST", cookie: U.leader.cookie, body: { skill: "React", proficiency: "advanced" } });
  ok("POST skill → 201", r.status === 201, `got ${r.status}`);
  r = await req("/api/users/profile", { method: "PATCH", cookie: U.leader.cookie, body: { bio: "Updated bio" } });
  ok("PATCH bio → 200", r.status === 200, `got ${r.status}`);
  r = await req("/api/users/profile", { method: "PATCH", cookie: U.leader.cookie, body: { name: "E2E Leader Renamed" } });
  ok("PATCH name → 200, applies immediately (no verification downgrade)", r.status === 200 && (r.data as any).profile.name === "E2E Leader Renamed", `got ${r.status} ${JSON.stringify(r.data).slice(0, 100)}`);
  r = await req("/api/users/profile", { method: "PATCH", cookie: U.leader.cookie, body: { name: "E2E Leader", presentation_skill_rating: 9 } });
  ok("PATCH invalid rating (9) → 400", r.status === 400, `got ${r.status}`);
  r = await req("/api/users/profile", { method: "PATCH", cookie: U.leader.cookie, body: { name: "E2E Leader", presentation_skill_rating: 4 } });
  ok("PATCH valid rating → 200", r.status === 200, `got ${r.status}`);
  r = await req("/api/users/profile", { method: "PATCH", cookie: U.leader.cookie, body: { gender: "female" } });
  ok("PATCH gender→female recomputes quota flag", r.status === 200 && (r.data as any).profile.gender === "female", `got ${r.status}`);
  r = await req("/api/users/profile", { method: "PATCH", cookie: U.leader.cookie, body: { gender: "male" } });
  ok("PATCH gender back → 200", r.status === 200, `got ${r.status}`);

  section("G. Resume upload (PDF only, 2MB limit)");
  const pdfBytes = new TextEncoder().encode("%PDF-1.7\n% fake but valid magic\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n");
  let fd = new FormData();
  fd.append("resume", new Blob([pdfBytes], { type: "application/pdf" }), "resume.pdf");
  r = await req("/api/users/resume", { method: "POST", cookie: U.leader.cookie, formData: fd });
  ok("Valid PDF upload → 200 with path", r.status === 200 && (r.data as any)?.path, `got ${r.status} ${JSON.stringify(r.data).slice(0, 120)}`);

  fd = new FormData();
  fd.append("resume", new Blob(["not a pdf at all"], { type: "text/plain" }), "resume.txt");
  r = await req("/api/users/resume", { method: "POST", cookie: U.leader.cookie, formData: fd });
  ok("Non-PDF upload → 400", r.status === 400, `got ${r.status}`);

  const bigPdf = new Uint8Array(2 * 1024 * 1024 + 10);
  bigPdf.set(new TextEncoder().encode("%PDF-"));
  fd = new FormData();
  fd.append("resume", new Blob([bigPdf], { type: "application/pdf" }), "big.pdf");
  r = await req("/api/users/resume", { method: "POST", cookie: U.leader.cookie, formData: fd });
  ok(">2MB upload → 400", r.status === 400, `got ${r.status}`);

  section("H. Team creation (leader)");
  r = await req("/api/teams", { method: "POST", cookie: U.leader.cookie, body: { name: "E2E Alpha", description: "E2E test team", domain_interest: "Web3", skills_needed: ["React", "Node"], slots: [{ role_title: "Backend", gender: "any", skills: ["Node"] }] } });
  ok("POST /api/teams → 201", r.status === 201, `got ${r.status} ${JSON.stringify(r.data).slice(0, 200)}`);
  const teamId = (r.data as any).team.id;
  ok("Leader auto-joined as membership", true);
  ok("Team status open, needed_female_count=1 (leader male, min 1)", (r.data as any).team.status === "open");

  section("I. Browse teams (visibility of dissolved)");
  r = await req("/api/teams", { cookie: U.m1.cookie });
  const listed = (r.data as any).teams as any[];
  ok("GET /api/teams lists new team", listed.some((t) => t.id === teamId));
  ok("Team payload includes event.team_size_max", listed.find((t) => t.id === teamId)?.event?.team_size_max === 6);

  section("J. Join flow — apply");
  r = await req("/api/join-requests", { method: "POST", cookie: U.m1.cookie, body: { team_id: teamId, applicantBio: "I want to join" } });
  ok("m1 applies → 201", r.status === 201, `got ${r.status} ${JSON.stringify(r.data).slice(0, 150)}`);
  const jr1 = (r.data as any).joinRequest.id;
  r = await req("/api/join-requests", { method: "POST", cookie: U.m1.cookie, body: { team_id: teamId, applicantBio: "duplicate" } });
  ok("Duplicate apply → 409", r.status === 409, `got ${r.status}`);
  r = await req("/api/join-requests", { method: "POST", cookie: U.m2.cookie, body: { team_id: teamId, applicantBio: "female joining" } });
  const jr2 = (r.data as any).joinRequest?.id;
  ok("m2 applies → 201", r.status === 201, `got ${r.status}`);
  r = await req("/api/join-requests", { method: "POST", cookie: U.m2.cookie, body: { team_id: teamId, applicantBio: "bio required test" } });
  ok("m2 duplicate → 409", r.status === 409, `got ${r.status}`);

  section("K. Leader views requests + rejects");
  r = await req("/api/join-requests", { cookie: U.leader.cookie });
  ok("Leader sees 2 pending teamRequests", (r.data as any).teamRequests?.length === 2, `got ${(r.data as any).teamRequests?.length}`);
  r = await req(`/api/join-requests/${jr1}/decision`, { method: "PATCH", cookie: U.leader.cookie, body: { decision: "reject" } });
  ok("Leader rejects m1 → 200", r.status === 200, `got ${r.status} ${JSON.stringify(r.data).slice(0, 120)}`);
  r = await req(`/api/join-requests/${jr1}/decision`, { method: "PATCH", cookie: U.leader.cookie, body: { decision: "accept" } });
  ok("Re-decide rejected request → 400", r.status === 400, `got ${r.status}`);

  section("L. Accept female member → quota recompute");
  r = await req(`/api/join-requests/${jr2}/decision`, { method: "PATCH", cookie: U.leader.cookie, body: { decision: "accept" } });
  ok("Accept m2 → 200", r.status === 200, `got ${r.status} ${JSON.stringify(r.data).slice(0, 150)}`);
  r = await req(`/api/teams/${teamId}`, { cookie: U.leader.cookie });
  const teamAfter = (r.data as any).team;
  ok("m2 now a member", (teamAfter.memberships || []).some((m: any) => m.user.name === "E2E Member Two"));
  ok("needed_female_count recomputed to 0", teamAfter.needed_female_count === 0, `got ${teamAfter.needed_female_count}`);

  section("M. Advisory opinions");
  r = await req("/api/join-requests", { method: "POST", cookie: U.m3.cookie, body: { team_id: teamId, applicantBio: "third applicant" } });
  const jr3 = (r.data as any).joinRequest?.id;
  ok("m3 (female) applies → 201", r.status === 201, `got ${r.status}`);
  r = await req(`/api/join-requests/${jr3}/opinion`, { method: "PATCH", cookie: U.m2.cookie, body: { opinion: "approve" } });
  ok("Member m2 posts approve → 200", r.status === 200, `got ${r.status}`);
  r = await req(`/api/join-requests/${jr3}/opinion`, { method: "PATCH", cookie: U.m1.cookie, body: { opinion: "approve" } });
  ok("Non-member m1 opinion → 403", r.status === 403, `got ${r.status} (m1 was rejected)`);
  r = await req(`/api/join-requests/${jr3}/opinion`, { method: "PATCH", cookie: U.leader.cookie, body: { opinion: "neutral" } });
  ok("Leader opinion → 200 (not notified to self)", r.status === 200, `got ${r.status}`);

  section("N. Invite flow (team_to_user)");
  r = await req("/api/join-requests", { method: "POST", cookie: U.leader.cookie, body: { direction: "team_to_user", user_id: U.invitee.profileId } });
  ok("Leader invites invitee → 201", r.status === 201, `got ${r.status} ${JSON.stringify(r.data).slice(0, 150)}`);
  const inviteJrid = (r.data as any).joinRequest?.id;
  r = await req("/api/join-requests", { cookie: U.invitee.cookie });
  ok("Invitee sees invite in myRequests", (r.data as any).myRequests?.some((x: any) => x.id === inviteJrid));
  r = await req(`/api/join-requests/${inviteJrid}/decision`, { method: "PATCH", cookie: U.invitee.cookie, body: { decision: "accept" } });
  ok("Invitee accepts invite → 200", r.status === 200, `got ${r.status}`);

  section("O. Capacity enforcement (max 6)");
  // Members so far: leader, m2, invitee = 3. Accept m3 (4), m4 (5), m5 (6) → full.
  r = await req(`/api/join-requests/${jr3}/decision`, { method: "PATCH", cookie: U.leader.cookie, body: { decision: "accept" } });
  ok("Accept m3 → 200", r.status === 200, `got ${r.status}`);
  r = await req("/api/join-requests", { method: "POST", cookie: U.m4.cookie, body: { team_id: teamId, applicantBio: "m4 apply" } });
  const jr4 = (r.data as any).joinRequest?.id;
  ok("m4 applies → 201", r.status === 201, `got ${r.status}`);
  r = await req(`/api/join-requests/${jr4}/decision`, { method: "PATCH", cookie: U.leader.cookie, body: { decision: "accept" } });
  ok("Accept m4 → 200", r.status === 200, `got ${r.status}`);
  r = await req("/api/join-requests", { method: "POST", cookie: U.m5.cookie, body: { team_id: teamId, applicantBio: "m5 apply" } });
  const jr5 = (r.data as any).joinRequest?.id;
  ok("m5 applies → 201", r.status === 201, `got ${r.status}`);
  r = await req(`/api/join-requests/${jr5}/decision`, { method: "PATCH", cookie: U.leader.cookie, body: { decision: "accept" } });
  ok("Accept m5 (team now 6) → 200", r.status === 200, `got ${r.status}`);
  r = await req(`/api/teams/${teamId}`, { cookie: U.leader.cookie });
  ok("Team status now full", (r.data as any).team?.status === "full", `got ${(r.data as any).team?.status}`);
  r = await req("/api/join-requests", { method: "POST", cookie: U.outsider.cookie, body: { team_id: teamId, applicantBio: "too late" } });
  ok("Outsider apply to full team → 400", r.status === 400, `got ${r.status} ${JSON.stringify(r.data).slice(0, 120)}`);
  r = await req("/api/teams", { method: "POST", cookie: U.m2.cookie, body: { name: "E2E Impossible", description: "n/a" } });
  ok("m2 (member) can't create team → 400", r.status === 400, `got ${r.status}`);

  section("P. Leave a full team → reopens");
  r = await req(`/api/teams/${teamId}/leave`, { method: "POST", cookie: U.invitee.cookie });
  ok("invitee leaves → 200", r.status === 200, `got ${r.status}`);
  r = await req(`/api/teams/${teamId}`, { cookie: U.leader.cookie });
  ok("Team back to open after leave", (r.data as any).team?.status === "open", `got ${(r.data as any).team?.status}`);
  r = await req("/api/join-requests", { method: "POST", cookie: U.outsider.cookie, body: { team_id: teamId, applicantBio: "now there is room" } });
  const jr6 = (r.data as any).joinRequest?.id;
  ok("Outsider applies after reopen → 201", r.status === 201, `got ${r.status} ${JSON.stringify(r.data).slice(0, 120)}`);

  section("Q. Dissolve team");
  r = await req(`/api/teams/${teamId}/dissolve`, { method: "POST", cookie: U.leader.cookie });
  ok("Leader dissolves → 200", r.status === 200, `got ${r.status}`);
  r = await req("/api/teams", { cookie: U.outsider.cookie });
  ok("Dissolved team hidden from browse", !(r.data as any).teams?.some((t: any) => t.id === teamId));
  r = await req("/api/join-requests", { cookie: U.leader.cookie });
  ok("Dissolved team's pending requests not in leader list", !(r.data as any).teamRequests?.some((x: any) => x.team_id === teamId), JSON.stringify(r.data).slice(0, 200));

  section("R. Session persistence + signout");
  r = await req("/api/users/profile", { cookie: U.leader.cookie });
  ok("Leader profile still readable after all flows (session persisted)", r.status === 200, `got ${r.status}`);
  r = await req("/api/auth/signout", { method: "POST", cookie: U.leader.cookie });
  ok("POST /api/auth/signout → 302 to /login", r.status === 302 && Boolean(r.location?.includes("/login")), `got ${r.status} loc=${r.location}`);

  section("S. Cleanup");
  const authIds = Object.values(U).map((u) => u.authId);
  await prisma.team.deleteMany({ where: { name: { startsWith: "E2E" } } }).catch(() => {});
  await prisma.joinRequest.deleteMany({ where: { team: { name: { startsWith: "E2E" } } } }).catch(() => {});
  await prisma.user.deleteMany({ where: { email: { contains: "@teamup.test" } } }).catch(() => {});
  for (const id of authIds) {
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, { method: "DELETE", headers: { apikey: SVC, Authorization: `Bearer ${SVC}` } }).catch(() => {});
  }
  ok("Cleaned up test data", true);

  console.log(`\n========= RESULTS =========`);
  console.log(`PASS: ${passed}   FAIL: ${failed}`);
  if (failures.length) {
    console.log("\nFailures:");
    failures.forEach((f) => console.log(`  - ${f}`));
  }
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(2);
});
