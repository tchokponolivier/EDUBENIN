import React, { useState, useEffect, useMemo } from "react";
import { db } from "../lib/db";
import { Payment, Student } from "../types";
import { useAuth } from "../lib/auth";
import { CreditCard, History, Search, MessageCircle, Printer, Plus, Trash2, CheckSquare, Square } from "lucide-react";

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

export function SchoolAdminPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [showPayModal, setShowPayModal] = useState(false);
  const [whatsappPromptInfo, setWhatsappPromptInfo] = useState<{payment: Payment, student: Student} | null>(null);
  const [whatsappInputPhone, setWhatsappInputPhone] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  
  // New Payment Fields
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
  const [trancheAmounts, setTrancheAmounts] = useState<Record<string, string>>({});
  const [customItems, setCustomItems] = useState<{name: string; amount: string}[]>([{name: "", amount: ""}]);
  const [paymentMethod, setPaymentMethod] = useState<"ESPÈCES" | "MTN Bénin" | "Moov Bénin" | "Celtiis Bénin">("ESPÈCES");

  useEffect(() => {
    setPayments(db.getPayments());
    setStudents(db.getStudents());
  }, []);

  const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);

  const availableFees = useMemo(() => {
    if (!selectedStudent) return [];
    const fees = [];
    const level = selectedStudent.level || "";
    
    if (selectedStudent.studentType === "NEW") {
        fees.push({ id: "inscription", name: "Frais d'inscription", amount: 2000 });
    }
    
    const isPrimary = level.startsWith("Maternelle") || level.startsWith("CI") || level.startsWith("CP") || level.startsWith("CE") || level.startsWith("CM");
    const isMiddleSchool = ["6ème", "5ème", "4ème", "3ème"].includes(level);
    const isHighSchool = ["2nde", "1ère A", "1ère B", "1ère C", "1ère D", "Terminale A", "Terminale B", "Terminale C", "Terminale D"].includes(level);

    let uniformeAmount = 0;
    if (isPrimary) uniformeAmount = selectedStudent.gender === "FEMALE" ? 3500 : 5000;
    else if (isMiddleSchool) uniformeAmount = 5000;
    else if (isHighSchool) uniformeAmount = 7000;

    if (uniformeAmount > 0) fees.push({ id: "uniforme", name: "Achat Uniforme", amount: uniformeAmount });

    fees.push({ id: "sport", name: "Tee-shirt de sport", amount: 2000 });

    if (["CI", "CP", "CE1", "CE2"].includes(level)) fees.push({ id: "td", name: "Frais de TD", amount: 5000 });
    else if (["CM1", "CM2"].includes(level)) fees.push({ id: "td", name: "Frais de TD", amount: 10000 });

    fees.push({ id: "eval", name: "Frais d'évaluation", amount: 3000 });

    if (["Maternelle 1", "Maternelle 2", "CM2", "3ème"].includes(level)) {
        fees.push({ id: "carte", name: "Carte scolaire", amount: 1500 });
    }

    if (level === "CM2") fees.push({ id: "examen", name: "Examen Blanc & Frais de Dossier", amount: 10000 });
    else if (level === "3ème") fees.push({ id: "examen", name: "Examen Blanc & Frais de Dossier", amount: 15000 });
    else if (level.startsWith("Terminale")) fees.push({ id: "examen", name: "Examen Blanc & Frais de Dossier", amount: 25000 });

    if (level.startsWith("Maternelle")) fees.push({ id: "kits", name: "Kit livre", amount: 7500 });
    else if (["CI", "CP", "CE1", "CE2", "CM1", "CM2"].includes(level)) fees.push({ id: "kits", name: "Kit livre", amount: 15000 });
    else if (["6ème", "5ème", "4ème", "3ème"].includes(level)) fees.push({ id: "kits", name: "Kit livre", amount: 30000 });
    else if (isHighSchool) fees.push({ id: "kits", name: "Kit livre", amount: 50000 });

    if (selectedStudent.canteenOptions && selectedStudent.canteenOptions.length > 0) {
        selectedStudent.canteenOptions.forEach(opt => {
            let prixJour = 0;
            if (opt.includes("200F")) prixJour = 200;
            else if (opt.includes("500F")) prixJour = 500;
            else if (opt.includes("1000F")) prixJour = 1000;

            if (prixJour > 0) {
                const prefixId = opt.includes("Garde") ? "garde" : "cantine";
                const labelName = opt.includes("Garde") ? "Garde surveillée" : "Cantine";
                fees.push({ id: `${prefixId}_semaine_${prixJour}`, name: `${labelName} (Semaine - 5 jrs)`, amount: prixJour * 5 });
                fees.push({ id: `${prefixId}_mois_${prixJour}`, name: `${labelName} (Mois - 20 jrs)`, amount: prixJour * 20 });
            }
        });
    }

    return fees;
  }, [selectedStudent]);

  const levelTranches = useMemo(() => {
     if (!selectedStudent) return [];
     return getTranchesForLevel(selectedStudent.level || "");
  }, [selectedStudent]);

  const paidAmountsPerFee = useMemo(() => {
    const paid: Record<string, number> = {};
    payments
      .filter(p => p.studentId === selectedStudentId && p.status === "COMPLETED")
      .forEach(p => {
         p.items?.forEach(item => {
           if (item.id) paid[item.id] = (paid[item.id] || 0) + item.amount;
         });
      });
    return paid;
  }, [payments, selectedStudentId]);

  const currentPaymentItemsTemplate = useMemo(() => {
    const items: { id?: string; name: string; amount: number }[] = [];
    selectedFeeIds.forEach(id => {
      const tranche = levelTranches.find(tr => tr.id === id);
      if (tranche) {
         const amountToPay = Number(trancheAmounts[tranche.id]) || 0;
         if (amountToPay > 0) items.push({ id, name: `Scolarité - ${tranche.name}`, amount: amountToPay });
      } else {
        const fee = availableFees.find(f => f.id === id);
        if (fee) {
          const amountToPay = Math.max(0, fee.amount - (paidAmountsPerFee[fee.id] || 0));
          if (amountToPay > 0) items.push({ id, name: fee.name, amount: amountToPay });
        }
      }
    });

    customItems.forEach(ci => {
       if (ci.name && ci.amount && Number(ci.amount) > 0) {
          items.push({ name: ci.name, amount: Number(ci.amount) });
       }
    });

    return items;
  }, [selectedFeeIds, availableFees, levelTranches, trancheAmounts, paidAmountsPerFee, customItems]);

  const totalAmount = useMemo(() => currentPaymentItemsTemplate.reduce((acc, curr) => acc + curr.amount, 0), [currentPaymentItemsTemplate]);

  const isMomo = paymentMethod !== "ESPÈCES";
  const transactionFee = isMomo ? Math.ceil(totalAmount * 0.01) : 0;
  const totalAmountWithFee = totalAmount + transactionFee;

  const handleManualPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || totalAmount <= 0) return;

    const newPayment = db.addPayment({
      studentId: selectedStudent.id,
      parentId: selectedStudent.parentId,
      schoolId: selectedStudent.schoolId,
      network: paymentMethod === "ESPÈCES" ? "Caisse Administration" : paymentMethod, 
      amount: totalAmountWithFee,
      items: [
        ...currentPaymentItemsTemplate,
        ...(isMomo ? [{ name: "Frais de transaction (1%)", amount: transactionFee }] : [])
      ]
    });

    setPayments(prev => [newPayment, ...prev]);
    setShowPayModal(false);
    setSelectedStudentId("");
    setSelectedFeeIds([]);
    setTrancheAmounts({});
    setCustomItems([{name: "", amount: ""}]);
    setPaymentMethod("ESPÈCES");
    
    if (isMomo) {
      if (window.confirm("Paiement initié avec succès. Voulez-vous lancer le code USSD sur cet appareil pour valider la transaction ?")) {
          const ussdCode = `*880*41*681199*${totalAmountWithFee}#`;
          window.location.href = `tel:${ussdCode.replace('#', '%23')}`;
      }
    }
    
    // Automatically propose sending WhatsApp receipt
    sendWhatsAppReceipt(newPayment, selectedStudent);
  };

  const handleFeeToggle = (id: string, isChecked: boolean) => {
    if (isChecked) setSelectedFeeIds(prev => [...prev, id]);
    else setSelectedFeeIds(prev => prev.filter(f => f !== id));
  };

  const addCustomItem = () => setCustomItems([...customItems, {name: "", amount: ""}]);
  const removeCustomItem = (idx: number) => setCustomItems(customItems.filter((_, i) => i !== idx));

  const executeWhatsAppReceipt = (phone: string, payment: Payment, student: Student) => {
    const formattedPhone = phone.replace(/\D/g, '');
    const settings = db.getSettings();
    const dateStr = new Date(payment.date).toLocaleDateString();
    
    // items text
    const itemsText = payment.items?.map(i => `- ${i.name} : ${i.amount.toLocaleString()} FCFA`).join('%0A') || `- Scolarité : ${payment.amount.toLocaleString()} FCFA`;
    
    const text = `*${settings?.name || "L'ÉCOLE"} - REÇU DE PAIEMENT*\n\nN° Réf: ${payment.reference}\nDate: ${dateStr}\n\n*ÉLÈVE:* ${student.firstName} ${student.lastName}\n*CLASSE:* ${student.level}\n\n*DÉTAILS DU RÈGLEMENT:*\n${itemsText}\n\n*TOTAL:* ${payment.amount.toLocaleString()} FCFA\n\nMerci de votre confiance.`;
    
    window.open(`https://wa.me/${formattedPhone}?text=${text.replace(/\n/g, '%0A')}`, '_blank');
  };

  const sendWhatsAppReceipt = (payment: Payment, student: Student) => {
    let defaultPhone = student.fatherContact || student.motherContact || student.guardianContact || "";
    setWhatsappInputPhone(defaultPhone);
    setWhatsappPromptInfo({ payment, student });
  };

  const printReceipt = (payment: Payment, student: Student) => {
    const settings = db.getSettings();
    const dateStr = new Date(payment.date).toLocaleDateString();
    
    const w = window.open('', '_blank');
    if (!w) return;
    
    w.document.write(`
      <html><head><title>Reçu ${payment.reference}</title><style>
        body { font-family: sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: auto;}
        h1 { font-size: 24px; text-transform: uppercase; margin-bottom: 5px;}
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1e293b; padding-bottom: 20px; margin-bottom: 30px;}
        table { width: 100%; border-collapse: collapse; margin-top: 20px;}
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #cbd5e1;}
        th { background: #1e293b; color: white; text-transform: uppercase; font-size: 12px;}
        td.amount { text-align: right; font-family: monospace; font-size: 14px;}
        th.amount { text-align: right;}
        .total-row { background: #f8fafc; font-weight: bold; font-size: 16px;}
      </style></head><body>
        <div class="header">
          <div>
            <h1>${settings?.name || "L'École"}</h1>
            <p style="margin:0;color:#64748b;">${settings?.address || ""}</p>
            <p style="margin:0;color:#64748b;">${settings?.contact || ""}</p>
          </div>
          <div style="text-align:right;">
            <h1 style="letter-spacing:2px; font-size: 28px;">REÇU</h1>
            <p style="margin:0; font-weight:bold;">N° ${payment.reference}</p>
            <p style="margin:0; color:#64748b; font-size:14px;">Date: ${dateStr}</p>
          </div>
        </div>
        
        <div style="background:#f8fafc; padding:20px; border-radius:8px; display:flex; gap: 40px; margin-bottom:30px; border: 1px solid #e2e8f0;">
          <div>
            <div style="font-size:10px; font-weight:bold; color:#64748b; text-transform:uppercase; margin-bottom:5px;">Élève</div>
            <div style="font-weight:bold;">${student.lastName} ${student.firstName}</div>
          </div>
          <div>
            <div style="font-size:10px; font-weight:bold; color:#64748b; text-transform:uppercase; margin-bottom:5px;">Classe</div>
            <div style="font-weight:bold;">${student.level}</div>
          </div>
        </div>

        <h3 style="font-size:12px; text-transform:uppercase; color:#64748b;">Détails du règlement</h3>
        <table>
          <thead>
            <tr>
              <th>Désignation</th>
              <th class="amount">Montant</th>
            </tr>
          </thead>
          <tbody>
            ${payment.items ? payment.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="amount">${item.amount.toLocaleString()} FCFA</td>
              </tr>
            `).join('') : `
              <tr>
                <td>Scolarité</td>
                <td class="amount">${payment.amount.toLocaleString()} FCFA</td>
              </tr>
            `}
            <tr class="total-row">
              <td style="text-align:right; font-size: 12px; text-transform:uppercase;">Total Réglé</td>
              <td class="amount" style="color: #047857;">${payment.amount.toLocaleString()} FCFA</td>
            </tr>
          </tbody>
        </table>
        
        <div style="margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 20px; text-align: center; color: #64748b; font-size: 11px; font-style: italic; font-weight: 500;">
          Toute année commencée est due en totalité. Aucun remboursement ou permutation n'est possible.
        </div>

        <div style="margin-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
          Document généré électroniquement via EduBénin.
        </div>
        <script>window.print(); setTimeout(() => window.close(), 500);</script>
      </body></html>
    `);
    w.document.close();
  };

  const filteredPayments = payments.filter(p => {
    const student = students.find(s => s.id === p.studentId);
    if (!student) return false;
    const nameStr = `${student.firstName} ${student.lastName}`.toLowerCase();
    return nameStr.includes(searchTerm.toLowerCase()) || p.reference.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-700">Gestion des Paiements</h1>
          <p className="text-xs text-slate-500 mt-1">Supervisez et enregistrez les paiements depuis la caisse</p>
        </div>
        <button
          onClick={() => setShowPayModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded font-bold uppercase tracking-wider text-xs hover:bg-emerald-700 transition"
        >
          <CreditCard size={16} /> Encaisser
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
         <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
           <h3 className="font-bold text-gray-700 flex items-center gap-2"><History size={18}/> Historique Global</h3>
           <div className="relative">
             <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
             <input 
               type="text" 
               placeholder="Rechercher (réf ou élève)..." 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none w-64"
             />
           </div>
         </div>
         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
             <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold">
               <tr className="border-b border-slate-100">
                 <th className="px-4 py-3">Date</th>
                 <th className="px-4 py-3">Référence</th>
                 <th className="px-4 py-3">Élève</th>
                 <th className="px-4 py-3 text-right">Montant</th>
                 <th className="px-4 py-3 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {filteredPayments.map(payment => {
                 const student = students.find(s => s.id === payment.studentId);
                 const studentName = student ? `${student.firstName} ${student.lastName}` : "Inconnu";
                 return (
                   <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                     <td className="px-4 py-3 text-xs">{new Date(payment.date).toLocaleDateString()}</td>
                     <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{payment.reference}</td>
                     <td className="px-4 py-3 text-xs font-semibold">{studentName}</td>
                     <td className="px-4 py-3 font-mono text-xs font-bold text-right">{payment.amount.toLocaleString()} F</td>
                     <td className="px-4 py-3 text-right">
                       {student && (
                         <div className="flex items-center justify-end gap-2">
                            <button onClick={() => printReceipt(payment, student)} className="p-1.5 text-slate-500 hover:text-gray-700 hover:bg-slate-200 rounded transition-colors" title="Imprimer le reçu">
                               <Printer size={16} />
                            </button>
                            <button onClick={() => sendWhatsAppReceipt(payment, student)} className="p-1.5 text-emerald-600 hover:text-gray-700 hover:bg-emerald-100 rounded transition-colors" title="Envoyer par WhatsApp">
                               <MessageCircle size={16} />
                            </button>
                         </div>
                       )}
                     </td>
                   </tr>
                 );
               })}
             </tbody>
           </table>
         </div>
      </div>

      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-100">
               <h3 className="font-bold text-lg text-gray-700">Encaisser un paiement</h3>
            </div>
            <form onSubmit={handleManualPayment} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
               <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Élève</label>
                  <select required value={selectedStudentId} onChange={e => {
                     setSelectedStudentId(e.target.value);
                     setSelectedFeeIds([]);
                     setTrancheAmounts({});
                     setCustomItems([{name: "", amount: ""}]);
                  }} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                     <option value="">Sélectionner un élève...</option>
                     {students.map(s => <option key={s.id} value={s.id}>{s.lastName} {s.firstName} ({s.level})</option>)}
                  </select>
               </div>
               
               {selectedStudent && (
                 <>
                   <div className="space-y-2">
                     <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Moyen de paiement</h4>
                     <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                        <option value="ESPÈCES">Espèces (Caisse)</option>
                        <option value="MTN Bénin">MTN Money</option>
                        <option value="Moov Bénin">Moov Money</option>
                        <option value="Celtiis Bénin">Celtiis Pay</option>
                     </select>
                   </div>

                   <div className="space-y-2 pt-2">
                     <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Frais Applicables</h4>
                     {availableFees.filter(f => (f.amount - (paidAmountsPerFee[f.id] || 0)) > 0).map(fee => {
                       const amountLeft = fee.amount - (paidAmountsPerFee[fee.id] || 0);
                       const isSelected = selectedFeeIds.includes(fee.id);
                       return (
                         <div key={fee.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${isSelected ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-slate-300'}`} onClick={() => handleFeeToggle(fee.id, !isSelected)}>
                           <div className={`w-5 h-5 flex items-center justify-center rounded ${isSelected ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300 text-transparent'}`}>
                              <CheckSquare size={14} className={isSelected ? 'text-white' : 'text-transparent hidden'} />
                           </div>
                           <div className="flex-1">
                             <div className="text-sm font-semibold text-gray-700">{fee.name}</div>
                           </div>
                           <div className="text-right">
                             <div className="font-bold font-mono text-gray-700">{amountLeft.toLocaleString()} F</div>
                             {paidAmountsPerFee[fee.id] > 0 && <div className="text-[10px] text-slate-500">Reste à payer</div>}
                           </div>
                         </div>
                       );
                     })}
                     
                     {levelTranches.map(tranche => {
                       const amountLeft = Math.max(0, tranche.amount - (paidAmountsPerFee[tranche.id] || 0));
                       if (amountLeft <= 0) return null;
                       const isSelected = selectedFeeIds.includes(tranche.id);
                       const maxPay = amountLeft;
                       
                       return (
                         <div key={tranche.id} className={`flex flex-col gap-2 p-3 rounded-lg border transition-colors ${isSelected ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'} `}>
                           <div className="flex items-center gap-3 cursor-pointer" onClick={() => {
                               handleFeeToggle(tranche.id, !isSelected);
                               if (!isSelected) {
                                  setTrancheAmounts(prev => ({...prev, [tranche.id]: maxPay.toString()}));
                               }
                           }}>
                             <div className={`w-5 h-5 flex items-center justify-center rounded ${isSelected ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300 text-transparent'}`}>
                                <CheckSquare size={14} className={isSelected ? 'text-white' : 'text-transparent hidden'} />
                             </div>
                             <div className="flex-1">
                               <div className="text-sm font-semibold text-gray-700">Scolarité - {tranche.name}</div>
                               <div className="text-xs text-slate-500">À solder avant {tranche.limit}</div>
                             </div>
                             <div className="text-right">
                               <div className="font-bold font-mono text-gray-700">Max: {maxPay.toLocaleString()} F</div>
                               <div className="text-[10px] uppercase text-emerald-600 font-bold">Personnalisable</div>
                             </div>
                           </div>
                           {isSelected && (
                             <div className="pl-8 pt-2">
                               <label className="block text-xs font-semibold text-gray-700 mb-1">Montant à régler (FCFA)</label>
                               <input type="number" min="1" max={maxPay} required value={trancheAmounts[tranche.id] || ""} onChange={e => {
                                 let val = e.target.value;
                                 if (Number(val) > maxPay) val = maxPay.toString();
                                 setTrancheAmounts(prev => ({...prev, [tranche.id]: val}));
                               }} className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm outline-none bg-white font-mono" />
                             </div>
                           )}
                         </div>
                       );
                     })}
                   </div>

                   <div className="pt-4 border-t border-slate-100">
                     <div className="flex items-center justify-between mb-2">
                       <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Frais Personnalisés</h4>
                       <button type="button" onClick={addCustomItem} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 hover:text-gray-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition-colors">
                         <Plus size={12} /> Ajouter
                       </button>
                     </div>
                     <div className="space-y-3">
                       {customItems.map((item, idx) => (
                         <div key={idx} className="flex gap-2 items-start">
                           <div className="flex-1 space-y-2">
                             <input type="text" value={item.name} onChange={e => {
                               const newItems = [...customItems];
                               newItems[idx].name = e.target.value;
                               setCustomItems(newItems);
                             }} placeholder="Désignation (ex: Inscription Annexe)" className="w-full px-3 py-2 border border-slate-300 rounded text-sm outline-none" />
                           </div>
                           <div className="w-32 space-y-2">
                             <input type="number" min="1" value={item.amount} onChange={e => {
                               const newItems = [...customItems];
                               newItems[idx].amount = e.target.value;
                               setCustomItems(newItems);
                             }} placeholder="Montant" className="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono outline-none" />
                           </div>
                           <button type="button" onClick={() => removeCustomItem(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded mt-0.5">
                             <Trash2 size={16} />
                           </button>
                         </div>
                       ))}
                       {customItems.length === 0 && (
                         <div className="text-xs text-slate-500 italic text-center py-2">Aucun frais personnalisé.</div>
                       )}
                     </div>
                   </div>
                   
                   <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-between">
                     <span className="text-sm font-bold text-gray-700 uppercase">Total à Encaisser {isMomo && '(+ 1% Frais)'}</span>
                     <span className="text-lg font-black font-mono text-gray-700">{totalAmountWithFee.toLocaleString()} F</span>
                   </div>
                   
                   <div className="text-[10px] text-gray-700 font-medium text-center italic">
                      {isMomo ? "Les frais de transaction de 1% sont appliqués aux paiements par Mobile Money." : "Les paiements en espèces (Caisse Administration) n'incluent pas les 1% de frais d'opérateur."}
                   </div>
                 </>
               )}
               
               <div className="flex justify-end gap-3 mt-6">
                 <button type="button" onClick={() => setShowPayModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded uppercase tracking-wider transition-colors">Annuler</button>
                 <button type="submit" disabled={!selectedStudent || totalAmount <= 0} className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded shadow-sm uppercase tracking-wider transition-colors">Valider</button>
               </div>
            </form>
          </div>
        </div>
      )}
      {whatsappPromptInfo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-in zoom-in-95 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
               <h3 className="font-bold text-gray-700 flex items-center gap-2"><MessageCircle size={18} className="text-emerald-500"/> Envoi par WhatsApp</h3>
               <button onClick={() => setWhatsappPromptInfo(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
               </button>
            </div>
            <div className="p-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Numéro WhatsApp</label>
              <input 
                type="text" 
                value={whatsappInputPhone}
                onChange={e => setWhatsappInputPhone(e.target.value)}
                placeholder="Ex: +229..."
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
              />
              <p className="text-xs text-slate-500 mt-2">Saisissez le numéro sur lequel vous souhaitez envoyer le reçu de paiement.</p>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setWhatsappPromptInfo(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded transition-colors text-sm font-medium"
              >
                Annuler
              </button>
              <button 
                onClick={() => {
                  if (whatsappInputPhone) {
                    executeWhatsAppReceipt(whatsappInputPhone, whatsappPromptInfo.payment, whatsappPromptInfo.student);
                    setWhatsappPromptInfo(null);
                  }
                }}
                disabled={!whatsappInputPhone}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded transition-colors text-sm font-bold flex items-center gap-2"
              >
                <MessageCircle size={16} />
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
