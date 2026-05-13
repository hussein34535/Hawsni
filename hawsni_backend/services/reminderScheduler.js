const { supabaseAdmin: supabase } = require('../config/supabase');
const whatsappService = require('./whatsappService');

const CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes
const REMINDER_DELAY = 12 * 60 * 60 * 1000; // 12 hours
let intervalHandle = null;

async function checkAndSendReminders() {
    try {
        console.log('[Reminder] 🔍 Checking for pending reminders...');

        // 1. Find messages where order_confirm template was sent
        const twelveHoursAgo = new Date(Date.now() - REMINDER_DELAY).toISOString();
        
        const { data: templateMessages, error } = await supabase
            .from('chat_messages')
            .select('session_id, created_at')
            .like('content', '[TEMPLATE:order_confirm]%')
            .lte('created_at', twelveHoursAgo)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Reminder] Query error:', error);
            return;
        }

        if (!templateMessages || templateMessages.length === 0) {
            console.log('[Reminder] ✅ No pending reminders.');
            return;
        }

        // 2. Deduplicate (only latest per session)
        const seen = new Set();
        const uniqueSessions = templateMessages
            .filter(m => {
                if (seen.has(m.session_id)) return false;
                seen.add(m.session_id);
                return true;
            });

        // 3. Check each session — skip if already sent hwasi_order or user replied
        for (const msg of uniqueSessions) {
            const phone = msg.session_id;

            // Check if hwasi_order was already sent to this session
            const { data: existingReminder } = await supabase
                .from('chat_messages')
                .select('id')
                .eq('session_id', phone)
                .like('content', '[TEMPLATE:hwasi_order]%')
                .limit(1);

            if (existingReminder && existingReminder.length > 0) {
                console.log(`[Reminder] ⏭️ ${phone} already received hwasi_order`);
                continue;
            }

            // Check if user has sent ANY message AFTER the order_confirm template
            // i.e., user replied = no need to remind
            const { data: userReplies } = await supabase
                .from('chat_messages')
                .select('id')
                .eq('session_id', phone)
                .eq('sender_type', 'user')
                .gt('created_at', msg.created_at)
                .limit(1);

            if (userReplies && userReplies.length > 0) {
                console.log(`[Reminder] ⏭️ ${phone} already replied, skipping`);
                continue;
            }

            // 4. Send the reminder
            console.log(`[Reminder] 📤 Sending hwasi_order to ${phone}...`);
            const result = await whatsappService.sendHwasiOrderReminder(phone);
            if (result.success) {
                console.log(`[Reminder] ✅ hwasi_order sent to ${phone}`);
            } else {
                console.error(`[Reminder] ❌ Failed for ${phone}:`, result.error);
            }

            // Small delay between sends to avoid rate limits
            await new Promise(r => setTimeout(r, 1000));
        }
    } catch (error) {
        console.error('[Reminder] ❌ Error in checkAndSendReminders:', error);
    }
}

function startReminderScheduler() {
    if (intervalHandle) return;
    console.log('[Reminder] ⏰ Starting reminder scheduler (every 30min)...');
    // Run first check after 1 minute (give server time to boot)
    setTimeout(() => {
        checkAndSendReminders();
        intervalHandle = setInterval(checkAndSendReminders, CHECK_INTERVAL);
    }, 60 * 1000);
}

function stopReminderScheduler() {
    if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
        console.log('[Reminder] ⏹ Scheduler stopped');
    }
}

module.exports = { startReminderScheduler, stopReminderScheduler };