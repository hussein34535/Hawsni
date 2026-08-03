const { supabaseAdmin: supabase } = require('./config/supabase');

async function promoteUsers() {
    const emailsToPromote = [
        'hussona4635550@gmail.com',
        '70unacceptable@tiffincrane.com',
        'hussammojahed10@gmail.com',
        'husseinh2711@gmail.com' // Just in case
    ];

    console.log('Promoting users to admin...');
    
    for (const email of emailsToPromote) {
        const { data, error } = await supabase
            .from('users')
            .update({ role: 'admin' })
            .eq('email', email)
            .select();

        if (error) {
            console.error(`Error promoting ${email}:`, error.message);
        } else if (data && data.length > 0) {
            console.log(`✅ ${email} is now an admin! (ID: ${data[0].id})`);
        } else {
            console.log(`ℹ️ ${email} not found in the users table.`);
        }
    }
    
    process.exit(0);
}

promoteUsers();
