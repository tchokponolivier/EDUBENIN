const fs = require('fs');
let code = fs.readFileSync('src/components/SecretaryTimetables.tsx', 'utf8');

// See if courseTeacherId is already in the UI. If not, add it.
if (!code.includes('<select value={courseTeacherId}')) {
  code = code.replace(
    /<div>\s*<label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Classe<\/label>[\s\S]*?<\/select>\s*<\/div>/,
    `<div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Classe</label>
                  <select value={courseLevel} onChange={e => setCourseLevel(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm">
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Professeur (Optionnel)</label>
                  <select value={courseTeacherId} onChange={e => setCourseTeacherId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm">
                    <option value="">Aucun professeur assigné</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                  </select>
                </div>`
  );
  
  // Update the insert
  code = code.replace(
    /await supabase\.from\('courses'\)\.insert\(\{\s*school_id:\s*user\.schoolId,\s*name:\s*courseName,\s*level:\s*courseLevel\s*\}\)/,
    `await supabase.from('courses').insert({
        school_id: user.schoolId,
        name: courseName,
        level: courseLevel,
        teacher_id: courseTeacherId || null
      })`
  );
  
  fs.writeFileSync('src/components/SecretaryTimetables.tsx', code);
}
