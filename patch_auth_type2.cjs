const fs = require('fs');

// Path to types
const fileTypes = 'src/types.ts';
let typesCode = fs.readFileSync(fileTypes, 'utf8');

const targetUser = `export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  schoolId?: string;
}`;

const replacementUser = `export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  schoolId?: string;
  avatar?: string;
}`;

typesCode = typesCode.replace(targetUser, replacementUser);
fs.writeFileSync(fileTypes, typesCode);
