import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { FeeConfig, LEVELS } from "../types";
import { useAuth } from "../lib/auth";
import { DollarSign, Plus, Settings, Trash2, Edit2, ChevronDown, X, AlertCircle, CheckCircle, Info } from "lucide-react";

const OPTIONAL_FEE_TYPES: Record<string, string> = {
  CANTEEN: "Cantine",
  BOOKS: "Livres Scolaires"
};

const MANDATORY_FEE_TYPES: Record<string, string> = {
  INSCRIPTION: "Inscription",
  MONTHLY: "Scolarité",
  TD: "TD",
  ID_CARD: "Carte Scolaire",
  TRANSPORT: "Transport",
  UNIFORMS: "Uniforme",
  SPORTS_WEAR: "Tenue de Sport",
  EVALUATION: "Frais d'évaluation"
};

const DEFAULT_ACADEMIC_YEARS = ["2024-2025", "2025-2026", "2026-2027"];

export function SchoolAdminFees() {
  const { user } = useAuth();
  const [fees, setFees] = useState<FeeConfig[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"MANDATORY" | "OPTIONAL">("MANDATORY");
  
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [showLevelsDropdown, setShowLevelsDropdown] = useState(false);
  const [tranches, setTranches] = useState<{id: string; name: string; limit: string; amount: number}[]>([
    {id: 'tranche1', name: 'Tranche 1', limit: '', amount: 0}
  ]);
  const [feeType, setFeeType] = useState<string>("INSCRIPTION");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedFeeDetails, setSelectedFeeDetails] = useState<FeeConfig | null>(null);
  const [formYear, setFormYear] = useState("");
  const [customYear, setCustomYear] = useState("");
  const [amount, setAmount] = useState("");
  const [academicYears, setAcademicYears] = useState<{id: string, name: string}[]>([]);
  const [filterLevel, setFilterLevel] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchAcademicYears = async () => {
    try {
      if (user?.schoolId) {
        const { data, error } = await supabase.from('academic_years').select('id, name').eq('school_id', user.schoolId);
        if (!error && data && data.length > 0) {
          setAcademicYears(data);
          if (!formYear) setFormYear(data[0].name);
          return;
        }
      }
      // Fallback years if none configured yet
      const fallbackYears = DEFAULT_ACADEMIC_YEARS.map(y => ({ id: y, name: y }));
      setAcademicYears(fallbackYears);
      if (!formYear) setFormYear(fallbackYears[0].name);
    } catch {
      const fallbackYears = DEFAULT_ACADEMIC_YEARS.map(y => ({ id: y, name: y }));
      setAcademicYears(fallbackYears);
      if (!formYear) setFormYear(fallbackYears[0].name);
    }
  };

  const fetchFees = async () => {
    if (!user?.schoolId) return;
    try {
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
           createdAt: new Date(d.created_at).getTime(),
           academic_year: d.academic_year,
           tranches: d.tranches
         })));
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des frais:", err);
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
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!user?.schoolId) {
      const msg = "Votre compte n'est pas encore associé à un établissement scolaire.";
      setErrorMessage(msg);
      alert(msg);
      return;
    }
    
    if (selectedLevels.length === 0) {
      const msg = "Veuillez sélectionner au moins une classe pour appliquer ces frais.";
      setErrorMessage(msg);
      alert(msg);
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      const msg = "Veuillez saisir un montant valide (supérieur ou égal à 0).";
      setErrorMessage(msg);
      alert(msg);
      return;
    }

    const effectiveYear = customYear.trim() || formYear || academicYears[0]?.name || "2024-2025";
    const isMonthly = feeType === "MONTHLY";

    // Clean up tranches: only include them if monthly fee and has rows
    const cleanedTranches = isMonthly && tranches.length > 0 
      ? tranches.map(t => ({
          id: t.id,
          name: t.name || 'Tranche',
          amount: Number(t.amount) || 0,
          limit: t.limit || ''
        }))
      : null;

    setIsSubmitting(true);
    let error: any = null;

    try {
      if (editingId) {
        const updatePayload: Record<string, any> = {
          level: selectedLevels[0] || 'ALL',
          fee_type: feeType,
          amount: numAmount,
          academic_year: effectiveYear,
        };
        if (cleanedTranches) {
          updatePayload.tranches = cleanedTranches;
        }

        let res = await supabase.from('fee_config').update(updatePayload).eq('id', editingId);

        // If the 'tranches' column does not exist in Supabase (PGRST204), retry gracefully without it
        if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('tranches'))) {
          delete updatePayload.tranches;
          res = await supabase.from('fee_config').update(updatePayload).eq('id', editingId);
        }
        error = res.error;
      } else {
        const inserts = selectedLevels.map(lvl => {
          const item: Record<string, any> = {
            school_id: user.schoolId,
            level: lvl,
            fee_type: feeType,
            amount: numAmount,
            academic_year: effectiveYear,
          };
          if (cleanedTranches) {
            item.tranches = cleanedTranches;
          }
          return item;
        });
        
        let res = await supabase.from('fee_config').insert(inserts);

        // If the 'tranches' column does not exist in Supabase (PGRST204), retry gracefully without it
        if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('tranches'))) {
          const fallbackInserts = inserts.map(({ tranches: _t, ...rest }) => rest);
          res = await supabase.from('fee_config').insert(fallbackInserts);
        }
        error = res.error;
      }

      if (!error) {
        setShowForm(false);
        setAmount("");
        setEditingId(null);
        setSelectedLevels([]);
        setCustomYear("");
        setTranches([{ id: 'tranche1', name: 'Tranche 1', limit: '', amount: 0 }]);
        setSuccessMessage("Frais enregistrés avec succès !");
        setTimeout(() => setSuccessMessage(null), 4000);
        fetchFees();
      } else {
        console.error("Erreur d'insertion fee_config :", error);
        const detailedMessage = error.message || "Erreur de validation de la base de données.";
        setErrorMessage(`Erreur lors de la création : ${detailedMessage}`);
        alert(`Erreur lors de la création : ${detailedMessage}`);
      }
    } catch (err: any) {
      console.error("Exception inattendue fee_config :", err);
      const excMessage = err?.message || "Erreur inconnue";
      setErrorMessage(`Erreur inattendue : ${excMessage}`);
      alert(`Erreur lors de la création : ${excMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer ce tarif ?")) return;
    try {
      const { error } = await supabase.from('fee_config').delete().eq('id', id);
      if (error) {
        alert("Erreur lors de la suppression : " + error.message);
      } else {
        setSuccessMessage("Tarif supprimé avec succès.");
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchFees();
      }
    } catch (err: any) {
      alert("Erreur lors de la suppression : " + (err?.message || "Erreur inconnue"));
    }
  };

  const displayedFees = fees.filter(f => {
    const isTabMatch = activeTab === "MANDATORY" 
      ? Object.keys(MANDATORY_FEE_TYPES).includes(f.feeType)
      : Object.keys(OPTIONAL_FEE_TYPES).includes(f.feeType);
    if (!isTabMatch) return false;
    
    if (filterLevel !== "ALL" && f.level !== filterLevel) return false;
    if (filterType !== "ALL" && f.feeType !== filterType) return false;
    if (filterYear !== "ALL" && f.academic_year !== filterYear) return false;
    
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-700">Configuration des Frais</h2>
        <button 
          onClick={() => { 
            setShowForm(!showForm); 
            setEditingId(null); 
            setErrorMessage(null);
            if (!showForm && academicYears.length > 0 && !formYear) {
              setFormYear(academicYears[0].name);
            }
          }}
          className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} /> Ajouter des Frais
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-700 p-1">
            <X size={16} />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="shrink-0 text-emerald-500" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-700 p-1">
            <X size={16} />
          </button>
        </div>
      )}

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
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4 items-end animate-in fade-in slide-in-from-top-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Année Scolaire</label>
            <select 
              value={formYear} 
              onChange={e => setFormYear(e.target.value)} 
              className="w-full px-3 py-2 border border-slate-300 focus:border-emerald-500 outline-none rounded text-sm bg-white"
            >
              {academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
            </select>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-gray-700 mb-2">Niveaux / Classes</label>
            <div className="relative">
              <button 
                type="button" 
                onClick={() => setShowLevelsDropdown(!showLevelsDropdown)} 
                className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded outline-none focus:border-emerald-500 bg-white text-sm"
              >
                <span className="truncate">
                  {selectedLevels.length === 0 
                    ? "Sélectionner des classes" 
                    : selectedLevels.includes("ALL") 
                    ? "Toutes les classes" 
                    : selectedLevels.join(", ")}
                </span>
                <ChevronDown size={16} className="text-slate-400" />
              </button>
              {showLevelsDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 shadow-xl rounded-lg z-50 p-2 grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer col-span-full border-b border-slate-100 pb-2 mb-1">
                    <input 
                      type="checkbox" 
                      checked={selectedLevels.includes("ALL")} 
                      onChange={(e) => { 
                        if (e.target.checked) setSelectedLevels(["ALL"]); 
                        else setSelectedLevels([]); 
                      }} 
                      className="rounded text-emerald-600 focus:ring-emerald-500" 
                    />
                    <span className="font-semibold text-gray-700">Toutes les classes</span>
                  </label>
                  {LEVELS.map(l => (
                    <label key={l} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                      <input 
                        type="checkbox" 
                        checked={selectedLevels.includes(l)} 
                        onChange={(e) => { 
                          if (e.target.checked) setSelectedLevels(prev => prev.filter(p => p !== "ALL").concat(l)); 
                          else setSelectedLevels(prev => prev.filter(p => p !== l)); 
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                      />
                      <span className="text-gray-700">{l}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Type de Frais</label>
            <select value={feeType} onChange={e => setFeeType(e.target.value)} className="w-full px-3 py-2 border border-slate-300 focus:border-emerald-500 outline-none rounded text-sm bg-white">
              {activeTab === "MANDATORY" ? (
                Object.entries(MANDATORY_FEE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)
              ) : (
                Object.entries(OPTIONAL_FEE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Montant Total (FCFA)</label>
            <input 
              required 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              type="number" 
              placeholder="ex: 45000"
              min="0"
              className="w-full px-3 py-2 border border-slate-300 focus:border-emerald-500 outline-none rounded text-sm" 
            />
          </div>
          
          {feeType === "MONTHLY" && (
            <div className="md:col-span-full border-t border-slate-200 mt-4 pt-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Tranches d'échéances de scolarité</label>
                  <p className="text-xs text-slate-500">Configurez les différentes échéances prévues pour le paiement de la scolarité</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setTranches(prev => [...prev, {id: `tranche${prev.length + 1}`, name: `Tranche ${prev.length + 1}`, limit: '', amount: 0}])} 
                  className="text-xs flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100 transition"
                >
                  <Plus size={14} /> Ajouter Tranche
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                {tranches.map((t, idx) => (
                  <div key={t.id} className="flex gap-2 items-center bg-slate-50 p-2 rounded border border-slate-100">
                    <input 
                      type="text" 
                      value={t.name} 
                      onChange={e => {
                        const newT = [...tranches];
                        newT[idx].name = e.target.value;
                        setTranches(newT);
                      }} 
                      placeholder="Nom (ex: Tranche 1)" 
                      className="w-1/3 px-2 py-1 text-sm border border-slate-300 rounded outline-none" 
                      required 
                    />
                    <input 
                      type="number" 
                      value={t.amount || ''} 
                      onChange={e => {
                        const newT = [...tranches];
                        newT[idx].amount = Number(e.target.value);
                        setTranches(newT);
                      }} 
                      placeholder="Montant" 
                      className="w-1/3 px-2 py-1 text-sm border border-slate-300 rounded outline-none" 
                      required 
                    />
                    <input 
                      type="date" 
                      value={t.limit} 
                      onChange={e => {
                        const newT = [...tranches];
                        newT[idx].limit = e.target.value;
                        setTranches(newT);
                      }} 
                      className="w-1/3 px-2 py-1 text-sm border border-slate-300 rounded outline-none" 
                      required 
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        if (tranches.length > 1) {
                          setTranches(prev => prev.filter((_, i) => i !== idx));
                        }
                      }} 
                      className="text-red-500 hover:bg-red-50 p-1 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-500 text-right">
                Total des tranches: <span className="font-bold text-gray-700">{tranches.reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()} FCFA</span> / {Number(amount || 0).toLocaleString()} FCFA
              </div>
            </div>
          )}

          <div className="md:col-span-full mt-2 flex gap-3">
             <button 
               type="button"
               onClick={() => { setShowForm(false); setEditingId(null); setErrorMessage(null); }}
               className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-bold text-sm transition-colors"
             >
               Annuler
             </button>
             <button 
               type="submit" 
               disabled={isSubmitting}
               className="flex-1 px-6 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded font-bold text-sm transition-colors flex items-center justify-center gap-2"
             >
               {isSubmitting ? "Enregistrement..." : editingId ? "Mettre à jour" : "Enregistrer les Frais"}
             </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Année scolaire</th>
              <th className="px-6 py-4">Niveau / Classe</th>
              <th className="px-6 py-4">Type de Frais</th>
              <th className="px-6 py-4 text-right">Montant (FCFA)</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedFees.map(fee => (
              <tr key={fee.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedFeeDetails(fee)}>
                <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                   {fee.academic_year || '-'}
                </td>
                <td className="px-6 py-4 font-medium text-gray-700 text-sm">
                   {fee.level === 'ALL' ? 'Toutes les classes' : fee.level}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">
                    {MANDATORY_FEE_TYPES[fee.feeType] || OPTIONAL_FEE_TYPES[fee.feeType] || fee.feeType}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-800 text-right">{fee.amount.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-right">
                   <button 
                     onClick={(e) => { 
                       e.stopPropagation();
                       setSelectedLevels([fee.level]);
                       setFeeType(fee.feeType);
                       setAmount(fee.amount.toString());
                       if (fee.academic_year) setFormYear(fee.academic_year);
                       if (fee.tranches) setTranches(fee.tranches);
                       setShowForm(true);
                       setEditingId(fee.id);
                       setErrorMessage(null);
                     }} 
                     className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors mr-2" 
                     title="Éditer"
                   >
                     <Edit2 size={16} />
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleDelete(fee.id); }} 
                     className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors" 
                     title="Supprimer"
                   >
                     <Trash2 size={16} />
                   </button>
                </td>
              </tr>
            ))}
            {displayedFees.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm italic">
                  Aucun frais configuré dans cette catégorie.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {selectedFeeDetails && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {selectedFeeDetails.academic_year || 'Année standard'}
                </span>
                <h3 className="text-lg font-bold text-gray-800 mt-1">
                  {MANDATORY_FEE_TYPES[selectedFeeDetails.feeType] || OPTIONAL_FEE_TYPES[selectedFeeDetails.feeType] || selectedFeeDetails.feeType}
                </h3>
                <p className="text-xs text-slate-500">
                  Niveau / Classe : <span className="font-semibold text-gray-700">{selectedFeeDetails.level === 'ALL' ? 'Toutes les classes' : selectedFeeDetails.level}</span>
                </p>
              </div>
              <button 
                onClick={() => setSelectedFeeDetails(null)} 
                className="text-slate-400 hover:text-gray-700 p-1 rounded hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg mb-4 border border-slate-100">
              <span className="text-xs text-slate-500">Montant total</span>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">
                {selectedFeeDetails.amount.toLocaleString()} <span className="text-sm font-normal text-slate-500">FCFA</span>
              </p>
            </div>

            {selectedFeeDetails.tranches && selectedFeeDetails.tranches.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Détail des tranches</h4>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                  {selectedFeeDetails.tranches.map((tranche, idx) => (
                    <div key={tranche.id || idx} className="p-2.5 bg-white flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-gray-700">{tranche.name}</p>
                        {tranche.limit && <p className="text-[10px] text-slate-400">Échéance : {tranche.limit}</p>}
                      </div>
                      <span className="font-bold text-gray-800">{tranche.amount.toLocaleString()} FCFA</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button 
                onClick={() => setSelectedFeeDetails(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

