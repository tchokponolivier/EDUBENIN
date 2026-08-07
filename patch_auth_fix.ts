import fs from 'fs';

let content = fs.readFileSync('src/lib/auth.tsx', 'utf-8');

content = content.replace(
`let schoolId = profile?.school_id;
          if (pendingRole === 'SCHOOL_ADMIN' && !schoolId) {`,
`// Fetch current profile to see if school_id is missing
          const { data: tempProfile } = await supabase.from('profiles').select('school_id').eq('id', sessionUser.id).single();
          let schoolId = tempProfile?.school_id;
          if (pendingRole === 'SCHOOL_ADMIN' && !schoolId) {`
);

fs.writeFileSync('src/lib/auth.tsx', content);
