import React, { useState } from "react";
import { Download, Search, BookOpen, Printer } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function SchoolAdminStats() {
  const [activeTab, setActiveTab] = useState<"BILAN_CLASSE" | "SYNTHESE_ELEVE">("BILAN_CLASSE");

  // Mock data as requested
  const bilanData = [
    { classe: "6ème", g: 10, f: 8, t: 18, majorMoy: 16.59, majorNom: "MONTCHO Sènami Ornella Prunelle", minorMoy: 10.76, minorNom: "HOUENOU Dylan Mael Enaam", nbreMoy: 18, pMoy: 100, nbreNonMoy: 0, pNonMoy: 0, nbreGMoy: 10, pGMoy: 100, nbreFMoy: 8, pFMoy: 100, moyClasse: 13.74 },
    { classe: "5ème", g: 11, f: 10, t: 21, majorMoy: 16.83, majorNom: "HOUESSOU Divinor Obed", minorMoy: 11.03, minorNom: "MAHAMADOU Issouffou", nbreMoy: 21, pMoy: 100, nbreNonMoy: 0, pNonMoy: 0, nbreGMoy: 11, pGMoy: 100, nbreFMoy: 10, pFMoy: 100, moyClasse: 13.61 },
    { classe: "4ème", g: 9, f: 15, t: 24, majorMoy: 15.67, majorNom: "ASSOGBA Fifamè Jysmine Divine", minorMoy: 9.71, minorNom: "ABOUDOU Abdel Malick", nbreMoy: 23, pMoy: 95.83, nbreNonMoy: 1, pNonMoy: 4.17, nbreGMoy: 8, pGMoy: 88.89, nbreFMoy: 15, pFMoy: 100, moyClasse: 12.48 },
    { classe: "3ème", g: 6, f: 8, t: 14, majorMoy: 15.94, majorNom: "HONGA Joseph", minorMoy: 8.96, minorNom: "TCHIKPE A. Victoire", nbreMoy: 8, pMoy: 57.14, nbreNonMoy: 6, pNonMoy: 42.86, nbreGMoy: 4, pGMoy: 66.67, nbreFMoy: 4, pFMoy: 50, moyClasse: 11.68 },
    { classe: "2nd CD", g: 6, f: 5, t: 11, majorMoy: 15.37, majorNom: "ABOUDOU Hamaad", minorMoy: 10.19, minorNom: "TCHIBOZO Précieux Zidane", nbreMoy: 11, pMoy: 100, nbreNonMoy: 0, pNonMoy: 0, nbreGMoy: 6, pGMoy: 100, nbreFMoy: 5, pFMoy: 100, moyClasse: 12.05 }
  ];

  const pieData = bilanData.map(row => ({
    name: row.classe,
    value: row.t
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  return (
    <div className="flex flex-col gap-6 p-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-700">Synthèse & Bilans</h1>
          <p className="text-xs text-slate-500 mt-1">Générez et imprimez les bilans trimestriels et annuels</p>
        </div>
        <div className="flex p-1 bg-slate-100 rounded-lg shrink-0">
          <button 
            onClick={() => setActiveTab("BILAN_CLASSE")} 
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "BILAN_CLASSE" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Bilan par Classes
          </button>
          <button 
            onClick={() => setActiveTab("SYNTHESE_ELEVE")} 
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "SYNTHESE_ELEVE" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
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
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                   <PieChart>
                     <Pie
                       data={pieData}
                       cx="50%"
                       cy="50%"
                       labelLine={false}
                       label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                       outerRadius={100}
                       fill="#8884d8"
                       dataKey="value"
                     >
                       {pieData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip 
                       formatter={(value: number) => [`${value} élèves`, 'Effectif']}
                     />
                     <Legend />
                   </PieChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
               <h3 className="font-bold text-gray-700 text-lg uppercase tracking-wider">Bilan Trimestriel</h3>
               <p className="text-xs font-semibold text-slate-500">Année Scolaire: 2025-2026</p>
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
                   <th className="p-2 border border-slate-700 text-center" colSpan={2}>G. Moy</th>
                   <th className="p-2 border border-slate-700 text-center" colSpan={2}>F. Moy</th>
                   <th className="p-2 border border-slate-700 text-center border-l-2 border-emerald-500">Moy Classe</th>
                </tr>
                <tr className="bg-slate-700 text-[9px]">
                   <th className="p-2 border border-slate-600"></th>
                   <th className="p-1 border border-slate-600 text-center">G</th>
                   <th className="p-1 border border-slate-600 text-center">F</th>
                   <th className="p-1 border border-slate-600 text-center">T</th>
                   
                   <th className="p-1 border border-slate-600 text-center">Moy</th>
                   <th className="p-1 border border-slate-600 text-center">Nom de l'élève</th>
                   
                   <th className="p-1 border border-slate-600 text-center">Moy</th>
                   <th className="p-1 border border-slate-600 text-center">Nom de l'élève</th>
                   
                   <th className="p-1 border border-slate-600 text-center">Nbre</th>
                   <th className="p-1 border border-slate-600 text-center">%</th>
                   
                   <th className="p-1 border border-slate-600 text-center">Nbre</th>
                   <th className="p-1 border border-slate-600 text-center">%</th>
                   
                   <th className="p-1 border border-slate-600 text-center">Nbre</th>
                   <th className="p-1 border border-slate-600 text-center">%</th>
                   
                   <th className="p-1 border border-slate-600 text-center">Nbre</th>
                   <th className="p-1 border border-slate-600 text-center">%</th>
                   
                   <th className="p-1 border border-slate-600 text-center border-l-2 border-emerald-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {bilanData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2 font-bold text-gray-700 border border-slate-200">{row.classe}</td>
                    
                    <td className="p-2 text-center text-blue-600 border border-slate-200">{row.g}</td>
                    <td className="p-2 text-center text-pink-600 border border-slate-200">{row.f}</td>
                    <td className="p-2 text-center font-bold bg-slate-50 border border-slate-200">{row.t}</td>
                    
                    <td className="p-2 text-center font-bold text-emerald-600 border border-slate-200">{row.majorMoy.toFixed(2)}</td>
                    <td className="p-2 underline underline-offset-2 decoration-slate-300 border border-slate-200 text-[10px] uppercase font-semibold">{row.majorNom}</td>
                    
                    <td className="p-2 text-center font-bold text-red-500 border border-slate-200">{row.minorMoy.toFixed(2)}</td>
                    <td className="p-2 underline underline-offset-2 decoration-slate-300 border border-slate-200 text-[10px] uppercase font-semibold">{row.minorNom}</td>
                    
                    <td className="p-2 text-center font-mono border border-slate-200 bg-emerald-50">{row.nbreMoy}</td>
                    <td className="p-2 text-center font-mono border border-slate-200 bg-emerald-50 text-gray-700 font-bold">{row.pMoy}%</td>
                    
                    <td className="p-2 text-center font-mono border border-slate-200 bg-red-50">{row.nbreNonMoy}</td>
                    <td className="p-2 text-center font-mono border border-slate-200 bg-red-50 text-red-600 font-bold">{row.pNonMoy}%</td>
                    
                    <td className="p-2 text-center font-mono border border-slate-200">{row.nbreGMoy}</td>
                    <td className="p-2 text-center font-mono border border-slate-200">{row.pGMoy}%</td>
                    
                    <td className="p-2 text-center font-mono border border-slate-200">{row.nbreFMoy}</td>
                    <td className="p-2 text-center font-mono border border-slate-200">{row.pFMoy}%</td>
                    
                    <td className="p-2 text-center font-bold text-lg text-gray-700 bg-emerald-50/50 border-l-2 border-emerald-500">{row.moyClasse.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
             <span>Nombre de classes : <strong className="text-gray-700">{bilanData.length}</strong></span>
             <span>Edité le {new Date().toLocaleDateString()} à {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
        </div>
      )}
      
      {activeTab === "SYNTHESE_ELEVE" && (
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
      )}
    </div>
  );
}
