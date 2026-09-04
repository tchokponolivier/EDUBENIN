const fs = require('fs');
let code = fs.readFileSync('src/components/SecretaryTimetables.tsx', 'utf8');

// Add teachers state
code = code.replace(
  `const [selectedLevelFilter, setSelectedLevelFilter] = useState(LEVELS[0]);`,
  `const [selectedLevelFilter, setSelectedLevelFilter] = useState(LEVELS[0]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courseTeacherId, setCourseTeacherId] = useState("");`
);

// Fetch teachers
code = code.replace(
  `supabase.from('timetables').select('*').eq('school_id', user.schoolId)`,
  `supabase.from('timetables').select('*').eq('school_id', user.schoolId),
      supabase.from('profiles').select('*').eq('school_id', user.schoolId).eq('role', 'TEACHER')`
);

code = code.replace(
  `const [coursesRes, timetablesRes] = await Promise.all([`,
  `const [coursesRes, timetablesRes, teachersRes] = await Promise.all([`
);

code = code.replace(
  `if (timetablesRes.data) {`,
  `if (teachersRes.data) {
       setTeachers(teachersRes.data);
    }
    
    if (timetablesRes.data) {`
);

// Update insert/update course logic
code = code.replace(
  `const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;
    
    const { error } = await supabase.from('courses').insert({
       school_id: user.schoolId,
       name: courseName,
       level: courseLevel
    });`,
  `const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;
    
    const { error } = await supabase.from('courses').insert({
       school_id: user.schoolId,
       name: courseName,
       level: courseLevel,
       teacher_id: courseTeacherId || null
    });`
);

code = code.replace(
  `setCourseName("");
       setShowCourseForm(false);`,
  `setCourseName("");
       setCourseTeacherId("");
       setShowCourseForm(false);`
);

// Add teacher select to course form
code = code.replace(
  `<div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Classe</label>
                <select value={courseLevel} onChange={e => setCourseLevel(e.target.value)} className="w-full px-3 py-2 border rounded">
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>`,
  `<div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Classe</label>
                <select value={courseLevel} onChange={e => setCourseLevel(e.target.value)} className="w-full px-3 py-2 border rounded">
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Professeur (Optionnel)</label>
                <select value={courseTeacherId} onChange={e => setCourseTeacherId(e.target.value)} className="w-full px-3 py-2 border rounded bg-white">
                  <option value="">Aucun professeur assigné</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name || t.email}</option>)}
                </select>
              </div>`
);

// Display teacher in course list
code = code.replace(
  `<div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div>
                        <p className="font-bold text-gray-700">{course.name}</p>
                      </div>`,
  `<div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div>
                        <p className="font-bold text-gray-700">{course.name}</p>
                        {course.teacherId && (
                           <p className="text-[10px] text-slate-500 mt-0.5">Prof: {teachers.find(t => t.id === course.teacherId)?.full_name || 'Inconnu'}</p>
                        )}
                      </div>`
);

fs.writeFileSync('src/components/SecretaryTimetables.tsx', code);
