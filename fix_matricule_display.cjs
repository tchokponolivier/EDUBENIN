const fs = require('fs');

const files = [
  'src/pages/SchoolAdmin.tsx',
  'src/pages/SchoolAdminStudentList.tsx',
  'src/pages/SchoolAdminStats.tsx',
  'src/pages/SchoolAdminPayments.tsx',
];

for (const file of files) {
   if (fs.existsSync(file)) {
      let code = fs.readFileSync(file, 'utf8');
      
      // We will carefully replace instances of id.substring(0,8) with matricule || ...
      code = code.replace(/\{student\.id\.substring\(0,\s*8\)\}/g, "{student.matricule || student.id.substring(0, 8)}");
      code = code.replace(/\[\{s\.id\.substring\(0,8\)\}\]/g, "[{s.matricule || s.id.substring(0,8)}]");
      code = code.replace(/\{selectedStudent\.id\.substring\(0,8\)\}/g, "{selectedStudent.matricule || selectedStudent.id.substring(0,8)}");
      code = code.replace(/\{s\.id\.substring\(0,8\)\}/g, "{s.matricule || s.id.substring(0,8)}");
      
      fs.writeFileSync(file, code);
   }
}
