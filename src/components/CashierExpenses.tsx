import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Expense } from "../types";
import { useAuth } from "../lib/auth";
import { Plus, Receipt } from "lucide-react";

export function CashierExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [category, setCategory] = useState<string>("MATERIEL_FOURNITURE");
  const [customCategory, setCustomCategory] = useState("");
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
    
    const finalCategory = category === "AUTRE" ? customCategory : category;
    
    let error;
    if (editingId) {
       const res = await supabase.from('expenses').update({
           description,
           amount: Number(amount),
           expense_date: expenseDate,
           category: finalCategory,
           proof_url: proofBase64 || null
       }).eq('id', editingId);
       error = res.error;
    } else {
       const res = await supabase.from('expenses').insert({
           school_id: user.schoolId,
           description,
           amount: Number(amount),
           expense_date: expenseDate,
           category: finalCategory,
           proof_url: proofBase64 || null
       });
       error = res.error;
    }
    
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

  const handleEdit = (expense: Expense) => {
    setDescription(expense.description);
    setAmount(expense.amount.toString());
    setExpenseDate(expense.expenseDate || "");
    const presetCategories = ["MATERIEL_FOURNITURE", "ENTRETIEN", "SERVICES_EXTERIEURS", "ACHAT_STOCKS"];
    if (presetCategories.includes(expense.category)) {
       setCategory(expense.category);
       setCustomCategory("");
    } else {
       setCategory("AUTRE");
       setCustomCategory(expense.category);
    }
    setProofBase64(expense.proofUrl || "");
    setEditingId(expense.id);
    setShowForm(true);
  };
  
  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer cette dépense ?")) return;
    await supabase.from('expenses').delete().eq('id', id);
    fetchExpenses();
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
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded">
              <option value="MATERIEL_FOURNITURE">Matériels et Fournitures de Bureau</option>
              <option value="ENTRETIEN_REPARATION">Entretien & réparations</option>
              <option value="TRAVAUX">Travaux</option>
              <option value="PRELEVEMENTS_BANQUE">Prélèvements BANQUE</option>
              <option value="UNIFORMES">Uniformes</option>
              <option value="LIVRES">Livres</option>
              <option value="CANTINE">Cantine</option>
              <option value="COMMUNICATIONS">Communications</option>
              <option value="PRESTATAIRES">Prestataires</option>
              <option value="IMPOTS">Impôts</option>
              <option value="COLLATIONS">Collations</option>
              <option value="MATERIEL_DIDACTIQUE">Matériels didactiques</option>
              <option value="PRIMES">Primes</option>
              <option value="FACTURE">Factures (Eau/Élec)</option>
              <option value="AUTRE">Autre</option>
            </select>
            {category === "AUTRE" && (
                <input required type="text" placeholder="Précisez la catégorie..." value={customCategory} onChange={e => setCustomCategory(e.target.value)} className="w-full mt-2 px-3 py-2 border rounded text-sm" />
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Justificatif (Photo/Facture)</label>
            <input type="file" accept="image/*" onChange={handleUpload} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 bg-emerald-50/20 rounded border border-emerald-200 outline-none" />
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
              <th className="px-6 py-4 text-right">Actions</th>
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
                <td className="px-6 py-4 text-sm text-right space-x-2">
                    <button onClick={() => handleEdit(exp)} className="text-emerald-600 font-bold hover:underline">Éditer</button>
                    <button onClick={() => handleDelete(exp.id)} className="text-red-600 font-bold hover:underline">Supprimer</button>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
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
