import { config } from 'dotenv';
config()
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const insertIntoParticipants = async () => {
  const record = {
    "room_id": "6d02607e-50d9-40d4-a3b3-bed5443f4dd8",
    "user_id": "740031ef-528e-461b-9f7d-9bf58a8b5eca",
    "wallet_id": null,
    "join_digest": "D3hUzDDYfggDzoPMyDZuexU9zK8aVbFy27jE5xcG5wxm",
    "payout_digest": null,
    "payment_currency": "USDC",
    "payment_amount": 0.001
  }
  const { data, error } = await supabase
    .from('game_room_participants')
    .insert(record)
    .select()
    .single()
  if (error) throw error;
  console.log(JSON.stringify(data, null, 2));
}

insertIntoParticipants();