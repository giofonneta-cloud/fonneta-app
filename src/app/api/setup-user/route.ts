export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return Response.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      );
    }

    console.log('🔄 Setting up test user: gerencia@fonneta.com');
    console.log('Supabase URL:', supabaseUrl);

    try {
      // Try to create user via direct API call
      console.log('Attempting to create user...');
      const createResponse = await fetch(
        `${supabaseUrl}/auth/v1/admin/users`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'gerencia@fonneta.com',
            password: 'Prueba01*',
            email_confirm: true,
            user_metadata: { role: 'admin' }
          })
        }
      );

      console.log('Create response status:', createResponse.status);
      const createData = await createResponse.json();
      console.log('Create response data:', JSON.stringify(createData).slice(0, 200));

      if (!createResponse.ok) {
        // If user already exists (409 Conflict or 422 with email_exists), try to update password
        if (
          createResponse.status === 409 ||
          createResponse.status === 422 ||
          createData.code === 'user_already_exists' ||
          createData.error_code === 'email_exists'
        ) {
          console.log('⚠️  User already exists, finding user ID...');

          // List users to find the ID
          const listResponse = await fetch(
            `${supabaseUrl}/auth/v1/admin/users`,
            {
              method: 'GET',
              headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('List response status:', listResponse.status);
          const listData = await listResponse.json();
          console.log('List response has users:', Array.isArray(listData.users));
          console.log('Total users:', listData.users?.length);
          if (listData.users && listData.users.length > 0) {
            console.log('First 2 users:', listData.users.slice(0, 2).map((u: any) => ({ email: u.email, id: u.id.substring(0, 8) })));
          }

          const user = listData.users?.find((u: any) => u.email === 'gerencia@fonneta.com');
          console.log('Found user:', user?.id ? user.id.substring(0, 8) + '...' : 'NOT FOUND');

          if (user) {
            console.log('Updating password for user:', user.id);
            const updateResponse = await fetch(
              `${supabaseUrl}/auth/v1/admin/users/${user.id}`,
              {
                method: 'PUT',
                headers: {
                  'apikey': supabaseServiceKey,
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password: 'Prueba01*' })
              }
            );

            console.log('Update response status:', updateResponse.status);

            if (updateResponse.ok) {
              console.log('✅ Password updated successfully');
              return Response.json({
                message: 'Password updated successfully',
                email: 'gerencia@fonneta.com',
                password: 'Prueba01*',
                status: 'updated'
              });
            } else {
              const updateData = await updateResponse.json();
              console.log('Update failed:', updateData);
              throw new Error(updateData.message || 'Failed to update password');
            }
          } else {
            console.log('⚠️  User not in list, trying to find by email in response...');
            // Try to find user by doing a partial match or checking the full response
            console.log('All user emails:', listData.users?.map((u: any) => u.email));
          }
        }
        throw new Error(createData.message || `Failed to create user (${createResponse.status})`);
      }

      console.log('✅ User created successfully');
      return Response.json({
        message: 'User created successfully',
        email: 'gerencia@fonneta.com',
        password: 'Prueba01*',
        userId: createData.id,
        status: 'created'
      });

    } catch (fetchErr) {
      console.error('Fetch error:', fetchErr);
      throw fetchErr;
    }

  } catch (err) {
    console.error('❌ Error:', err);
    return Response.json(
      {
        error: err instanceof Error ? err.message : 'Unknown error',
        type: err instanceof Error ? err.constructor.name : typeof err
      },
      { status: 500 }
    );
  }
}
