const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

require('dotenv').config({ path: '.env.example' }); // using .env if needed, but wait, usually postgres string is not available, we use supabase_schema.sql by appending or we just use `run_sql.js`

