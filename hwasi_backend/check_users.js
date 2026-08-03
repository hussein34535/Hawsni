const { supabaseAdmin: supabase } = require('./config/supabase');

async function listUsers() {
    console.log('--- Current Users in Profile Table ---');
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, role, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching users:', error.message);
        return;
    }

    if (users.length === 0) {
        console.log('No users found in the "users" table.');
    } else {
        users.forEach(u => {
            console.log(`- ${u.name || 'No Name'} | ${u.email || 'No Email'} | Role: ${u.role} | ID: ${u.id}`);
        });
    }
    
    process.exit(0);
}

listUsers();
