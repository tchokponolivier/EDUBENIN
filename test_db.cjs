const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function test() {
   const env = fs.readFileSync('.env', 'utf8');
   const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
   const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];
   const supabase = createClient(url, key);
   
   // Login as the user
   const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: 'adetolafrancia@gmail.com',
      password: 'password' // I don't know the password, this might fail.
   });
   
   // Just check schema or make a dummy query
   const { data, error } = await supabase.from('profiles').select('role').limit(1);
   console.log("Roles:", data);
   console.log("Error:", error);
}
test();
