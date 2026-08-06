require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log("=== SECURITY TESTING SCRIPT ===");
  
  // 1. Authenticate as a test user
  // Let's create a temporary user or sign in if exists
  const testEmail = "test_security_" + Date.now() + "@gmail.com";
  let authRes = await supabase.auth.signUp({
    email: testEmail,
    password: "TestPassword123!"
  });
  
  if (authRes.error) {
    console.error("Failed to create test user:", authRes.error);
    return;
  }
  
  const token = authRes.data.session.access_token;
  console.log("Acquired auth token for:", testEmail);

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const API_BASE = "http://localhost:3000/api"; // Assumes app is running on port 3000

  console.log("\n--- TEST 1: IDOR / Auth Check on Dissolve (Non-Leader) ---");
  try {
    const res = await fetch(`${API_BASE}/teams/non_existent_team/dissolve`, { method: 'POST', headers });
    console.log(`POST /api/teams/non_existent_team/dissolve -> Status: ${res.status}`);
    console.log(await res.text());
  } catch(e) { console.error(e.message) }

  console.log("\n--- TEST 2: IDOR / Auth Check on Leave (Not in team) ---");
  try {
    const res = await fetch(`${API_BASE}/teams/some_team_id/leave`, { method: 'POST', headers });
    console.log(`POST /api/teams/some_team_id/leave -> Status: ${res.status}`);
    console.log(await res.text());
  } catch(e) { console.error(e.message) }

  console.log("\n--- TEST 3: Visibility Leak Check (Raw API Response) ---");
  try {
    const res = await fetch(`${API_BASE}/teams?status=open`);
    console.log(`GET /api/teams?status=open -> Status: ${res.status}`);
    const data = await res.json();
    if (data.teams && data.teams.length > 0) {
      console.log("Checking first team in payload...");
      console.log(JSON.stringify(data.teams[0].memberships, null, 2).slice(0, 500) + "...");
    } else {
      console.log("No teams found to check.");
    }
  } catch(e) { console.error(e.message) }
  
  console.log("\n--- TEST 4: Injection / XSS Payload Test ---");
  try {
    const payload = {
      name: "<script>alert('xss')</script>",
      description: "'; DROP TABLE users; --",
      domain_interest: "Web3",
      skills_needed: ["React"],
    };
    const res = await fetch(`${API_BASE}/teams`, { method: 'POST', headers, body: JSON.stringify(payload) });
    console.log(`POST /api/teams with Injection Payload -> Status: ${res.status}`);
    console.log(await res.text());
  } catch(e) { console.error(e.message) }

  process.exit(0);
}

runTests();
