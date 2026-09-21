import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { CheckCircle2, XCircle, Search, Calendar, RefreshCcw, Bell, Clock, AlertTriangle } from "lucide-react";
import { Payment } from "../types";

export function CashierVerification() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchPayments = async () => {
    if (!user?.schoolId) return;
    setLoading(true);
    
    // Attempt with relational students join
    let res = await supabase
      .from('payments')
      .select('*, students(first_name, last_name, level, academic_year, parent_id)')
      .eq('school_id', user.schoolId)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });
    
    // If foreign key join fails, fetch plain payments and attach students
    if (res.error) {
      console.warn("Retrying fetchPayments without relational join:", res.error);
      const [plainPays, studentsRes] = await Promise.all([
        supabase.from('payments').select('*').eq('school_id', user.schoolId).eq('status', 'PENDING').order('created_at', { ascending: false }),
        supabase.from('students').select('*').eq('school_id', user.schoolId)
      ]);
      if (plainPays.data) {
        const studentMap = new Map((studentsRes.data || []).map((s: any) => [s.id, s]));
        const merged = plainPays.data.map((p: any) => ({
          ...p,
          students: studentMap.get(p.student_id) || null
        }));
        setPayments(merged);
      }
    } else if (res.data) {
      // Ensure students object is present if null in join
      const hasMissingStudents = res.data.some((p: any) => !p.students && p.student_id);
      if (hasMissingStudents) {
        const { data: studentsData } = await supabase.from('students').select('*').eq('school_id', user.schoolId);
        const studentMap = new Map((studentsData || []).map((s: any) => [s.id, s]));
        const merged = res.data.map((p: any) => ({
          ...p,
          students: p.students || studentMap.get(p.student_id) || null
        }));
        setPayments(merged);
      } else {
        setPayments(res.data);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();

    // Auto-refresh pending list every 15 seconds
    const interval = setInterval(fetchPayments, 15 * 1000);
    const handleRefresh = () => fetchPayments();
    window.addEventListener('refresh_notifications', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('refresh_notifications', handleRefresh);
    };
  }, [user, refreshKey]);

  const handleValidate = async (payment: any) => {
    const studentName = payment.students ? `${payment.students.first_name} ${payment.students.last_name}` : "l'élève";
    if (!window.confirm(`Confirmer et valider la réception du paiement de ${Number(payment.amount).toLocaleString()} FCFA pour ${studentName} ?\n\nUne fois validée, la transaction sera intégrée à l'historique global et le parent en sera notifié.`)) return;
    
    const { error } = await supabase
       .from('payments')
       .update({ status: 'COMPLETED' })
       .eq('id', payment.id);
       
    if (error) {
       alert("Erreur lors de la validation: " + error.message);
       return;
    }

    // Insert parent notification if parent_id exists
    const parentId = payment.parent_id || payment.students?.parent_id;
    if (parentId && user?.schoolId) {
      try {
        await supabase.from('notifications').insert({
          school_id: user.schoolId,
          user_id: parentId,
          title: `Paiement validé : ${studentName}`,
          message: `Le paiement de ${Number(payment.amount).toLocaleString()} FCFA (Réf: ${payment.reference}) a été vérifié et validé avec succès par la caisse.`,
          type: 'PAYMENT'
        });
      } catch (notifErr) {
        console.warn("Could not insert notification row in database:", notifErr);
      }
    }
    
    alert("Transaction validée avec succès ! L'historique global a été mis à jour et le parent notifié.");
    window.dispatchEvent(new CustomEvent('refresh_notifications'));
    setRefreshKey(k => k + 1);
  };

  const handleReject = async (payment: any) => {
    const studentName = payment.students ? `${payment.students.first_name} ${payment.students.last_name}` : "l'élève";
    if (!window.confirm(`Rejeter définitivement ce paiement pour ${studentName} ? (Transaction introuvable ou invalide)`)) return;
    
    const { error } = await supabase
       .from('payments')
       .update({ status: 'FAILED' })
       .eq('id', payment.id);
       
    if (error) {
       alert("Erreur lors du rejet: " + error.message);
       return;
    }
    
    alert("Transaction rejetée.");
    window.dispatchEvent(new CustomEvent('refresh_notifications'));
    setRefreshKey(k => k + 1);
  };

  if (loading && payments.length === 0) return <div className="p-8 text-center text-slate-500">Chargement des vérifications...</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
           <RefreshCcw size={18} className="text-amber-500" /> 
           <h3 className="font-bold text-gray-700">Transactions en attente de vérification</h3>
           {payments.length > 0 && (
             <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[11px] font-bold animate-pulse">
               {payments.length}
             </span>
           )}
        </div>
        <button 
          onClick={fetchPayments} 
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-gray-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors self-end sm:self-auto font-medium"
        >
          <RefreshCcw size={12} /> Actualiser
        </button>
      </div>

      {payments.length > 0 && (
        <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2.5 text-xs text-amber-900">
          <Bell size={16} className="text-amber-600 shrink-0" />
          <span>
            <strong>Alerte Vérification :</strong> Vous avez <strong>{payments.length} encaissement(s)</strong> en attente. Vérifiez les références et cliquez sur <strong>Valider</strong> pour les intégrer à l'historique financier et notifier le parent.
          </span>
        </div>
      )}
      
      {payments.length === 0 ? (
        <div className="p-12 text-center text-slate-500">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={24} />
          </div>
          <p className="font-semibold text-gray-700 text-sm">Toutes les transactions sont vérifiées</p>
          <p className="text-xs text-slate-400 mt-1">Aucune transaction en attente de validation par la caisse.</p>
        </div>
      ) : (
        <div className="p-0">
          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-slate-100">
            {payments.map(p => {
              const studentName = p.students ? `${p.students.first_name} ${p.students.last_name}` : "Inconnu";
              const dateObj = new Date(p.created_at || p.payment_date);
              const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
              const timeStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
              
              return (
                <div key={p.id} className="p-4 flex flex-col gap-2 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 text-sm">{studentName}</span>
                    <span className="font-mono font-bold text-amber-600 text-sm">{Number(p.amount).toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{p.students?.level} • {p.students?.academic_year || 'Année standard'}</span>
                    <span className="flex items-center gap-1 font-mono text-gray-700 text-xs font-semibold">
                      <Clock size={12} className="text-amber-600" />
                      <span>{dateStr} à {timeStr || '--:--'}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                        {p.network || 'Caisse'}
                      </span>
                      <span className="font-mono text-slate-400 text-[10px]">({p.reference})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleValidate(p)} 
                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 transition-colors"
                        title="Valider la transaction"
                      >
                        <CheckCircle2 size={14} /> Valider
                      </button>
                      <button 
                        onClick={() => handleReject(p)} 
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Rejeter"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="p-3 font-semibold">Date & Heure</th>
                  <th className="p-3 font-semibold">Référence</th>
                  <th className="p-3 font-semibold">Élève</th>
                  <th className="p-3 font-semibold">Moyen / Réseau</th>
                  <th className="p-3 font-semibold text-right">Montant</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const studentName = p.students ? `${p.students.first_name} ${p.students.last_name}` : "Inconnu";
                  const dateObj = new Date(p.created_at || p.payment_date);
                  const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
                  const timeStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
                  
                  return (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-3">
                         <div className="flex flex-col">
                           <span className="text-xs font-semibold text-gray-800">{dateStr}</span>
                           {timeStr && (
                             <span className="text-[11px] text-amber-700 font-mono font-medium flex items-center gap-1 mt-0.5">
                               <Clock size={11} className="text-amber-600" />
                               {timeStr}
                             </span>
                           )}
                         </div>
                      </td>
                      <td className="p-3">
                         <span className="text-[11px] text-slate-500 font-mono">{p.reference}</span>
                      </td>
                      <td className="p-3">
                         <p className="text-xs font-bold text-gray-700">{studentName}</p>
                         <p className="text-[10px] text-slate-500">{p.students?.level} • {p.students?.academic_year || 'Année standard'}</p>
                      </td>
                      <td className="p-3">
                         <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                           {p.network || 'Caisse'}
                         </span>
                      </td>
                      <td className="p-3 text-right">
                         <span className="font-mono font-bold text-sm text-gray-800">{Number(p.amount).toLocaleString()} F</span>
                      </td>
                      <td className="p-3 text-right">
                         <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={() => handleValidate(p)} 
                             className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                             title="Valider et intégrer à l'historique"
                           >
                             <CheckCircle2 size={15} /> Valider
                           </button>
                           <button 
                             onClick={() => handleReject(p)} 
                             className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" 
                             title="Rejeter"
                           >
                             <XCircle size={18} />
                           </button>
                         </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
