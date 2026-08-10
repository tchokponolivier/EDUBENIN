const fs = require('fs');
let content = fs.readFileSync('src/lib/auth.tsx', 'utf-8');

// For userToSet
content = content.replace(
  'const userToSet = role ? { ...foundUser, role: role as any } : foundUser;',
  'const userToSet = role ? { ...foundUser, role: role as any, schoolId: (role === "SUPER_ADMIN" || role === "PARENT") ? undefined : (realSchoolId || foundUser.schoolId) } : { ...foundUser, schoolId: (foundUser.role === "SUPER_ADMIN" || foundUser.role === "PARENT") ? undefined : (realSchoolId || foundUser.schoolId) };'
);

content = content.replace(
  /schoolId: \(role === "SCHOOL_ADMIN"\) \? "11111111-1111-4111-8111-111111111111" : undefined/,
  'schoolId: (role === "SUPER_ADMIN" || role === "PARENT") ? undefined : (realSchoolId || "11111111-1111-4111-8111-111111111111")'
);

fs.writeFileSync('src/lib/auth.tsx', content);
