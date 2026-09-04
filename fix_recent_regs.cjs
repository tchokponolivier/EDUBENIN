const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolAdmin.tsx', 'utf8');

code = code.replace(
  `<th className="px-4 py-3">Niveau / Classe</th>`,
  `<th className="px-4 py-3">Niveau / Classe</th>
                    <th className="px-4 py-3">Année Scolaire</th>`
);

code = code.replace(
  `<td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-xs">`,
  `<td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-xs">`
);

code = code.replace(
  `<td className="px-4 py-3 text-xs text-slate-500">{student.level}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </td>`,
  `<td className="px-4 py-3 text-xs text-slate-500">{student.level}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{student.academic_year || student.academicYear || '-'}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </td>`
);

fs.writeFileSync('src/pages/SchoolAdmin.tsx', code);
