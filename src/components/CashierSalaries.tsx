import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Calendar, 
  BarChart3, 
  Check, 
  X, 
  User, 
  RefreshCw 
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

type Salary = {
  id: string;
  employeeName: string;
  employeeRole: string;
  amount: number;
  paymentDate: string;
  periodStart: string;
  periodEnd: string;
  month: string;
  deductions: string;
  status: string;
};

const ROLES = [
  "Professeur",
  "Directeur",
  "Directeur des études",
  "Secrétaire",
  "Surveillant",
  "Gardien",
  "Comptable / Caisse",
  "Chauffeur",
  "Autre"
];

export function CashierSalaries() {
  const { user } = useAuth();
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tableError, setTableError] = useState(false);

  // Form states
  const [employeeName, setEmployeeName] = useState("");
  const [employeeRole, setEmployeeRole] = useState(ROLES[0]);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [deductions, setDeductions] = useState("Aucun");
  const [status, setStatus] = useState("PAYÉ");
  const [schoolEmployees, setSchoolEmployees] = useState<any[]>([]);

  // Inline Editing Table Row State
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineName, setInlineName] = useState("");
  const [inlineRole, setInlineRole] = useState("");
  const [inlineAmount, setInlineAmount] = useState("");
  const [inlineDate, setInlineDate] = useState("");
  const [inlineMonth, setInlineMonth] = useState("");
  const [inlineStatus, setInlineStatus] = useState("");
  const [savingInline, setSavingInline] = useState(false);

  useEffect(() => {
    fetchSalaries();
    fetchEmployees();
  }, [user?.schoolId]);

  const fetchEmployees = async () => {
    if (!user?.schoolId) return;
    const { data } = await supabase.from("profiles").select("*").eq("school_id", user.schoolId);
    if (data) setSchoolEmployees(data);
  };

  const fetchSalaries = async () => {
    if (!user?.schoolId) return;
    setLoading(true);
    setTableError(false);
    try {
      const { data, error } = await supabase
        .from("salaries")
        .select("*")
        .eq("school_id", user.schoolId)
        .order("payment_date", { ascending: false });

      if (error) {
        console.error("Error fetching salaries:", error);
        if (error.message.includes('relation "public.salaries" does not exist')) {
          setTableError(true);
        }
      } else if (data) {
        setSalaries(
          data.map((d) => ({
            id: d.id,
            employeeName: d.employee_name,
            employeeRole: d.employee_role,
            amount: Number(d.amount),
            paymentDate: d.payment_date,
            periodStart: d.period_start || "",
            periodEnd: d.period_end || "",
            deductions: d.deductions || "Aucun",
            month: d.month || "",
            status: d.status,
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Start Inline Editing for Table Row
  const startInlineEdit = (s: Salary) => {
    setInlineEditingId(s.id);
    setInlineName(s.employeeName);
    setInlineRole(s.employeeRole);
    setInlineAmount(s.amount.toString());
    setInlineDate(s.paymentDate);
    setInlineMonth(s.month || "");
    setInlineStatus(s.status);
  };

  const cancelInlineEdit = () => {
    setInlineEditingId(null);
    setInlineName("");
    setInlineRole("");
    setInlineAmount("");
    setInlineDate("");
    setInlineMonth("");
    setInlineStatus("");
  };

  const saveInlineEdit = async (id: string) => {
    if (!inlineName.trim() || !inlineAmount) {
      alert("Veuillez renseigner le nom de l'employé et le montant.");
      return;
    }
    setSavingInline(true);
    const { error } = await supabase
      .from("salaries")
      .update({
        employee_name: inlineName,
        employee_role: inlineRole,
        amount: Number(inlineAmount),
        payment_date: inlineDate,
        month: inlineMonth,
        status: inlineStatus,
      })
      .eq("id", id);

    setSavingInline(false);
    if (!error) {
      cancelInlineEdit();
      fetchSalaries();
    } else {
      alert("Erreur lors de la modification : " + error.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;

    const payload = {
      school_id: user.schoolId,
      employee_name: employeeName,
      employee_role: employeeRole,
      amount: Number(amount),
      payment_date: paymentDate,
      month: month,
      period_start: periodStart,
      period_end: periodEnd,
      deductions: deductions,
      status: status,
    };

    if (editingId) {
      const { error } = await supabase.from("salaries").update(payload).eq("id", editingId);
      if (!error) {
        fetchSalaries();
        resetForm();
      } else {
        alert("Erreur lors de la modification.");
      }
    } else {
      const { error } = await supabase.from("salaries").insert(payload);
      if (!error) {
        fetchSalaries();
        resetForm();
      } else {
        alert("Erreur lors de l'ajout.");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Supprimer ce paiement de salaire ?")) {
      const { error } = await supabase.from("salaries").delete().eq("id", id);
      if (!error) fetchSalaries();
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setEmployeeName("");
    setEmployeeRole(ROLES[0]);
    setAmount("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setMonth(new Date().toISOString().slice(0, 7));
    setPeriodStart("");
    setPeriodEnd("");
    setDeductions("Aucun");
    setStatus("PAYÉ");
  };

  const openEdit = (s: Salary) => {
    setEditingId(s.id);
    setEmployeeName(s.employeeName);
    setEmployeeRole(s.employeeRole);
    setAmount(s.amount.toString());
    setPaymentDate(s.paymentDate);
    setMonth(s.month);
    setPeriodStart(s.periodStart);
    setPeriodEnd(s.periodEnd);
    setDeductions(s.deductions);
    setStatus(s.status);
    setShowForm(true);
  };

  const filteredSalaries = salaries.filter(
    (s) =>
      s.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.employeeRole.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const totalPaid = salaries
    .filter((s) => s.status === "PAYÉ")
    .reduce((acc, s) => acc + s.amount, 0);
  const totalPending = salaries
    .filter((s) => s.status === "EN_ATTENTE")
    .reduce((acc, s) => acc + s.amount, 0);

  // Graph Data (Group by Role)
  const roleStats = ROLES.map((role) => {
    const roleSalaries = salaries.filter((s) => s.employeeRole === role);
    return {
      name: role,
      Payé: roleSalaries
        .filter((s) => s.status === "PAYÉ")
        .reduce((sum, s) => sum + s.amount, 0),
      Attente: roleSalaries
        .filter((s) => s.status === "EN_ATTENTE")
        .reduce((sum, s) => sum + s.amount, 0),
    };
  }).filter((r) => r.Payé > 0 || r.Attente > 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      {tableError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800">
          <h4 className="font-bold mb-2 flex items-center gap-2">
            ⚠️ Table 'salaries' manquante dans Supabase
          </h4>
          <p className="text-sm mb-4">
            Il semble que la table <strong>salaries</strong> n'existe pas encore dans votre base de données Supabase.
          </p>
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => fetchSalaries()}
              className="px-4 py-2 bg-amber-600 text-white font-bold rounded shadow-sm text-sm hover:bg-amber-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-800">
              {totalPaid.toLocaleString()} <span className="text-sm font-bold">FCFA</span>
            </div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">
              Total Salaires Réglés
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-800">
              {totalPending.toLocaleString()} <span className="text-sm font-bold">FCFA</span>
            </div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">
              Salaires En Attente
            </div>
          </div>
        </div>
      </div>

      {/* Graph */}
      {salaries.length > 0 && roleStats.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
            <BarChart3 size={18} className="text-emerald-600" /> Ventilation des Salaires par Poste
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(val) => `${(val / 1000).toLocaleString()}k`}
                />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString()} FCFA`, undefined]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="Payé" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Attente" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="font-bold text-gray-800 text-sm">Rémunérations & Salaires du Personnel</h3>
            <p className="text-xs text-slate-400">
              Modifiez directement les lignes dans le tableau ou cliquez sur Ajouter pour un nouveau règlement.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher employé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shadow-sm transition"
            >
              <Plus size={15} /> Nouveau Salaire
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Employé & Fonction</th>
                <th className="px-5 py-3.5">Mois</th>
                <th className="px-5 py-3.5">Date de paiement</th>
                <th className="px-5 py-3.5 text-center">Statut</th>
                <th className="px-5 py-3.5 text-right">Montant (FCFA)</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Chargement des salaires...
                  </td>
                </tr>
              ) : filteredSalaries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">
                    Aucun salaire enregistré.
                  </td>
                </tr>
              ) : (
                filteredSalaries.map((s) => {
                  const isEditing = inlineEditingId === s.id;

                  if (isEditing) {
                    return (
                      <tr key={s.id} className="bg-emerald-50/60 border-2 border-emerald-500 animate-in fade-in">
                        {/* Employé & Fonction Inputs */}
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={inlineName}
                              onChange={(e) => setInlineName(e.target.value)}
                              placeholder="Nom employé"
                              className="w-full px-2.5 py-1 bg-white border border-emerald-400 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <select
                              value={inlineRole}
                              onChange={(e) => setInlineRole(e.target.value)}
                              className="w-full px-2.5 py-1 bg-white border border-emerald-400 rounded-lg text-xs outline-none"
                            >
                              {ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>

                        {/* Mois Input */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="month"
                            value={inlineMonth}
                            onChange={(e) => setInlineMonth(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-emerald-400 rounded-lg text-xs outline-none"
                          />
                        </td>

                        {/* Date de paiement Input */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="date"
                            value={inlineDate}
                            onChange={(e) => setInlineDate(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-emerald-400 rounded-lg text-xs outline-none"
                          />
                        </td>

                        {/* Statut Input */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <select
                            value={inlineStatus}
                            onChange={(e) => setInlineStatus(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-emerald-400 rounded-lg text-xs font-bold outline-none"
                          >
                            <option value="PAYÉ">PAYÉ</option>
                            <option value="EN_ATTENTE">EN ATTENTE</option>
                          </select>
                        </td>

                        {/* Montant Input */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            value={inlineAmount}
                            onChange={(e) => setInlineAmount(e.target.value)}
                            className="w-28 px-2.5 py-1.5 bg-white border border-emerald-400 rounded-lg text-xs font-bold text-rose-600 text-right outline-none"
                          />
                        </td>

                        {/* Save / Cancel */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => saveInlineEdit(s.id)}
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

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-900 text-xs">{s.employeeName}</div>
                        <div className="text-[10px] text-slate-400">{s.employeeRole}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 whitespace-nowrap font-medium">
                        {s.month || "Mois courant"}
                      </td>
                      <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                        {new Date(s.paymentDate).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            s.status === "PAYÉ"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                        {s.amount.toLocaleString()} FCFA
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => startInlineEdit(s)}
                            className="px-2.5 py-1 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                            title="Modifier dans le tableau"
                          >
                            <Edit2 size={13} />
                            <span>Modifier</span>
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
                            title="Supprimer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Detailed Edit */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-base">
                {editingId ? "Modifier le Salaire" : "Enregistrer un Salaire"}
              </h3>
              <button
                onClick={resetForm}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nom de l'employé
                </label>
                <input
                  required
                  type="text"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: Dossou Paul"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Fonction / Poste</label>
                <select
                  value={employeeRole}
                  onChange={(e) => setEmployeeRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Montant (FCFA)
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-rose-600 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mois concerné
                  </label>
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Date de paiement
                  </label>
                  <input
                    required
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Statut</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PAYÉ">Payé</option>
                    <option value="EN_ATTENTE">En attente</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold shadow-sm"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
