import React, { useState } from 'react';
import { Compass, ShieldAlert, Plus } from 'lucide-react';

export function DirectorOrientation() {
  const [sanctions, setSanctions] = useState([
    { id: 1, student: 'KOUASSI Marc', class: '3ème A', type: 'Avertissement', reason: 'Bavardages répétés', date: '2023-11-10' },
    { id: 2, student: 'DOSSA Léa', class: '2nde C', type: 'Exclusion temporaire', reason: 'Insubordination', date: '2023-11-12' },
  ]);

  return (
    <div className="space-y-8">
      {/* Flux d'orientation */}
      <section>
         <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Compass className="text-emerald-600" /> Suivi de l'Orientation (Fin d'année)
         </h2>
         <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center max-w-3xl mx-auto">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
               <Compass className="text-slate-400 w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">Campagne d'orientation non démarrée</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto leading-relaxed">
               La préparation des affectations et des passages en séries (Série C, D, etc.) s'effectue généralement au 3ème trimestre après les conseils de classe.
            </p>
            <button className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-bold text-sm shadow-sm transition-all hover:border-slate-400">
               Simuler les passages
            </button>
         </div>
      </section>

      {/* Sanctions */}
      <section>
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
               <ShieldAlert className="text-rose-600" /> Suivi des Sanctions Pédagogiques
            </h2>
            <button className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-bold w-full sm:w-auto flex items-center justify-center gap-2">
               <Plus size={16} /> Nouvelle Sanction
            </button>
         </div>
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                 <thead className="bg-slate-50">
                    <tr>
                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Élève</th>
                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Classe</th>
                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Sanction</th>
                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Motif</th>
                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-slate-200">
                    {sanctions.map(sanction => (
                       <tr key={sanction.id}>
                          <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{sanction.student}</td>
                          <td className="px-6 py-4 text-slate-500 whitespace-nowrap font-bold">{sanction.class}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                             <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${sanction.type.includes('Exclusion') ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                                {sanction.type}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 min-w-[200px]">{sanction.reason}</td>
                          <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap font-medium">{sanction.date}</td>
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
