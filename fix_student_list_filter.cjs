const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolAdminStudentList.tsx', 'utf8');

code = code.replace(
  `const [selectedClass, setSelectedClass] = useState("ALL");`,
  `const [selectedClass, setSelectedClass] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState("ALL");
  const [academicYears, setAcademicYears] = useState<{id: string, name: string}[]>([]);`
);

code = code.replace(
  `supabase.from('students').select('*').eq('school_id', user.schoolId)`,
  `supabase.from('students').select('*').eq('school_id', user.schoolId),
      supabase.from('academic_years').select('id, name').eq('school_id', user.schoolId)`
);

code = code.replace(
  `const [studentsRes, coursesRes] = await Promise.all([`,
  `const [studentsRes, coursesRes, yearsRes] = await Promise.all([`
);

code = code.replace(
  `if (coursesRes.data) {`,
  `if (yearsRes.data) setAcademicYears(yearsRes.data);
    if (coursesRes.data) {`
);

code = code.replace(
  `const filteredStudents = students.filter(s => {`,
  `const filteredStudents = students.filter(s => {
    const matchesYear = selectedYear === "ALL" || s.academic_year === selectedYear;`
);

code = code.replace(
  `return matchesSearch && matchesClass;`,
  `return matchesSearch && matchesClass && matchesYear;`
);

code = code.replace(
  `<div className="w-full md:w-64">
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide flex items-center gap-1">
            <Filter size={14} /> Filtrer par classe
          </label>`,
  `<div className="w-full md:w-48">
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide flex items-center gap-1">
            <Filter size={14} /> Année Scolaire
          </label>
          <select 
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
          >
            <option value="ALL">Toutes les années</option>
            {academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
          </select>
        </div>
        <div className="w-full md:w-48">
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide flex items-center gap-1">
            <Filter size={14} /> Classe
          </label>`
);

fs.writeFileSync('src/pages/SchoolAdminStudentList.tsx', code);
