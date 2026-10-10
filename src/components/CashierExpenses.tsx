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
  RefreshCw 
} from "lucide-react";

const EXPENSE_CATEGORIES = [
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

  // Inline Editing Table Row State
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineDate, setInlineDate] = useState("");
  const [inlineDesc, setInlineDesc] = useState("");
  const [inlineCat, setInlineCat] = useState("");
  const [inlineAmount, setInlineAmount] = useState("");
  const [inlineProof, setInlineProof] = useState("");
  const [savingInline, setSavingInline] = useState(false);

  // Proof Viewer Modal State
  const [viewingProof, setViewingProof] = useState<{
    url: string;
    description: string;
    amount: number;
    date: string;
    category: string;
  } | null>(null);

  const fetchExpenses = async () => {
    if (!user?.schoolId) return;
    setLoading(true);
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
    }
    setLoading(false);
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

    const res = await supabase.from("expenses").insert({
      school_id: user.schoolId,
      description,
      amount: Number(amount),
      expense_date: expenseDate,
      category: finalCategory,
      proof_url: proofBase64 || null,
    });

    if (!res.error) {
      setShowForm(false);
      setDescription("");
      setAmount("");
      setExpenseDate(new Date().toISOString().split("T")[0]);
      setProofBase64("");
      fetchExpenses();
    } else {
      alert("Erreur lors de la création : " + (res.error?.message || "Erreur inconnue"));
    }
  };

  // Start Inline Editing for Table Row
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
    const { error } = await supabase
      .from("expenses")
      .update({
        description: inlineDesc,
        amount: Number(inlineAmount),
        expense_date: inlineDate,
        category: inlineCat,
        proof_url: inlineProof || null,
      })
      .eq("id", id);

    setSavingInline(false);
    if (!error) {
      cancelInlineEdit();
      fetchExpenses();
    } else {
      alert("Erreur lors de la modification : " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette dépense ?")) return;
    await supabase.from("expenses").delete().eq("id", id);
    fetchExpenses();
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
            Modifiez directement les lignes dans le tableau ou cliquez sur Voir pour inspecter les reçus et justificatifs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchExpenses}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            title="Rafraîchir"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} /> Enregistrer une dépense
          </button>
        </div>
      </div>

      {/* Formulaire d'ajout rapide */}
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
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
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

      {/* TABLE DES DÉPENSES AVEC MODIFICATION DIRECTE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">Date</th>
                <th className="px-5 py-3.5">Description / Motif</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Catégorie</th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap">Justificatif</th>
                <th className="px-5 py-3.5 text-right whitespace-nowrap">Montant (FCFA)</th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {expenses.map((exp) => {
                const isEditing = inlineEditingId === exp.id;

                if (isEditing) {
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
                          <label className="cursor-pointer px-2 py-1 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-bold flex items-center gap-1">
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
                                setViewingProof({
                                  url: inlineProof,
                                  description: inlineDesc,
                                  amount: Number(inlineAmount) || 0,
                                  date: inlineDate,
                                  category: inlineCat,
                                })
                              }
                              className="p-1 text-emerald-700 hover:text-emerald-900 bg-white rounded border border-emerald-300"
                              title="Aperçu du justificatif"
                            >
                              <Eye size={13} />
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

                    {/* Justificatif View Button */}
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      {exp.proofUrl ? (
                        <button
                          onClick={() =>
                            setViewingProof({
                              url: exp.proofUrl!,
                              description: exp.description,
                              amount: exp.amount,
                              date: exp.expenseDate,
                              category: exp.category,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition shadow-2xs"
                          title="Visualiser le justificatif"
                        >
                          <Eye size={13} />
                          <span>Voir</span>
                        </button>
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
                          title="Modifier directement dans le tableau"
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

              {expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    Aucune dépense enregistrée pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE VISUALISATION DU JUSTIFICATIF (PHOTO / FACTURE) */}
      {viewingProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Justificatif de dépense</h3>
                  <p className="text-xs text-slate-500">
                    {viewingProof.description} — {viewingProof.amount.toLocaleString()} FCFA
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingProof(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Document Content View */}
            <div className="flex-1 overflow-auto bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-center min-h-[300px]">
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
                  className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-sm border border-slate-200"
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
    </div>
  );
}
