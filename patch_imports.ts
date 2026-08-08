import fs from 'fs';

let studentsContent = fs.readFileSync('src/pages/SchoolAdminStudents.tsx', 'utf-8');
if (!studentsContent.includes('import { useLocation } from "react-router-dom";')) {
  studentsContent = studentsContent.replace(
    'import { useAuth } from "../lib/auth";',
    'import { useAuth } from "../lib/auth";\nimport { useLocation } from "react-router-dom";'
  );
  fs.writeFileSync('src/pages/SchoolAdminStudents.tsx', studentsContent);
}

let paymentsContent = fs.readFileSync('src/pages/SchoolAdminPayments.tsx', 'utf-8');
if (!paymentsContent.includes('import { useLocation } from "react-router-dom";')) {
  paymentsContent = paymentsContent.replace(
    'import { useAuth } from "../lib/auth";',
    'import { useAuth } from "../lib/auth";\nimport { useLocation } from "react-router-dom";'
  );
  fs.writeFileSync('src/pages/SchoolAdminPayments.tsx', paymentsContent);
}
