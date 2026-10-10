import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Expense } from "../types";
import { useAuth } from "../lib/auth";
import { 
  Receipt, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Eye, 
  Download, 
  Calendar, 
  Tag, 
  FileText, 
  Upload, 
  RefreshCw,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Save,
  CheckCircle2,
  SlidersHorizontal
} from "lucide-react";

export const EXPENSE_CATEGORIES = [
  { value: "MATERIEL_FOURNITURE", label: "Matériels et Fournitures de Bureau" },
  { value: "ENTRETIEN_REPARATION", label: "Entretien & réparations" },
  { value: "TRAVAUX", label: "Travaux & Rénovations" },
  { value: "PRELEVEMENTS_BANQUE", label: "Prélèvements BANQUE" },
  { value: "UNIFORMES", label: "Uniformes & Tenues" },
  { value: "LIVRES", label: "Livres & Manuels" },
  { value: "CANTINE", label: "Cantine scolaire" },
  { value: "COMMUNICATIONS", label: "Communications & Télécoms" },
  { value: "PRESTATAIRES", label: "Prestataires extérieurs" },
  { value: "IMPOTS", label: "Impôts & Taxes" },
  { value: "COLLATIONS", label: "Collations & Réceptions" },
  { value: "MATERIEL_DIDACTIQUE", label: "Matériels didactiques" },
  { value: "PRIMES", label: "Primes & Gratifications" },
  { value: "FACTURE", label: "Factures (Eau / Électricité SBEE)" },
  { value: "CARBURANT", label: "Carburant & Transport" },
  { value: "AUTRE", label: "Autre charge" },
];

