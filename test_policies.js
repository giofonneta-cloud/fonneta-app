require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function inspectPolicies() {
  const { data, error } = await supabaseAdmin.rpc('execute_sql_query', {
    sql_query: "SELECT polname, polcmd, polroles, polstat, polrelid::regclass as tablename, polqual, polwithcheck FROM pg_policy WHERE polrelid::regclass::text IN ('servers', 'server_members');"
  });

  if (error) {
     console.log('No execute_sql_query function?', error.message);
  } else {
     console.log(JSON.stringify(data, null, 2));
  }
}

inspectPolicies();
