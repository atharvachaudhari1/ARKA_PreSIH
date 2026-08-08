/* eslint-disable @typescript-eslint/no-explicit-any */
import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "@/app/api/users/profile/route";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    userSkill: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("PATCH /api/users/profile", () => {
  let mockAuthGetUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthGetUser = jest.fn();
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
    });
  });

  test("returns 401 if unauthorized", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Unauthorized") });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "PATCH", body: JSON.stringify({}) });
        expect(res.status).toBe(401);
      },
    });
  });

  test("rejects invalid JSON", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "db_user1" });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "PATCH", body: "not-json" });
        expect(res.status).toBe(400);
      },
    });
  });

  test("rejects invalid contact visibility", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "db_user1" });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          body: JSON.stringify({ preferred_contact_visibility: "invalid_value" }),
        });
        expect(res.status).toBe(400);
      },
    });
  });

  test("strips protected fields and only updates whitelisted fields", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "db_user1" });

    const mockUpdatedUser = { id: "db_user1", name: "New Name", led_teams: [] };
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          body: JSON.stringify({
            name: "New Name",
            is_admin: true, // MUST BE STRIPPED (Mass assignment protection)
          }),
        });
        expect(res.status).toBe(200);

        // Assert that prisma.user.update was called WITHOUT the protected field
        expect(prisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: "db_user1" },
            data: { name: "New Name" },
          })
        );
      },
    });
  });

  test("name/college/department edits apply immediately with no downgrade (verification removed)", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "db_user1",
      name: "Old Name",
      college: "Old College",
      department: "Old Dept",
    });

    const mockUpdatedUser = { id: "db_user1", name: "Old Name", led_teams: [] };
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          body: JSON.stringify({ department: "New Dept", college: "New College" }),
        });
        expect(res.status).toBe(200);

        expect(prisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              department: "New Dept",
              college: "New College",
            }),
          })
        );
      },
    });
  });

  test("changing gender recomputes counts_toward_female_quota", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "db_user1" });

    const mockUpdatedUser = { id: "db_user1", led_teams: [] };
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          body: JSON.stringify({ gender: "female" }),
        });
        expect(res.status).toBe(200);

        expect(prisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              gender: "female",
              counts_toward_female_quota: true,
            }),
          })
        );
      },
    });
  });

  test("skills array replaces the full skill set while preserving proficiency", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "db_user1" });
    (prisma.userSkill.findMany as jest.Mock).mockResolvedValue([
      { skill: "React", proficiency: "expert" },
      { skill: "Python", proficiency: "beginner" },
    ]);
    (prisma.user.update as jest.Mock).mockResolvedValue({ id: "db_user1", led_teams: [] });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          body: JSON.stringify({ skills: ["React", "Figma"] }),
        });
        expect(res.status).toBe(200);

        // Python was dropped -> deleteMany removes skills not in the new list
        expect(prisma.userSkill.deleteMany).toHaveBeenCalledWith({
          where: { user_id: "db_user1", skill: { notIn: ["React", "Figma"] } },
        });
        // React keeps its existing proficiency (expert), Figma defaults to intermediate
        expect(prisma.userSkill.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { user_id_skill: { user_id: "db_user1", skill: "React" } },
            create: expect.objectContaining({ proficiency: "expert" }),
            update: expect.objectContaining({ proficiency: "expert" }),
          })
        );
        expect(prisma.userSkill.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { user_id_skill: { user_id: "db_user1", skill: "Figma" } },
            create: expect.objectContaining({ proficiency: "intermediate" }),
          })
        );
      },
    });
  });
});

describe("POST /api/users/profile", () => {
  let mockAuthGetUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthGetUser = jest.fn().mockResolvedValue({ data: { user: { id: "test-user-id", email: "test@test.com" } }, error: null });
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
    });
  });

  const validPayload = {
    name: "John Doe",
    gender: "male",
    college: "State University",
    department: "Computer Science",
    bio: "Test bio",
    whatsapp_number: "+919876543210",
    intent: "join",
  };

  test("returns 401 if unauthorized", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Unauthorized") });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST", body: JSON.stringify(validPayload) });
        expect(res.status).toBe(401);
      },
    });
  });

  test("returns 400 for missing required fields", async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST", body: JSON.stringify({ name: "Only Name" }) });
        expect(res.status).toBe(400);
      },
    });
  });

  test("returns 409 if profile already exists", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "existing" });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST", body: JSON.stringify(validPayload) });
        expect(res.status).toBe(409);
      },
    });
  });

  test("creates profile with female quota flag derived directly from self-reported gender", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: "user1",
      name: "John Doe",
      email: "test@test.com",
      gender: "female",
      college: "State University",
      department: "Computer Science",
    });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ ...validPayload, gender: "female" }),
        });
        expect(res.status).toBe(201);

        expect(prisma.user.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              counts_toward_female_quota: true,
            }),
          })
        );
        // No verification fields are written at all
        const callArg = (prisma.user.create as jest.Mock).mock.calls[0][0];
        expect(callArg.data).not.toHaveProperty("verification_status");
        expect(callArg.data).not.toHaveProperty("verification_method");
        expect(callArg.data).not.toHaveProperty("id_card_storage_path");
      },
    });
  });

  test("creates profile with quota flag false for non-female self-reported gender", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({ id: "user1" });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST", body: JSON.stringify(validPayload) });
        expect(res.status).toBe(201);

        expect(prisma.user.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              counts_toward_female_quota: false,
            }),
          })
        );
      },
    });
  });
});
