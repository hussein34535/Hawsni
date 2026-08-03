-- Create Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id TEXT PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'bot_active' CHECK (status IN ('bot_active', 'human_requested', 'human_active')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    sender_type TEXT CHECK (sender_type IN ('user', 'bot', 'admin')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Realtime subscriptions need to be enabled for these tables
alter publication supabase_realtime add table chat_sessions;
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table cancellation_requests;

-- RLS Policies
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow public to insert/select (since WhatsApp webhooks and Edge Functions might need access without auth, or we can use service_role key)
-- For simplicity, since admin uses anon key in frontend:
CREATE POLICY "Public Read Sessions" ON chat_sessions FOR SELECT USING (true);
CREATE POLICY "Public Read Messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Admin Insert Messages" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin Update Sessions" ON chat_sessions FOR UPDATE USING (true);
