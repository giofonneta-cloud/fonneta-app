

async function executeSql() {
  const token = 'sbp_5285ace1ac05ac77c26b268ef243ac7510915ce5';
  const ref = 'dmdhxgthekbslzehctgn';

  const query = `
    SELECT tgname as trigger_name, proname as function_name 
    FROM pg_trigger t 
    JOIN pg_proc p ON t.tgfoid = p.oid 
    JOIN pg_class c ON t.tgrelid = c.oid 
    WHERE relname = 'servers';
  `;

  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('SQL Error:', response.status, err);
    return;
  }

  const result = await response.json();
  console.log('Triggers:', JSON.stringify(result, null, 2));

  // Also query policies
  const queryPol = `SELECT polname, polcmd, polroles, polqual, polwithcheck FROM pg_policies WHERE tablename = 'servers';`;
  const resPol = await fetch(`https://api.supabase.com/v1/projects/${ref}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: queryPol }),
  });
  const resPolData = await resPol.json();
  console.log('Policies:', JSON.stringify(resPolData, null, 2));
}

executeSql();
