import React, { useState } from "react";
import { Plus, Calendar, Clock, User } from "lucide-react";

export function SecretaryPlanning() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [visitor, setVisitor] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setAppointments([{
      id: Date.now().toString(),
      title, date, time, visitor,
      createdAt: new Date().toISOString()
    }, ...appointments]);
    setShowAdd(false);
    setTitle(""); setDate(""); setTime(""); setVisitor("");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="font-bold text-gray-700 text-lg flex items-center gap-2">
          <Calendar className="text-emerald-600" />
          Agenda du Directeur
        </h2>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm">
          <Plus size={14} /> Nouveau RDV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Date & Heure</th>
              <th className="px-6 py-4">Motif du RDV</th>
              <th className="px-6 py-4">Visiteur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {appointments.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500 text-sm">Aucun rendez-vous prévu.</td></tr>
            ) : appointments.map(a => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-700">{new Date(a.date).toLocaleDateString()}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12}/> {a.time}</div>
                </td>
                <td className="px-6 py-4 font-semibold text-gray-800">{a.title}</td>
                <td className="px-6 py-4 text-sm text-slate-600 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center"><User size={12}/></div>
                  {a.visitor}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">Programmer un RDV</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Motif / Objet</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Date</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Heure</label>
                <input required type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Nom du visiteur / Parent</label>
                <input required type="text" value={visitor} onChange={e => setVisitor(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
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
