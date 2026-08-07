import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { FeeConfig, LEVELS } from "../types";
import { useAuth } from "../lib/auth";
import { DollarSign, Plus } from "lucide-react";

export function SchoolAdminFees() {
  const { user } = useAuth();
  const [fees, setFees] = useState<FeeConfig[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  const [level, setLevel] = useState(LEVELS[0]);
  const [feeType, setFeeType] = useState<FeeConfig["feeType"]>("INSCRIPTION");
  const [amount, setAmount] = useState("");

  const fetchFees = async () => {
    if (!user?.schoolId) return;
    const { data, error } = await supabase
      .from('fee_config')
      .select('*')
      .eq('school_id', user.schoolId)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
       setFees(data.map(d => ({
         id: d.id,
         schoolId: d.school_id,
         level: d.level,
         feeType: d.fee_type,
         amount: d.amount,
         createdAt: new Date(d.created_at).getTime()
       })));
    }
  };

  useEffect(() => {
    fetchFees();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;
    
    const { error } = await supabase.from('fee_config').insert({
       school_id: user.schoolId,
       level,
       fee_type: feeType,
       amount: Number(amount)
    });
    
    if (!error) {
       setShowForm(false);
       setAmount("");
       fetchFees();
    } else {
       alert("Erreur lors de la création");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-700">Configuration des Frais</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Ajouter des Frais
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Niveau / Classe</label>
            <select value={level} onChange={e => setLevel(e.target.value)} className="w-full px-3 py-2 border rounded">
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Type de Frais</label>
            <select value={feeType} onChange={e => setFeeType(e.target.value as any)} className="w-full px-3 py-2 border rounded">
              <option value="INSCRIPTION">Inscription</option>
              <option value="MONTHLY">Mensualité / Scolarité</option>
              <option value="TRANSPORT">Transport</option>
              <option value="CANTEEN">Cantine</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Montant (FCFA)</label>
            <input required value={amount} onChange={e => setAmount(e.target.value)} type="number" className="w-full px-3 py-2 border rounded" />
          </div>
          <button type="submit" className="px-6 py-2 bg-slate-900 text-white rounded font-bold w-full">Enregistrer</button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Niveau / Classe</th>
              <th className="px-6 py-4">Type de Frais</th>
              <th className="px-6 py-4 text-right">Montant (FCFA)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fees.map(fee => (
              <tr key={fee.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-gray-700 text-sm">{fee.level}</td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs">{fee.feeType}</span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-800 text-right">{fee.amount.toLocaleString()}</td>
              </tr>
            ))}
            {fees.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-500 text-sm">
                  Aucun frais configuré. Ajoutez-en pour commencer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
