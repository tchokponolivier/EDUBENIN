import React, { useState } from 'react';
import { BarChart2, TrendingUp, TrendingDown, Users, Award } from 'lucide-react';

export function DirectorResults() {
  const stats = [
    { class: '6ème A', avg: 13.5, passRate: 85, trend: 'up' },
    { class: '6ème B', avg: 11.2, passRate: 60, trend: 'down' },
    { class: '5ème A', avg: 14.1, passRate: 90, trend: 'up' },
    { class: '3ème', avg: 12.8, passRate: 75, trend: 'up' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <Award size={24} />
               </div>
               <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Moyenne Générale</p>
                  <h3 className="text-2xl lg:text-3xl font-black text-gray-800">12.9<span className="text-sm text-slate-400 font-normal">/20</span></h3>
               </div>
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <TrendingUp size={24} />
               </div>
               <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Taux de Réussite</p>
                  <h3 className="text-2xl lg:text-3xl font-black text-gray-800">78%</h3>
               </div>
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                  <Users size={24} />
               </div>
               <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Conseils de Classe</p>
                  <h3 className="text-2xl lg:text-3xl font-black text-gray-800">3<span className="text-sm text-slate-400 font-normal ml-1">à planifier</span></h3>
               </div>
            </div>
         </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
         <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart2 className="text-emerald-600" /> Analyse par Classe (1er Trimestre)
         </h2>
         <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-bold w-full sm:w-auto transition-colors">
            Exporter PDF
         </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="overflow-x-auto">
           <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                 <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Classe</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Moyenne de classe</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Taux de réussite (≥10)</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Outil Délibération</th>
                 </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                 {stats.map((stat, idx) => (
                    <tr key={idx}>
                       <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">{stat.class}</td>
                       <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                             <span className="font-bold text-slate-700">{stat.avg} / 20</span>
                             {stat.trend === 'up' ? <TrendingUp size={16} className="text-emerald-500" /> : <TrendingDown size={16} className="text-rose-500" />}
                          </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3 w-48">
                             <span className="font-bold text-slate-700">{stat.passRate}%</span>
                             <div className="flex-1 bg-slate-100 rounded-full h-2">
                                <div className={`h-2 rounded-full ${stat.passRate > 80 ? 'bg-emerald-500' : stat.passRate > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${stat.passRate}%` }}></div>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button className="px-4 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-bold hover:bg-blue-100 transition-colors">
                             Préparer Conseil
                          </button>
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
