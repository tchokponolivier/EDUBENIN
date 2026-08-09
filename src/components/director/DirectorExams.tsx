import React, { useState } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';

export function DirectorExams() {
  const [sessions, setSessions] = useState([
    { id: 1, name: 'Composition 1er Trimestre', dates: '12 Déc - 16 Déc', status: 'PREPARATION', progress: 30 },
    { id: 2, name: 'Examen Blanc N°1', dates: '15 Fév - 17 Fév', status: 'PLANNED', progress: 0 },
  ]);

  const [missingGrades, setMissingGrades] = useState([
    { id: 1, teacher: 'M. Dubois', subject: 'Physique', class: '3ème A', type: 'Devoir 2', deadline: 'Il y a 2 jours' },
    { id: 2, teacher: 'Mme. Martin', subject: 'Français', class: '6ème B', type: 'Interrogation', deadline: 'Hier' },
  ]);

  return (
    <div className="space-y-8">
      {/* Sessions d'examen */}
      <section>
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
               <Calendar className="text-emerald-600" /> Sessions d'Examen
            </h2>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-bold w-full sm:w-auto">
               Créer une Session
            </button>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map(session => (
               <div key={session.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start">
                     <div>
                        <h3 className="font-bold text-gray-900 text-lg">{session.name}</h3>
                        <p className="text-slate-500 text-sm mt-1">{session.dates}</p>
                     </div>
                     <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${session.status === 'PREPARATION' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                        {session.status}
                     </span>
                  </div>
                  <div className="mt-6">
                     <div className="flex justify-between text-xs mb-2 text-slate-500 font-bold uppercase tracking-wide">
                        <span>Préparation (Salles, Sujets)</span>
                        <span className="text-emerald-700">{session.progress}%</span>
                     </div>
                     <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${session.progress}%` }}></div>
                     </div>
                  </div>
                  <div className="mt-6 flex gap-3">
                     <button className="flex-1 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                        Planning
                     </button>
                     <button className="flex-1 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                        Sujets
                     </button>
                  </div>
               </div>
            ))}
         </div>
      </section>

      {/* Centralisation des notes (Anomalies) */}
      <section>
         <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle className="text-rose-600" /> Notes Manquantes / Anomalies
         </h2>
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                 <thead className="bg-slate-50">
                    <tr>
                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Enseignant</th>
                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Matière / Classe</th>
                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Évaluation</th>
                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Retard</th>
                       <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                    </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-slate-200">
                    {missingGrades.map(grade => (
                       <tr key={grade.id}>
                          <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{grade.teacher}</td>
                          <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{grade.subject} - <span className="font-bold text-slate-700">{grade.class}</span></td>
                          <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{grade.type}</td>
                          <td className="px-6 py-4 text-rose-600 font-bold whitespace-nowrap">{grade.deadline}</td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                             <button className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-md text-sm font-bold hover:bg-rose-100 transition-colors">
                                Relancer
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
            </div>
         </div>
      </section>
    </div>
  );
}
