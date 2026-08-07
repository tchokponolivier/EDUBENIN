import React, { useMemo, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { DollarSign, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Payment, Expense } from "../types";

export function CashierDashboard() {
  const { user } = useAuth();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.schoolId) return;
      setLoading(true);
      
      const [paymentsRes, expensesRes] = await Promise.all([
        supabase.from('payments').select('*').eq('school_id', user.schoolId),
        supabase.from('expenses').select('*').eq('school_id', user.schoolId)
      ]);
      
      if (paymentsRes.data) {
         setPayments(paymentsRes.data.map(d => ({
           id: d.id,
           schoolId: d.school_id,
           studentId: d.student_id,
           amount: d.amount,
           paymentDate: d.payment_date || d.created_at,
           paymentMethod: d.payment_method || d.network || 'CASH',
           reference: d.reference,
           status: d.status,
           createdAt: new Date(d.created_at).getTime()
         })));
      }
      
      if (expensesRes.data) {
         setExpenses(expensesRes.data.map(d => ({
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
      setLoading(false);
    };
    
    fetchData();
  }, [user]);

  const totalRevenue = useMemo(() => payments.reduce((acc, p) => acc + p.amount, 0), [payments]);
  const totalExpenses = useMemo(() => expenses.reduce((acc, e) => acc + e.amount, 0), [expenses]);
  
  if (loading) {
    return <div className="p-8 text-center text-slate-500">Chargement du tableau de bord...</div>;
  }
  const netProfit = totalRevenue - totalExpenses;

  // Chart data
  const data = [
    { name: "Entrées", amount: totalRevenue, fill: "#10b981" },
    { name: "Sorties", amount: totalExpenses, fill: "#ef4444" },
    { name: "Bénéfice Net", amount: Math.max(0, netProfit), fill: "#3b82f6" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Chiffre d'Affaires Brut</p>
                <h3 className="text-2xl font-black text-gray-800">{totalRevenue.toLocaleString()} F</h3>
             </div>
             <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <TrendingUp size={20} />
             </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Dépenses</p>
                <h3 className="text-2xl font-black text-gray-800">{totalExpenses.toLocaleString()} F</h3>
             </div>
             <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <TrendingDown size={20} />
             </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Bénéfice Net</p>
                <h3 className="text-2xl font-black text-gray-800">{netProfit.toLocaleString()} F</h3>
             </div>
             <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <DollarSign size={20} />
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80">
         <h3 className="text-sm font-bold text-gray-700 mb-6">Vue d'ensemble financière</h3>
         <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
               <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
               <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(v) => `${(v/1000)}k`} />
               <Tooltip formatter={(value) => `${Number(value).toLocaleString()} FCFA`} />
               <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
            </BarChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
}
