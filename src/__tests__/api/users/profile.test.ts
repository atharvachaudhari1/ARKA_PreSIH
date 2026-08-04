/* eslint-disable @typescript-eslint/no-explicit-any */
import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "@/app/api/users/profile/route";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { fuzzyMatchSimilarity } from "@/lib/stringMatch";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    ocrVerificationAttempt: {
      findFirst: jest.fn(),
    }
  },
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/stringMatch", () => ({
  fuzzyMatchSimilarity: jest.fn(),
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

  test("rejects invalid contact_visibility enum", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "db_user1" });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          body: JSON.stringify({ contact_visibility: "invalid_value" }),
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
            id_card_storage_path: "hacked/path.png", // SHOULD BE STRIPPED
            verification_status: "verified", // SHOULD BE STRIPPED
            is_admin: true, // MUST BE STRIPPED (Mass assignment protection)
          }),
        });
        expect(res.status).toBe(200);
        
        // Assert that prisma.user.update was called WITHOUT the protected fields
        expect(prisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: "db_user1" },
            data: { name: "New Name" }, // No id_card_storage_path, verification_status, or is_admin
          })
        );
      },
    });
  });
});

describe("POST /api/users/profile (OCR Verification)", () => {
  let mockAuthGetUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthGetUser = jest.fn().mockResolvedValue({ data: { user: { id: "test-user-id" } }, error: null });
    (createClient as jest.Mock).mockReturnValue({
      auth: { getUser: mockAuthGetUser }
    });
    // By default return 1.0 for name, college, department
    (fuzzyMatchSimilarity as jest.Mock).mockReturnValue(1.0);
  });

  const validPayload = {
    name: "John Doe",
    gender: "Male",
    college: "State University",
    department: "Computer Science",
    past_hackathons_count: 1,
    id_card_storage_path: "path/to/id.jpg",
    intent: "join",
  };

  test("Client cannot forge OCR detection - Server DB result is authoritative", async () => {
    // Mock fuzzy match to fail because the DB strings are different
    (fuzzyMatchSimilarity as jest.Mock).mockReturnValue(0);
    
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1", email: "test@test.com" } }, error: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    
    // Server has a stored OCR result that does NOT match the payload
    (prisma.ocrVerificationAttempt.findFirst as jest.Mock).mockResolvedValue({
      user_id: "user1",
      ocr_parsed_name: "Jane Smith",
      ocr_parsed_college: "Tech Institute",
      ocr_parsed_department: "Biology",
      ocr_confidence_score: 0.9,
    });
    
    (prisma.user.create as jest.Mock).mockResolvedValue({ id: "user1" });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        // Client tries to forge the detected values in the payload
        const forgedPayload = {
          ...validPayload,
          detected_name: "John Doe", // Client trying to spoof
          detected_college: "State University",
        };
        const res = await fetch({ method: "POST", body: JSON.stringify(forgedPayload) });
        expect(res.status).toBe(201);
        
        // Assert it fell back to manual review because the server DB was used, not the spoofed payload
        expect(prisma.user.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              verification_status: "pending",
              verification_method: "manual_review",
            })
          })
        );
      },
    });
  });

  test("Exactly 85% match boundary auto-verifies", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1", email: "test@test.com" } }, error: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    
    const dbCollege = "Univ of London";
    const formCollege = "University of London";
    
    (prisma.ocrVerificationAttempt.findFirst as jest.Mock).mockResolvedValue({
      user_id: "user1",
      ocr_parsed_name: validPayload.name,
      ocr_parsed_college: dbCollege,
      ocr_parsed_department: validPayload.department,
      ocr_confidence_score: 0.9,
    });
    
    // name = 1.0, college = 0.85, department = 1.0
    (fuzzyMatchSimilarity as jest.Mock)
      .mockReturnValueOnce(1.0)
      .mockReturnValueOnce(0.85)
      .mockReturnValueOnce(1.0);
    
    (prisma.user.create as jest.Mock).mockResolvedValue({ id: "user1" });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST", body: JSON.stringify({ ...validPayload, college: formCollege }) });
        expect(res.status).toBe(201);
        
        expect(prisma.user.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              verification_status: "verified",
              verification_method: "auto",
            })
          })
        );
      },
    });
  });

  test("Exactly 0.7 OCR confidence boundary auto-verifies", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1", email: "test@test.com" } }, error: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    
    (prisma.ocrVerificationAttempt.findFirst as jest.Mock).mockResolvedValue({
      user_id: "user1",
      ocr_parsed_name: "John Doe",
      ocr_parsed_college: "State University",
      ocr_parsed_department: "Computer Science",
      ocr_confidence_score: 0.7, // Exactly 0.7
    });
    
    (prisma.user.create as jest.Mock).mockResolvedValue({ id: "user1" });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST", body: JSON.stringify(validPayload) });
        expect(res.status).toBe(201);
        
        expect(prisma.user.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              verification_status: "verified",
              verification_method: "auto",
            })
          })
        );
      },
    });
  });

  test("Exactly 0.5 department match boundary auto-verifies", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1", email: "test@test.com" } }, error: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    
    // Exact department match threshold 0.5
    (prisma.ocrVerificationAttempt.findFirst as jest.Mock).mockResolvedValue({
      user_id: "user1",
      ocr_parsed_name: validPayload.name,
      ocr_parsed_college: validPayload.college,
      ocr_parsed_department: "Computer Science",
      ocr_confidence_score: 0.9,
    });
    
    // We call fuzzyMatchSimilarity 3 times: Name, College, Dept
    (fuzzyMatchSimilarity as jest.Mock)
      .mockReturnValueOnce(1.0)
      .mockReturnValueOnce(1.0)
      .mockReturnValueOnce(0.5);
    
    (prisma.user.create as jest.Mock).mockResolvedValue({ id: "user1" });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST", body: JSON.stringify(validPayload) });
        expect(res.status).toBe(201);
        
        expect(prisma.user.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              verification_status: "verified",
              verification_method: "auto",
            })
          })
        );
      },
    });
  });

  test("Low confidence sets to manual review", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1", email: "test@test.com" } }, error: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    
    (prisma.ocrVerificationAttempt.findFirst as jest.Mock).mockResolvedValue({
      user_id: "user1",
      ocr_parsed_name: "Match Name",
      ocr_parsed_college: "Match College",
      ocr_parsed_department: "Match Dept",
      ocr_confidence_score: 0.69, // Below 0.70 MIN threshold
    });
    
    // name = 1.0, college = 1.0, department = 1.0
    (fuzzyMatchSimilarity as jest.Mock)
      .mockReturnValue(1.0);
    
    (prisma.user.create as jest.Mock).mockResolvedValue({ id: "user1" });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST", body: JSON.stringify(validPayload) });
        expect(res.status).toBe(201);
        
        expect(prisma.user.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              verification_status: "pending",
              verification_method: "manual_review",
            })
          })
        );
      },
    });
  });

  test("Raw ID image URL is never present in public-facing API response", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1", email: "test@test.com" } }, error: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    
    (prisma.ocrVerificationAttempt.findFirst as jest.Mock).mockResolvedValue(null);
    
    // Mock create to return exactly what it selects
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: "user1",
      name: "John Doe",
      email: "test@test.com",
      gender: "Male",
      college: "State University",
      department: "Computer Science",
      verification_status: "pending",
      verification_method: "manual_review",
      verified_at: null,
      past_hackathons_count: 1,
      bio: null,
      created_at: new Date(),
    });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST", body: JSON.stringify(validPayload) });
        const data = await res.json();
        
        expect(res.status).toBe(201);
        
        // Assert explicitly that it's undefined
        expect(data.profile.id_card_storage_path).toBeUndefined();
        
        // Also check the stringified response to be absolutely certain it didn't slip through
        const jsonString = JSON.stringify(data);
        expect(jsonString).not.toContain("id_card_storage_path");
        expect(jsonString).not.toContain("path/to/id.jpg");
      },
    });
  });
});
