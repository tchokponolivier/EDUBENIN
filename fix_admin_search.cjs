const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolAdmin.tsx', 'utf8');

code = code.replace(
  `const [settings, setSettings] = useState<SchoolSettings | null>(null);`,
  `const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [searchTerm, setSearchTerm] = useState("");`
);

code = code.replace(
  `<h3 className="font-bold text-gray-700">Inscriptions Récentes</h3>
              <div className="relative">
                 <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                 <input
                    type="text"
                    placeholder="Rechercher..."
                    className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                 />`,
  `<h3 className="font-bold text-gray-700">Inscriptions Récentes</h3>
              <div className="relative">
                 <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                 <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher par nom ou matricule..."
                    className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none w-64"
                 />`
);

// We need to replace students.slice(0, 5).map...
code = code.replace(
  `students.slice(0, 5).map((student) => (`,
  `students.filter(s => (s.firstName + ' ' + s.lastName).toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 10).map((student) => (`
);

// Add Matricule and Utilisateur to table
code = code.replace(
  `<th className="px-4 py-3">Nom de l'élève</th>
                    <th className="px-4 py-3">Niveau / Classe</th>
                    <th className="px-4 py-3">Date</th>`,
  `<th className="px-4 py-3">Matricule</th>
                    <th className="px-4 py-3">Nom de l'élève</th>
                    <th className="px-4 py-3">Niveau / Classe</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Enregistré par</th>`
);

code = code.replace(
  `<td colSpan={3} className="px-4 py-8 text-center text-slate-500 text-xs">`,
  `<td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-xs">`
);

code = code.replace(
  `<tr key={student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-xs text-gray-700">
                          {student.firstName} {student.lastName}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{student.level}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </td>
                      </tr>`,
  `<tr key={student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-xs text-slate-500">
                          {student.id.substring(0, 8)}
                        </td>
                        <td className="px-4 py-3 font-medium text-xs text-gray-700">
                          {student.firstName} {student.lastName}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{student.level}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {student.parentId ? "Parent" : "Administration"}
                        </td>
                      </tr>`
);

fs.writeFileSync('src/pages/SchoolAdmin.tsx', code);
