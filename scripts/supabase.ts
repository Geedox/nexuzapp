import { config } from 'dotenv';
config()
import { supabase } from '../src/integrations/supabase/client';

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
        .limit(3);
    if (error) throw error;
    console.log(data);
}

fetchRecentWinners();