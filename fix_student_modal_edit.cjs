const fs = require('fs');
let code = fs.readFileSync('src/components/AddStudentModal.tsx', 'utf8');

code = code.replace(
  `setLevel(initialData.level || LEVELS[0]);`,
  `setLevel(initialData.level || LEVELS[0]);
      if (initialData.academic_year) setAcademicYear(initialData.academic_year);`
);

fs.writeFileSync('src/components/AddStudentModal.tsx', code);
