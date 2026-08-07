import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Expense } from "../types";
import { useAuth } from "../lib/auth";
import { Plus, Receipt } from "lucide-react";

export function CashierExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [category, setCategory] = useState<Expense["category"]>("FOURNITURE");
  const [proofBase64, setProofBase64] = useState("");

  const fetchExpenses = async () => {
    if (!user?.schoolId) return;
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('school_id', user.schoolId)
      .order('expense_date', { ascending: false });
      
    if (!error && data) {
       setExpenses(data.map(d => ({
         id: d.id,
         schoolId: d.school_id,
         description: d.description,
         amount: d.amount,
         expenseDate: d.expense_date,
         category: d.category,
         proofUrl: d.proof_url,
         createdAt: new Date(d.created_at).getTime()
       })));
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [user]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
         setProofBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;
    
    const { error } = await supabase.from('expenses').insert({
       school_id: user.schoolId,
       description,
       amount: Number(amount),
       expense_date: expenseDate,
       category,
       proof_url: proofBase64 || null
    });
    
    if (!error) {
       setShowForm(false);
       setDescription("");
       setAmount("");
       setExpenseDate("");
       setProofBase64("");
       fetchExpenses();
    } else {
       alert("Erreur lors de la création");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-700">Gestion des Dépenses</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Enregistrer une dépense
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description / Motif</label>
            <input required value={description} onChange={e => setDescription(e.target.value)} type="text" className="w-full px-3 py-2 border rounded" placeholder="Achat rames de papier..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Montant (FCFA)</label>
            <input required value={amount} onChange={e => setAmount(e.target.value)} type="number" className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
            <input required value={expenseDate} onChange={e => setExpenseDate(e.target.value)} type="date" className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Catégorie</label>
            <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full px-3 py-2 border rounded">
              <option value="FOURNITURE">Fournitures</option>
              <option value="FACTURE">Factures (Eau/Élec)</option>
              <option value="SALAIRE">Salaires</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Justificatif (Photo/Facture)</label>
            <input type="file" accept="image/*" onChange={handleUpload} className="w-full text-xs" />
          </div>
          <div className="lg:col-span-3 pt-2">
            <button type="submit" className="px-6 py-2 bg-slate-900 text-white rounded font-bold">Enregistrer la dépense</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Catégorie</th>
              <th className="px-6 py-4">Justificatif</th>
              <th className="px-6 py-4 text-right">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map(exp => (
              <tr key={exp.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm text-slate-600">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-medium text-gray-700 text-sm">{exp.description}</td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs">{exp.category}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {exp.proofUrl ? (
                    <a href={exp.proofUrl} target="_blank" rel="noreferrer" className="text-emerald-600 flex items-center gap-1 hover:underline">
                      <Receipt size={14} /> Voir
                    </a>
                  ) : (
                    <span className="text-slate-400 text-xs">Aucun</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-red-600 text-right">- {exp.amount.toLocaleString()}</td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">
                  Aucune dépense enregistrée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
