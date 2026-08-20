const fs = require('fs');
let content = fs.readFileSync('src/lib/auth.tsx', 'utf-8');

const target = `  "secretary@school.com": {
    id: "44444444-4444-4444-8444-444444444444",
    email: "secretary@school.com",
    name: "Secrétaire Ecole",
    role: "SECRETARY",
    schoolId: "11111111-1111-4111-8111-111111111111",
  },`;
const insert = `  "secretary@school.com": {
    id: "44444444-4444-4444-8444-444444444444",
    email: "secretary@school.com",
    name: "Secrétaire Ecole",
    role: "SECRETARY",
    schoolId: "11111111-1111-4111-8111-111111111111",
  },
  "surveillant@school.com": {
    id: "88888888-8888-4888-8888-888888888888",
    email: "surveillant@school.com",
    name: "Surveillant Test",
    role: "SUPERVISOR",
    schoolId: "11111111-1111-4111-8111-111111111111",
  },`;

content = content.replace(target, insert);

fs.writeFileSync('src/lib/auth.tsx', content);
console.log("Patched auth.tsx");
