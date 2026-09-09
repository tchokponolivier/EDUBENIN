const fs = require('fs');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function run() {
   // Try to get a profile
   const { data, error } = await supabase.from('profiles').select('*').limit(1);
   console.log("Profiles:", data);
   if (data && data.length > 0) {
       const profile = data[0];
       // Check if role is an enum by trying to set it to an invalid value
       const { error: updateErr } = await supabase.from('profiles').update({ role: 'INVALID_ROLE_TEST' }).eq('id', profile.id);
       console.log("Update Error:", updateErr);
   }
}
run();
