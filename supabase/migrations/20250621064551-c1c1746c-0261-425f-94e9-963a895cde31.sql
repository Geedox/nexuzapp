
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums for better data integrity
CREATE TYPE public.game_status AS ENUM ('active', 'waiting', 'full', 'starting', 'finished');
CREATE TYPE public.transaction_type AS ENUM ('win', 'loss', 'deposit', 'withdrawal', 'fee');
CREATE TYPE public.currency_type AS ENUM ('USDC', 'USDT', 'NGN', 'ETH', 'BTC');
CREATE TYPE public.friend_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');
CREATE TYPE public.notification_type AS ENUM ('friend_request', 'game_invite', 'room_start', 'payment', 'wallet_connect', 'achievement');

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    country TEXT DEFAULT 'Nigeria',
    email_verified BOOLEAN DEFAULT FALSE,
    total_earnings DECIMAL(15,2) DEFAULT 0.00,
    total_games_played INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    current_win_streak INTEGER DEFAULT 0,
    longest_win_streak INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table
CREATE TABLE public.games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    min_players INTEGER DEFAULT 2,
    max_players INTEGER DEFAULT 10,
    entry_fee_min DECIMAL(10,2) DEFAULT 0.00,
    entry_fee_max DECIMAL(10,2) DEFAULT 1000.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game rooms table
CREATE TABLE public.game_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
    host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    entry_fee DECIMAL(10,2) NOT NULL,
    currency currency_type DEFAULT 'USDC',
    max_players INTEGER NOT NULL,
    current_players INTEGER DEFAULT 1,
    status game_status DEFAULT 'waiting',
    is_private BOOLEAN DEFAULT FALSE,
    room_code TEXT UNIQUE,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room participants table
CREATE TABLE public.room_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES public.game_rooms(id) ON DELETE CASCADE,
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    position INTEGER,
    score INTEGER DEFAULT 0,
    earnings DECIMAL(10,2) DEFAULT 0.00,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, player_id)
);

-- Wallets table
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    currency currency_type NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    wallet_address TEXT,
    is_connected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, currency)
);

-- Transactions table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.game_rooms(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency currency_type NOT NULL,
    description TEXT,
    transaction_hash TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friends table
CREATE TABLE public.friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    addressee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status friend_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(requester_id, addressee_id)
);

-- Leaderboards table (for caching leaderboard data)
CREATE TABLE public.leaderboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
    total_score INTEGER DEFAULT 0,
    total_earnings DECIMAL(15,2) DEFAULT 0.00,
    games_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    rank INTEGER,
    period TEXT DEFAULT 'all_time', -- 'daily', 'weekly', 'monthly', 'all_time'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, game_id, period)
);

-- Notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email queue table for scheduled emails
CREATE TABLE public.email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    template_data JSONB,
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for games (public read access)
CREATE POLICY "Everyone can view games" ON public.games FOR SELECT USING (true);

-- RLS Policies for game_rooms
CREATE POLICY "Users can view all rooms" ON public.game_rooms FOR SELECT USING (true);
CREATE POLICY "Users can create rooms" ON public.game_rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can update own rooms" ON public.game_rooms FOR UPDATE USING (auth.uid() = host_id);

-- RLS Policies for room_participants
CREATE POLICY "Users can view room participants" ON public.room_participants FOR SELECT USING (true);
CREATE POLICY "Users can join rooms" ON public.room_participants FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "Users can update own participation" ON public.room_participants FOR UPDATE USING (auth.uid() = player_id);

-- RLS Policies for wallets
CREATE POLICY "Users can view own wallets" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own wallets" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wallets" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for friends
CREATE POLICY "Users can view own friendships" ON public.friends FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can create friend requests" ON public.friends FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update friend requests" ON public.friends FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- RLS Policies for leaderboards
CREATE POLICY "Users can view all leaderboards" ON public.leaderboards FOR SELECT USING (true);
CREATE POLICY "System can manage leaderboards" ON public.leaderboards FOR ALL USING (true);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for email_queue
CREATE POLICY "System can manage email queue" ON public.email_queue FOR ALL USING (true);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, email_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.email_confirmed_at IS NOT NULL
  );
  
  -- Create default wallets for major currencies
  INSERT INTO public.wallets (user_id, currency, balance) VALUES
    (NEW.id, 'USDC', 0.00),
    (NEW.id, 'USDT', 0.00),
    (NEW.id, 'NGN', 0.00);
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample games
INSERT INTO public.games (name, description, image_url, min_players, max_players) VALUES
('Crypto Blaster', 'Fast-paced space shooting game with crypto rewards', '/games/crypto-blaster.jpg', 2, 8),
('DeFi Racing', 'High-speed racing through decentralized finance tracks', '/games/defi-racing.jpg', 2, 6),
('NFT Arena', 'Battle with your NFT characters in epic combat', '/games/nft-arena.jpg', 2, 10),
('Blockchain Puzzle', 'Solve complex puzzles to mine virtual crypto', '/games/blockchain-puzzle.jpg', 1, 4),
('Space Mining', 'Mine asteroids and compete for the biggest haul', '/games/space-mining.jpg', 2, 8),
('Cyber Tournament', 'Ultimate esports competition with huge prizes', '/games/cyber-tournament.jpg', 4, 16);

-- Create indexes for better performance
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_total_earnings ON public.profiles(total_earnings DESC);
CREATE INDEX idx_game_rooms_status ON public.game_rooms(status);
CREATE INDEX idx_game_rooms_game_id ON public.game_rooms(game_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_leaderboards_rank ON public.leaderboards(period, rank);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read);
