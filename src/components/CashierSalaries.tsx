import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { Search, Plus, Edit2, Trash2, CheckCircle, Clock, Banknote, Calendar, BarChart3, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

type Salary = {
  id: string;
  employeeName: string;
  employeeRole: string;
  amount: number;
  paymentDate: string;
  month: string;
  status: string;
};

const ROLES = [
  "Directeur",
  "Directeur des études",
  "Secrétaire",
  "Surveillant",
  "Professeur",
  "Gardien",
  "Autre"
];

export function CashierSalaries() {
  const { user } = useAuth();
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [employeeName, setEmployeeName] = useState("");
  const [employeeRole, setEmployeeRole] = useState(ROLES[0]);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [status, setStatus] = useState("PAYÉ");

  useEffect(() => {
    fetchSalaries();
  }, [user?.schoolId]);

  const fetchSalaries = async () => {
    if (!user?.schoolId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('salaries')
        .select('*')
        .eq('school_id', user.schoolId)
        .order('created_at', { ascending: false });

      if (error) {
        // Table might not exist yet if user hasn't run the SQL
        console.error("Error fetching salaries:", error);
      } else if (data) {
        setSalaries(data.map(d => ({
          id: d.id,
          employeeName: d.employee_name,
          employeeRole: d.employee_role,
          amount: Number(d.amount),
          paymentDate: d.payment_date,
          month: d.month,
          status: d.status
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
      status: status
    };

    if (editingId) {
      const { error } = await supabase.from('salaries').update(payload).eq('id', editingId);
      if (!error) {
        fetchSalaries();
        resetForm();
      } else {
        alert("Erreur lors de la modification. Avez-vous exécuté la requête SQL pour créer la table 'salaries' ?");
      }
    } else {
      const { error } = await supabase.from('salaries').insert(payload);
      if (!error) {
        fetchSalaries();
        resetForm();
      } else {
        alert("Erreur lors de l'ajout. Avez-vous exécuté la requête SQL pour créer la table 'salaries' ?");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Supprimer ce paiement de salaire ?")) {
      const { error } = await supabase.from('salaries').delete().eq('id', id);
      if (!error) fetchSalaries();
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setEmployeeName("");
    setEmployeeRole(ROLES[0]);
    setAmount("");
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setMonth(new Date().toISOString().slice(0, 7));
    setStatus("PAYÉ");
  };

  const openEdit = (s: Salary) => {
    setEditingId(s.id);
    setEmployeeName(s.employeeName);
    setEmployeeRole(s.employeeRole);
    setAmount(s.amount.toString());
    setPaymentDate(s.paymentDate);
    setMonth(s.month);
    setStatus(s.status);
    setShowForm(true);
  };

  const filteredSalaries = salaries.filter(s => 
    s.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.employeeRole.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const totalPaid = salaries.filter(s => s.status === 'PAYÉ').reduce((acc, s) => acc + s.amount, 0);
  const totalPending = salaries.filter(s => s.status === 'EN_ATTENTE').reduce((acc, s) => acc + s.amount, 0);

  // Graph Data (Group by Role)
  const roleStats = ROLES.map(role => {
    const roleSalaries = salaries.filter(s => s.employeeRole === role);
    return {
      name: role,
      Payé: roleSalaries.filter(s => s.status === 'PAYÉ').reduce((sum, s) => sum + s.amount, 0),
      Attente: roleSalaries.filter(s => s.status === 'EN_ATTENTE').reduce((sum, s) => sum + s.amount, 0),
    };
  }).filter(r => r.Payé > 0 || r.Attente > 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800 font-mono">{totalPaid.toLocaleString()} F</div>
            <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Salaires Payés</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800 font-mono">{totalPending.toLocaleString()} F</div>
            <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Salaires En Attente</div>
          </div>
        </div>
      </div>

      {/* Graph */}
      {salaries.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><BarChart3 size={18}/> Salaires par Fonction</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={val => `${val.toLocaleString()} F`} />
                <Tooltip cursor={{fill: '#f8fafc'}} formatter={(value: number) => [`${value.toLocaleString()} F`, undefined]} />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                <Bar dataKey="Payé" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Attente" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="font-bold text-gray-700 flex items-center gap-2"><Banknote size={18}/> Historique des Salaires</h3>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Rechercher (nom, fonction)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 whitespace-nowrap">
              <Plus size={16} /> Ajouter
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Employé</th>
                <th className="px-6 py-3">Mois</th>
                <th className="px-6 py-3">Montant</th>
                <th className="px-6 py-3">Date de paiement</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Chargement...</td></tr>
              ) : filteredSalaries.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">Aucun salaire enregistré.</td></tr>
              ) : (
                filteredSalaries.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800 text-sm">{s.employeeName}</div>
                      <div className="text-xs text-slate-500">{s.employeeRole}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      <div className="flex items-center gap-1"><Calendar size={14} className="text-slate-400"/> {s.month}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold font-mono text-gray-700">{s.amount.toLocaleString()} F</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(s.paymentDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.status === 'PAYÉ' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded shadow-sm">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 text-slate-400 hover:text-red-600 bg-white border border-slate-200 rounded shadow-sm">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95 my-8">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-gray-800">{editingId ? "Modifier le Salaire" : "Enregistrer un Salaire"}</h3>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nom de l'employé</label>
                <input required type="text" value={employeeName} onChange={e => setEmployeeName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: Jean Dupont" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Fonction</label>
                <select value={employeeRole} onChange={e => setEmployeeRole(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Montant (FCFA)</label>
                  <input required type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded font-mono focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mois (AAAA-MM)</label>
                  <input required type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date d'opération</label>
                  <input required type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Statut</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="PAYÉ">Payé</option>
                    <option value="EN_ATTENTE">En attente</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded">Annuler</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
