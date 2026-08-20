import React, { useState } from "react";
import { Plus, Users, Clock, AlertTriangle, CheckSquare } from "lucide-react";

export function SupervisorTeacherAbsences() {
  const [records, setRecords] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  
  const [teacher, setTeacher] = useState("");
  const [type, setType] = useState("ABSENCE");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [justified, setJustified] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setRecords([{
      id: Date.now().toString(),
      teacher, type, date, reason, justified,
      createdAt: new Date().toISOString()
    }, ...records]);
    setShowAdd(false);
    setTeacher(""); setDate(""); setReason(""); setJustified(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="font-bold text-gray-700 text-lg flex items-center gap-2">
          <Users className="text-emerald-600" />
          Absences & Retards Professeurs
        </h2>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm">
          <Plus size={14} /> Signaler
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Professeur</th>
              <th className="px-6 py-4">Date & Type</th>
              <th className="px-6 py-4">Motif & Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500 text-sm">Aucun enregistrement.</td></tr>
            ) : records.map(r => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-gray-800">{r.teacher}</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-600">{new Date(r.date).toLocaleDateString()}</div>
                  <span className={`mt-1 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit \${r.type === 'ABSENCE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    <Clock size={12} /> {r.type === 'ABSENCE' ? 'Absence' : 'Retard'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-700 mb-1">{r.reason}</div>
                  <div className={`text-xs font-semibold flex items-center gap-1 \${r.justified ? 'text-emerald-600' : 'text-red-600'}`}>
                    {r.justified ? <CheckSquare size={12} /> : <AlertTriangle size={12} />}
                    {r.justified ? 'Justifié' : 'Non justifié'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">Signaler Absence / Retard</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Professeur</label>
                <input required type="text" value={teacher} onChange={e => setTeacher(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Type</label>
                  <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="ABSENCE">Absence</option>
                    <option value="DELAY">Retard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Date</label>
                  <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Motif</label>
                <textarea required value={reason} onChange={e => setReason(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none resize-none" rows={3}></textarea>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={justified} onChange={e => setJustified(e.target.checked)} className="rounded text-emerald-600 focus:ring-emerald-500" />
                <span className="text-sm font-medium text-gray-700">Absence justifiée</span>
              </label>
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