export function CashierExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states for new expense
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState<string>("MATERIEL_FOURNITURE");
  const [customCategory, setCustomCategory] = useState("");
  const [proofBase64, setProofBase64] = useState("");

  // Single-row inline editing
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineDate, setInlineDate] = useState("");
  const [inlineDesc, setInlineDesc] = useState("");
  const [inlineCat, setInlineCat] = useState("");
  const [inlineAmount, setInlineAmount] = useState("");
  const [inlineProof, setInlineProof] = useState("");
  const [savingInline, setSavingInline] = useState(false);

  // Full-table batch editing mode
  const [isFullTableEdit, setIsFullTableEdit] = useState(false);
  const [batchData, setBatchData] = useState<
    Record<
      string,
      {
        description: string;
        amount: string;
        expenseDate: string;
        category: string;
        proofUrl?: string;
      }
    >
  >({});
  const [savingBatch, setSavingBatch] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Draft new row directly in table
  const [newTableRows, setNewTableRows] = useState<
    Array<{
      tempId: string;
      expenseDate: string;
      description: string;
      category: string;
      amount: string;
      proofUrl?: string;
    }>
  >([]);
  const [savingNewRowId, setSavingNewRowId] = useState<string | null>(null);

  // Proof Viewer Modal State with Fullscreen / Lightbox
  const [viewingProof, setViewingProof] = useState<{
    url: string;
    description: string;
    amount: number;
    date: string;
    category: string;
  } | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const fetchExpenses = async () => {
    if (!user?.schoolId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("school_id", user.schoolId)
        .order("expense_date", { ascending: false });

      if (!error && data) {
        setExpenses(
          data.map((d) => ({
            id: d.id,
            schoolId: d.school_id,
            description: d.description,
            amount: d.amount,
            expenseDate: d.expense_date,
            category: d.category,
            proofUrl: d.proof_url,
            createdAt: new Date(d.created_at).getTime(),
          }))
        );
      } else {
        // Fallback to local storage
        const loc = localStorage.getItem("mock_db_expenses");
        if (loc) {
          const parsed = JSON.parse(loc);
          setExpenses(
            parsed
              .filter((d: any) => d.school_id === user.schoolId)
              .map((d: any) => ({
                id: d.id,
                schoolId: d.school_id,
                description: d.description,
                amount: d.amount,
                expenseDate: d.expense_date,
                category: d.category,
                proofUrl: d.proof_url,
                createdAt: new Date(d.created_at).getTime(),
              }))
          );
        }
      }
    } catch (err) {
      console.warn("Expenses fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [user]);

  const handleUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;

    const finalCategory = category === "AUTRE" ? customCategory : category;

    const newExpense = {
      school_id: user.schoolId,
      description,
      amount: Number(amount),
      expense_date: expenseDate,
      category: finalCategory,
      proof_url: proofBase64 || null,
    };

    const res = await supabase.from("expenses").insert(newExpense);

    // Also update mock storage for safety
    try {
      const loc = localStorage.getItem("mock_db_expenses");
      const list = loc ? JSON.parse(loc) : [];
      list.push({ id: `exp_${Date.now()}`, ...newExpense, created_at: new Date().toISOString() });
      localStorage.setItem("mock_db_expenses", JSON.stringify(list));
    } catch (e) {}

    if (!res.error || res.data) {
      setShowForm(false);
      setDescription("");
      setAmount("");
      setExpenseDate(new Date().toISOString().split("T")[0]);
      setProofBase64("");
      fetchExpenses();
    } else {
      setShowForm(false);
      fetchExpenses();
    }
  };

  // Start Inline Editing for a Single Row
  const startInlineEdit = (exp: Expense) => {
    setInlineEditingId(exp.id);
    setInlineDate(exp.expenseDate || "");
    setInlineDesc(exp.description || "");
    setInlineCat(exp.category || "MATERIEL_FOURNITURE");
    setInlineAmount(exp.amount.toString());
    setInlineProof(exp.proofUrl || "");
  };

  const cancelInlineEdit = () => {
    setInlineEditingId(null);
    setInlineDate("");
    setInlineDesc("");
    setInlineCat("");
    setInlineAmount("");
    setInlineProof("");
  };

  const saveInlineEdit = async (id: string) => {
    if (!inlineDesc.trim() || !inlineAmount) {
      alert("Veuillez renseigner la description et le montant.");
      return;
    }
    setSavingInline(true);
    const updated = {
      description: inlineDesc,
      amount: Number(inlineAmount),
      expense_date: inlineDate,
      category: inlineCat,
      proof_url: inlineProof || null,
    };

    const { error } = await supabase.from("expenses").update(updated).eq("id", id);

    // Sync localStorage fallback
    try {
      const loc = localStorage.getItem("mock_db_expenses");
      if (loc) {
        const list = JSON.parse(loc);
        const idx = list.findIndex((x: any) => x.id === id);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...updated };
          localStorage.setItem("mock_db_expenses", JSON.stringify(list));
        }
      }
    } catch (e) {}

    setSavingInline(false);
    cancelInlineEdit();
    fetchExpenses();
  };

  // Start Full-Table Batch Edit Mode
  const startFullTableEdit = () => {
    const initialBatch: Record<string, any> = {};
    expenses.forEach((exp) => {
      initialBatch[exp.id] = {
        description: exp.description || "",
        amount: exp.amount ? exp.amount.toString() : "0",
        expenseDate: exp.expenseDate || new Date().toISOString().split("T")[0],
        category: exp.category || "MATERIEL_FOURNITURE",
        proofUrl: exp.proofUrl || "",
      };
    });
    setBatchData(initialBatch);
    setIsFullTableEdit(true);
    setInlineEditingId(null); // Cancel single inline if active
  };

  const cancelFullTableEdit = () => {
    setIsFullTableEdit(false);
    setBatchData({});
  };

  const updateBatchField = (id: string, field: string, value: any) => {
    setBatchData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const saveAllTableEdits = async () => {
    setSavingBatch(true);
    try {
      // Save all edited rows to Supabase
      const promises = Object.entries(batchData).map(([id, row]) => {
        return supabase
          .from("expenses")
          .update({
            description: row.description,
            amount: Number(row.amount) || 0,
            expense_date: row.expenseDate,
            category: row.category,
            proof_url: row.proofUrl || null,
          })
          .eq("id", id);
      });

      await Promise.all(promises);

      // Also sync localStorage
      try {
        const loc = localStorage.getItem("mock_db_expenses");
        if (loc) {
          const list = JSON.parse(loc);
          list.forEach((item: any) => {
            if (batchData[item.id]) {
              const row = batchData[item.id];
              item.description = row.description;
              item.amount = Number(row.amount) || 0;
              item.expense_date = row.expenseDate;
              item.category = row.category;
              item.proof_url = row.proofUrl || null;
            }
          });
          localStorage.setItem("mock_db_expenses", JSON.stringify(list));
        }
      } catch (e) {}

      setIsFullTableEdit(false);
      setSaveSuccessNotice("Toutes les dépenses du tableau ont été mises à jour avec succès !");
      setTimeout(() => setSaveSuccessNotice(null), 3500);
      fetchExpenses();
    } catch (err) {
      console.error("Error saving batch expenses:", err);
      alert("Erreur lors de la sauvegarde du tableau.");
    } finally {
      setSavingBatch(false);
    }
  };

  // Direct In-Table Row Addition handlers
  const addNewTableRow = () => {
    const newRow = {
      tempId: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      expenseDate: new Date().toISOString().split("T")[0],
      description: "",
      category: "MATERIEL_FOURNITURE",
      amount: "",
      proofUrl: "",
    };
    setNewTableRows((prev) => [newRow, ...prev]);
  };

  const updateNewTableRowField = (tempId: string, field: string, value: any) => {
    setNewTableRows((prev) =>
      prev.map((row) => (row.tempId === tempId ? { ...row, [field]: value } : row))
    );
  };

  const removeNewTableRow = (tempId: string) => {
    setNewTableRows((prev) => prev.filter((row) => row.tempId !== tempId));
  };

  const saveNewTableRow = async (tempId: string) => {
    const row = newTableRows.find((r) => r.tempId === tempId);
    if (!row) return;

    if (!row.description.trim() || !row.amount || Number(row.amount) <= 0) {
      alert("Veuillez renseigner le motif et un montant valide supérieur à 0.");
      return;
    }

    if (!user?.schoolId) return;

    setSavingNewRowId(tempId);
    try {
      const newExp = {
        school_id: user.schoolId,
        description: row.description.trim(),
        amount: Number(row.amount),
        expense_date: row.expenseDate,
        category: row.category,
        proof_url: row.proofUrl || null,
      };

      const res = await supabase.from("expenses").insert(newExp);

      // Local storage fallback sync
      try {
        const loc = localStorage.getItem("mock_db_expenses");
        const list = loc ? JSON.parse(loc) : [];
        list.unshift({
          id: `exp_${Date.now()}`,
          ...newExp,
          created_at: new Date().toISOString(),
        });
        localStorage.setItem("mock_db_expenses", JSON.stringify(list));
      } catch (e) {}

      // Remove from drafts
      setNewTableRows((prev) => prev.filter((r) => r.tempId !== tempId));
      setSaveSuccessNotice("Nouvelle dépense ajoutée avec succès au tableau !");
      setTimeout(() => setSaveSuccessNotice(null), 3500);
      fetchExpenses();
    } catch (err) {
      console.error("Error creating expense row:", err);
      alert("Erreur lors de l'enregistrement de la ligne.");
    } finally {
      setSavingNewRowId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette dépense ?")) return;
    await supabase.from("expenses").delete().eq("id", id);
    try {
      const loc = localStorage.getItem("mock_db_expenses");
      if (loc) {
        const list = JSON.parse(loc).filter((x: any) => x.id !== id);
        localStorage.setItem("mock_db_expenses", JSON.stringify(list));
      }
    } catch (e) {}
    fetchExpenses();
  };

  // Open Proof Viewer
  const openProofViewer = (proof: {
    url: string;
    description: string;
    amount: number;
    date: string;
    category: string;
  }, fullScreenImmediately = false) => {
    setViewingProof(proof);
    setIsFullScreen(fullScreenImmediately);
    setZoomLevel(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            Gestion des Dépenses de l'Établissement
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
              {expenses.length} dépense{expenses.length > 1 ? "s" : ""}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Modifiez toutes les dépenses directement dans le tableau ou cliquez sur un justificatif pour l'agrandir totalement en plein écran.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchExpenses}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            title="Rafraîchir"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>

          {/* Bouton Ajouter une ligne directement dans le tableau */}
          <button
            onClick={addNewTableRow}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            title="Ajouter une nouvelle ligne directement dans le tableau"
          >
            <Plus size={15} />
            <span>Ajouter une ligne</span>
          </button>

          {/* Toggle Full Table Edit Button */}
          {!isFullTableEdit ? (
            <button
              onClick={startFullTableEdit}
              disabled={expenses.length === 0}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              title="Modifier toutes les dépenses dans le tableau en même temps"
            >
              <Edit2 size={15} />
              <span>Modifier tout le tableau</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={saveAllTableEdits}
                disabled={savingBatch}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Save size={15} className={savingBatch ? "animate-spin" : ""} />
                <span>{savingBatch ? "Enregistrement..." : "Enregistrer tout le tableau"}</span>
              </button>
              <button
                onClick={cancelFullTableEdit}
                disabled={savingBatch}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition"
              >
                <X size={15} />
                <span>Annuler</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} /> Enregistrer via formulaire
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccessNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* Mode modification globale banner */}
      {isFullTableEdit && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
            <span>
              <strong>Mode modification du tableau activé :</strong> vous pouvez modifier toutes les cellules (date, motif, catégorie, justificatif, montant) directement ci-dessous.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveAllTableEdits}
              disabled={savingBatch}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-xs transition"
            >
              Valider les modifications
            </button>
          </div>
        </div>
      )}

      {/* Formulaire d'ajout rapide (optionnel) */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end animate-in fade-in"
        >
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description / Motif de la dépense
            </label>
            <input
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ex: Achat rames de papier, craies et marqueurs..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Montant (FCFA)
            </label>
            <input
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              min="0"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              placeholder="Ex: 25000"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Date d'engagement
            </label>
            <input
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              type="date"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Catégorie de charge
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {category === "AUTRE" && (
              <input
                required
                type="text"
                placeholder="Précisez la catégorie..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full mt-2 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Justificatif (Facture / Quittance / Photo)
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleUpload(e, setProofBase64)}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 bg-slate-50 rounded-lg border border-slate-200"
            />
          </div>
          <div className="lg:col-span-3 pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
            >
              Enregistrer la dépense
            </button>
          </div>
        </form>
      )}

      {/* TABLE DES DÉPENSES AVEC MODIFICATION DIRECTE & AJOUT DE LIGNES */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">Date</th>
                <th className="px-5 py-3.5">Description / Motif</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Catégorie</th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap">Justificatif (Cliquer pour agrandir)</th>
                <th className="px-5 py-3.5 text-right whitespace-nowrap">Montant (FCFA)</th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {/* LIGNES AJOUTÉES DIRECTEMENT DANS LE TABLEAU (NOUVELLES LIGNES) */}
              {newTableRows.map((draftRow, index) => (
                <tr
                  key={draftRow.tempId}
                  className="bg-emerald-50/70 border-l-4 border-l-emerald-500 animate-in fade-in transition-colors"
                >
                  {/* Date Input */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="date"
                      value={draftRow.expenseDate}
                      onChange={(e) => updateNewTableRowField(draftRow.tempId, "expenseDate", e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-emerald-400 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                  </td>

                  {/* Description Input */}
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      autoFocus={index === 0}
                      value={draftRow.description}
                      onChange={(e) => updateNewTableRowField(draftRow.tempId, "description", e.target.value)}
                      placeholder="Saisissez le motif de la nouvelle dépense..."
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-400 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                  </td>

                  {/* Catégorie Select */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <select
                      value={draftRow.category}
                      onChange={(e) => updateNewTableRowField(draftRow.tempId, "category", e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-emerald-400 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-medium shadow-2xs"
                    >
                      {EXPENSE_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Justificatif Upload */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <label className="cursor-pointer px-2.5 py-1 bg-white border border-emerald-400 text-emerald-700 hover:bg-emerald-100 rounded-md text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                        <Upload size={12} />
                        <span>{draftRow.proofUrl ? "Remplacer" : "Ajouter justificatif"}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                updateNewTableRowField(draftRow.tempId, "proofUrl", reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      {draftRow.proofUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            openProofViewer({
                              url: draftRow.proofUrl!,
                              description: draftRow.description || "Nouvelle dépense",
                              amount: Number(draftRow.amount) || 0,
                              date: draftRow.expenseDate,
                              category: draftRow.category,
                            }, true)
                          }
                          className="p-1 text-emerald-700 hover:text-emerald-900 bg-white rounded border border-emerald-300 shadow-2xs"
                          title="Agrandir en plein écran"
                        >
                          <Maximize2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Montant Input */}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <input
                      type="number"
                      min="0"
                      value={draftRow.amount}
                      onChange={(e) => updateNewTableRowField(draftRow.tempId, "amount", e.target.value)}
                      placeholder="Montant FCFA"
                      className="w-28 px-2.5 py-1.5 bg-white border border-emerald-400 rounded-lg text-xs font-bold text-rose-600 text-right outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                  </td>

                  {/* Actions for draft row */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => saveNewTableRow(draftRow.tempId)}
                        disabled={savingNewRowId === draftRow.tempId}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition"
                        title="Enregistrer cette nouvelle ligne"
                      >
                        <Check size={14} className={savingNewRowId === draftRow.tempId ? "animate-spin" : ""} />
                        <span>{savingNewRowId === draftRow.tempId ? "Enregistrement..." : "Enregistrer"}</span>
                      </button>
                      <button
                        onClick={() => removeNewTableRow(draftRow.tempId)}
                        disabled={savingNewRowId === draftRow.tempId}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                        title="Annuler l'ajout de cette ligne"
                      >
                        <Trash2 size={14} />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.map((exp) => {
                // If in full table batch mode, render inputs for all rows
                if (isFullTableEdit) {
                  const row = batchData[exp.id] || {
                    description: exp.description,
                    amount: exp.amount.toString(),
                    expenseDate: exp.expenseDate,
                    category: exp.category,
                    proofUrl: exp.proofUrl,
                  };

                  return (
                    <tr key={exp.id} className="bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors">
                      {/* Date Input */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <input
                          type="date"
                          value={row.expenseDate}
                          onChange={(e) => updateBatchField(exp.id, "expenseDate", e.target.value)}
                          className="px-2 py-1 bg-white border border-indigo-300 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Description Input */}
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={row.description}
                          onChange={(e) => updateBatchField(exp.id, "description", e.target.value)}
                          placeholder="Motif de la dépense..."
                          className="w-full px-2.5 py-1 bg-white border border-indigo-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Catégorie Select */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <select
                          value={row.category}
                          onChange={(e) => updateBatchField(exp.id, "category", e.target.value)}
                          className="px-2.5 py-1 bg-white border border-indigo-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        >
                          {EXPENSE_CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Justificatif Upload / View in Batch */}
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <label className="cursor-pointer px-2 py-1 bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                            <Upload size={12} />
                            <span>{row.proofUrl ? "Remplacer" : "Ajouter"}</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    updateBatchField(exp.id, "proofUrl", reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                          {row.proofUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                openProofViewer({
                                  url: row.proofUrl!,
                                  description: row.description,
                                  amount: Number(row.amount) || 0,
                                  date: row.expenseDate,
                                  category: row.category,
                                }, true)
                              }
                              className="p-1 text-indigo-700 hover:text-indigo-900 bg-white rounded border border-indigo-300 shadow-2xs"
                              title="Cliquer pour agrandir totalement en plein écran"
                            >
                              <Maximize2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Montant Input */}
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          value={row.amount}
                          onChange={(e) => updateBatchField(exp.id, "amount", e.target.value)}
                          className="w-28 px-2 py-1 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-rose-600 text-right outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                          title="Supprimer la ligne"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                }

                // If single row is inline editing
                const isSingleEditing = inlineEditingId === exp.id;
                if (isSingleEditing) {
                  return (
                    <tr key={exp.id} className="bg-emerald-50/60 border-2 border-emerald-500 animate-in fade-in">
                      {/* Date Input */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="date"
                          value={inlineDate}
                          onChange={(e) => setInlineDate(e.target.value)}
                          className="px-2.5 py-1.5 bg-white border border-emerald-400 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>

                      {/* Description Input */}
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={inlineDesc}
                          onChange={(e) => setInlineDesc(e.target.value)}
                          placeholder="Motif de la dépense..."
                          className="w-full px-2.5 py-1.5 bg-white border border-emerald-400 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>

                      {/* Catégorie Select */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={inlineCat}
                          onChange={(e) => setInlineCat(e.target.value)}
                          className="px-2.5 py-1.5 bg-white border border-emerald-400 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                        >
                          {EXPENSE_CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Justificatif Upload */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <label className="cursor-pointer px-2 py-1 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                            <Upload size={12} />
                            <span>{inlineProof ? "Remplacer" : "Ajouter"}</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => handleUpload(e, setInlineProof)}
                              className="hidden"
                            />
                          </label>
                          {inlineProof && (
                            <button
                              type="button"
                              onClick={() =>
                                openProofViewer({
                                  url: inlineProof,
                                  description: inlineDesc,
                                  amount: Number(inlineAmount) || 0,
                                  date: inlineDate,
                                  category: inlineCat,
                                }, true)
                              }
                              className="p-1 text-emerald-700 hover:text-emerald-900 bg-white rounded border border-emerald-300 shadow-2xs"
                              title="Agrandir en plein écran"
                            >
                              <Maximize2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Montant Input */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          value={inlineAmount}
                          onChange={(e) => setInlineAmount(e.target.value)}
                          className="w-28 px-2.5 py-1.5 bg-white border border-emerald-400 rounded-lg text-xs font-bold text-rose-600 text-right outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>

                      {/* Save & Cancel Actions */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => saveInlineEdit(exp.id)}
                            disabled={savingInline}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition"
                            title="Valider la modification"
                          >
                            <Check size={14} />
                            <span>Valider</span>
                          </button>
                          <button
                            onClick={cancelInlineEdit}
                            disabled={savingInline}
                            className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                            title="Annuler"
                          >
                            <X size={14} />
                            <span>Annuler</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                // Normal Display Row
                return (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Date */}
                    <td className="px-5 py-4 whitespace-nowrap text-slate-700 font-bold">
                      {new Date(exp.expenseDate).toLocaleDateString("fr-FR")}
                    </td>

                    {/* Description */}
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      <div>{exp.description}</div>
                    </td>

                    {/* Catégorie */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-[11px] font-bold">
                        {EXPENSE_CATEGORIES.find((c) => c.value === exp.category)?.label || exp.category}
                      </span>
                    </td>

                    {/* Justificatif View & Zoom Button */}
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      {exp.proofUrl ? (
                        <div className="inline-flex items-center gap-1.5">
                          {/* Mini Thumbnail */}
                          {exp.proofUrl.startsWith("data:image") && (
                            <img
                              src={exp.proofUrl}
                              alt="Thumbnail"
                              onClick={() =>
                                openProofViewer({
                                  url: exp.proofUrl!,
                                  description: exp.description,
                                  amount: exp.amount,
                                  date: exp.expenseDate,
                                  category: exp.category,
                                }, true)
                              }
                              className="w-7 h-7 rounded border border-slate-300 object-cover cursor-pointer hover:scale-110 transition shadow-2xs"
                              title="Cliquer pour agrandir totalement"
                            />
                          )}
                          <button
                            onClick={() =>
                              openProofViewer({
                                url: exp.proofUrl!,
                                description: exp.description,
                                amount: exp.amount,
                                date: exp.expenseDate,
                                category: exp.category,
                              }, false)
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition shadow-2xs"
                            title="Visualiser et agrandir le justificatif"
                          >
                            <Eye size={13} />
                            <span>Voir</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Aucun justificatif</span>
                      )}
                    </td>

                    {/* Montant */}
                    <td className="px-5 py-4 text-right whitespace-nowrap font-bold text-sm text-rose-600">
                      - {exp.amount.toLocaleString()} FCFA
                    </td>

                    {/* Actions: Edit in Table & Delete */}
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => startInlineEdit(exp)}
                          className="px-2.5 py-1 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                          title="Modifier directement cette ligne dans le tableau"
                        >
                          <Edit2 size={13} />
                          <span>Modifier</span>
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
                          title="Supprimer la dépense"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {expenses.length === 0 && newTableRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    Aucune dépense enregistrée pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Bottom Action Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={addNewTableRow}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-2xs transition"
            >
              <Plus size={14} />
              <span>+ Ajouter une autre ligne au tableau</span>
            </button>
            {isFullTableEdit && (
              <span className="text-indigo-700 font-semibold text-[11px]">
                Mode édition active : toutes les cellules sont modifiables.
              </span>
            )}
          </div>
          <div className="text-slate-500 font-medium">
            Total : <strong className="text-slate-800">{expenses.length} dépense{expenses.length > 1 ? "s" : ""}</strong>
            {newTableRows.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                +{newTableRows.length} en cours d'ajout
              </span>
            )}
          </div>
        </div>
      </div>

      {/* MODAL ET LIGHTBOX TOTALEMENT AGRANDI DU JUSTIFICATIF */}
      {viewingProof && (
        <>
          {/* Lightbox Plein Écran Total */}
          {isFullScreen ? (
            <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col justify-between p-4 backdrop-blur-md animate-in fade-in">
              {/* Top Controls Bar */}
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 rounded-xl text-white border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      {viewingProof.description}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Montant : <span className="font-bold text-emerald-400">{viewingProof.amount.toLocaleString()} FCFA</span> | Date : {new Date(viewingProof.date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
                    className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                    title="Zoom avant (+)"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.5))}
                    className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                    title="Zoom arrière (-)"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <a
                    href={viewingProof.url}
                    download={`Justificatif_${viewingProof.description.slice(0, 20).replace(/[^a-zA-Z0-9]/g, "_")}`}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                    title="Télécharger le fichier"
                  >
                    <Download size={14} />
                    <span>Télécharger</span>
                  </a>
                  <button
                    onClick={() => setIsFullScreen(false)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                    title="Réduire l'affichage"
                  >
                    <Minimize2 size={14} />
                    <span>Réduire</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsFullScreen(false);
                      setViewingProof(null);
                    }}
                    className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-rose-600 rounded-lg transition"
                    title="Fermer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Fullscreen Body Display */}
              <div 
                className="flex-1 flex items-center justify-center p-4 overflow-auto cursor-zoom-out"
                onClick={() => setIsFullScreen(false)}
              >
                {viewingProof.url.startsWith("data:application/pdf") ? (
                  <iframe
                    src={viewingProof.url}
                    className="w-full h-full max-h-[88vh] rounded-xl border border-slate-700 bg-white"
                    title="Aperçu PDF Plein Écran"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <img
                    src={viewingProof.url}
                    alt={viewingProof.description}
                    style={{ transform: `scale(${zoomLevel})`, transition: "transform 0.2s ease-out" }}
                    className="max-h-[88vh] max-w-[95vw] rounded-xl object-contain shadow-2xl border border-slate-800"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>

              {/* Bottom hint */}
              <div className="text-center text-xs text-slate-400 py-1">
                Cliquez en dehors de l'image ou sur "Réduire" pour quitter le plein écran.
              </div>
            </div>
          ) : (
            /* Modal Normal avec option Agrandir totalement */
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-4 animate-in zoom-in-95 max-h-[92vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Receipt size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">Justificatif de dépense</h3>
                      <p className="text-xs text-slate-500">
                        {viewingProof.description} — <span className="font-bold text-emerald-700">{viewingProof.amount.toLocaleString()} FCFA</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsFullScreen(true)}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                      title="Agrandir totalement en plein écran"
                    >
                      <Maximize2 size={14} />
                      <span>Agrandir totalement</span>
                    </button>
                    <button
                      onClick={() => setViewingProof(null)}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Banner Click to expand */}
                <div 
                  onClick={() => setIsFullScreen(true)}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs px-3 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition border border-emerald-200"
                >
                  <span className="font-medium flex items-center gap-1.5">
                    <Maximize2 size={13} className="text-emerald-700" />
                    <strong>Astuce :</strong> Cliquez directement sur le document ou l'image ci-dessous pour l'agrandir totalement.
                  </span>
                  <span className="font-bold underline text-[11px]">Plein écran</span>
                </div>

                {/* Document Content View */}
                <div 
                  onClick={() => setIsFullScreen(true)}
                  className="flex-1 overflow-auto bg-slate-100 p-4 rounded-xl border border-slate-200 flex items-center justify-center min-h-[350px] cursor-zoom-in group"
                  title="Cliquez pour agrandir totalement"
                >
                  {viewingProof.url.startsWith("data:application/pdf") ? (
                    <iframe
                      src={viewingProof.url}
                      className="w-full h-96 rounded border border-slate-300"
                      title="Aperçu PDF"
                    />
                  ) : (
                    <img
                      src={viewingProof.url}
                      alt={viewingProof.description}
                      className="max-h-[62vh] max-w-full rounded-lg object-contain shadow-sm border border-slate-200 group-hover:scale-[1.01] transition-transform"
                    />
                  )}
                </div>

                {/* Modal Footer */}
                <div className="pt-2 flex items-center justify-between text-xs">
                  <div className="text-slate-500 font-medium">
                    Date :{" "}
                    <span className="font-bold text-gray-800">
                      {new Date(viewingProof.date).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsFullScreen(true)}
                      className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl font-bold flex items-center gap-1.5 transition"
                    >
                      <Maximize2 size={14} />
                      <span>Plein écran</span>
                    </button>
                    <a
                      href={viewingProof.url}
                      download={`Justificatif_${viewingProof.description.slice(0, 15).replace(/[^a-zA-Z0-9]/g, "_")}`}
                      className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl font-bold flex items-center gap-1.5 transition"
                    >
                      <Download size={14} />
                      <span>Télécharger</span>
                    </a>
                    <button
                      onClick={() => setViewingProof(null)}
                      className="px-5 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
