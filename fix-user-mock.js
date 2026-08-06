const fs = require('fs');

let jr = fs.readFileSync('src/__tests__/api/join-requests.test.ts', 'utf8');

const badLine = `(prisma.user.findUnique as jest.Mock).mockImplementation(async (args) => { if (args?.where?.id === "leader1" || args?.where?.auth_user_id === "auth_user_1") return { id: "leader1", team_memberships: [{ team_id: "team1", role: "leader" }] }; return { id: args?.where?.id, team_memberships: [] }; });`;

const goodLine = `(prisma.user.findUnique as jest.Mock).mockImplementation(async (args) => {
  if (args?.where?.id === "leader1" || args?.where?.auth_user_id === "auth_user_1") return { id: "leader1", team_memberships: [{ team_id: "team1", role: "leader" }] };
  return { id: args?.where?.id, counts_toward_female_quota: true, verification_status: "verified", team_memberships: [] };
});`;

jr = jr.split(badLine).join(goodLine);

fs.writeFileSync('src/__tests__/api/join-requests.test.ts', jr);
