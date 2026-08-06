const fs = require('fs');

let jr = fs.readFileSync('src/__tests__/api/join-requests.test.ts', 'utf8');
const searchString = `(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "leader1",
        team_memberships: [{ team_id: "team1", role: "leader" }],
      });`;
const replaceString = `(prisma.user.findUnique as jest.Mock).mockImplementation(async (args) => {
        if (args?.where?.id === "leader1" || args?.where?.auth_user_id === "auth_user_1") return { id: "leader1", team_memberships: [{ team_id: "team1", role: "leader" }] };
        return { id: args?.where?.id, counts_toward_female_quota: true, verification_status: "verified", team_memberships: [] };
      });`;

jr = jr.split(searchString).join(replaceString);
fs.writeFileSync('src/__tests__/api/join-requests.test.ts', jr);

const universalMock = `jest.mock("@/lib/prisma", () => {
  const mockP = {
    user: { findUnique: jest.fn(), update: jest.fn() },
    team: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), findMany: jest.fn(), delete: jest.fn() },
    teamMembership: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    teamSlot: { create: jest.fn(), updateMany: jest.fn() },
    event: { findFirst: jest.fn(), create: jest.fn() },
    joinRequest: { findFirst: jest.fn(), create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    joinRequestOpinion: { upsert: jest.fn() },
    notification: { create: jest.fn() },
    chatMessage: { findMany: jest.fn(), create: jest.fn() },
    report: { findMany: jest.fn() },
  };
  mockP.$transaction = jest.fn((callback) => callback(mockP));
  return { prisma: mockP };
});`;

const files = [
  'src/__tests__/api/chat.test.ts',
  'src/__tests__/api/leave-team.test.ts',
  'src/__tests__/api/teams.test.ts',
  'src/__tests__/api/join-requests.test.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/jest\.mock\(['"]@\/lib\/prisma['"], \(\) => \{\s*const mockP = \{[\s\S]*?return \{ prisma: mockP \};\s*\}\);/g, universalMock);
  fs.writeFileSync(file, content);
}
