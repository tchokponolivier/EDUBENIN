import fs from 'fs';
let content = fs.readFileSync('src/types/index.ts', 'utf-8');

content = content.replace(
  /export type UserRole = "SUPER_ADMIN" \| "SCHOOL_ADMIN" \| "SECRETARY" \| "CASHIER" \| "PARENT" \| "TEACHER";/,
  'export type UserRole = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "SECRETARY" | "CASHIER" | "PARENT" | "TEACHER" | "DIRECTOR_OF_STUDIES";'
);

fs.writeFileSync('src/types/index.ts', content);
