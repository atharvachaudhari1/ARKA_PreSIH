const fs = require('fs');

// Fix join-requests.test.ts
let jr = fs.readFileSync('src/__tests__/api/join-requests.test.ts', 'utf8');
jr = jr.replace(/\(prisma\.user\.findUnique as jest\.Mock\)\.mockResolvedValue\(\{\s*id: ["']leader1["'],\s*team_memberships: \[\{ team_id: ["']team1["'], role: ["']leader["'] \}\],?\s*\}\);/g, 
  `(prisma.user.findUnique as jest.Mock).mockImplementation(async (args) => {
    if (args?.where?.id === "leader1" || args?.where?.auth_user_id) {
      return { id: "leader1", team_memberships: [{ team_id: "team1", role: "leader" }] };
    }
    return { id: args?.where?.id, counts_toward_female_quota: true, verification_status: "verified", team_memberships: [] };
  });`);
fs.writeFileSync('src/__tests__/api/join-requests.test.ts', jr);

// Fix chat.test.ts mock scoping
let chat = fs.readFileSync('src/__tests__/api/chat.test.ts', 'utf8');
chat = chat.replace(/jest\.mock\([\s\S]*?\$transaction: jest\.fn\(\(callback\) => callback\(prisma\)\),[\s\S]*?\}\)\);/, 
  `const mockPrisma = {
  user: { findUnique: jest.fn() },
  chatMessage: { findMany: jest.fn(), create: jest.fn() },
  report: { findMany: jest.fn() },
  teamMembership: { create: jest.fn() },
  $transaction: jest.fn((callback) => callback(mockPrisma))
};
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));`);
fs.writeFileSync('src/__tests__/api/chat.test.ts', chat);

// Fix leave-team.test.ts mock scoping
let leave = fs.readFileSync('src/__tests__/api/leave-team.test.ts', 'utf8');
leave = leave.replace(/jest\.mock\([\s\S]*?\$transaction: jest\.fn\(\(callback\) => callback\(prisma\)\),[\s\S]*?\}\)\);/, 
  `const mockPrisma = {
  user: { findUnique: jest.fn() },
  team: { findUnique: jest.fn(), update: jest.fn() },
  teamMembership: { findUnique: jest.fn(), delete: jest.fn(), update: jest.fn(), findMany: jest.fn() },
  joinRequest: { updateMany: jest.fn() },
  $transaction: jest.fn((callback) => callback(mockPrisma))
};
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));`);
fs.writeFileSync('src/__tests__/api/leave-team.test.ts', leave);
