const fs = require('fs');
let content = fs.readFileSync('src/lib/auth.tsx', 'utf-8');

// For google login, don't create a new school for SCHOOL_ADMIN automatically.
const googleSearch = `          if (pendingRole === 'SCHOOL_ADMIN' && !schoolId) {
             const { data: newSchool, error: schoolErr } = await supabase.from('schools').insert({
                name: "Mon Établissement",
                locality: "À définir",
                contacts: ""
             }).select().single();
             if (newSchool) {
                schoolId = newSchool.id;
             }
          }`;

const googleReplace = `          if (pendingRole === 'SCHOOL_ADMIN' && !schoolId) {
             // Do not automatically create a school. Let the user go to onboarding.
             schoolId = null;
          }`;
content = content.replace(googleSearch, googleReplace);

// For email login, don't use realSchoolId for SCHOOL_ADMIN.
// Let's replace the logic for setting schoolId in userToSet.
// (role === "SUPER_ADMIN" || role === "PARENT") ? undefined : (realSchoolId || "11111111-1111-4111-8111-111111111111")
// We can just use regex to replace how userToSet is initialized.

content = content.replace(
  /schoolId: \(role === 'SUPER_ADMIN' \|\| role === 'PARENT'\) \? undefined : \(realSchoolId \|\| foundUser\.schoolId\)/g,
  "schoolId: (role === 'SUPER_ADMIN' || role === 'PARENT' || role === 'SCHOOL_ADMIN') ? undefined : (realSchoolId || foundUser.schoolId)"
);

content = content.replace(
  /schoolId: \(foundUser\.role === 'SUPER_ADMIN' \|\| foundUser\.role === 'PARENT'\) \? undefined : \(realSchoolId \|\| foundUser\.schoolId\)/g,
  "schoolId: (foundUser.role === 'SUPER_ADMIN' || foundUser.role === 'PARENT' || foundUser.role === 'SCHOOL_ADMIN') ? undefined : (realSchoolId || foundUser.schoolId)"
);

content = content.replace(
  /schoolId: \(role === "SUPER_ADMIN" \|\| role === "PARENT"\) \? undefined : \(realSchoolId \|\| "11111111-1111-4111-8111-111111111111"\)/g,
  "schoolId: (role === 'SUPER_ADMIN' || role === 'PARENT' || role === 'SCHOOL_ADMIN') ? undefined : (realSchoolId || '11111111-1111-4111-8111-111111111111')"
);

fs.writeFileSync('src/lib/auth.tsx', content);
console.log("Patched auth.tsx");
