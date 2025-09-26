import { config } from 'dotenv';
config()
import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/integrations/supabase/types';

const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const insertIntoParticipants = async () => {
  const currentMatchData = {
    "id": "b7dae324-cf1e-4a23-ac20-ce37db18ecf0",
    "room_id": "1affc5ac-ce5b-4733-b4e8-004305f7f445",
    "round_number": 1,
    "match_number": 1,
    "player1_id": "e80a79ce-ef57-454f-9c3e-30ea3e836d84",
    "player2_id": "c6a8d3e3-c398-4dc8-b3c6-08fca22a365a",
    "player3_id": null,
    "player4_id": null,
    "status": "active",
    "winner_id": null,
    "match_data": {
      "elimination_type": "single",
      "players_per_match": 2,
      "round_duration_minutes": 5,
      "scores": {}
    },
    "started_at": null,
    "completed_at": null,
    "time_limit_minutes": 1,
    "created_at": "2025-09-24T18:03:06.343718+00:00",
    "updated_at": "2025-09-24T18:03:06.343718+00:00"
  }

  // check if the match is already exists
  const { data: matchData, error: matchDataError } = await supabase.from("tournament_matches").select("*").eq("id", currentMatchData.id);
  if (matchDataError) console.error(matchDataError);
  if (matchData) {
    console.log("Match already exists", matchData);
  }

  const { data, error } = await supabase.from("tournament_matches").update({
    match_data: {
      ...currentMatchData.match_data,
      scores: {
        ...currentMatchData.match_data.scores,
        "e80a79ce-ef57-454f-9c3e-30ea3e836d84": 210
      }
    }
  }).eq("id", currentMatchData.id).select("*").single();
  if (error) console.error(error);
  console.log(JSON.stringify(data, null, 2));

}

insertIntoParticipants();