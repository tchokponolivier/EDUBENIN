import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { FeeConfig, LEVELS } from "../types";
import { useAuth } from "../lib/auth";
import { DollarSign, Plus, Settings } from "lucide-react";

const OPTIONAL_FEE_TYPES: Record<string, string> = {
  CANTEEN: "Cantine",
  BOOKS: "Livres Scolaires",
  UNIFORMS: "Achat des Uniformes",
  EVALUATION: "Frais d'Évaluation",
  BOOK_KITS: "Kits Livres par Classe"
};

const MANDATORY_FEE_TYPES: Record<string, string> = {
  INSCRIPTION: "Inscription",
  MONTHLY: "Scolarité",
  TD: "TD",
  ID_CARD: "Carte Scolaire",
  TRANSPORT: "Transport",
  OTHER: "Autre"
};

export function SchoolAdminFees() {
  const { user } = useAuth();
  const [fees, setFees] = useState<FeeConfig[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"MANDATORY" | "OPTIONAL">("MANDATORY");
  
  const [level, setLevel] = useState(LEVELS[0]);
  const [feeType, setFeeType] = useState<string>("INSCRIPTION");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [academicYears, setAcademicYears] = useState<{id: string, name: string}[]>([]);
  const [filterLevel, setFilterLevel] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");

  const fetchAcademicYears = async () => {
    if (!user?.schoolId) return;
    const { data } = await supabase.from('academic_years').select('id, name').eq('school_id', user.schoolId);
    if (data) setAcademicYears(data);
  };

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
    fetchAcademicYears();
  }, [user]);

  // Adjust default feeType when tab changes
  useEffect(() => {
    if (activeTab === "MANDATORY") setFeeType("INSCRIPTION");
    else setFeeType("CANTEEN");
  }, [activeTab]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;
    
    let error;
    if (editingId) {
       const res = await supabase.from('fee_config').update({
         level,
         fee_type: feeType,
         amount: Number(amount)
       }).eq('id', editingId);
       error = res.error;
    } else {
       const res = await supabase.from('fee_config').insert({
         school_id: user.schoolId,
         level,
         fee_type: feeType,
         amount: Number(amount)
       });
       error = res.error;
    }
    
    if (!error) {
       setShowForm(false);
       setAmount("");
       setEditingId(null);
       fetchFees();
    } else {
       alert("Erreur lors de la création");
    }
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm("Supprimer ce tarif ?")) return;
    await supabase.from('fee_config').delete().eq('id', id);
    fetchFees();
  };

  const displayedFees = fees.filter(f => {
    const isTabMatch = activeTab === "MANDATORY" 
      ? Object.keys(MANDATORY_FEE_TYPES).includes(f.feeType)
      : Object.keys(OPTIONAL_FEE_TYPES).includes(f.feeType);
    if (!isTabMatch) return false;
    
    if (filterLevel !== "ALL" && f.level !== filterLevel) return false;
    if (filterType !== "ALL" && f.feeType !== filterType) return false;
    
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-700">Configuration des Frais</h2>
        <button 
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
          className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Ajouter des Frais
        </button>
      </div>

      <div className="flex p-1 bg-slate-100 rounded-lg shrink-0 overflow-x-auto max-w-fit">
        <button 
          onClick={() => setActiveTab("MANDATORY")} 
          className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "MANDATORY" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
        >
          Frais Scolaires
        </button>
        <button 
          onClick={() => setActiveTab("OPTIONAL")} 
          className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "OPTIONAL" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
        >
          Services Optionnels
        </button>
      </div>

      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Classe</label>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded text-xs outline-none">
            <option value="ALL">Toutes les classes</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded text-xs outline-none">
            <option value="ALL">Tous les types</option>
            {activeTab === "MANDATORY" 
              ? Object.entries(MANDATORY_FEE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)
              : Object.entries(OPTIONAL_FEE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)
            }
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Année Scolaire</label>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded text-xs outline-none">
            <option value="ALL">Toutes les années</option>
            {academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
          </select>
        </div>
      </div>
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-in fade-in slide-in-from-top-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Niveau / Classe</label>
            <select value={level} onChange={e => setLevel(e.target.value)} className="w-full px-3 py-2 border border-slate-300 focus:border-emerald-500 outline-none rounded text-sm">
              <option value="ALL">Tous les niveaux (Général)</option>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Type de Frais</label>
            <select value={feeType} onChange={e => setFeeType(e.target.value)} className="w-full px-3 py-2 border border-slate-300 focus:border-emerald-500 outline-none rounded text-sm">
              {activeTab === "MANDATORY" ? (
                Object.entries(MANDATORY_FEE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)
              ) : (
                Object.entries(OPTIONAL_FEE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Montant (FCFA)</label>
            <input required value={amount} onChange={e => setAmount(e.target.value)} type="number" className="w-full px-3 py-2 border border-slate-300 focus:border-emerald-500 outline-none rounded text-sm" />
          </div>
          <button type="submit" className="px-6 py-2 bg-slate-900 text-white rounded font-bold w-full text-sm">Enregistrer</button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Niveau / Classe</th>
              <th className="px-6 py-4">Type de Frais</th>
              <th className="px-6 py-4 text-right">Montant (FCFA)</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedFees.map(fee => (
              <tr key={fee.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-gray-700 text-sm">
                   {fee.level === 'ALL' ? 'Tous les niveaux' : fee.level}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">
                    {MANDATORY_FEE_TYPES[fee.feeType] || OPTIONAL_FEE_TYPES[fee.feeType] || fee.feeType}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-800 text-right">{fee.amount.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-right">
                   <button onClick={() => {
                     setLevel(fee.level);
                     setFeeType(fee.feeType);
                     setAmount(fee.amount.toString());
                     setShowForm(true);
                     setEditingId(fee.id);
                   }} className="text-blue-500 hover:text-blue-700 text-xs font-bold uppercase tracking-wider mr-3">
                     Éditer
                   </button>
                   <button onClick={() => handleDelete(fee.id)} className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wider">
                     Supprimer
                   </button>
                </td>
              </tr>
            ))}
            {displayedFees.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm italic">
                  Aucun frais configuré dans cette catégorie.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
