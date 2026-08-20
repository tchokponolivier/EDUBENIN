import React, { useState } from "react";
import { Plus, Search, FileText, ArrowRight, ArrowLeft } from "lucide-react";

export function SecretaryMails() {
  const [mails, setMails] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [type, setType] = useState<"DEPART" | "ARRIVEE">("ARRIVEE");
  const [reference, setReference] = useState("");
  const [sender, setSender] = useState("");
  const [recipient, setRecipient] = useState("");
  const [date, setDate] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setMails([{
      id: Date.now().toString(),
      type, reference, sender, recipient, date,
      createdAt: new Date().toISOString()
    }, ...mails]);
    setShowAdd(false);
    setReference(""); setSender(""); setRecipient(""); setDate("");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="font-bold text-gray-700 text-lg flex items-center gap-2">
          <FileText className="text-emerald-600" />
          Gestion des Courriers
        </h2>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm">
          <Plus size={14} /> Nouveau
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Référence</th>
              <th className="px-6 py-4">Expéditeur</th>
              <th className="px-6 py-4">Destinataire</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mails.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">Aucun courrier enregistré.</td></tr>
            ) : mails.map(m => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit \${m.type === 'ARRIVEE' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                    {m.type === 'ARRIVEE' ? <ArrowRight size={12} /> : <ArrowLeft size={12} />}
                    {m.type === 'ARRIVEE' ? 'Arrivée' : 'Départ'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{new Date(m.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-mono text-xs text-slate-600">{m.reference}</td>
                <td className="px-6 py-4 text-sm text-gray-800">{m.sender}</td>
                <td className="px-6 py-4 text-sm text-gray-800">{m.recipient}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">Enregistrer un courrier</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Type</label>
                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="ARRIVEE">Arrivée</option>
                  <option value="DEPART">Départ</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Référence</label>
                <input required type="text" value={reference} onChange={e => setReference(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Expéditeur</label>
                <input required type="text" value={sender} onChange={e => setSender(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Destinataire</label>
                <input required type="text" value={recipient} onChange={e => setRecipient(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Date</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
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
