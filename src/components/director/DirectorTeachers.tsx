import React, { useState } from 'react';
import { Users, UserPlus, Search } from 'lucide-react';

export function DirectorTeachers() {
  const [teachers, setTeachers] = useState([
    { id: 1, name: 'M. Dupont Jean', subjects: ['Mathématiques'], hoursAssigned: 18, maxHours: 18, status: 'AVAILABLE' },
    { id: 2, name: 'Mme. Martin Sophie', subjects: ['Français', 'Histoire'], hoursAssigned: 20, maxHours: 18, status: 'OVERLOAD' },
    { id: 3, name: 'M. Dubois Alain', subjects: ['Physique'], hoursAssigned: 12, maxHours: 18, status: 'ABSENT' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
           <Users className="text-emerald-600" /> Charges Enseignantes
        </h2>
        <div className="relative w-full sm:w-auto">
          <input type="text" placeholder="Rechercher un enseignant..." className="w-full sm:w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium" />
          <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Enseignant</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Matières</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Heures Assignées</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {teachers.map(teacher => {
                 const percentage = (teacher.hoursAssigned / teacher.maxHours) * 100;
                 return (
                <tr key={teacher.id}>
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{teacher.name}</td>
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                     <div className="flex gap-1">
                        {teacher.subjects.map((sub, idx) => (
                           <span key={idx} className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">{sub}</span>
                        ))}
                     </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <div className="flex flex-col gap-1.5 w-32">
                        <span className={`font-bold text-sm ${teacher.hoursAssigned > teacher.maxHours ? 'text-rose-600' : 'text-slate-700'}`}>
                           {teacher.hoursAssigned}h / {teacher.maxHours}h
                        </span>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                             <div className={`h-1.5 rounded-full ${percentage > 100 ? 'bg-rose-500' : percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     {teacher.status === 'AVAILABLE' && <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 uppercase tracking-wider">Disponible</span>}
                     {teacher.status === 'OVERLOAD' && <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-rose-100 text-rose-800 uppercase tracking-wider">Surcharge</span>}
                     {teacher.status === 'ABSENT' && <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-slate-100 text-slate-800 uppercase tracking-wider">Absent</span>}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                     {teacher.status === 'ABSENT' ? (
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md font-bold transition-colors">
                           <UserPlus size={14} /> <span>Remplacer</span>
                        </button>
                     ) : (
                        <button className="text-blue-600 font-bold hover:text-blue-900 bg-blue-50 px-3 py-1.5 rounded-md">Détails</button>
                     )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
