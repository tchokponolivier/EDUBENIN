import React, { useState } from "react";
import { Plus, BookOpen, Package, User } from "lucide-react";

export function SupervisorMaterials() {
  const [items, setItems] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  
  const [itemName, setItemName] = useState("");
  const [borrower, setBorrower] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("BORROWED");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setItems([{
      id: Date.now().toString(),
      itemName, borrower, date, status,
      createdAt: new Date().toISOString()
    }, ...items]);
    setShowAdd(false);
    setItemName(""); setBorrower(""); setDate("");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="font-bold text-gray-700 text-lg flex items-center gap-2">
          <Package className="text-emerald-600" />
          Matériel Pédagogique Prêté
        </h2>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm">
          <Plus size={14} /> Nouveau Prêt
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Matériel</th>
              <th className="px-6 py-4">Emprunteur</th>
              <th className="px-6 py-4">Date de prêt</th>
              <th className="px-6 py-4">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">Aucun matériel prêté actuellement.</td></tr>
            ) : items.map(i => (
              <tr key={i.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-gray-800">{i.itemName}</td>
                <td className="px-6 py-4 text-sm text-slate-600 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center"><User size={12}/></div>
                  {i.borrower}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{new Date(i.date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  {i.status === 'BORROWED' ? (
                     <button onClick={() => {
                        setItems(items.map(item => item.id === i.id ? { ...item, status: 'RETURNED' } : item))
                     }} className="px-3 py-1 bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs font-bold rounded transition-colors">
                        Marquer Retourné
                     </button>
                  ) : (
                     <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider">
                        Retourné
                     </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">Enregistrer un prêt</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Matériel (Livre, Vidéoprojecteur...)</label>
                <input required type="text" value={itemName} onChange={e => setItemName(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Emprunteur (Professeur)</label>
                <input required type="text" value={borrower} onChange={e => setBorrower(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Date de prêt</label>
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
