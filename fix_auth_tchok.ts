import fs from 'fs';
let content = fs.readFileSync('src/lib/auth.tsx', 'utf-8');

// Undo the bad patch
content = content.replace(
`let schoolId = tempProfile?.school_id;
          
          if (sessionUser.email === 'contact.tchok@gmail.com' && profile?.role !== 'SUPER_ADMIN') {
             await supabase.from('profiles').update({ role: 'SUPER_ADMIN', school_id: null }).eq('id', sessionUser.id);
             profile.role = 'SUPER_ADMIN';
             profile.school_id = null;
          }
          if (pendingRole === 'SCHOOL_ADMIN' && !schoolId) {`,
`let schoolId = tempProfile?.school_id;
          if (pendingRole === 'SCHOOL_ADMIN' && !schoolId) {`
);

// Apply it AFTER profile is fetched
content = content.replace(
`        if (profile) {
          setUser({`,
`        if (profile) {
          if (sessionUser.email === 'contact.tchok@gmail.com' && profile.role !== 'SUPER_ADMIN') {
             await supabase.from('profiles').update({ role: 'SUPER_ADMIN', school_id: null }).eq('id', sessionUser.id);
             profile.role = 'SUPER_ADMIN';
             profile.school_id = null;
          }
          setUser({`
);

fs.writeFileSync('src/lib/auth.tsx', content);
