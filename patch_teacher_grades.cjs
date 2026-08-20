const fs = require('fs');
let content = fs.readFileSync('src/pages/TeacherDashboard.tsx', 'utf-8');

// Modify the grades state type
content = content.replace(
  `const [grades, setGrades] = useState<Record<string, Record<string, string>>>({});`,
  `const [grades, setGrades] = useState<Record<string, Record<string, any>>>({});`
);

// We need to update the table headers
const headerTarget = `{subjects.map(s => (
                     <th key={s.id} className="px-2 py-2 border border-slate-700 text-center min-w-[80px]">
                        {s.name} <br/><span className="text-slate-400 font-normal">Coef {s.coef}</span>
                     </th>
                   ))}`;

const headerInsert = `{subjects.map(s => (
                     <React.Fragment key={s.id}>
                       <th className="px-2 py-2 border border-slate-700 text-center min-w-[60px] bg-slate-700/50 text-[9px]">Dev 1</th>
                       <th className="px-2 py-2 border border-slate-700 text-center min-w-[60px] bg-slate-700/50 text-[9px]">Int 1</th>
                       <th className="px-2 py-2 border border-slate-700 text-center min-w-[60px] bg-slate-700/50 text-[9px]">Int 2</th>
                       <th className="px-2 py-2 border border-slate-700 text-center min-w-[60px] text-emerald-400">
                          {s.name} (Moy)<br/><span className="text-slate-400 font-normal">Coef {s.coef}</span>
                       </th>
                     </React.Fragment>
                   ))}`;

content = content.replace(headerTarget, headerInsert);

// Now update the table cells
const cellTarget = `{subjects.map(s => (
                           <td key={s.id} className="px-2 py-1 border border-slate-200">
                              <input 
                                type="number" 
                                min="0" max="20" step="0.25"
                                value={sGrades[s.id] || ""}
                                onChange={(e) => {
                                   setGrades(prev => ({
                                      ...prev,
                                      [student.id]: {
                                        ...(prev[student.id] || {}),
                                        [s.id]: e.target.value
                                      }
                                   }));
                                }}
                                className="w-full text-center py-1 text-sm border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none bg-transparent"
                                placeholder="-"
                              />
                           </td>
                         ))}`;

const cellInsert = `{subjects.map(s => {
                           const g = sGrades[s.id] || { dev: "", int1: "", int2: "", avg: "" };
                           const handleUpdate = (field, val) => {
                             let newG = { ...g, [field]: val };
                             // Auto-calculate average if fields are present
                             const nDev = parseFloat(newG.dev);
                             const nInt1 = parseFloat(newG.int1);
                             const nInt2 = parseFloat(newG.int2);
                             let count = 0; let sum = 0;
                             if (!isNaN(nDev)) { sum += nDev; count++; }
                             if (!isNaN(nInt1)) { sum += nInt1; count++; }
                             if (!isNaN(nInt2)) { sum += nInt2; count++; }
                             if (count > 0) newG.avg = (sum / count).toFixed(2);
                             else newG.avg = "";
                             
                             // If they manually edit avg, we keep it
                             if (field === 'avg') newG.avg = val;
                             
                             setGrades(prev => ({
                               ...prev,
                               [student.id]: { ...(prev[student.id] || {}), [s.id]: newG }
                             }));
                           };
                           
                           return (
                             <React.Fragment key={s.id}>
                               <td className="px-1 py-1 border border-slate-200 bg-slate-50/50">
                                  <input type="number" min="0" max="20" step="0.25" value={g.dev || ""} onChange={e => handleUpdate('dev', e.target.value)} className="w-full text-center py-1 text-xs border-b border-transparent hover:border-slate-300 focus:border-emerald-500 outline-none bg-transparent" placeholder="-" />
                               </td>
                               <td className="px-1 py-1 border border-slate-200 bg-slate-50/50">
                                  <input type="number" min="0" max="20" step="0.25" value={g.int1 || ""} onChange={e => handleUpdate('int1', e.target.value)} className="w-full text-center py-1 text-xs border-b border-transparent hover:border-slate-300 focus:border-emerald-500 outline-none bg-transparent" placeholder="-" />
                               </td>
                               <td className="px-1 py-1 border border-slate-200 bg-slate-50/50">
                                  <input type="number" min="0" max="20" step="0.25" value={g.int2 || ""} onChange={e => handleUpdate('int2', e.target.value)} className="w-full text-center py-1 text-xs border-b border-transparent hover:border-slate-300 focus:border-emerald-500 outline-none bg-transparent" placeholder="-" />
                               </td>
                               <td className="px-1 py-1 border border-slate-200 bg-emerald-50/30">
                                  <input type="number" min="0" max="20" step="0.25" value={g.avg || ""} onChange={e => handleUpdate('avg', e.target.value)} className="w-full text-center py-1 text-sm font-bold text-emerald-700 border-b border-transparent hover:border-slate-300 focus:border-emerald-500 outline-none bg-transparent" placeholder="-" />
                               </td>
                             </React.Fragment>
                           );
                         })}`;

content = content.replace(cellTarget, cellInsert);

fs.writeFileSync('src/pages/TeacherDashboard.tsx', content);
console.log("Patched teacher grades");
