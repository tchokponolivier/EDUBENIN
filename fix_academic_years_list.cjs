const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolAdminStudentList.tsx', 'utf8');

if (!code.includes('const [academicYears, setAcademicYears]')) {
  code = code.replace(
    `const [selectedYear, setSelectedYear] = useState<string>("ALL");`,
    `const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [academicYears, setAcademicYears] = useState<{id: string, name: string}[]>([]);`
  );
}

fs.writeFileSync('src/pages/SchoolAdminStudentList.tsx', code);
