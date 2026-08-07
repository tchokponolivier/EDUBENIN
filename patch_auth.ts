import fs from 'fs';

let content = fs.readFileSync('src/lib/auth.tsx', 'utf-8');

content = content.replace(
`const { error: updateError } = await supabase.from('profiles').update({ role: pendingRole }).eq('id', sessionUser.id);
          if (updateError) {
            console.error("Erreur lors de la mise à jour du rôle :", updateError);
            alert(\`Erreur: Le rôle n'a pas pu être mis à jour. Détail: \${updateError.message}\`);
          }`,
`let schoolId = profile?.school_id;
          if (pendingRole === 'SCHOOL_ADMIN' && !schoolId) {
             const { data: newSchool, error: schoolErr } = await supabase.from('schools').insert({
                name: "Mon Établissement",
                locality: "À définir",
                contacts: ""
             }).select().single();
             if (newSchool) {
                schoolId = newSchool.id;
             }
          }
          const { error: updateError } = await supabase.from('profiles').update({ role: pendingRole, school_id: schoolId }).eq('id', sessionUser.id);
          if (updateError) {
            console.error("Erreur lors de la mise à jour du rôle :", updateError);
            alert(\`Erreur: Le rôle n'a pas pu être mis à jour. Détail: \${updateError.message}\`);
          }`
);

// We should also replace the manual login auto-create logic just in case:
content = content.replace(
`const newUser: User = {
        id: \`user_\${Date.now()}\`,
        email,
        name: fullName || email.split("@")[0],
        role: (role as any) || "PARENT"
      };`,
`const newUser: User = {
        id: \`user_\${Date.now()}\`,
        email,
        name: fullName || email.split("@")[0],
        role: (role as any) || "PARENT",
        schoolId: (role === "SCHOOL_ADMIN") ? "school_mock_1" : undefined
      };`
);

fs.writeFileSync('src/lib/auth.tsx', content);
