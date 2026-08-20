const fs = require('fs');
let content = fs.readFileSync('src/components/AddStudentModal.tsx', 'utf-8');

const target1 = `    const studentData = {
      firstName, lastName, level, dateOfBirth, placeOfBirth,
      studentType: finalStudentType, previousClass, previousSchool,
      lastYearAttended: finalLastYear, educmasterNumber, gender,
      nationality, religion, fatherName, motherName, fatherProfession,
      motherProfession, fatherContact, fatherAddress, motherContact,
      motherAddress, guardianName, guardianContact, guardianAddress,
      canteenOptions, disciplinaryCommitment, disciplinarySignature
    };`;

const insert1 = `    let finalPhoto = photo;
    if (!finalPhoto) {
      if (gender === 'MALE') {
        finalPhoto = "https://images.unsplash.com/photo-1506869408013-189f783ee855?auto=format&fit=crop&q=80&w=200&h=200"; // Default African boy
      } else if (gender === 'FEMALE') {
        finalPhoto = "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200&h=200"; // Default African girl
      }
    }
    const studentData = {
      firstName, lastName, level, dateOfBirth, placeOfBirth,
      studentType: finalStudentType, previousClass, previousSchool,
      lastYearAttended: finalLastYear, educmasterNumber, gender,
      nationality, religion, fatherName, motherName, fatherProfession,
      motherProfession, fatherContact, fatherAddress, motherContact,
      motherAddress, guardianName, guardianContact, guardianAddress,
      canteenOptions, disciplinaryCommitment, disciplinarySignature,
      photo: finalPhoto
    };`;
    
content = content.replace(target1, insert1);

const target2 = `        canteen_options: studentData.canteenOptions.join(", ")
      }).eq('id', initialData.id);`;
const insert2 = `        canteen_options: studentData.canteenOptions.join(", "),
        photo: studentData.photo
      }).eq('id', initialData.id);`;

content = content.replace(target2, insert2);

const target3 = `        school_id: insertSchoolId,
        canteen_options: studentData.canteenOptions.join(", ")
      });`;
const insert3 = `        school_id: insertSchoolId,
        canteen_options: studentData.canteenOptions.join(", "),
        photo: studentData.photo
      });`;
content = content.replace(target3, insert3);

fs.writeFileSync('src/components/AddStudentModal.tsx', content);
console.log("Patched AddStudentModal for photo");
