const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolAdminStudents.tsx', 'utf8');

code = code.replace(
  `      {showAddStudentModal && <AddStudentModal onClose={() => { setShowAddStudentModal(false); window.location.reload(); }} />}`,
  `      {showAddStudentModal && <AddStudentModal isOpen={true} onClose={() => setShowAddStudentModal(false)} onSuccess={() => { setShowAddStudentModal(false); window.location.reload(); }} />}`
);

fs.writeFileSync('src/pages/SchoolAdminStudents.tsx', code);
