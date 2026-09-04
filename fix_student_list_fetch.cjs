const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolAdminStudentList.tsx', 'utf8');

code = code.replace(
  `      const [studentsRes, coursesRes, yearsRes] = await Promise.all([
        supabase.from('students').select('*').eq('school_id', user?.schoolId),
        supabase.from('courses').select('*, profiles(full_name)').eq('school_id', user?.schoolId)
      ]);
      
      setStudents(studentsRes.data || []);
      setCourses(coursesRes.data || []);`,
  `      const [studentsRes, coursesRes, yearsRes] = await Promise.all([
        supabase.from('students').select('*').eq('school_id', user?.schoolId),
        supabase.from('courses').select('*, profiles(full_name)').eq('school_id', user?.schoolId),
        supabase.from('academic_years').select('id, name').eq('school_id', user?.schoolId)
      ]);
      
      setStudents(studentsRes.data || []);
      setCourses(coursesRes.data || []);
      if (yearsRes?.data) setAcademicYears(yearsRes.data);`
);

fs.writeFileSync('src/pages/SchoolAdminStudentList.tsx', code);
