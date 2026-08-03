-- Add is_read column to chat_messages
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- Update existing user messages as read (they're always "read" by the sender)
UPDATE chat_messages SET is_read = true WHERE sender_type = 'user';
