require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
const supabaseUser = createClient(supabaseUrl, supabaseAnonKey);

async function reproduce500Error() {
  const email = `test500_${Date.now()}@fonneta.com`;
  
  // 1. Create a confirmed user using Admin API
  const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: 'Password123!',
    email_confirm: true
  });
  
  if (adminError) {
    console.error('Admin create user error:', adminError);
    return;
  }
  
  // 2. Sign in as the user
  const { data: signInData, error: signInError } = await supabaseUser.auth.signInWithPassword({
    email,
    password: 'Password123!'
  });
  
  if (signInError) {
    console.error('Sign in error:', signInError);
    return;
  }

  console.log('Signed in as:', signInData.user.id);

  // 3. Attempt to CREATE a server exactly like serverService.ts
  const { data: serverResult, error: serverError } = await supabaseUser
      .from('servers')
      .insert({ name: 'Fuscia Test', description: 'Testing the 500 error', owner_id: signInData.user.id })
      .select()
      .single();

  if (serverError) {
    console.error('\n==== EXACT ERROR WHEN CREATING ====\n');
    console.error(JSON.stringify(serverError, null, 2));
    
    // Cleanup 
    await supabaseAdmin.auth.admin.deleteUser(signInData.user.id);
    return;
  }

  console.log('Success! Server created:', serverResult);
  
  // Cleanup
  await supabaseAdmin.auth.admin.deleteUser(signInData.user.id);
}

reproduce500Error();
