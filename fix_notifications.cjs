const fs = require('fs');
let code = fs.readFileSync('src/lib/useNotifications.ts', 'utf8');

// Determine audience based on user role
const filterLogic = `
      let audienceFilter = 'Parents';
      if (user.role === 'TEACHER') audienceFilter = 'Professeurs';
      else if (['SECRETARY', 'CASHIER', 'SUPERVISOR', 'DIRECTOR_OF_STUDIES'].includes(user.role)) audienceFilter = 'Administration';
      
      const { data: announcements } = await supabase
        .from('announcements')
        .select('*')
        .eq('school_id', user.schoolId)
        .in('target_audience', [audienceFilter, 'ALL'])
        .order('created_at', { ascending: false })
        .limit(10);
`;

code = code.replace(
  `      const { data: announcements } = await supabase
        .from('announcements')
        .select('*')
        .eq('school_id', user.schoolId)
        .order('created_at', { ascending: false })
        .limit(10);`,
  filterLogic
);
fs.writeFileSync('src/lib/useNotifications.ts', code);
