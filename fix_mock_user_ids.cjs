const fs = require('fs');
let authContent = fs.readFileSync('src/lib/auth.tsx', 'utf-8');

authContent = authContent.replace(/id: "admin_1"/g, 'id: "22222222-2222-4222-8222-222222222222"');
authContent = authContent.replace(/id: "caisse_1"/g, 'id: "33333333-3333-4333-8333-333333333333"');
authContent = authContent.replace(/id: "sec_1"/g, 'id: "44444444-4444-4444-8444-444444444444"');
authContent = authContent.replace(/id: "parent_1"/g, 'id: "55555555-5555-4555-8555-555555555555"');
authContent = authContent.replace(/id: "dir_1"/g, 'id: "66666666-6666-4666-8666-666666666666"');
authContent = authContent.replace(/id: "prof_1"/g, 'id: "77777777-7777-4777-8777-777777777777"');
authContent = authContent.replace(/id: \`user_\$\{Date\.now\(\)\}\`/g, 'id: "00000000-0000-4000-8000-000000000000"'); // well, Date.now() was for uniqueness, maybe use crypto.randomUUID()? But we can't easily do that in a JS string literal. Wait, we can.

authContent = authContent.replace(/id: \`user_\$\{Date\.now\(\)\}\`/g, 'id: "00000000-0000-4000-8000-" + Date.now().toString().slice(-12)'); // Close enough to a UUID for testing? No, Supabase might strict check it. Let's do something like:

fs.writeFileSync('src/lib/auth.tsx', authContent);
