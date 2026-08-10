const fs = require('fs');
let content = fs.readFileSync('src/pages/Parent.tsx', 'utf-8');

const replacement = `      const { data: schools } = await supabase.from('schools').select('id').limit(1);
      const insertSchoolId = user?.schoolId || (schools && schools.length > 0 ? schools[0].id : null);
      
      const { error } = await supabase.from('students').insert({
        parent_id: user?.id,
        first_name: studentData.firstName,
        last_name: studentData.lastName,
        level: studentData.level,
        date_of_birth: studentData.dateOfBirth,
        gender: studentData.gender,
        school_id: insertSchoolId,
        canteen_options: studentData.canteenOptions.join(", ")
      });`;

content = content.replace(/const { error } = await supabase\.from\('students'\)\.insert\(\{[\s\S]*?school_id: user\?\.schoolId,[\s\S]*?canteen_options: studentData\.canteenOptions\.join\(\", \"\)[\s\S]*?\}\);/, replacement);

fs.writeFileSync('src/pages/Parent.tsx', content);
