import { config } from 'dotenv';
config()
import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/integrations/supabase/types';

const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const insertIntoParticipants = async () => {

  // check if the match is already exists
  const { data: matchData, error: matchDataError } = await supabase.from("tournament_matches").delete().eq("room_id", "4239ca1f-c59e-4c88-b415-4a5a1c56cd28");
  if (matchDataError) console.error(matchDataError);
  if (matchData) {
    console.log("Match deleted", matchData);
  }

  // const { data, error } = await supabase.from("tournament_matches").update({
  //   match_data: {
  //     ...currentMatchData.match_data,
  //     scores: {
  //       ...currentMatchData.match_data.scores,
  //       "e80a79ce-ef57-454f-9c3e-30ea3e836d84": 210
  //     }
  //   }
  // }).eq("id", currentMatchData.id).select("*").single();
  // if (error) console.error(error);
  console.log(JSON.stringify(matchData, null, 2));

}

insertIntoParticipants();