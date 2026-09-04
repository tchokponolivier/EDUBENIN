const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolAdminTeachers.tsx', 'utf8');

code = code.replace(
  `<button className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded shadow-sm hover:bg-slate-100 transition-colors flex items-center justify-center gap-1">`,
  `<button onClick={() => window.location.href = '/school-admin/students?tab=TIMETABLES'} className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded shadow-sm hover:bg-slate-100 transition-colors flex items-center justify-center gap-1">`
);

code = code.replace(
  `<button className="flex-1 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded shadow-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1">`,
  `<button onClick={() => window.location.href = '/school-admin/payments?tab=SALARIES'} className="flex-1 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded shadow-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1">`
);

fs.writeFileSync('src/pages/SchoolAdminTeachers.tsx', code);
