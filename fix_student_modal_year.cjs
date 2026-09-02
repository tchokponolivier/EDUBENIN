const fs = require('fs');
let code = fs.readFileSync('src/components/AddStudentModal.tsx', 'utf8');

code = code.replace(
  `<div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Statut Élève</label>`,
  `<div>
                 <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Année Scolaire *</label>
                 <select required value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm bg-emerald-50 text-emerald-800 font-bold">
                   {academicYears.length === 0 && <option value="">Aucune année active</option>}
                   {academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
                 </select>
              </div>
              <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Statut Élève</label>`
);

fs.writeFileSync('src/components/AddStudentModal.tsx', code);
