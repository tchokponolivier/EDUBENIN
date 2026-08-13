import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { CheckCircle2, XCircle, Search, Calendar, RefreshCcw } from "lucide-react";
import { Payment } from "../types";

export function CashierVerification() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user?.schoolId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select('*, students(first_name, last_name, level)')
        .eq('school_id', user.schoolId)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });
      
      if (data) {
         setPayments(data);
      }
      setLoading(false);
    };
    fetchPayments();
  }, [user, refreshKey]);

  const handleValidate = async (id: string) => {
    if (!window.confirm("Confirmer la réception de ce paiement via le réseau mobile ?")) return;
    
    const { error } = await supabase
       .from('payments')
       .update({ status: 'COMPLETED' })
       .eq('id', id);
       
    if (error) {
       alert("Erreur: " + error.message);
       return;
    }
    
    alert("Paiement validé avec succès !");
    setRefreshKey(k => k + 1);
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("Rejeter ce paiement ? (Transaction introuvable)")) return;
    
    const { error } = await supabase
       .from('payments')
       .update({ status: 'FAILED' })
       .eq('id', id);
       
    if (error) {
       alert("Erreur: " + error.message);
       return;
    }
    
    alert("Paiement rejeté.");
    setRefreshKey(k => k + 1);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Chargement...</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-gray-700 flex items-center gap-2">
           <RefreshCcw size={18} className="text-orange-500" /> Transactions en attente
        </h3>
      </div>
      
      {payments.length === 0 ? (
        <div className="p-8 text-center text-slate-500 italic">
          Aucune transaction en attente de vérification.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="p-3 font-semibold">Date & Réf</th>
                <th className="p-3 font-semibold">Élève</th>
                <th className="p-3 font-semibold">Réseau USSD</th>
                <th className="p-3 font-semibold text-right">Montant</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-3">
                     <p className="text-xs font-semibold text-gray-700">{new Date(p.created_at).toLocaleString()}</p>
                     <p className="text-[10px] text-slate-400 font-mono">{p.reference}</p>
                  </td>
                  <td className="p-3">
                     <p className="text-xs font-bold text-gray-700">{p.students?.first_name} {p.students?.last_name}</p>
                     <p className="text-[10px] text-slate-500">{p.students?.level}</p>
                  </td>
                  <td className="p-3">
                     <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                       {p.network}
                     </span>
                  </td>
                  <td className="p-3 text-right">
                     <span className="font-mono font-bold text-sm text-gray-700">{p.amount.toLocaleString()} F</span>
                  </td>
                  <td className="p-3 text-right">
                     <div className="flex items-center justify-end gap-2">
                       <button onClick={() => handleValidate(p.id)} className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors" title="Valider">
                         <CheckCircle2 size={16} />
                       </button>
                       <button onClick={() => handleReject(p.id)} className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors" title="Rejeter">
                         <XCircle size={16} />
                       </button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
