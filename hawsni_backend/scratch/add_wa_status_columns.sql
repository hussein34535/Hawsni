-- Migration: Add WhatsApp message status tracking columns to chat_messages
-- Run this in Supabase SQL Editor

-- 1. Add wa_message_id column (stores the WhatsApp message ID / wamid)
ALTER TABLE chat_messages
    ADD COLUMN IF NOT EXISTS wa_message_id TEXT DEFAULT NULL;

-- 2. Add wa_status column (sent / delivered / read / failed)
ALTER TABLE chat_messages
    ADD COLUMN IF NOT EXISTS wa_status TEXT DEFAULT NULL;

-- 3. Create index for fast lookups by wamid (webhook updates)
CREATE INDEX IF NOT EXISTS idx_chat_messages_wa_message_id
    ON chat_messages(wa_message_id)
    WHERE wa_message_id IS NOT NULL;

-- Done! ✅
-- wa_status values:
--   'sent'      = ✓  (grey)      - message sent to WhatsApp servers
--   'delivered' = ✓✓ (grey)      - message delivered to customer device
--   'read'      = ✓✓ (blue)      - customer read the message
--   'failed'    = ✗  (red)       - message failed to send
