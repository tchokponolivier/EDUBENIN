import React, { useState, useEffect, useMemo } from "react";
import { Payment, Student } from "../types";
import { useAuth } from "../lib/auth";
import { useLocation } from "react-router-dom";
import { CreditCard, History, Search, MessageCircle, Printer, Plus, Trash2, CheckSquare, Square, X, Wallet, TrendingUp, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { CashierExpenses } from "../components/CashierExpenses";
import { CashierDashboard } from "../components/CashierDashboard";
import { CashierEnrollment } from "../components/CashierEnrollment";
import { CashierSalaries } from "../components/CashierSalaries";
import { CashierVerification } from "../components/CashierVerification";

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
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"INSCRIPTIONS" | "PAYMENTS" | "EXPENSES" | "SALARIES" | "DASHBOARD" | "VERIFICATION">(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === "PAYMENTS" || tab === "EXPENSES" || tab === "SALARIES" || tab === "DASHBOARD") return tab;
    return "PAYMENTS";
  });

  // Sync state if URL changes
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === "PAYMENTS" || tab === "EXPENSES" || tab === "SALARIES" || tab === "DASHBOARD") setActiveTab(tab);
  }, [location.search]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  
  // Modal states
  const [showPayModal, setShowPayModal] = useState(false);
  const [payFilterYear, setPayFilterYear] = useState("");
  const [payFilterLevel, setPayFilterLevel] = useState("");
  const [whatsappPromptInfo, setWhatsappPromptInfo] = useState<{payment: Payment, student: Student} | null>(null);
  const [whatsappInputPhone, setWhatsappInputPhone] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  
  // New Payment Fields
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
  const [trancheAmounts, setTrancheAmounts] = useState<Record<string, string>>({});
  const [customItems, setCustomItems] = useState<{name: string; amount: string}[]>([{name: "", amount: ""}]);
  const [paymentMethod, setPaymentMethod] = useState<"ESPÈCES" | "MTN Bénin" | "Moov Bénin" | "Celtiis Bénin">("ESPÈCES");
  const [nextPaymentDate, setNextPaymentDate] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);


  const fetchData = async () => {
    if (!user?.schoolId) return;
    
    try {
      const [studentsRes, paymentsRes] = await Promise.all([
        supabase.from('students').select('*').eq('school_id', user.schoolId),
        supabase.from('payments').select('*').eq('school_id', user.schoolId)
      ]);
      
      if (studentsRes.data) {
        setStudents(studentsRes.data.map(d => ({...d, createdAt: d.created_at, firstName: d.first_name, lastName: d.last_name, parentId: d.parent_id, schoolId: d.school_id, studentType: d.studentType, educmasterNumber: d.educmasterNumber, gender: d.gender})) as any);
      }
      if (paymentsRes.data) {
        setPayments(paymentsRes.data.map(d => ({
          ...d, 
          studentId: d.student_id, 
          schoolId: d.school_id, 
          parentId: d.parent_id, 
          createdAt: d.created_at,
          date: d.payment_date ? new Date(d.payment_date).getTime() : new Date(d.created_at).getTime(),
          items: d.items || []
        })) as any);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data from supabase", err);
    }
  };

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
    const items: { id?: string; name: string; amount: number, remaining?: number }[] = [];
    selectedFeeIds.forEach(id => {
      const tranche = levelTranches.find(tr => tr.id === id);
      if (tranche) {
         const amountToPay = Number(trancheAmounts[tranche.id]) || 0;
         if (amountToPay > 0) {
            const trancheRemaining = Math.max(0, tranche.amount - (paidAmountsPerFee[tranche.id] || 0)) - amountToPay;
            items.push({ id, name: `Scolarité - ${tranche.name}`, amount: amountToPay, remaining: trancheRemaining });
         }
      } else {
        const fee = availableFees.find(f => f.id === id);
        if (fee) {
          const amountToPay = Math.max(0, fee.amount - (paidAmountsPerFee[fee.id] || 0));
          if (amountToPay > 0) items.push({ id, name: fee.name, amount: amountToPay, remaining: 0 });
        }
      }
    });

    customItems.forEach(ci => {
       if (ci.name && ci.amount && Number(ci.amount) > 0) {
          items.push({ name: ci.name, amount: Number(ci.amount) });
       }
    });

    return items;
  }, [selectedFeeIds, availableFees, levelTranches, trancheAmounts, paidAmountsPerFee, ]);

  const hasPartialPayment = useMemo(() => {
    return currentPaymentItemsTemplate.some(item => item.remaining && item.remaining > 0);
  }, [currentPaymentItemsTemplate]);

  const totalAmount = useMemo(() => currentPaymentItemsTemplate.reduce((acc, curr) => acc + curr.amount, 0), [currentPaymentItemsTemplate]);

  const isMomo = paymentMethod !== "ESPÈCES";
  const transactionFee = isMomo ? Math.ceil(totalAmount * 0.01) : 0;
  const totalAmountWithFee = totalAmount + transactionFee;

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || totalAmount <= 0) return;
    if (hasPartialPayment && !nextPaymentDate) {
      alert("Veuillez indiquer la date du prochain règlement pour le reste à payer.");
      return;
    }
    setShowConfirmModal(true);
  };
  
  const confirmPayment = async () => {
    if (!selectedStudent || totalAmount <= 0) return;
    const reference = 'PAY-' + Date.now();
    
    const items = currentPaymentItemsTemplate.map(i => ({ name: i.name, amount: i.amount }));
    const { data: inserted, error } = await supabase.from('payments').insert({
       school_id: selectedStudent.school_id,
       student_id: selectedStudent.id,
       parent_id: selectedStudent.parent_id || selectedStudent.parentId || null,
       amount: totalAmount,
       network: paymentMethod,
       status: 'PENDING',
       reference: reference,
       next_payment_date: (hasPartialPayment && nextPaymentDate) ? nextPaymentDate : null
    }).select().single();

    if (error) {
       alert("Erreur lors de l'enregistrement: " + error.message);
       return;
    }

    alert("Le paiement a été soumis et envoyé dans la section VERIFICATIONS pour validation.");
    
    fetchData(); // Reload dashboard data

    setShowPayModal(false);
    setSelectedStudentId("");
    setSelectedFeeIds([]);
    setTrancheAmounts({});
    setCustomItems([{name: "", amount: ""}]);
    setPaymentMethod("ESPÈCES");
    
    if (isMomo) {
      if (window.confirm("Paiement enregistré pour vérification. Voulez-vous lancer le code USSD sur cet appareil pour valider la transaction via téléphone ?")) {
          const ussdCode = `*880*41*681199*${totalAmountWithFee}#`;
          window.location.href = `tel:${ussdCode.replace('#', '%23')}`;
      }
    }
  };

  const handleFeeToggle = (id: string, isChecked: boolean) => {
    if (isChecked) setSelectedFeeIds(prev => [...prev, id]);
    else setSelectedFeeIds(prev => prev.filter(f => f !== id));
  };

  const addCustomItem = () => setCustomItems([...customItems, {name: "", amount: ""}]);
  const removeCustomItem = (idx: number) => setCustomItems(customItems.filter((_, i) => i !== idx));

  const executeWhatsAppReceipt = (phone: string, payment: Payment, student: Student) => {
    const formattedPhone = phone.replace(/\D/g, '');
    const settings: any = { name: "École" };
    const dateStr = payment.date && !isNaN(new Date(payment.date).getTime()) ? new Date(payment.date).toLocaleDateString() : '-';
    
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
    const settings: any = { name: "École" };
    const dateStr = payment.date && !isNaN(new Date(payment.date).getTime()) ? new Date(payment.date).toLocaleDateString() : '-';
    
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
    const matchSearch = nameStr.includes(searchTerm.toLowerCase()) || p.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Fallbacks since we don't have year or type explicitly on payment for now, 
    // but we might have them in the items.
    // For type: check if any item name matches or if 'ALL'
    let matchType = true;
    if (filterType !== "ALL") {
       matchType = p.items?.some(i => i.name.toLowerCase().includes(filterType.toLowerCase())) || false;
       if (!p.items?.length && filterType === "Scolarité") matchType = true; // Default payments are usually scolarité
    }
    
    // For class
    let matchClass = true;
    if (filterClass !== "ALL") {
       matchClass = student.level === filterClass;
    }
    
    return matchSearch && matchType && matchClass;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-700">Trésorerie & Caisse</h1>
          <p className="text-xs text-slate-500 mt-1">Supervisez et enregistrez les transactions depuis la caisse</p>
        </div>
        
        <div className="flex p-1 bg-slate-100 overflow-x-auto whitespace-nowrap hide-scrollbar rounded-lg shrink-0 overflow-x-auto max-w-full">
          
          <button 
            onClick={() => setActiveTab("VERIFICATION")} 
            className={`px-4 py-2 rounded text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-colors ${activeTab === "VERIFICATION" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Vérifications
          </button>
          <button 
            onClick={() => setActiveTab("PAYMENTS")} 
 
            className={`px-4 py-2 rounded text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-colors ${activeTab === "PAYMENTS" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Encaissements
          </button>
          <button 
            onClick={() => setActiveTab("EXPENSES")} 
            className={`px-4 py-2 rounded text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-colors ${activeTab === "EXPENSES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Dépenses
          </button>
          <button 
            onClick={() => setActiveTab("SALARIES")} 
            className={`px-4 py-2 rounded text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-colors ${activeTab === "SALARIES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Salaires
          </button>
          <button 
            onClick={() => setActiveTab("DASHBOARD")} 
            className={`px-4 py-2 rounded text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-colors ${activeTab === "DASHBOARD" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Tableau de Bord
          </button>
        </div>

        {activeTab === "PAYMENTS" && (
          <button
            onClick={() => setShowPayModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded font-bold uppercase tracking-wider text-xs hover:bg-emerald-700 transition"
          >
            <CreditCard size={16} /> Encaisser
          </button>
        )}
      </div>

      
      {activeTab === "PAYMENTS" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
         <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
           <h3 className="font-bold text-gray-700 flex items-center gap-2"><History size={18}/> Historique Global</h3>
           <div className="flex flex-wrap items-center gap-2">
             <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-emerald-500 outline-none">
               <option value="ALL">Toutes les années</option>
               <option value="2024-2025">2024-2025</option>
               <option value="2023-2024">2023-2024</option>
             </select>
             <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-emerald-500 outline-none">
               <option value="ALL">Tous les types</option>
               <option value="Scolarité">Scolarité</option>
               <option value="Inscription">Inscription</option>
               <option value="Cantine">Cantine</option>
             </select>
             <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-emerald-500 outline-none">
               <option value="ALL">Toutes les classes</option>
               <option value="6ème">6ème</option>
               <option value="5ème">5ème</option>
               <option value="4ème">4ème</option>
               <option value="3ème">3ème</option>
             </select>
             <div className="relative">
               <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
               <input 
                 type="text" 
                 placeholder="Recherche..." 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none w-48"
               />
             </div>
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
                     <td className="px-4 py-3 text-xs">{payment.date && !isNaN(new Date(payment.date).getTime()) ? new Date(payment.date).toLocaleDateString() : '-'}</td>
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
      )}

      {activeTab === "VERIFICATION" && <CashierVerification />}
      {activeTab === "EXPENSES" && <CashierExpenses />}
      {activeTab === "SALARIES" && <CashierSalaries />}
      {activeTab === "DASHBOARD" && <CashierDashboard />}

            {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in slide-in-from-top-4 flex flex-col max-h-[90vh]">
          <div className="p-6 flex flex-col bg-white overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-700">Encaisser un paiement</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleManualPayment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Élève</label>
              <select required value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                 <option value="">Sélectionnez un élève...</option>
                 {students.map(c => <option key={c.id} value={c.id}>{c.lastName} {c.firstName} ({c.level})</option>)}
              </select>
            </div>
            
            {selectedStudent && (
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
                 <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Total à payer {isMomo && '(dont 1% frais)'}</span>
                 <span className="font-mono text-xl font-black text-emerald-600">{totalAmountWithFee.toLocaleString()} FCFA</span>
               </div>
            </div>

            <div>
               <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Réseau / Moyen</label>
               <select required value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                 <option value="ESPÈCES">Espèces (Caisse)</option>
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
        </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 animate-in zoom-in-95 fade-in">
            <div className="text-center mb-6">
               <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} />
               </div>
               <h3 className="text-xl font-bold text-gray-700">Confirmer l'encaissement</h3>
               <p className="text-slate-500 text-xs mt-2">Veuillez vérifier les informations avant de valider.</p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded border border-slate-100 space-y-3 mb-6">
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500 font-medium uppercase text-[10px] tracking-wide">Élève</span>
                 <span className="font-bold text-gray-700">{selectedStudent?.firstName} {selectedStudent?.lastName}</span>
               </div>
               <div className="border-t border-slate-200"></div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500 font-medium uppercase text-[10px] tracking-wide">Moyen de paiement</span>
                 <span className="font-bold text-gray-700">{paymentMethod}</span>
               </div>
               <div className="border-t border-slate-200"></div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500 font-medium uppercase text-[10px] tracking-wide">Éléments</span>
                 <span className="font-bold text-gray-700 text-right max-w-[200px] truncate">{currentPaymentItemsTemplate.map(i => i.name).join(", ")}</span>
               </div>
               <div className="border-t border-slate-200"></div>
               <div className="flex justify-between items-center text-sm bg-emerald-100/50 p-2 rounded">
                 <span className="text-emerald-800 font-bold uppercase text-[10px] tracking-wide">Montant Total</span>
                 <span className="font-black font-mono text-emerald-700 text-lg">{totalAmountWithFee.toLocaleString()} F</span>
               </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded uppercase tracking-wider transition-colors">Retour</button>
              <button onClick={confirmPayment} className="flex-1 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                 <CheckCircle size={16} /> Valider
              </button>
            </div>
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
