const fs = require('fs');
let content = fs.readFileSync('src/pages/Parent.tsx', 'utf-8');

const replacement = `      const { error } = await supabase.from('students').insert({
        parent_id: user?.id,
        first_name: studentData.firstName,
        last_name: studentData.lastName,
        level: studentData.level,
        date_of_birth: studentData.dateOfBirth,
        gender: studentData.gender,
        school_id: user?.schoolId,
        canteen_options: studentData.canteenOptions.join(", ")
      });
      if (error) {
         alert("Erreur lors de l'inscription: " + error.message);
         return;
      }
      
      if (window.confirm("Inscription validée avec succès ! Voulez-vous ajouter un autre enfant ?")) {
         resetForm();
         return; // Keep form open
      } else {
         window.location.href = "/parent/payments";
      }`;

content = content.replace('/* db.addStudent removed */', replacement);
fs.writeFileSync('src/pages/Parent.tsx', content);
