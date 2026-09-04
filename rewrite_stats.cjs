const fs = require('fs');

const code = `import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BookOpen, Printer, Search } from "lucide-react";
import { useAuth } from "../lib/auth";

export function SchoolAdminStats() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"BILAN_CLASSE" | "SYNTHESE_ELEVE">("BILAN_CLASSE");
  const [students, setStudents] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<{id: string, name: string}[]>([]);
  const [filterYear, setFilterYear] = useState<string>("");
  const [synthYear, setSynthYear] = useState<string>("");
  const [synthClass, setSynthClass] = useState<string>("");
  const [synthStudentId, setSynthStudentId] = useState<string>("");

  useEffect(() => {
    if (user?.schoolId) {
      supabase.from('students').select('*').eq('school_id', user.schoolId).then(({data}) => {
         if (data) setStudents(data);
      });
      supabase.from('academic_years').select('id, name').eq('school_id', user.schoolId).then(({data}) => {
         if (data) {
             setAcademicYears(data);
         }
      });
    }
  }, [user]);

  const classes = Array.from<string>(new Set(students.map(s => s.level as string))).sort();

  const bilanData = React.useMemo(() => {
    const classMap = new Map<string, { g: number; f: number; t: number }>();
    const filteredStudents = filterYear ? students.filter(s => s.academic_year === filterYear || s.academicYear === filterYear) : students;
    
    filteredStudents.forEach(s => {
       const lvl = s.level || 'Inconnu';
       if (!classMap.has(lvl)) classMap.set(lvl, { g: 0, f: 0, t: 0 });
       const stat = classMap.get(lvl)!;
       if (s.gender === 'MALE') stat.g += 1;
       else if (s.gender === 'FEMALE') stat.f += 1;
       stat.t += 1;
    });
    
    return Array.from(classMap.entries()).map(([classe, stats]) => ({
       classe, g: stats.g, f: stats.f, t: stats.t,
       majorMoy: null, majorNom: "-", minorMoy: null, minorNom: "-",
       nbreMoy: 0, pMoy: 0, nbreNonMoy: 0, pNonMoy: 0, 
       nbreGMoy: 0, pGMoy: 0, nbreFMoy: 0, pFMoy: 0, moyClasse: null
    })).sort((a,b) => a.classe.localeCompare(b.classe));
  }, [students, filterYear]);

  const pieData = React.useMemo(() => {
     return bilanData.map(row => ({ name: row.classe, value: row.t }));
  }, [bilanData]);

  const synthFilteredStudents = React.useMemo(() => {
     let res = students;
     if (synthYear) res = res.filter(s => s.academic_year === synthYear || s.academicYear === synthYear);
     if (synthClass) res = res.filter(s => s.level === synthClass);
     return res;
  }, [students, synthYear, synthClass]);
  
  const selectedSynthStudent = React.useMemo(() => {
     return synthStudentId ? students.find(s => s.id === synthStudentId) : null;
  }, [students, synthStudentId]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  return (
    <div className="flex flex-col gap-6 p-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-700">Synthèse & Bilans</h1>
          <p className="text-xs text-slate-500 mt-1">Générez et imprimez les bilans trimestriels et annuels</p>
        </div>
        <div className="flex p-1 bg-slate-100 rounded-lg shrink-0 overflow-x-auto max-w-full">
          <button 
            onClick={() => setActiveTab("BILAN_CLASSE")} 
            className={\`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors \${activeTab === "BILAN_CLASSE" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}\`}
          >
            Bilan par Classes
          </button>
          <button 
            onClick={() => setActiveTab("SYNTHESE_ELEVE")} 
            className={\`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors \${activeTab === "SYNTHESE_ELEVE" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}\`}
          >
            Synthèse Élève
          </button>
        </div>
      </div>

      {activeTab === "BILAN_CLASSE" && (
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 w-full md:w-1/2">
             <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-4">Répartition des élèves par classe</h3>
             <div className="h-[300px] w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => \`\${name} (\${(percent * 100).toFixed(0)}%)\`} outerRadius={100} fill="#8884d8" dataKey="value">
                       {pieData.map((entry, index) => <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />)}
                     </Pie>
                     <Tooltip formatter={(value: number) => [\`\${value} élèves\`, 'Effectif']} />
                     <Legend />
                   </PieChart>
                </ResponsiveContainer>
             </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                 <h3 className="font-bold text-gray-700 text-lg uppercase tracking-wider">Bilan Trimestriel</h3>
                 <div className="flex items-center gap-2 mt-2">
                   <p className="text-xs font-semibold text-slate-500">Année Scolaire:</p>
                   <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-2 py-1 text-xs border border-slate-200 rounded outline-none bg-white">
                      <option value="">Toutes les années</option>
                      {academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
                   </select>
                 </div>
              </div>
              <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white rounded font-bold uppercase tracking-wider text-xs hover:bg-slate-700 transition">
                <Printer size={14} /> Imprimer
              </button>
            </div>
            
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-800 text-white text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                     <th className="p-2 border border-slate-700">Classe</th>
                     <th className="p-2 border border-slate-700 text-center" colSpan={3}>Effectif</th>
                     <th className="p-2 border border-slate-700 text-center" colSpan={2}>Major</th>
                     <th className="p-2 border border-slate-700 text-center" colSpan={2}>Minor</th>
                     <th className="p-2 border border-slate-700 text-center" colSpan={2}>Moyennes</th>
                     <th className="p-2 border border-slate-700 text-center" colSpan={2}>Non Moyennes</th>
                  </tr>
                  <tr>
                     <th className="p-2 border border-slate-700"></th>
                     <th className="p-2 border border-slate-700 text-center">G</th>
                     <th className="p-2 border border-slate-700 text-center">F</th>
                     <th className="p-2 border border-slate-700 text-center bg-slate-700">T</th>
                     <th className="p-2 border border-slate-700 text-center">Moy</th>
                     <th className="p-2 border border-slate-700 text-center">Nom & Prénoms</th>
                     <th className="p-2 border border-slate-700 text-center">Moy</th>
                     <th className="p-2 border border-slate-700 text-center">Nom & Prénoms</th>
                     <th className="p-2 border border-slate-700 text-center">Nbre</th>
                     <th className="p-2 border border-slate-700 text-center">%</th>
                     <th className="p-2 border border-slate-700 text-center">Nbre</th>
                     <th className="p-2 border border-slate-700 text-center">%</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-gray-700">
                  {bilanData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                       <td className="p-2 border border-slate-200 font-bold">{row.classe}</td>
                       <td className="p-2 border border-slate-200 text-center">{row.g}</td>
                       <td className="p-2 border border-slate-200 text-center">{row.f}</td>
                       <td className="p-2 border border-slate-200 text-center font-bold bg-slate-50">{row.t}</td>
                       <td className="p-2 border border-slate-200 text-center text-emerald-600">{row.majorMoy || '-'}</td>
                       <td className="p-2 border border-slate-200">{row.majorNom}</td>
                       <td className="p-2 border border-slate-200 text-center text-red-600">{row.minorMoy || '-'}</td>
                       <td className="p-2 border border-slate-200">{row.minorNom}</td>
                       <td className="p-2 border border-slate-200 text-center">{row.nbreMoy}</td>
                       <td className="p-2 border border-slate-200 text-center">{row.pMoy}%</td>
                       <td className="p-2 border border-slate-200 text-center">{row.nbreNonMoy}</td>
                       <td className="p-2 border border-slate-200 text-center">{row.pNonMoy}%</td>
                    </tr>
                  ))}
                  {bilanData.length === 0 && (
                     <tr>
                        <td colSpan={12} className="p-8 text-center text-slate-500">Aucune donnée pour l'année sélectionnée.</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "SYNTHESE_ELEVE" && (
         <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
               <div className="flex-1">
                 <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Année Scolaire</label>
                 <select value={synthYear} onChange={e => setSynthYear(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 outline-none text-sm">
                    <option value="">Toutes les années</option>
                    {academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
                 </select>
               </div>
               <div className="flex-1">
                 <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Classe</label>
                 <select value={synthClass} onChange={e => setSynthClass(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 outline-none text-sm">
                    <option value="">Toutes les classes</option>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
               </div>
               <div className="flex-1">
                 <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Élève (Matricule - Nom)</label>
                 <select value={synthStudentId} onChange={e => setSynthStudentId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 outline-none text-sm">
                    <option value="">Sélectionner un élève</option>
                    {synthFilteredStudents.map(s => (
                       <option key={s.id} value={s.id}>
                          {s.matricule || s.id.substring(0,8)} - {s.first_name} {s.last_name}
                       </option>
                    ))}
                 </select>
               </div>
            </div>

            {selectedSynthStudent ? (
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                     <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Informations de l'Élève</h3>
                     <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                           <span className="text-slate-500">Nom Complet:</span>
                           <span className="font-bold">{selectedSynthStudent.first_name} {selectedSynthStudent.last_name}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-slate-500">Matricule:</span>
                           <span className="font-bold">{selectedSynthStudent.matricule || selectedSynthStudent.id.substring(0,8)}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-slate-500">Classe:</span>
                           <span className="font-bold">{selectedSynthStudent.level}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-slate-500">Année Scolaire:</span>
                           <span className="font-bold">{selectedSynthStudent.academic_year || selectedSynthStudent.academicYear}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-slate-500">Sexe:</span>
                           <span className="font-bold">{selectedSynthStudent.gender === 'MALE' ? 'Masculin' : (selectedSynthStudent.gender === 'FEMALE' ? 'Féminin' : '-')}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-slate-500">Statut:</span>
                           <span className="font-bold text-emerald-600">{selectedSynthStudent.student_type === 'NEW' ? 'Nouveau' : 'Ancien'}</span>
                        </div>
                     </div>
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Synthèse Globale</h3>
                     <div className="flex items-center justify-center h-32 bg-slate-50 rounded border border-slate-100 text-center p-4">
                        <p className="text-slate-500 text-sm">
                           Les bulletins de notes et historiques des paiements détaillés apparaîtront ici dès que les modules pédagogiques et financiers seront consolidés pour cet élève.
                        </p>
                     </div>
                  </div>
               </div>
            ) : (
               <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 text-sm max-w-md mx-auto">
                     Sélectionnez un élève dans les filtres ci-dessus pour afficher sa synthèse individuelle.
                  </p>
               </div>
            )}
         </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/pages/SchoolAdminStats.tsx', code);
