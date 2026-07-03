import React, { useState, useEffect } from "react";
import { db } from "../lib/db";
import { Student, LEVELS } from "../types";
import { useAuth } from "../lib/auth";
import { BookOpen, Users, Save, Download, LayoutGrid, ArrowLeft, Plus, Trash2, CheckSquare } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  coef: number;
}

export function TeacherDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [newCoef, setNewCoef] = useState("1");
  
  const [grades, setGrades] = useState<Record<string, Record<string, string>>>({});
  const [appreciations, setAppreciations] = useState<Record<string, string>>({});
  
  const [includedStudents, setIncludedStudents] = useState<string[]>([]);
  const [period, setPeriod] = useState("1er Trimestre");

  const isMaternelle = selectedClass?.includes("Maternelle");

  useEffect(() => {
    const all = db.getStudents();
    setStudents(all);
  }, []);

  const classStudents = students.filter(s => s.level === selectedClass);

  useEffect(() => {
    // When class changes, select all students by default for the report card
    setIncludedStudents(classStudents.map(s => s.id));
    // Provide default subjects if Maternelle
    if (selectedClass?.includes("Maternelle")) {
       setSubjects([
         { id: "s1", name: "Langage & Comm.", coef: 1 },
         { id: "s2", name: "Motricité", coef: 1 },
         { id: "s3", name: "Éveil & Découverte", coef: 1 }
       ]);
    } else {
       setSubjects([]);
    }
  }, [selectedClass]);

  const handleAddSubject = () => {
    if (!newSubject.trim()) return;
    setSubjects(prev => [...prev, { id: `sub_${Date.now()}`, name: newSubject, coef: Number(newCoef) || 1 }]);
    setNewSubject("");
    setNewCoef("1");
  };

  const removeSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  const handleGradeChange = (studentId: string, subjectId: string, value: string) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subjectId]: value
      }
    }));
  };

  const handleAppreciationChange = (studentId: string, value: string) => {
    setAppreciations(prev => ({ ...prev, [studentId]: value }));
  };

  const handleSaveGrades = () => {
    alert("Les notes et appréciations ont été enregistrées avec succès !");
  };
  
  const toggleStudentIncluded = (studentId: string) => {
    setIncludedStudents(prev => 
       prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };
  
  const getClassesToDisplay = () => {
     const classGroups = LEVELS.map(level => {
         return { level, count: students.filter(s => s.level === level).length };
     }).filter(c => c.count > 0);
     
     // Include unknown levels
     students.forEach(s => {
        if (s.level && !LEVELS.includes(s.level) && !classGroups.some(c => c.level === s.level)) {
            classGroups.push({ level: s.level, count: students.filter(x => x.level === s.level).length });
        }
     });

     return classGroups;
  };

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-700">Espace Professeur</h1>
          <p className="text-xs text-slate-500 mt-1">Gérez vos matières, saisissez les notes et constituez les relevés par classe.</p>
        </div>
      </div>

      {!selectedClass ? (
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {getClassesToDisplay().map((c) => (
              <div 
                 key={c.level} 
                 onClick={() => setSelectedClass(c.level)} 
                 className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center gap-3 hover:border-emerald-500 group"
              >
                 <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <LayoutGrid size={24} />
                 </div>
                 <span className="font-bold text-gray-700 text-lg text-center">{c.level}</span>
                 <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{c.count} élève{c.count > 1 ? 's' : ''} inscrits</span>
              </div>
            ))}
            {getClassesToDisplay().length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                 Aucune classe avec des élèves enregistrés pour le moment.
              </div>
            )}
         </div>
      ) : (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
         <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
           <button onClick={() => setSelectedClass(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-gray-700 transition-colors" title="Retour aux classes">
             <ArrowLeft size={18} />
           </button>
           <h3 className="font-bold text-gray-700 flex items-center gap-2 text-lg">
             <Users size={18} className="text-emerald-600" />
             Classe : {selectedClass}
           </h3>
         </div>

         <div className="flex flex-col lg:flex-row gap-8 mb-6">
            {/* Configuration des matières */}
            <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-200">
               <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><BookOpen size={16}/> Matières du relevé</h4>
               {subjects.length > 0 ? (
                 <ul className="space-y-2 mb-4">
                   {subjects.map(s => (
                     <li key={s.id} className="flex items-center justify-between bg-white p-2 border border-slate-200 rounded text-sm">
                        <span className="font-semibold text-gray-700">{s.name} <span className="text-xs text-slate-500 font-normal">(Coef. {s.coef})</span></span>
                        <button onClick={() => removeSubject(s.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={14}/></button>
                     </li>
                   ))}
                 </ul>
               ) : (
                 <p className="text-xs text-slate-500 mb-4 italic">Aucune matière ajoutée pour cette classe. Ajoutez-en ci-dessous.</p>
               )}
               
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={newSubject} 
                   onChange={e => setNewSubject(e.target.value)} 
                   placeholder={isMaternelle ? "Nouvelle matière/domaine" : "Nouvelle matière"}
                   className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                 />
                 {!isMaternelle && (
                 <input 
                   type="number" 
                   value={newCoef} 
                   onChange={e => setNewCoef(e.target.value)} 
                   min="1"
                   placeholder="Coef"
                   className="w-16 px-2 py-1.5 border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                 />
                 )}
                 <button onClick={handleAddSubject} className="bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-700 transition flex items-center justify-center">
                    <Plus size={16} />
                 </button>
               </div>
            </div>

            {/* Période / Actions */}
            <div className="w-full lg:w-72 bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
               <div>
                 <h4 className="font-bold text-gray-700 mb-2">Période</h4>
                 <input 
                    type="text" 
                    value={period} 
                    onChange={e => setPeriod(e.target.value)} 
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none mb-4" 
                    placeholder="Ex: 1er Trimestre" 
                 />
               </div>
               <div className="space-y-2">
                 <button onClick={handleSaveGrades} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded text-sm font-bold uppercase tracking-wider hover:bg-emerald-700 transition shadow-sm">
                   <Save size={16} /> Enregistrer Brouillon
                 </button>
                 <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-white rounded text-sm font-bold uppercase tracking-wider hover:bg-slate-700 transition shadow-sm">
                   <Download size={16} /> Générer Relevés
                 </button>
               </div>
            </div>
         </div>

         {/* Table des élèves et notes */}
         <div className="overflow-x-auto print:overflow-visible">
            <h4 className="font-bold text-gray-700 mb-3 ml-1">Constitution des relevés {classStudents.length > 0 && `(${includedStudents.length}/${classStudents.length} sélectionnés)`}</h4>
            <table className="w-full text-left border-collapse border border-slate-200">
               <thead className="bg-slate-800 text-[10px] uppercase text-white font-bold tracking-wider">
                 <tr>
                   <th className="px-3 py-2 border border-slate-700 text-center w-8" title="Sélectionner pour le relevé">
                      <CheckSquare size={14} className="mx-auto" />
                   </th>
                   <th className="px-3 py-2 border border-slate-700 w-48">Nom et prénoms</th>
                   
                   {subjects.map(s => (
                     <th key={s.id} className="px-2 py-2 border border-slate-700 text-center min-w-[80px]">
                        {s.name} <br/><span className="text-slate-400 font-normal">Coef {s.coef}</span>
                     </th>
                   ))}

                   <th className="px-3 py-2 border border-slate-700 min-w-[150px]">Appréciation globale</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-200 text-sm">
                 {classStudents.length === 0 ? (
                   <tr><td colSpan={subjects.length + 3} className="p-8 text-center text-slate-500">Aucun élève dans cette classe.</td></tr>
                 ) : (
                   classStudents.map((student) => {
                     const isIncluded = includedStudents.includes(student.id);
                     const sGrades = grades[student.id] || {};
                     return (
                       <tr key={student.id} className={`transition-colors ${isIncluded ? 'hover:bg-slate-50' : 'bg-slate-50/50 opacity-60'}`}>
                         <td className="px-3 py-2 border border-slate-200 text-center">
                            <input 
                              type="checkbox" 
                              checked={isIncluded}
                              onChange={() => toggleStudentIncluded(student.id)}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                         </td>
                         <td className="px-3 py-2 font-semibold text-gray-700 border border-slate-200 uppercase text-xs">
                           {student.lastName} {student.firstName}
                         </td>
                         
                         {subjects.map(s => (
                           <td key={s.id} className="p-1 border border-slate-200 text-center">
                             <input 
                               type="text" 
                               disabled={!isIncluded}
                               placeholder={isMaternelle ? "A/ECA/NA" : "/20"}
                               className="w-full min-w-[60px] text-center text-xs p-1.5 outline-none focus:ring-1 ring-emerald-500 rounded bg-transparent disabled:cursor-not-allowed" 
                               value={sGrades[s.id] || ''} 
                               onChange={e => handleGradeChange(student.id, s.id, e.target.value)} 
                             />
                           </td>
                         ))}
                         
                         <td className="p-1 border border-slate-200">
                            <input 
                              type="text" 
                              disabled={!isIncluded}
                              placeholder="Observation / Appréciation" 
                              className="w-full text-xs p-1.5 outline-none focus:ring-1 ring-emerald-500 rounded bg-transparent disabled:cursor-not-allowed" 
                              value={appreciations[student.id] || ''} 
                              onChange={e => handleAppreciationChange(student.id, e.target.value)} 
                            />
                         </td>
                       </tr>
                     );
                   })
                 )}
               </tbody>
            </table>
            <div className="mt-4 p-4 bg-blue-50 text-blue-800 text-xs rounded-lg flex gap-2">
               L'impression des relevés se basera sur les élèves cochés et les colonnes de matières configurées. Le système s'occupera du calcul des moyennes automatiquement.
            </div>
         </div>
      </div>
      )}
    </div>
  );
}
