import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.log("No Supabase URL/Key found");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from('students').select('*').limit(1);
  if (error) console.error("Error:", error);
  else if (data && data.length > 0) console.log("Columns:", Object.keys(data[0]));
  else console.log("No data, try querying empty array to get keys... wait, Supabase doesn't return keys for empty array if we don't have types.");
}
check();
