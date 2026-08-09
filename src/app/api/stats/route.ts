import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = Date.now();
  // "Online now" = presence heartbeat window. The app layout refreshes
  // last_seen_at at most every 5 minutes, so anyone seen within the last
  // 5 minutes is effectively at the platform right now.
  const onlineWindow = new Date(now - 5 * 60 * 1000);
  const dayWindow = new Date(now - 24 * 60 * 60 * 1000);

  const [onlineNow, active24h] = await Promise.all([
    prisma.user.count({ where: { last_seen_at: { gte: onlineWindow } } }),
    prisma.user.count({ where: { last_seen_at: { gte: dayWindow } } }),
  ]);

  return NextResponse.json({
    online_now: onlineNow,
    active_24h: active24h,
  });
}
