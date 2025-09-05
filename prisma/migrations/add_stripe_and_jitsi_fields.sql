-- Add Stripe Connect and Jitsi fields to the database
-- This migration adds the necessary fields for the live session booking flow

-- Add stripe_account_id to users table for instructor Stripe Connect accounts
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255);

-- Add meeting room fields to live_sessions table for Jitsi integration
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS meeting_room_id VARCHAR(255);
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS meeting_link VARCHAR(500);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_stripe_account_id ON users(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_meeting_room_id ON live_sessions(meeting_room_id);

-- Add comments for documentation
COMMENT ON COLUMN users.stripe_account_id IS 'Stripe Connect account ID for instructor payouts';
COMMENT ON COLUMN live_sessions.meeting_room_id IS 'Jitsi meeting room identifier';
COMMENT ON COLUMN live_sessions.meeting_link IS 'Jitsi meeting URL for participants';

