const fs = require('fs');
let content = fs.readFileSync('src/pages/Login.tsx', 'utf-8');

const target1 = `{ email: "secretary@school.com", title: "Secrétaire", desc: "Saisie d'élèves" },`;
const insert1 = `{ email: "secretary@school.com", title: "Secrétaire", desc: "Saisie d'élèves" },
    { email: "surveillant@school.com", title: "Surveillant", desc: "Absences et Matériel" },`;

content = content.replace(target1, insert1);

const target2 = `{ id: "SECRETARY", title: "Secrétaire", desc: "Saisie d'élèves" },`;
const insert2 = `{ id: "SECRETARY", title: "Secrétaire", desc: "Saisie d'élèves" },
                  { id: "SUPERVISOR", title: "Surveillant", desc: "Absences et matériel" },`;

content = content.replace(target2, insert2);

fs.writeFileSync('src/pages/Login.tsx', content);
console.log("Patched Login.tsx");
