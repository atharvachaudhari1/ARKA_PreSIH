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

    const body = await request.json();
    const { storagePath } = body;

    if (!storagePath) {
      return NextResponse.json({ error: "storagePath is required" }, { status: 400 });
    }

    // 1. Download image from Supabase private bucket
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("id-cards")
      .download(storagePath);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: "Failed to download image from storage" }, { status: 500 });
    }

    // Convert Blob to Base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    // 2. Call Google Cloud Vision API
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    if (!apiKey) {
      // Fallback if no API key is set - simulate low confidence to force manual review
      return storeAndReturnFallback(user.id);
    }

    // Ensure we NEVER log the base64Image payload
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

    if (!visionResponse.ok) {
      console.error("[OCR] Cloud Vision API error status:", visionResponse.status);
      return storeAndReturnFallback(user.id);
    }

    const visionData = await visionResponse.json();
    const textAnnotations = visionData.responses?.[0]?.textAnnotations;
    
    if (!textAnnotations || textAnnotations.length === 0) {
      return storeAndReturnFallback(user.id);
    }

    const fullText = textAnnotations[0].description;
    
    // Very basic heuristic extraction for demonstration (in a real app, use GPT or deeper regex)
    // We'll extract what we can, otherwise return nulls.
    const parsedName = extractName(fullText);
    const parsedCollege = extractCollege(fullText);
    const parsedDept = extractDepartment(fullText);
    
    // Assign a confidence score. If we found something, 0.8, else 0.3.
    const score = (parsedName || parsedCollege || parsedDept) ? 0.85 : 0.3;

    // 3. Persist the OCR attempt server-side to prevent client spoofing
    const attempt = await prisma.ocrVerificationAttempt.create({
      data: {
        user_id: user.id,
        ocr_parsed_name: parsedName,
        ocr_parsed_college: parsedCollege,
        ocr_parsed_department: parsedDept,
        ocr_confidence_score: score,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
      }
    });

    return NextResponse.json({
      parsed: {
        name: attempt.ocr_parsed_name,
        college: attempt.ocr_parsed_college,
        department: attempt.ocr_parsed_department,
      }
    });

  } catch (err) {
    console.error("[POST /api/ocr] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function storeAndReturnFallback(userId: string) {
  const attempt = await prisma.ocrVerificationAttempt.create({
    data: {
      user_id: userId,
      ocr_parsed_name: null,
      ocr_parsed_college: null,
      ocr_parsed_department: null,
      ocr_confidence_score: 0.1,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24),
    }
  });
  return NextResponse.json({
    parsed: { name: null, college: null, department: null }
  });
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
