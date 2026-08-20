const fs = require('fs');
let content = fs.readFileSync('src/pages/SchoolAdminStudents.tsx', 'utf-8');

const target = `            const mappedStudents = data.map(d => ({
              id: d.id,
              firstName: d.first_name,
              lastName: d.last_name,
              level: d.level,
              status: d.status,
              schoolId: d.school_id,
              parentId: d.parent_id,
              discountPercentage: d.discount_percentage || 0
            }));`;

const replace = `            const mappedStudents = data.map(d => ({
              id: d.id,
              firstName: d.first_name,
              lastName: d.last_name,
              level: d.level,
              status: d.status,
              schoolId: d.school_id,
              parentId: d.parent_id,
              discountPercentage: d.discount_percentage || 0,
              dateOfBirth: d.date_of_birth,
              fatherContact: d.father_contact,
              motherContact: d.mother_contact,
              guardianContact: d.guardian_contact,
              photo: d.photo,
              gender: d.gender,
              fatherName: d.father_name,
              motherName: d.mother_name,
              guardianName: d.guardian_name,
              canteenOptions: d.canteen_options,
              created_at: d.created_at
            }));`;

content = content.replace(target, replace);
fs.writeFileSync('src/pages/SchoolAdminStudents.tsx', content);
console.log("Patched fetchStudents in SchoolAdminStudents");
