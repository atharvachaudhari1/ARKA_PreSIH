import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('--- STARTING REALTIME RLS ISOLATION VERIFICATION ---');

  console.log('1. Creating test users in Supabase Auth...');
  const { data: authUserA } = await supabaseAdmin.auth.admin.createUser({
    email: 'usera_realtime_' + Date.now() + '@example.com',
    password: 'password123',
    email_confirm: true
  });
  const { data: authUserB } = await supabaseAdmin.auth.admin.createUser({
    email: 'userb_realtime_' + Date.now() + '@example.com',
    password: 'password123',
    email_confirm: true
  });

  if (!authUserA.user || !authUserB.user) throw new Error('Failed to create users');

  console.log('2. Creating test data using service role...');
  const eventId = crypto.randomUUID();
  const now = new Date().toISOString();
  await supabaseAdmin.from('events').insert({
    id: eventId,
    name: 'Test Event',
    team_size_max: 4,
    updated_at: now
  });

  const userAId = crypto.randomUUID();
  await supabaseAdmin.from('users').insert({
    id: userAId,
    auth_user_id: authUserA.user.id,
    email: authUserA.user.email!,
    name: 'User A',
    verification_status: 'pending',
    contact_visibility: 'private',
    updated_at: now
  });

  const userBId = crypto.randomUUID();
  await supabaseAdmin.from('users').insert({
    id: userBId,
    auth_user_id: authUserB.user.id,
    email: authUserB.user.email!,
    name: 'User B',
    verification_status: 'pending',
    contact_visibility: 'private',
    updated_at: now
  });

  const teamId = crypto.randomUUID();
  const { error: teamErr } = await supabaseAdmin.from('teams').insert({
    id: teamId,
    event_id: eventId,
    leader_id: userAId,
    name: 'Realtime Isolation Team',
    status: 'open',
    succession_mode: 'manual',
    skills_needed: [],
    updated_at: now
  });
  if (teamErr) throw new Error('Failed to create team: ' + teamErr.message);

  const memId = crypto.randomUUID();
  const { error: memErr } = await supabaseAdmin.from('team_memberships').insert({
    id: memId,
    team_id: teamId,
    user_id: userAId,
    role: 'leader'
  });
  if (memErr) throw new Error('Failed to create membership: ' + memErr.message);

  console.log('3. Authenticating clients to get JWTs...');
  const clientA = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const loginARes = await clientA.auth.signInWithPassword({ email: authUserA.user.email!, password: 'password123' });
  if (loginARes.error) throw new Error('Login A failed: ' + loginARes.error.message);
  
  const clientB = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const loginBRes = await clientB.auth.signInWithPassword({ email: authUserB.user.email!, password: 'password123' });
  
  console.log('\n--- TESTING UNAUTHORIZED ACCESS (User B - Non-Member) ---');
  let userBReceived = false;
  const channelB = clientB.channel(`room_team_${teamId}`);
  
  channelB.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `team_id=eq.${teamId}` }, (payload) => {
    userBReceived = true;
    console.error('❌ FATAL: User B (Non-Member) received event! RLS LEAK DETECTED:', payload);
  }).subscribe();

  await new Promise(r => setTimeout(r, 2000));
  const { error: insErr1 } = await supabaseAdmin.from('chat_messages').insert({
    id: crypto.randomUUID(),
    team_id: teamId,
    sender_id: userAId,
    content: 'Unauthorized Leak Test Message!'
  });
  if (insErr1) console.error('Insert Error 1:', insErr1.message);

  await new Promise(r => setTimeout(r, 3000));
  if (!userBReceived) console.log('✅ User B (Non-Member) received nothing. Isolation successful.');

  console.log('\n--- TESTING AUTHORIZED ACCESS (User A - Member) ---');
  
  let userAReceived = false;
  const channelA = clientA.channel(`room_team_${teamId}`);
  
  channelA.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `team_id=eq.${teamId}` }, (payload) => {
    userAReceived = true;
    console.log('✅ User A (Member) received event:', payload.new.content);
  }).subscribe((status) => {
    console.log('User A subscription status:', status);
  });

  await new Promise(r => setTimeout(r, 2000));
  
  const { data: testFunc, error: funcErr } = await clientA.rpc('is_team_member', { check_team_id: teamId });
  console.log('User A test is_team_member:', testFunc, funcErr);

  const { error: insErr2 } = await supabaseAdmin.from('chat_messages').insert({
    id: crypto.randomUUID(),
    team_id: teamId,
    sender_id: userAId,
    content: 'Authorized Message!'
  });
  if (insErr2) console.error('Insert Error 2:', insErr2.message);

  await new Promise(r => setTimeout(r, 2000));
  
  // Verify row actually exists
  const { data: adminSelect } = await supabaseAdmin.from('chat_messages').select('*').eq('team_id', teamId);
  console.log('Total chat messages in DB for team:', adminSelect?.length);

  // Test SELECT after INSERT to verify REST access
  const { data: testSelect, error: selectErr } = await clientA.from('chat_messages').select('*').eq('team_id', teamId);
  console.log('User A SELECT test:', selectErr ? 'Error: ' + selectErr.message : `Success, rows: ${testSelect?.length}`);

  if (!userAReceived) console.error('❌ User A failed to receive event via Realtime');

  console.log('\nCleaning up test data...');
  await supabaseAdmin.from('teams').delete().eq('id', teamId);
  await supabaseAdmin.from('events').delete().eq('id', eventId);
  await supabaseAdmin.from('users').delete().in('id', [userAId, userBId]);
  await supabaseAdmin.auth.admin.deleteUser(authUserA.user.id);
  await supabaseAdmin.auth.admin.deleteUser(authUserB.user.id);

  console.log('--- VERIFICATION COMPLETE ---');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
