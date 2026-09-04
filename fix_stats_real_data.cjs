const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolAdminStats.tsx', 'utf8');

// Replace mock bilanData
code = code.replace(
  /const bilanData = \[\s*\{[\s\S]*?\}\s*\];/g,
  `const bilanData = React.useMemo(() => {
    const classMap = new Map<string, { g: number; f: number; t: number }>();
    
    // Filter students by selected year for the Bilan
    const filteredStudents = filterYear ? students.filter(s => s.academicYear === filterYear) : students;
    
    filteredStudents.forEach(s => {
       const lvl = s.level || 'Inconnu';
       if (!classMap.has(lvl)) {
          classMap.set(lvl, { g: 0, f: 0, t: 0 });
       }
       const stat = classMap.get(lvl)!;
       if (s.gender === 'MALE') stat.g += 1;
       else if (s.gender === 'FEMALE') stat.f += 1;
       stat.t += 1;
    });
    
    return Array.from(classMap.entries()).map(([classe, stats]) => ({
       classe,
       g: stats.g,
       f: stats.f,
       t: stats.t,
       majorMoy: null, majorNom: "-", minorMoy: null, minorNom: "-",
       nbreMoy: 0, pMoy: 0, nbreNonMoy: 0, pNonMoy: 0, 
       nbreGMoy: 0, pGMoy: 0, nbreFMoy: 0, pFMoy: 0, moyClasse: null
    })).sort((a,b) => a.classe.localeCompare(b.classe));
  }, [students, filterYear]);`
);

// We need to add the academic year dropdown to the BILAN_CLASSE view.
// Currently it is hardcoded to "Année Scolaire: 2025-2026"
code = code.replace(
  /<p className="text-xs font-semibold text-slate-500">Année Scolaire: 2025-2026<\/p>/g,
  `<div className="flex items-center gap-2 mt-2">
                 <p className="text-xs font-semibold text-slate-500">Année Scolaire:</p>
                 <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-2 py-1 text-xs border border-slate-200 rounded outline-none bg-white">
                    <option value="">Toutes les années</option>
                    {academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
                 </select>
               </div>`
);

// Update table to show N/A for missing averages
code = code.replace(
  /<td className="p-2 border border-slate-700 text-center text-emerald-400">\{row\.majorMoy\}<\/td>/g,
  `<td className="p-2 border border-slate-700 text-center text-emerald-400">{row.majorMoy || '-'}</td>`
);
code = code.replace(
  /<td className="p-2 border border-slate-700 text-center text-red-400">\{row\.minorMoy\}<\/td>/g,
  `<td className="p-2 border border-slate-700 text-center text-red-400">{row.minorMoy || '-'}</td>`
);
code = code.replace(
  /<td className="p-2 border border-slate-700 text-center font-bold text-emerald-400">\{row\.moyClasse\}<\/td>/g,
  `<td className="p-2 border border-slate-700 text-center font-bold text-emerald-400">{row.moyClasse || '-'}</td>`
);

fs.writeFileSync('src/pages/SchoolAdminStats.tsx', code);
