import React, { useState } from "react";
import { Plus, BookOpen, Download, Search } from "lucide-react";
import { LEVELS } from "../types";

export function SecretaryExams() {
  const [exams, setExams] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState(LEVELS[0]);
  const [year, setYear] = useState("2026");
  const [file, setFile] = useState<File | null>(null);

  const [filterYear, setFilterYear] = useState("ALL");
  const [filterLevel, setFilterLevel] = useState("ALL");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const url = URL.createObjectURL(file);
    setExams([{
      id: Date.now().toString(),
      subject, level, year, url,
      filename: file.name,
      createdAt: new Date().toISOString()
    }, ...exams]);
    setShowAdd(false);
    setSubject(""); setFile(null);
  };

  const filteredExams = exams.filter(e => {
    return (filterYear === "ALL" || e.year === filterYear) &&
           (filterLevel === "ALL" || e.level === filterLevel);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
        <h2 className="font-bold text-gray-700 text-lg flex items-center gap-2">
          <BookOpen className="text-emerald-600" />
          Banque d'épreuves
        </h2>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-3 py-2 border rounded-lg text-sm outline-none">
             <option value="ALL">Toutes années</option>
             <option value="2026">2026</option>
             <option value="2025">2025</option>
          </select>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="px-3 py-2 border rounded-lg text-sm outline-none">
             <option value="ALL">Toutes classes</option>
             {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 shadow-sm">
            <Plus size={14} /> Ajouter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExams.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
             Aucune épreuve trouvée.
          </div>
        ) : filteredExams.map(e => (
          <div key={e.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 group hover:border-emerald-500 transition-colors">
            <div className="flex justify-between items-start">
               <div>
                 <h3 className="font-bold text-gray-800">{e.subject}</h3>
                 <p className="text-sm text-slate-500">{e.level} • {e.year}</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors">
                 <BookOpen size={20} />
               </div>
            </div>
            <a href={e.url} download={e.filename} className="flex items-center justify-center gap-2 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase text-xs rounded transition-colors">
              <Download size={14} /> Télécharger
            </a>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">Uploader une épreuve</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Matière</label>
                <input required type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Classe</label>
                <select value={level} onChange={e => setLevel(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none">
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Année scolaire</label>
                <input required type="text" value={year} onChange={e => setYear(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Fichier PDF / Doc</label>
                <input required type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase hover:bg-slate-200">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded text-xs font-bold uppercase hover:bg-emerald-700">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
