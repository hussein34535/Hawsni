const { supabaseAdmin } = require('./config/supabase');

async function cleanupEmptySessions() {
    console.log('🧹 Cleaning up empty chat sessions...');
    
    // 1. Get all sessions
    const { data: sessions } = await supabaseAdmin.from('chat_sessions').select('session_id');
    
    // 2. Get all session IDs that HAVE messages
    const { data: messages } = await supabaseAdmin.from('chat_messages').select('session_id');
    const idsWithMessages = new Set(messages.map(m => m.session_id));

    // 3. Find sessions to delete
    const sessionsToDelete = sessions.filter(s => !idsWithMessages.has(s.session_id));
    
    console.log(`Found ${sessionsToDelete.length} sessions with no message history.`);

    if (sessionsToDelete.length === 0) {
        console.log('✅ No empty sessions to delete.');
        return;
    }

    // 4. Delete them
    for (const s of sessionsToDelete) {
        const { error } = await supabaseAdmin
            .from('chat_sessions')
            .delete()
            .eq('session_id', s.session_id);
        
        if (!error) {
            console.log(`🗑️ Deleted empty session: ${s.session_id}`);
        } else {
            console.error(`❌ Failed to delete ${s.session_id}:`, error);
        }
    }

    console.log('🎉 Cleanup completed.');
}

cleanupEmptySessions();
