const fs = require('fs');
let code = fs.readFileSync('src/components/SecretaryTimetables.tsx', 'utf8');

code = code.replace(
  `teacher_id: user.id // or proper teacher selection`,
  `teacher_id: courseTeacherId || null`
);

const formTarget = `<select value={courseLevel} onChange={e => setCourseLevel(e.target.value)} className="w-full px-2 py-1 border rounded">
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>`;

const formReplacement = `<select value={courseLevel} onChange={e => setCourseLevel(e.target.value)} className="w-full px-2 py-1 border rounded">
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <select value={courseTeacherId} onChange={e => setCourseTeacherId(e.target.value)} className="w-full px-2 py-1 border rounded bg-white">
                <option value="">Sélectionner un professeur (optionnel)</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name || t.email}</option>)}
              </select>`;

if (code.includes(formTarget)) {
  fs.writeFileSync('src/components/SecretaryTimetables.tsx', code.replace(formTarget, formReplacement));
  console.log("Patched Timetables successfully");
} else {
  console.log("Target not found!");
}
