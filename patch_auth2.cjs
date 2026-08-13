const fs = require('fs');
let content = fs.readFileSync('src/lib/auth.tsx', 'utf-8');

content = content.replace(
  /schoolId: \(role === 'SUPER_ADMIN' \|\| role === 'PARENT' \|\| role === 'SCHOOL_ADMIN'\) \? undefined : \(realSchoolId \|\| foundUser\.schoolId\)/g,
  "schoolId: (role === 'SUPER_ADMIN' || role === 'PARENT') ? undefined : (realSchoolId || foundUser.schoolId)"
);

content = content.replace(
  /schoolId: \(foundUser\.role === 'SUPER_ADMIN' \|\| foundUser\.role === 'PARENT' \|\| foundUser\.role === 'SCHOOL_ADMIN'\) \? undefined : \(realSchoolId \|\| foundUser\.schoolId\)/g,
  "schoolId: (foundUser.role === 'SUPER_ADMIN' || foundUser.role === 'PARENT') ? undefined : (realSchoolId || foundUser.schoolId)"
);

fs.writeFileSync('src/lib/auth.tsx', content);
console.log("Patched auth.tsx again");
