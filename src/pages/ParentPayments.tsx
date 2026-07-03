import React, { useState, useEffect, useMemo } from "react";
import { db } from "../lib/db";
import { Student, Payment, SchoolSettings } from "../types";
import { useAuth } from "../lib/auth";
import { CreditCard, CheckCircle2, History, AlertTriangle, MessageCircle, Download, FileText, X, Calendar } from "lucide-react";
import html2pdf from "html2pdf.js";

type DateFilter = 'ALL' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

const getTranchesForLevel = (level: string) => {
  if (["Maternelle 1", "Maternelle 2"].includes(level)) {
    return [
      { id: "tranche1", name: "Tranche 1", limit: "Fin Octobre", amount: 35000 },
      { id: "tranche2", name: "Tranche 2", limit: "30 Novembre", amount: 15000 },
      { id: "tranche3", name: "Tranche 3", limit: "30 Décembre", amount: 10000 }
    ];
  }
  if (["CI", "CP", "CE1", "CE2"].includes(level)) {
    return [
      { id: "tranche1", name: "Tranche 1", limit: "Fin Octobre", amount: 30000 },
      { id: "tranche2", name: "Tranche 2", limit: "30 Novembre", amount: 15000 },
      { id: "tranche3", name: "Tranche 3", limit: "30 Décembre", amount: 10000 }
    ];
  }
  if (level === "CM1") {
    return [
      { id: "tranche1", name: "Tranche 1", limit: "Fin Octobre", amount: 35000 },
      { id: "tranche2", name: "Tranche 2", limit: "30 Novembre", amount: 20000 },
      { id: "tranche3", name: "Tranche 3", limit: "30 Décembre", amount: 10000 }
    ];
  }
  if (level === "CM2") {
    return [
      { id: "tranche1", name: "Tranche 1", limit: "Fin Octobre", amount: 45000 },
      { id: "tranche2", name: "Tranche 2", limit: "30 Novembre", amount: 30000 },
      { id: "tranche3", name: "Tranche 3", limit: "30 Décembre", amount: 10000 }
    ];
  }
  if (level === "6ème") {
    return [
      { id: "tranche1", name: "Tranche 1", limit: "31 Octobre", amount: 40000 },
      { id: "tranche2", name: "Tranche 2", limit: "30 Novembre", amount: 20000 },
      { id: "tranche3", name: "Tranche 3", limit: "30 Décembre", amount: 10000 }
    ];
  }
  if (level === "5ème") {
    return [
      { id: "tranche1", name: "Tranche 1", limit: "31 Octobre", amount: 45000 },
      { id: "tranche2", name: "Tranche 2", limit: "30 Novembre", amount: 30000 },
      { id: "tranche3", name: "Tranche 3", limit: "30 Décembre", amount: 10000 }
    ];
  }
  if (level === "4ème") {
    return [
      { id: "tranche1", name: "Tranche 1", limit: "31 Octobre", amount: 50000 },
      { id: "tranche2", name: "Tranche 2", limit: "30 Novembre", amount: 40000 },
      { id: "tranche3", name: "Tranche 3", limit: "30 Décembre", amount: 15000 }
    ];
  }
  if (level === "3ème") {
    return [
      { id: "tranche1", name: "Tranche 1", limit: "31 Octobre", amount: 60000 },
      { id: "tranche2", name: "Tranche 2", limit: "30 Novembre", amount: 45000 },
      { id: "tranche3", name: "Tranche 3", limit: "30 Décembre", amount: 20000 }
    ];
  }
  if (level === "2nde") {
    return [
      { id: "tranche1", name: "Tranche 1", limit: "31 Octobre", amount: 50000 },
      { id: "tranche2", name: "Tranche 2", limit: "30 Novembre", amount: 35000 },
      { id: "tranche3", name: "Tranche 3", limit: "30 Décembre", amount: 20000 }
    ];
  }
  if (level.startsWith("1ère")) {
    return [
      { id: "tranche1", name: "Tranche 1", limit: "31 Octobre", amount: 60000 },
      { id: "tranche2", name: "Tranche 2", limit: "30 Novembre", amount: 45000 },
      { id: "tranche3", name: "Tranche 3", limit: "30 Décembre", amount: 20000 }
    ];
  }
  if (level.startsWith("Terminale")) {
    return [
      { id: "tranche1", name: "Tranche 1", limit: "31 Octobre", amount: 70000 },
      { id: "tranche2", name: "Tranche 2", limit: "30 Novembre", amount: 60000 },
      { id: "tranche3", name: "Tranche 3", limit: "30 Décembre", amount: 20000 }
    ];
  }
  return [];
};

