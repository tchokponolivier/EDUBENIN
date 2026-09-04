const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolAdminStats.tsx', 'utf8');

// Add imports
if (!code.includes('import { supabase }')) {
    code = code.replace(
        `import React, { useState } from "react";`,
        `import React, { useState, useEffect } from "react";\nimport { supabase } from "../lib/supabase";\nimport { useAuth } from "../lib/auth";\nimport { Student, Payment, AcademicYear } from "../types";`
    );
}

// Add state for data fetching
code = code.replace(
  `const [activeTab, setActiveTab] = useState<"BILAN_CLASSE" | "SYNTHESE_ELEVE">("BILAN_CLASSE");`,
  `const [activeTab, setActiveTab] = useState<"BILAN_CLASSE" | "SYNTHESE_ELEVE">("BILAN_CLASSE");
  const { user } = useAuth();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  
  // Filters
  const [filterYear, setFilterYear] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterStudentId, setFilterStudentId] = useState("");
  
  useEffect(() => {
     if (!user?.schoolId) return;
     const fetchData = async () => {
         const [yRes, sRes, pRes] = await Promise.all([
             supabase.from('academic_years').select('*').eq('school_id', user.schoolId),
             supabase.from('students').select('*').eq('school_id', user.schoolId),
             supabase.from('payments').select('*').eq('school_id', user.schoolId)
         ]);
         if (yRes.data) setAcademicYears(yRes.data.map(d => ({id: d.id, name: d.name, status: d.status} as any)));
         if (sRes.data) setStudents(sRes.data.map(d => ({...d, id: d.id, firstName: d.first_name, lastName: d.last_name, level: d.level, academicYear: d.academic_year} as any)));
         if (pRes.data) setPayments(pRes.data.map(d => ({...d, studentId: d.student_id, amount: d.amount, academicYear: d.academic_year} as any)));
         
         const activeYear = yRes.data?.find(y => y.status === 'ACTIVE')?.name;
         if (activeYear) setFilterYear(activeYear);
     };
     fetchData();
  }, [user]);
  
  // Derive options
  const availableClasses = Array.from(new Set(students.filter(s => filterYear ? s.academicYear === filterYear : true).map(s => s.level))).sort();
  const availableStudents = students.filter(s => {
      let match = true;
      if (filterYear) match = match && s.academicYear === filterYear;
      if (filterClass) match = match && s.level === filterClass;
      return match;
  });
  
  const selectedStudent = students.find(s => s.id === filterStudentId);
  const studentPayments = payments.filter(p => p.studentId === filterStudentId && (!filterYear || p.academicYear === filterYear));
  const totalPaid = studentPayments.reduce((acc, p) => acc + p.amount, 0);`
);

// Replace SYNTHESE_ELEVE UI
code = code.replace(
  `{activeTab === "SYNTHESE_ELEVE" && (
         <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-2">Synthèse individuelle</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">Recherchez un élève pour visualiser son parcours pédagogique, son point financier et sa courbe de progression globale.</p>
            <div className="max-w-md mx-auto relative">
               <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
               <input
                  type="text"
                  placeholder="Entrez le nom de l'élève..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
               />
            </div>
         </div>
      )}`,
  `{activeTab === "SYNTHESE_ELEVE" && (
         <div className="flex flex-col gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
               <div className="flex-1">
                   <label className="block text-xs font-semibold text-gray-700 mb-1">Année Scolaire</label>
                   <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setFilterClass(""); setFilterStudentId(""); }} className="w-full px-3 py-2 border rounded bg-white text-sm">
                       <option value="">Toutes les années</option>
                       {academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
                   </select>
               </div>
               <div className="flex-1">
                   <label className="block text-xs font-semibold text-gray-700 mb-1">Classe</label>
                   <select value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterStudentId(""); }} className="w-full px-3 py-2 border rounded bg-white text-sm">
                       <option value="">Toutes les classes</option>
                       {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
               </div>
               <div className="flex-1 min-w-[250px]">
                   <label className="block text-xs font-semibold text-gray-700 mb-1">Élève (Nom ou Matricule)</label>
                   <select value={filterStudentId} onChange={e => setFilterStudentId(e.target.value)} className="w-full px-3 py-2 border rounded bg-white text-sm">
                       <option value="">Sélectionnez un élève...</option>
                       {availableStudents.map(s => <option key={s.id} value={s.id}>[{s.id.substring(0,8)}] {s.firstName} {s.lastName}</option>)}
                   </select>
               </div>
            </div>
            
            {selectedStudent ? (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1 space-y-4">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Informations de l'Élève</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-slate-500">Nom Complet:</span> <p className="font-bold">{selectedStudent.firstName} {selectedStudent.lastName}</p></div>
                                <div><span className="text-slate-500">Matricule:</span> <p className="font-bold">{selectedStudent.id.substring(0,8)}</p></div>
                                <div><span className="text-slate-500">Classe Actuelle:</span> <p className="font-bold">{selectedStudent.level}</p></div>
                                <div><span className="text-slate-500">Année:</span> <p className="font-bold">{selectedStudent.academicYear}</p></div>
                                <div><span className="text-slate-500">Sexe:</span> <p className="font-bold">{selectedStudent.gender === 'MALE' ? 'Masculin' : 'Féminin'}</p></div>
                                <div><span className="text-slate-500">Statut:</span> <p className="font-bold text-emerald-600">{selectedStudent.status || 'Actif'}</p></div>
                            </div>
                        </div>
                        <div className="flex-1 space-y-4">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Bilan Financier</h3>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600 font-medium text-sm">Total payé:</span>
                                    <span className="font-bold text-emerald-600 text-lg">{totalPaid.toLocaleString()} FCFA</span>
                                </div>
                                <div className="text-xs text-slate-500">
                                    Paiements effectués: {studentPayments.length}
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mt-4">Scolarité</h3>
                            <div className="text-sm text-slate-600">
                                <p>Pas d'absence répertoriée pour le moment.</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm">Sélectionnez un élève ci-dessus pour afficher sa synthèse.</p>
                </div>
            )}
         </div>
      )}`
);

fs.writeFileSync('src/pages/SchoolAdminStats.tsx', code);
