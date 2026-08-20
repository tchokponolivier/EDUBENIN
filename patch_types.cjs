const fs = require('fs');
let content = fs.readFileSync('src/types/index.ts', 'utf-8');

const target = `"SUPER_ADMIN" | "SCHOOL_ADMIN" | "DIRECTOR_OF_STUDIES" | "SECRETARY" | "CASHIER" | "PARENT" | "TEACHER"`;
const insert = `"SUPER_ADMIN" | "SCHOOL_ADMIN" | "DIRECTOR_OF_STUDIES" | "SECRETARY" | "CASHIER" | "PARENT" | "TEACHER" | "SUPERVISOR"`;

content = content.replace(target, insert);

fs.writeFileSync('src/types/index.ts', content);
console.log("Patched types");
