-- Update notification_type enum to include new game room and tournament events
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'room_created';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'player_joined';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'player_left';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'room_completed';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'room_cancelled';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'highscore_beaten';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'tournament_advance';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'tournament_elimination';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'game_won';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'prize_distributed';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'room_reminder';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'friend_request_accepted';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'friend_request_declined';

-- Add notification preferences to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email": {
    "friend_requests": true,
    "game_invites": true,
    "room_start": true,
    "room_completed": true,
    "room_cancelled": true,
    "highscore_beaten": true,
    "tournament_advance": true,
    "tournament_elimination": true,
    "game_won": true,
    "prize_distributed": true,
    "room_reminder": true,
    "friend_request_accepted": true,
    "friend_request_declined": false
  },
  "in_app": {
    "room_created": true,
    "player_joined": true,
    "player_left": true,
    "room_start": true,
    "room_completed": true,
    "room_cancelled": true,
    "highscore_beaten": true,
    "tournament_advance": true,
    "tournament_elimination": true,
    "game_won": true,
    "prize_distributed": true,
    "room_reminder": true,
    "friend_request": true,
    "friend_request_accepted": true,
    "friend_request_declined": true
  }
}';

-- Add notification settings table for more granular control
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    email_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- Enable RLS on notification_settings
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_settings
CREATE POLICY "Users can view own notification settings" ON public.notification_settings 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings" ON public.notification_settings 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings" ON public.notification_settings 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON public.notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_type ON public.notification_settings(notification_type);

-- Function to create default notification settings for new users
CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default settings for all notification types
    INSERT INTO public.notification_settings (user_id, notification_type, email_enabled, in_app_enabled)
    SELECT 
        NEW.id,
        unnest(ARRAY[
            'friend_request'::notification_type,
            'game_invite'::notification_type,
            'room_start'::notification_type,
            'payment'::notification_type,
            'wallet_connect'::notification_type,
            'achievement'::notification_type,
            'room_created'::notification_type,
            'player_joined'::notification_type,
            'player_left'::notification_type,
            'room_completed'::notification_type,
            'room_cancelled'::notification_type,
            'highscore_beaten'::notification_type,
            'tournament_advance'::notification_type,
            'tournament_elimination'::notification_type,
            'game_won'::notification_type,
            'prize_distributed'::notification_type,
            'room_reminder'::notification_type,
            'friend_request_accepted'::notification_type,
            'friend_request_declined'::notification_type
        ]),
        CASE 
            WHEN unnest(ARRAY[
                'friend_request'::notification_type,
                'game_invite'::notification_type,
                'room_start'::notification_type,
                'payment'::notification_type,
                'wallet_connect'::notification_type,
                'achievement'::notification_type,
                'room_created'::notification_type,
                'player_joined'::notification_type,
                'player_left'::notification_type,
                'room_completed'::notification_type,
                'room_cancelled'::notification_type,
                'highscore_beaten'::notification_type,
                'tournament_advance'::notification_type,
                'tournament_elimination'::notification_type,
                'game_won'::notification_type,
                'prize_distributed'::notification_type,
                'room_reminder'::notification_type,
                'friend_request_accepted'::notification_type,
                'friend_request_declined'::notification_type
            ]) IN ('friend_request', 'room_start', 'room_completed', 'room_cancelled', 'highscore_beaten', 'tournament_advance', 'tournament_elimination', 'game_won', 'prize_distributed', 'friend_request_accepted') 
            THEN true 
            ELSE false 
        END,
        true
    ON CONFLICT (user_id, notification_type) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user notification settings
DROP TRIGGER IF EXISTS trigger_create_notification_settings ON public.profiles;
CREATE TRIGGER trigger_create_notification_settings
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_settings();
