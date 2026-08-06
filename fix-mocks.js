const fs = require('fs');

const universalMock = `jest.mock("@/lib/prisma", () => {
  const mockP = {
    user: { findUnique: jest.fn(), update: jest.fn() },
    team: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    teamMembership: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    teamSlot: { create: jest.fn() },
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
  // Remove existing const mockPrisma = { ... }; block
  content = content.replace(/const mockPrisma = \{[\s\S]*?jest\.mock\(['"]@\/lib\/prisma['"], \(\) => \(\{\s*prisma: mockPrisma,?\s*\}\)\);/g, universalMock);
  
  // Also remove the old jest.mock if it's there
  content = content.replace(/jest\.mock\(['"]@\/lib\/prisma['"], \(\) => \(\{[\s\S]*?\$transaction: jest\.fn\(\(callback\) => callback\(prisma\)\),[\s\S]*?\}\)\);/g, universalMock);
  
  fs.writeFileSync(file, content);
}
