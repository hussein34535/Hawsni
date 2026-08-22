-- 009: Merge duplicate WhatsApp chat sessions.
-- Meta webhooks store session_id as "201xxxxxxxxx" while some legacy
-- flows stored the local format "01xxxxxxxxx". This caused the same
-- customer to appear as two separate sessions in the admin inbox.
-- Canonical form: country-code format "20XXXXXXXXXX".

-- 1. Move messages from local-format sessions to their canonical twin
UPDATE chat_messages m
SET    session_id = '20' || substring(m.session_id from 2)
WHERE  m.session_id ~ '^0[0-9]{10}$';

-- 2. Insert canonical sessions that don't exist yet (copy from local row)
INSERT INTO chat_sessions (session_id, platform, status, updated_at, summary)
SELECT '20' || substring(d.session_id from 2),
       COALESCE(d.platform, 'whatsapp'),
       d.status,
       d.updated_at,
       d.summary
FROM   chat_sessions d
WHERE  d.session_id ~ '^0[0-9]{10}$'
ON CONFLICT (session_id) DO NOTHING;

-- 3. Keep the canonical session's timestamp fresh (max of the two)
UPDATE chat_sessions canon
SET    updated_at = GREATEST(canon.updated_at, dup.updated_at)
FROM   (SELECT '20' || substring(session_id from 2) AS canon_id, MAX(updated_at) AS updated_at
        FROM chat_sessions WHERE session_id ~ '^0[0-9]{10}$' GROUP BY 1) dup
WHERE  canon.session_id = dup.canon_id;

-- 4. Delete the old local-format sessions
DELETE FROM chat_sessions
WHERE  session_id ~ '^0[0-9]{10}$';
