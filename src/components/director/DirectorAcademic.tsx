import React, { useState } from 'react';
import { Calendar as CalendarIcon, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export function DirectorAcademic() {
  const [evaluations, setEvaluations] = useState([
    { id: 1, title: 'Devoir Surveillé 1 - Maths', classes: '6ème A, 6ème B', date: '2023-11-15', status: 'VALIDATED' },
    { id: 2, title: 'Examen Blanc - SVT', classes: 'Terminale D', date: '2023-11-20', status: 'PENDING' },
  ]);

  const [cahiers, setCahiers] = useState([
    { id: 1, teacher: 'M. Dupont', subject: 'Mathématiques', class: '6ème A', lastUpdate: 'Il y a 2 jours', status: 'OK', progression: '85%' },
    { id: 2, teacher: 'Mme. Martin', subject: 'Français', class: '3ème B', lastUpdate: "Aujourd'hui", status: 'OK', progression: '90%' },
    { id: 3, teacher: 'M. Dubois', subject: 'Physique', class: '2nde C', lastUpdate: 'Il y a 5 jours', status: 'LATE', progression: '70%' },
  ]);

  return (
    <div className="space-y-8">
      {/* Evaluations */}
      <section>
         <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CalendarIcon className="text-emerald-600" /> Planification des Évaluations
         </h2>
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                 <thead className="bg-slate-50">
                    <tr>
                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Évaluation</th>
                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Classes concernées</th>
                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date Prévue</th>
                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                       <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-slate-200">
                    {evaluations.map(ev => (
                       <tr key={ev.id}>
                          <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{ev.title}</td>
                          <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{ev.classes}</td>
                          <td className="px-6 py-4 text-slate-500 font-bold whitespace-nowrap">{ev.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                             {ev.status === 'VALIDATED' ? (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-md bg-emerald-100 text-emerald-800 uppercase tracking-wide">Validé</span>
                             ) : (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-md bg-amber-100 text-amber-800 uppercase tracking-wide">En attente</span>
                             )}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                             {ev.status === 'PENDING' ? (
                                <button className="text-emerald-600 font-bold hover:text-emerald-900 bg-emerald-50 px-3 py-1 rounded-md">Valider</button>
                             ) : (
                                <button className="text-slate-400 font-bold hover:text-slate-600 bg-slate-50 px-3 py-1 rounded-md">Éditer</button>
                             )}
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
            </div>
         </div>
      </section>

      {/* Cahiers de textes */}
      <section>
         <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle className="text-emerald-600" /> Validation des Cahiers de Textes
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cahiers.map(cahier => (
               <div key={cahier.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-emerald-200 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-3">
                     <div>
                        <h3 className="font-bold text-gray-800">{cahier.teacher}</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">{cahier.subject} - {cahier.class}</p>
                     </div>
                     {cahier.status === 'OK' ? (
                        <CheckCircle className="text-emerald-500 w-6 h-6" />
                     ) : (
                        <AlertTriangle className="text-rose-500 w-6 h-6" />
                     )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                     <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Progression</span>
                        <span className="font-black text-emerald-700">{cahier.progression}</span>
                     </div>
                     <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                        <div className={`h-2 rounded-full ${cahier.status === 'OK' ? 'bg-emerald-500' : 'bg-rose-400'}`} style={{ width: cahier.progression }}></div>
                     </div>
                     <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                        <Clock className="w-3 h-3" /> Dernière MAJ: {cahier.lastUpdate}
                     </p>
                  </div>
               </div>
            ))}
         </div>
      </section>
    </div>
  );
}
