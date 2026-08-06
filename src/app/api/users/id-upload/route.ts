import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("id_card") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No ID card file provided" }, { status: 400 });
    }

    // 5MB limit
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Image exceeds 5MB limit." }, { status: 400 });
    }

    // Magic Bytes Validation
    const buffer = await file.arrayBuffer();
    const header = new Uint8Array(buffer).subarray(0, 4);
    const hex = Array.from(header).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    let isJpeg = hex.startsWith("FFD8");
    let isPng = hex.startsWith("89504E47");
    
    if (!isJpeg && !isPng) {
      return NextResponse.json({ error: "Invalid file type. Only genuine JPEG/PNG images are allowed." }, { status: 400 });
    }

    // Upload to Supabase Storage (private bucket)
    const fileExt = file.name.split(".").pop();
    const storagePath = `id-cards/${user.id}/id_card_${Date.now()}.${fileExt}`;
    const contentType = isJpeg ? "image/jpeg" : "image/png";

    const { error: uploadError } = await supabase.storage
      .from("id-cards")
      .upload(storagePath, buffer, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload ID card to storage." }, { status: 500 });
    }

    // Run OCR via Google Cloud Vision
    const base64Image = Buffer.from(buffer).toString("base64");
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    
    let score = 0.1;
    let parsedName = null, parsedCollege = null, parsedDept = null;

    if (apiKey) {
      const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Image },
              features: [{ type: "TEXT_DETECTION" }]
            }
          ]
        })
      });

      if (visionResponse.ok) {
        const visionData = await visionResponse.json();
        const textAnnotations = visionData.responses?.[0]?.textAnnotations;
        
        if (textAnnotations && textAnnotations.length > 0) {
          const fullText = textAnnotations[0].description;
          const lowerText = fullText.toLowerCase();
          const keywords = ["university", "college", "institute", "student", "technology", "academy", "id", "card", "valid", "campus", "school", "faculty"];
          const containsKeyword = keywords.some((kw: string) => lowerText.includes(kw));
          
          if (containsKeyword) {
            parsedName = extractName(fullText);
            parsedCollege = extractCollege(fullText);
            parsedDept = extractDepartment(fullText);
            score = (parsedName || parsedCollege || parsedDept) ? 0.85 : 0.3;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      path: storagePath,
      parsed: {
        name: parsedName,
        college: parsedCollege,
        department: parsedDept,
        score: score
      }
    });

  } catch (err: any) {
    console.error("[POST /api/users/id-upload]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Simple heuristics for extraction (can be improved)
function extractName(text: string): string | null {
  const lines = text.split('\n');
  const nameLine = lines.find(l => l.toLowerCase().includes('name:') || l.toLowerCase().includes('name '));
  if (nameLine) {
    return nameLine.replace(/name[\s:]+/i, '').trim();
  }
  return null;
}

function extractCollege(text: string): string | null {
  const lines = text.split('\n');
  const collegeLine = lines.find(l => l.toLowerCase().includes('institute') || l.toLowerCase().includes('university') || l.toLowerCase().includes('college'));
  if (collegeLine) return collegeLine.trim();
  return null;
}

function extractDepartment(text: string): string | null {
  const lines = text.split('\n');
  const deptLine = lines.find(l => l.toLowerCase().includes('department') || l.toLowerCase().includes('branch') || l.toLowerCase().includes('b.tech'));
  if (deptLine) return deptLine.trim();
  return null;
}
