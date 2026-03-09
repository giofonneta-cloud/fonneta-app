require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
const supabaseUser = createClient(supabaseUrl, supabaseAnonKey);

async function checkTrigger() {
  const email = `test_trig_${Date.now()}@fonneta.com`;
  
  const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: 'Password123!',
    email_confirm: true
  });
  
  const { data: signInData, error: signInError } = await supabaseUser.auth.signInWithPassword({
    email,
    password: 'Password123!'
  });
  
  const { data: serverResult } = await supabaseUser
      .from('servers')
      .insert({ name: 'Fuscia Test Trigger', owner_id: signInData.user.id })
      .select()
      .single();

  const { data: members } = await supabaseUser
      .from('server_members')
      .select('*')
      .eq('server_id', serverResult.id);

  console.log('Members count:', members?.length || 0);

  // Cleanup
  await supabaseAdmin.auth.admin.deleteUser(signInData.user.id);
}

checkTrigger();
