const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');

if (!code.includes('matricule?: string;')) {
  code = code.replace(
    `export interface Student {
  id: string;`,
    `export interface Student {
  id: string;
  matricule?: string;`
  );
  fs.writeFileSync('src/types/index.ts', code);
}
