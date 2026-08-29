const fs = require('fs');
let content = fs.readFileSync('src/pages/SchoolAdminStudents.tsx', 'utf-8');

const targetMap = `const mappedStudents = data.map(d => ({
              id: d.id,
              firstName: d.first_name,
              lastName: d.last_name,
              level: d.level,
              status: d.status,
              schoolId: d.school_id,
              parentId: d.parent_id,
              createdAt: new Date(d.created_at).getTime()
            })) as Student[];`;

const replaceMap = `const mappedStudents = data.map(d => ({
              id: d.id,
              firstName: d.first_name,
              lastName: d.last_name,
              level: d.level,
              status: d.status,
              schoolId: d.school_id,
              parentId: d.parent_id,
              dateOfBirth: d.date_of_birth,
              fatherContact: d.father_contact,
              motherContact: d.mother_contact,
              guardianContact: d.guardian_contact,
              fatherName: d.father_name,
              motherName: d.mother_name,
              guardianName: d.guardian_name,
              createdAt: new Date(d.created_at).getTime()
            })) as Student[];`;

content = content.replace(targetMap, replaceMap);

// Also fix any invalid date by checking if it's a valid date string
const targetDateDisplay = `{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '-'}`;
const replaceDateDisplay = `{student.dateOfBirth && !isNaN(new Date(student.dateOfBirth).getTime()) ? new Date(student.dateOfBirth).toLocaleDateString() : '-'}`;

content = content.replace(targetDateDisplay, replaceDateDisplay);

fs.writeFileSync('src/pages/SchoolAdminStudents.tsx', content);
