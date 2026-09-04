const fs = require('fs');
let code = fs.readFileSync('src/components/AddStudentModal.tsx', 'utf8');

if (!code.includes('const countRes')) {
  code = code.replace(
    `const insertSchoolId = user?.schoolId || (schools && schools.length > 0 ? schools[0].id : null);
      
      const { error } = await supabase.from('students').insert({`,
    `const insertSchoolId = user?.schoolId || (schools && schools.length > 0 ? schools[0].id : null);
      
      let generatedMatricule = "";
      if (insertSchoolId && academicYear) {
         const countRes = await supabase.from('students').select('id', { count: 'exact' })
            .eq('school_id', insertSchoolId)
            .eq('academic_year', academicYear);
         const studentCount = countRes.count || 0;
         const yearPrefix = academicYear.substring(0, 4);
         generatedMatricule = \`MAT-\${yearPrefix}-\${studentCount + 1}\`;
      }
      
      const { error } = await supabase.from('students').insert({
        matricule: generatedMatricule,
        academic_year: academicYear,`
  );
  fs.writeFileSync('src/components/AddStudentModal.tsx', code);
}
