const fs = require('fs');
let code = fs.readFileSync('src/pages/Parent.tsx', 'utf8');

code = code.replace(
  `const { data: annData } = await supabase.from('announcements').select('*').order('date', { ascending: false });`,
  `const { data: annData } = await supabase.from('announcements').select('*').in('target_audience', ['Parents', 'ALL']).order('created_at', { ascending: false });`
);

fs.writeFileSync('src/pages/Parent.tsx', code);
