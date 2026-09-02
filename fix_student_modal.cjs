const fs = require('fs');
let code = fs.readFileSync('src/components/AddStudentModal.tsx', 'utf8');

code = code.replace(
  `const [level, setLevel] = useState(LEVELS[0]);`,
  `const [level, setLevel] = useState(LEVELS[0]);
  const [academicYears, setAcademicYears] = useState<{id: string, name: string}[]>([]);
  const [academicYear, setAcademicYear] = useState("");`
);

code = code.replace(
  `  useEffect(() => {
    if (isOpen) {
      supabase.from('schools').select('*').limit(1).then(({ data }) => {
        if (data && data.length > 0) setSettings(data[0]);
      });
    }
  }, [isOpen]);`,
  `  useEffect(() => {
    if (isOpen) {
      supabase.from('schools').select('*').limit(1).then(({ data }) => {
        if (data && data.length > 0) setSettings(data[0]);
      });
      if (user?.schoolId) {
        supabase.from('academic_years').select('id, name').eq('school_id', user.schoolId).eq('status', 'ACTIVE').then(({data}) => {
           if(data) {
             setAcademicYears(data);
             if(data.length > 0) setAcademicYear(data[0].name);
           }
        });
      }
    }
  }, [isOpen, user]);`
);

code = code.replace(
  `placeOfBirth,
        studentType,
        previousClass,
        previousSchool,
        lastYearAttended,
        status,`,
  `placeOfBirth,
        studentType,
        previousClass,
        previousSchool,
        lastYearAttended,
        status,
        academic_year: academicYear,`
);

// Add dropdown to the UI
// Look for Name inputs
code = code.replace(
  `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nom (Famille) *</label>`,
  `<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                 <label className="block text-xs font-semibold text-gray-700 mb-1">Année Scolaire *</label>
                 <select required value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm bg-slate-50">
                   {academicYears.length === 0 && <option value="">Aucune année active</option>}
                   {academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
                 </select>
              </div>
              <div className="md:col-span-2"></div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nom (Famille) *</label>`
);

fs.writeFileSync('src/components/AddStudentModal.tsx', code);
