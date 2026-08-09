import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

export function DirectorPrograms() {
  const [subjects, setSubjects] = useState([
    { id: 1, name: 'Mathématiques', level: '6ème', coefficient: 4, weeklyHours: 4, competencies: ['Calcul', 'Géométrie'] },
    { id: 2, name: 'Français', level: '6ème', coefficient: 4, weeklyHours: 4, competencies: ['Lecture', 'Écriture', 'Grammaire'] },
    { id: 3, name: 'SVT', level: '6ème', coefficient: 2, weeklyHours: 2, competencies: ['Démarche scientifique'] },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Programmes et Coefficients</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
          <Plus size={18} />
          <span className="font-bold">Nouvelle Matière</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Matière</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Niveau/Classe</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Coefficient</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Vol. Horaire/Semaine</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Compétences (APC)</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {subjects.map((subject) => (
                <tr key={subject.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{subject.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">{subject.level}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-700">{subject.coefficient}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-700">{subject.weeklyHours}h</td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                    <div className="flex flex-wrap gap-1">
                      {subject.competencies.map((comp, idx) => (
                        <span key={idx} className="bg-slate-100 px-2 py-1 rounded-md text-[10px] font-bold uppercase">{comp}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3"><Edit size={16} /></button>
                    <button className="text-rose-600 hover:text-rose-900"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
