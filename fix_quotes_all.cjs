const fs = require('fs');

function fixFile(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');
  if (content.includes('\\`')) {
    content = content.replace(/\\`/g, '`');
    fs.writeFileSync(file, content);
    console.log("Fixed " + file);
  }
}

fixFile('src/pages/SupervisorDashboard.tsx');
fixFile('src/components/SecretaryMails.tsx');
fixFile('src/components/SecretaryExams.tsx');
fixFile('src/components/SecretaryPlanning.tsx');
fixFile('src/pages/SchoolAdminStudents.tsx');
fixFile('src/pages/SchoolAdminStudentList.tsx');
fixFile('src/pages/Parent.tsx');
fixFile('src/pages/TeacherDashboard.tsx');
