import { config } from 'dotenv';
config()
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const fetchRecentWinners = async () => {
  const { data, error } = await supabase
    .from('game_room_winners')
    .select(`
          *,
          participant:game_room_participants(
            user:profiles(username, display_name),
            room:game_rooms(
              name,
              currency,
              game:games(name)
            )
          )
        `)
    .order('created_at', { ascending: false })
  if (error) throw error;
  console.log(JSON.stringify(data, null, 2));
}

fetchRecentWinners();