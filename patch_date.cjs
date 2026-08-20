const fs = require('fs');
let content = fs.readFileSync('src/pages/SchoolAdminStudents.tsx', 'utf-8');
content = content.replace(/{new Date\(student\.dateOfBirth\)\.toLocaleDateString\(\)}/g, "{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '-'}");
fs.writeFileSync('src/pages/SchoolAdminStudents.tsx', content);
console.log("Patched dateOfBirth in SchoolAdminStudents");