export function ParentPayments() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState<Payment | null>(null);
  
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');

  // Payment Form
  const [selectedChildId, setSelectedChildId] = useState("");
  const [network, setNetwork] = useState<"Moov Bénin" | "MTN Bénin" | "Celtiis Bénin">("MTN Bénin");
  
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
  const [trancheAmounts, setTrancheAmounts] = useState<Record<string, string>>({});
  const [nextPaymentDate, setNextPaymentDate] = useState<string>("");

  useEffect(() => {
    if (user) {
      setChildren(db.getStudents({ parentId: user.id }));
      const pays = db.getPayments({ parentId: user.id });
      // sort by date descending
      pays.sort((a, b) => b.date - a.date);
      setAllPayments(pays);
      setSettings(db.getSchoolSettings());
      
      const kids = db.getStudents({ parentId: user.id });
      if (kids.length > 0) setSelectedChildId(kids[0].id);
    }
  }, [user]);

  useEffect(() => {
    const now = new Date();
    
    const filtered = allPayments.filter(payment => {
      const paymentDate = new Date(payment.date);
      switch(dateFilter) {
        case 'DAY': return paymentDate.toDateString() === now.toDateString();
        case 'WEEK': {
          const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
          const lastDay = new Date(now.setDate(now.getDate() - now.getDay() + 6));
          return paymentDate >= firstDay && paymentDate <= lastDay;
        }
        case 'MONTH': return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
        case 'YEAR': return paymentDate.getFullYear() === now.getFullYear();
        default: return true;
      }
    });

    setFilteredPayments(filtered);
  }, [allPayments, dateFilter]);

  const selectedChild = children.find(c => c.id === selectedChildId);

  const availableFees = useMemo(() => {
    if (!selectedChild) return [];
    const fees = [];
    const level = selectedChild.level || "";
    
    // Frais d'inscription Maternelle à Terminale : 2000 FCFA (pour NOUVEAUX ELÈVES seulement)
    if (selectedChild.studentType === "NEW") {
        fees.push({ id: "inscription", name: "Frais d'inscription", amount: 2000 });
    }
    
    const isPrimary = level.startsWith("Maternelle") || level.startsWith("CI") || level.startsWith("CP") || level.startsWith("CE") || level.startsWith("CM");
    const isMiddleSchool = ["6ème", "5ème", "4ème", "3ème"].includes(level);
    const isHighSchool = ["2nde", "1ère A", "1ère B", "1ère C", "1ère D", "Terminale A", "Terminale B", "Terminale C", "Terminale D"].includes(level);

    let uniformeAmount = 0;
    if (isPrimary) {
       uniformeAmount = selectedChild.gender === "FEMALE" ? 3500 : 5000;
    } else if (isMiddleSchool) {
       uniformeAmount = 5000;
    } else if (isHighSchool) {
       uniformeAmount = 7000;
    }

    if (uniformeAmount > 0) {
        fees.push({ id: "uniforme", name: "Achat Uniforme", amount: uniformeAmount });
    }

    // Tee-shirt sport
    fees.push({ id: "sport", name: "Tee-shirt de sport", amount: 2000 });

    // Frais TD CI, CP, CE1, CE2 : 5000 F / L'année. CM1, CM2 : 10000 F / L'année
    if (["CI", "CP", "CE1", "CE2"].includes(level)) {
        fees.push({ id: "td", name: "Frais de TD", amount: 5000 });
    } else if (["CM1", "CM2"].includes(level)) {
        fees.push({ id: "td", name: "Frais de TD", amount: 10000 });
    }

    // Frais évaluation pour toutes les classes : 3000 F / L'année
    fees.push({ id: "eval", name: "Frais d'évaluation", amount: 3000 });

    // Carte scolaire: Uniquement Maternelle 1 et 2, CM2, 3ème
    if (["Maternelle 1", "Maternelle 2", "CM2", "3ème"].includes(level)) {
        fees.push({ id: "carte", name: "Carte scolaire", amount: 1500 });
    }

    // Examen Blanc et Frais Dossier
    if (level === "CM2") {
        fees.push({ id: "examen", name: "Examen Blanc & Frais de Dossier", amount: 10000 });
    } else if (level === "3ème") {
        fees.push({ id: "examen", name: "Examen Blanc & Frais de Dossier", amount: 15000 });
    } else if (level.startsWith("Terminale")) {
        fees.push({ id: "examen", name: "Examen Blanc & Frais de Dossier", amount: 25000 });
    }

    // Kits scolaires
    if (level.startsWith("Maternelle")) {
        fees.push({ id: "kits", name: "Kit livre", amount: 7500 });
    } else if (["CI", "CP", "CE1", "CE2", "CM1", "CM2"].includes(level)) {
        fees.push({ id: "kits", name: "Kit livre", amount: 15000 });
    } else if (["6ème", "5ème", "4ème", "3ème"].includes(level)) {
        fees.push({ id: "kits", name: "Kit livre", amount: 30000 });
    } else if (isHighSchool) {
        fees.push({ id: "kits", name: "Kit livre", amount: 50000 });
    }

    // Cantine & Garde Surveillée (Basé sur les choix à l'inscription)
    if (selectedChild.canteenOptions && selectedChild.canteenOptions.length > 0) {
        selectedChild.canteenOptions.forEach(opt => {
            let prixJour = 0;
            if (opt.includes("200F")) prixJour = 200;
            else if (opt.includes("500F")) prixJour = 500;
            else if (opt.includes("1000F")) prixJour = 1000;

            if (prixJour > 0) {
                const prefixId = opt.includes("Garde") ? "garde" : "cantine";
                const labelName = opt.includes("Garde") ? "Garde surveillée" : "Cantine";
                
                fees.push({ id: `${prefixId}_semaine_${prixJour}`, name: `${labelName} (Semaine - 5 jours) - ${prixJour}F/j`, amount: prixJour * 5 });
                fees.push({ id: `${prefixId}_mois_${prixJour}`, name: `${labelName} (Mois - 20 jours) - ${prixJour}F/j`, amount: prixJour * 20 });
            }
        });
    }

    return fees;
  }, [selectedChild]);

  useEffect(() => {
    setSelectedFeeIds([]);
    setTrancheAmounts({});
  }, [selectedChildId]);

  const levelTranches = useMemo(() => {
     if (!selectedChild) return [];
     return getTranchesForLevel(selectedChild.level || "");
  }, [selectedChild]);

  const paidAmountsPerFee = useMemo(() => {
    const paid: Record<string, number> = {};
    allPayments
      .filter(p => p.studentId === selectedChildId && p.status === "COMPLETED")
      .forEach(p => {
         p.items?.forEach(item => {
           if (item.id) {
             paid[item.id] = (paid[item.id] || 0) + item.amount;
           }
         });
      });
    return paid;
  }, [allPayments, selectedChildId]);

  const totalAmount = useMemo(() => {
    let t = 0;
    selectedFeeIds.forEach(id => {
      const tranche = levelTranches.find(tr => tr.id === id);
      if (tranche) {
        t += Number(trancheAmounts[tranche.id]) || 0;
      } else {
        const fee = availableFees.find(f => f.id === id);
        if (fee) t += Math.max(0, fee.amount - (paidAmountsPerFee[fee.id] || 0));
      }
    });
    return t;
  }, [selectedFeeIds, availableFees, levelTranches, trancheAmounts, paidAmountsPerFee]);

  const transactionFee = Math.ceil(totalAmount * 0.01);
  const totalAmountWithFee = totalAmount + transactionFee;

  const handleFeeToggle = (id: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedFeeIds(prev => [...prev, id]);
    } else {
      setSelectedFeeIds(prev => prev.filter(f => f !== id));
    }
  };

  const currentPaymentItemsTemplate = useMemo(() => {
    const items: { id?: string; name: string; amount: number; remaining?: number }[] = [];
    selectedFeeIds.forEach(id => {
      const tranche = levelTranches.find(tr => tr.id === id);
      if (tranche) {
         const amountToPay = Number(trancheAmounts[tranche.id]) || 0;
         const oldRemaining = Math.max(0, tranche.amount - (paidAmountsPerFee[tranche.id] || 0));
         items.push({ id, name: `Scolarité - ${tranche.name} (Max ${tranche.limit})`, amount: amountToPay, remaining: Math.max(0, oldRemaining - amountToPay) });
      } else {
        const fee = availableFees.find(f => f.id === id);
        if (fee) {
          const amountToPay = Math.max(0, fee.amount - (paidAmountsPerFee[fee.id] || 0));
          const oldRemaining = Math.max(0, fee.amount - (paidAmountsPerFee[fee.id] || 0));
          items.push({ id, name: fee.name, amount: amountToPay, remaining: Math.max(0, oldRemaining - amountToPay) });
        }
      }
    });
    return items;
  }, [selectedFeeIds, availableFees, levelTranches, trancheAmounts, paidAmountsPerFee]);

  const hasPartialPayment = useMemo(() => {
    return currentPaymentItemsTemplate.some(item => item.remaining && item.remaining > 0);
  }, [currentPaymentItemsTemplate]);

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAmount <= 0) {
      alert("Veuillez sélectionner et chiffrer au moins un frais à payer.");
      return;
    }
    
    if (hasPartialPayment && !nextPaymentDate) {
      alert("Veuillez indiquer la date du prochain règlement pour le reste à payer.");
      return;
    }
    
    setShowConfirmModal(true);
  };

  const confirmPayment = () => {
    if (!user) return;

    const newPayment = db.addPayment({
      studentId: selectedChildId,
      parentId: user.id,
      schoolId: "school_1",
      network,
      amount: totalAmountWithFee,
      items: [
        ...currentPaymentItemsTemplate,
        { name: "Frais de transaction (1%)", amount: transactionFee }
      ],
      ...(hasPartialPayment && nextPaymentDate ? { nextPaymentDate } : {})
    });

    const updatedPays = [newPayment, ...allPayments];
    updatedPays.sort((a,b) => b.date - a.date);
    setAllPayments(updatedPays);
    
    setShowConfirmModal(false);
    setShowPayModal(false);
    setShowReceiptModal(newPayment);

    // Lancer le code USSD sur le téléphone
    const ussdCode = `*880*41*681199*${totalAmountWithFee}#`;
    // On utilise encodeURIComponent pour le # -> %23
    window.location.href = `tel:${ussdCode.replace('#', '%23')}`;
  };

  const handleWhatsAppReceipt = (payment: Payment, customPhone?: string) => {
    const child = children.find(c => c.id === payment.studentId);
    let phone = customPhone;
    if (!phone) {
      const defaultPhone = child?.fatherContact || child?.motherContact || child?.guardianContact || "";
      phone = window.prompt("Sur quel numéro WhatsApp souhaitez-vous recevoir le reçu ?", defaultPhone);
    }
    if (!phone) return;

    const childName = child ? `${child.firstName} ${child.lastName}` : "mon enfant";
    const details = payment.items?.map(i => i.name).join(", ") || "Scolarité";
    
    const msg = `Bonjour EduBénin ! Je viens d'effectuer un paiement de ${payment.amount.toLocaleString()} FCFA pour ${childName} via ${payment.network}. Référence: ${payment.reference}. Détails: ${details}.`;
    
    const formattedPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleDownloadPDF = (payment: Payment) => {
    const element = document.getElementById('receipt-print-area');
    if (element) {
      const opt = {
        margin:       [0.3, 0.3, 0.3, 0.3], // top, left, bottom, right
        filename:     `Recu_${payment.reference}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      // Forcing the height to fit onto a single page by tweaking scale if necessary,
      // but 'avoid-all' prevents unwanted splitting. A4 height is 11.69 inches.
      // We can append CSS specifically for printing or rely on a clean layout.
      html2pdf().set(opt).from(element).save();
    }
  };

  const handleDownloadCSV = () => {
    if (filteredPayments.length === 0) return;

    const headers = ["Date", "Référence", "Élève", "Réseau", "Montant (FCFA)", "Statut"];
    const rows = filteredPayments.map(payment => {
      const childName = children.find(c => c.id === payment.studentId)?.firstName || "Inconnu";
      const date = new Date(payment.date).toLocaleDateString();
      return [
        date,
        payment.reference,
        childName,
        payment.network,
        payment.amount.toString(),
        "Validé"
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `historique_paiements_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-700">Paiements de Scolarité</h1>
          <p className="text-xs text-slate-500 mt-1">Acquittez-vous des frais scolaires via Mobile Money</p>
        </div>
        <button 
          onClick={() => setShowPayModal(true)}
          disabled={children.length === 0}
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          <CreditCard size={16} />
          Nouveau Paiement
        </button>
      </div>

      {showPayModal && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4">
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-gray-700 mb-4">Paiement Mobile Money</h3>
            <form onSubmit={handlePaymentSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Enfant</label>
              <select required value={selectedChildId} onChange={e => setSelectedChildId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                {children.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.level})</option>)}
              </select>
            </div>
            
            {selectedChild && (
              <div className="md:col-span-2 bg-slate-50 p-4 rounded border border-slate-200">
                 <h4 className="text-xs font-bold uppercase text-gray-700 mb-3 tracking-wide">Éléments à Payer</h4>
                 <div className="space-y-3">
                   
                   {/* Options de Scolarité */}
                   <div className="pt-2 pb-3 mb-3 border-b border-slate-200 flex flex-col gap-3">
                     <p className="text-[10px] font-bold text-slate-500 uppercase">Scolarité par tranches</p>
                     
                     {levelTranches.map(tranche => {
                       const paid = paidAmountsPerFee[tranche.id] || 0;
                       const remaining = Math.max(0, tranche.amount - paid);
                       const isPaidOut = remaining <= 0;
                       return (
                       <div key={tranche.id} className={`flex items-center justify-between gap-3 ${isPaidOut ? 'opacity-50' : ''}`}>
                         <label className="flex items-center gap-2 cursor-pointer flex-1">
                           <input 
                             type="checkbox" 
                             disabled={isPaidOut}
                             checked={selectedFeeIds.includes(tranche.id) && !isPaidOut} 
                             onChange={e => handleFeeToggle(tranche.id, e.target.checked)} 
                             className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 disabled:opacity-50" 
                           />
                           <span className="text-sm font-medium text-gray-700">
                             {tranche.name} <span className="text-[10px] text-red-500 ml-1">(Max: {tranche.limit})</span>
                           </span>
                         </label>
                         <div className="flex items-center gap-2">
                           {selectedFeeIds.includes(tranche.id) && !isPaidOut && (
                             <input 
                               type="number" 
                               required 
                               max={remaining}
                               placeholder="Montant" 
                               value={trancheAmounts[tranche.id] || ""} 
                               onChange={e => {
                                 const val = Number(e.target.value);
                                 if (val > remaining) {
                                   setTrancheAmounts(prev => ({ ...prev, [tranche.id]: remaining.toString() }));
                                 } else {
                                   setTrancheAmounts(prev => ({ ...prev, [tranche.id]: e.target.value }));
                                 }
                               }} 
                               className="w-28 px-2 py-1 border border-slate-300 rounded text-sm outline-none text-right" 
                             />
                           )}
                           <span className="text-xs font-bold text-slate-600 min-w-16 whitespace-nowrap text-right">
                             {isPaidOut ? "Payé" : `Reste: ${remaining.toLocaleString()} / ${tranche.amount.toLocaleString()}F`}
                           </span>
                         </div>
                       </div>
                     )})}
                   </div>

                   {/* Autres Frais calculés dynamiquement */}
                   {availableFees.map(fee => {
                     const paid = paidAmountsPerFee[fee.id] || 0;
                     const remaining = Math.max(0, fee.amount - paid);
                     const isPaidOut = remaining <= 0;
                     return (
                     <label key={fee.id} className={`flex items-center justify-between gap-3 ${isPaidOut ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            disabled={isPaidOut}
                            checked={selectedFeeIds.includes(fee.id) && !isPaidOut}
                            onChange={e => handleFeeToggle(fee.id, e.target.checked)}
                            className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 disabled:opacity-50" 
                          />
                          <span className="text-sm font-medium text-gray-700">{fee.name}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-700">
                          {isPaidOut ? "Payé" : (paid > 0 ? `Reste: ${remaining.toLocaleString()}F (Total: ${fee.amount.toLocaleString()}F)` : `${fee.amount.toLocaleString()} F`)}
                        </span>
                     </label>
                   )})}

                 </div>
              </div>
            )}

            <div className="md:col-span-2">
               <div className="flex justify-between items-center bg-emerald-50 px-4 py-3 border border-emerald-100 rounded-lg mb-4">
                 <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Total à payer (dont 1% frais)</span>
                 <span className="font-mono text-xl font-bold text-emerald-600">{totalAmountWithFee.toLocaleString()} FCFA</span>
               </div>
            </div>

            <div>
               <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Réseau Mobile</label>
               <select required value={network} onChange={e => setNetwork(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                 <option value="MTN Bénin">MTN Mobile Money</option>
                 <option value="Moov Bénin">Moov Money</option>
                 <option value="Celtiis Bénin">Celtiis Cash</option>
               </select>
            </div>
            
            {hasPartialPayment && (
               <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Prochain règlement</label>
                  <input type="date" required value={nextPaymentDate} onChange={e => setNextPaymentDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" min={new Date().toISOString().split('T')[0]} />
               </div>
            )}

            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setShowPayModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded uppercase tracking-wider transition-colors">Annuler</button>
              <button type="submit" disabled={totalAmount <= 0} className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-sm uppercase tracking-wider transition-colors disabled:opacity-50">Continuer</button>
            </div>
          </form>
        </div>
        <div className="hidden lg:block relative rounded-xl border border-slate-200 overflow-hidden shadow-sm h-full max-h-[400px]">
          <img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800" alt="Prospectus EduBénin Paiement" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent flex flex-col justify-end p-6 text-white">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">Scolarité</span>
            <h3 className="text-xl font-bold mb-2">Facilitez-vous la vie</h3>
            <p className="text-sm text-slate-300">Réglez les frais de scolarité de vos enfants en toute sécurité depuis votre téléphone via Mobile Money.</p>
          </div>
        </div>
      </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 animate-in zoom-in-95 fade-in">
            <div className="text-center mb-6">
               <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} />
               </div>
               <h3 className="text-xl font-bold text-gray-700">Confirmer le paiement</h3>
               <p className="text-slate-500 text-xs mt-2">Veuillez vérifier les informations de la transaction avant de valider.</p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded border border-slate-100 space-y-3 mb-6">
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500 font-medium font-semibold uppercase text-[10px] tracking-wide">Enfant</span>
                 <span className="font-bold text-gray-700">{children.find(c => c.id === selectedChildId)?.firstName} {children.find(c => c.id === selectedChildId)?.lastName}</span>
               </div>
               <div className="border-t border-slate-200"></div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500 font-medium font-semibold uppercase text-[10px] tracking-wide">Réseau</span>
                 <span className="font-bold text-gray-700">{network}</span>
               </div>
               <div className="border-t border-slate-200"></div>
               <div className="flex justify-between text-sm items-center">
                 <span className="text-slate-500 font-medium font-semibold uppercase text-[10px] tracking-wide">Montant Total</span>
                 <span className="font-mono text-xl font-bold text-emerald-600">{totalAmountWithFee.toLocaleString()} FCFA</span>
               </div>
            </div>
            
            <p className="text-[10px] text-orange-600 font-semibold mb-6 text-center bg-orange-50 p-2 rounded border border-orange-100">
               Attention : Les frais de transaction s'élèvent à 1% du montant total (soit {transactionFee.toLocaleString()} FCFA), inclus dans le total.
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmPayment}
                className="w-full inline-flex justify-center items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded text-sm font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <CreditCard size={18} />
                Payer via USSD (*880#)
              </button>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="w-full px-4 py-3 rounded text-xs font-bold text-slate-600 hover:bg-slate-100 uppercase tracking-wider transition-colors"
              >
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historique des paiements */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-700">Historique des transactions</h3>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownloadCSV}
              disabled={filteredPayments.length === 0}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              <Download size={14} /> Exporter
            </button>
            <div className="flex p-1 bg-slate-100 rounded overflow-x-auto">
               <button onClick={() => setDateFilter('ALL')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${dateFilter === 'ALL' ? 'bg-white shadow-sm text-gray-700' : 'text-slate-500 hover:text-gray-700'}`}>Tous</button>
               <button onClick={() => setDateFilter('DAY')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${dateFilter === 'DAY' ? 'bg-white shadow-sm text-gray-700' : 'text-slate-500 hover:text-gray-700'}`}>Jour</button>
               <button onClick={() => setDateFilter('WEEK')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${dateFilter === 'WEEK' ? 'bg-white shadow-sm text-gray-700' : 'text-slate-500 hover:text-gray-700'}`}>Sem</button>
               <button onClick={() => setDateFilter('MONTH')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${dateFilter === 'MONTH' ? 'bg-white shadow-sm text-gray-700' : 'text-slate-500 hover:text-gray-700'}`}>Mois</button>
               <button onClick={() => setDateFilter('YEAR')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${dateFilter === 'YEAR' ? 'bg-white shadow-sm text-gray-700' : 'text-slate-500 hover:text-gray-700'}`}>An</button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold sticky top-0">
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Réf</th>
                <th className="px-4 py-3">Élève</th>
                <th className="px-4 py-3">Moyen</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3 text-right">Statut</th>
                <th className="px-4 py-3 text-right">Reçu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-xs">
                    Aucun paiement trouvé pour cette période.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(payment => {
                  let networkDotColor = "bg-yellow-400";
                  if (payment.network === "Moov Bénin") networkDotColor = "bg-emerald-500";
                  if (payment.network === "Celtiis Bénin") networkDotColor = "bg-red-500";

                  const childName = children.find(c => c.id === payment.studentId)?.firstName || "Inconnu";

                  return (
                    <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs">
                        {new Date(payment.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[10px] uppercase">{payment.reference}</td>
                      <td className="px-4 py-3 font-semibold text-gray-700 text-xs">{childName}</td>
                      <td className="px-4 py-3">
                         <span className="flex items-center gap-2 text-xs">
                           <span className={`w-2 h-2 rounded-full ${networkDotColor}`}></span>
                           {payment.network.replace(' Bénin', '')}
                         </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-xs">{payment.amount.toLocaleString()} F</td>
                      <td className="px-4 py-3 text-right">
                         <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                           Validé
                         </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => setShowReceiptModal(payment)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors inline-block"
                        >
                          <FileText size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showReceiptModal && settings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 fade-in overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 shrink-0">
               <div className="flex items-center gap-3">
                 <button onClick={() => handleDownloadPDF(showReceiptModal)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-slate-700 transition-colors">
                   <Download size={14} /> Imprimer / Télécharger
                 </button>
                 <div className="flex items-center gap-2 bg-white rounded border border-slate-200 p-0.5">
                   <input
                      type="text"
                      id="whatsapp-phone-input"
                      placeholder="Numéro WhatsApp..."
                      className="px-2 py-1 text-xs outline-none w-32 text-gray-700"
                      defaultValue={children.find(c => c.id === showReceiptModal.studentId)?.fatherContact || children.find(c => c.id === showReceiptModal.studentId)?.motherContact || children.find(c => c.id === showReceiptModal.studentId)?.guardianContact || ""}
                   />
                   <button onClick={() => {
                     const phoneInput = document.getElementById('whatsapp-phone-input') as HTMLInputElement;
                     handleWhatsAppReceipt(showReceiptModal, phoneInput?.value);
                   }} className="flex items-center gap-2 px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider rounded hover:bg-emerald-700 transition-colors">
                     <MessageCircle size={14} /> Envoyer
                   </button>
                 </div>
               </div>
               <button onClick={() => setShowReceiptModal(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200 transition-colors">
                  <X size={20} />
               </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-white text-[13px]" id="receipt-print-area">
               {/* En-tête */}
               <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-slate-800 pb-4 mb-4">
                 <div className="flex items-center gap-3">
                   {settings.logo && (
                     <img src={settings.logo} alt="Logo" className="w-16 h-16 object-contain rounded" />
                   )}
                   <div>
                     <h2 className="text-lg font-bold text-gray-700 uppercase tracking-wide">{settings.name}</h2>
                     <p className="text-[11px] text-slate-600 mt-0.5">{settings.address}</p>
                     <p className="text-[11px] text-slate-600">{settings.contact}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <h1 className="text-xl font-black text-gray-700 uppercase tracking-widest mb-1">Reçu</h1>
                   <p className="text-xs font-bold text-gray-700 uppercase">N° {showReceiptModal.reference}</p>
                   <p className="text-[10px] text-slate-500">Date: {new Date(showReceiptModal.date).toLocaleDateString()}</p>
                 </div>
               </div>

               {/* Infos Elève */}
               {(() => {
                 const currentChild = children.find(c => c.id === showReceiptModal.studentId);
                 return currentChild ? (
                   <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg mb-4 flex flex-wrap gap-x-8 gap-y-2">
                     <div>
                       <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Élève</span>
                       <span className="font-bold text-xs text-gray-700">{currentChild.lastName} {currentChild.firstName}</span>
                     </div>
                     <div>
                       <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Classe</span>
                       <span className="font-bold text-xs text-gray-700">{currentChild.level}</span>
                     </div>
                   </div>
                 ) : null;
               })()}

               {/* Détails du paiement */}
               <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Détails du règlement</h4>
               <div className="overflow-x-auto"><table className="w-full border-collapse mb-4">
                 <thead>
                   <tr className="bg-slate-800 text-white text-[9px] uppercase tracking-wider">
                     <th className="p-2 text-left border border-slate-700">Désignation</th>
                     <th className="p-2 text-right border border-slate-700 w-28">Montant</th>
                   </tr>
                 </thead>
                 <tbody>
                   {showReceiptModal.items?.map((item, idx) => {
                     const isPartial = item.remaining !== undefined && item.remaining > 0;
                     return (
                       <tr key={idx} className="text-xs border-b border-slate-200">
                         <td className="p-2 font-medium text-gray-700">
                           {item.name}
                           {isPartial && (
                              <span className="block text-[9px] text-red-500 font-bold uppercase mt-0.5">
                                Reste à payer: {item.remaining?.toLocaleString()} F
                              </span>
                           )}
                         </td>
                         <td className="p-2 font-mono text-right align-top">{item.amount.toLocaleString()} F</td>
                       </tr>
                     );
                   }) || (
                     <tr className="text-xs border-b border-slate-200">
                       <td className="p-2 font-medium text-gray-700">Scolarité</td>
                       <td className="p-2 font-mono text-right">{showReceiptModal.amount.toLocaleString()} F</td>
                     </tr>
                   )}
                   <tr className="bg-slate-50 font-bold text-sm">
                     <td className="p-2 text-right uppercase text-[10px] tracking-wider">Total Réglé</td>
                     <td className="p-2 text-right font-mono text-gray-700 border-t-2 border-slate-800">
                       {showReceiptModal.amount.toLocaleString()} FCFA
                     </td>
                   </tr>
                 </tbody>
               </table></div>

               <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 mt-4">Situation globale (Restants à payer)</h4>
               <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
                 {(() => {
                   let hasRemaining = false;
                   const remainings = [...levelTranches, ...availableFees].map(fee => {
                     const paid = paidAmountsPerFee[fee.id] || 0;
                     const remaining = Math.max(0, fee.amount - paid);
                     if (remaining > 0) hasRemaining = true;
                     return { name: fee.name, amount: fee.amount, remaining };
                   }).filter(f => f.remaining > 0);

                   if (!hasRemaining) {
                     return <p className="text-xs text-emerald-600 font-bold">L'élève est à jour de tous ses paiements.</p>;
                   }

                   return (
                     <div className="overflow-x-auto">
                     <table className="w-full text-xs">
                       <tbody>
                         {remainings.map((req, idx) => (
                           <tr key={idx} className="border-b border-slate-100 last:border-0">
                             <td className="py-1 text-gray-700">{req.name}</td>
                             <td className="py-1 text-right font-mono text-red-600 font-bold">{req.remaining.toLocaleString()} F</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                     </div>
                   );
                 })()}
               </div>
               
               {showReceiptModal.nextPaymentDate && (
                 <div className="mb-4 p-3 rounded border border-orange-200 bg-orange-50/50 flex items-center justify-center gap-2">
                    <Calendar size={14} className="text-orange-500" />
                    <p className="text-xs text-gray-700 font-medium">Date du prochain règlement: <span className="font-bold text-orange-600 ml-1">{new Date(showReceiptModal.nextPaymentDate).toLocaleDateString()}</span></p>
                 </div>
               )}
               
               <div className="mt-2 pt-4 border-t border-slate-200 flex justify-between items-center text-xs">
                 <div className="text-slate-500">
                   Moyen de paiement : <span className="font-bold text-gray-700">{showReceiptModal.network}</span>
                 </div>
                 <div className="text-right">
                   <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-gray-700 rounded-full font-bold uppercase tracking-widest text-[9px]">
                     <CheckCircle2 size={10} /> Réglé
                   </span>
                 </div>
               </div>

               <div className="mt-8 text-center text-[11px] text-slate-500 font-medium italic border-t border-dashed border-slate-300 pt-4">
                 Toute année commencée est due en totalité. Aucun remboursement ou permutation n'est possible.
               </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
