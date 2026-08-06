import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Using the standard supabase-js client to prevent setting cookies on the server automatically
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Attempt to sign in to verify the password.
    // This will NOT set a session in the user's browser, as it's done server-side without SSR cookie helpers.
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[verify-password] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
