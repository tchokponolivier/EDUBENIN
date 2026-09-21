import React, { useState, useEffect, useMemo } from "react";
import { Student, Payment, SchoolSettings } from "../types";
import { useAuth } from "../lib/auth";
import { CreditCard, CheckCircle2, History, AlertTriangle, MessageCircle, Download, FileText, X, Calendar, Clock, Bell } from "lucide-react";
import { supabase } from "../lib/supabase";
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
  if (level.startsWith("2nde")) {
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
  const [academicYears, setAcademicYears] = useState<{id?: string; name: string; status?: string}[]>([]);
  const [feeConfigs, setFeeConfigs] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState<Payment | null>(null);
  
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');
  const [filterStudentId, setFilterStudentId] = useState<string>("ALL");
  const [filterYear, setFilterYear] = useState<string>("ALL");

  // Payment Form (Matching Director Encaisser steps)
  const [payFilterYear, setPayFilterYear] = useState<string>("");
  const [payFilterLevel, setPayFilterLevel] = useState<string>("");
  const [selectedChildId, setSelectedChildId] = useState("");
  const [network, setNetwork] = useState<"Moov Bénin" | "MTN Bénin" | "Celtiis Bénin">("MTN Bénin");
  
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
  const [trancheAmounts, setTrancheAmounts] = useState<Record<string, string>>({});
  const [feeAmountsToPay, setFeeAmountsToPay] = useState<Record<string, string>>({});
  const [nextPaymentDate, setNextPaymentDate] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const [kidsRes, paysRes, yearsRes, feesRes] = await Promise.all([
          supabase.from('students').select('*').eq('parent_id', user.id),
          supabase.from('payments').select('*').eq('parent_id', user.id),
          supabase.from('academic_years').select('id, name, status').order('created_at', { ascending: false }),
          supabase.from('fee_config').select('*')
        ]);

        const kids = (kidsRes.data || []).map((d: any) => ({
          ...d, 
          createdAt: d.created_at, 
          firstName: d.first_name, 
          lastName: d.last_name, 
          parentId: d.parent_id, 
          schoolId: d.school_id, 
          studentType: d.studentType, 
          educmasterNumber: d.educmasterNumber, 
          gender: d.gender,
          academic_year: d.academic_year || d.academicYear,
          academicYear: d.academic_year || d.academicYear
        }));
        setChildren(kids);
        
        if (feesRes.data) setFeeConfigs(feesRes.data);

        let years: {id?: string; name: string; status?: string}[] = (yearsRes.data || []).map((y: any) => ({ 
          id: y.id, 
          name: y.name, 
          status: y.status 
        }));

        kids.forEach((k: any) => {
          const yName = k.academic_year || k.academicYear;
          if (yName && !years.some(y => y.name === yName)) {
            years.push({ id: yName, name: yName, status: 'OTHER' });
          }
        });

        if (years.length === 0) {
          years = [{ id: 'default', name: '2024-2025', status: 'ACTIVE' }];
        }
        setAcademicYears(years);

        const activeYear = years.find(y => y.status === 'ACTIVE')?.name || years[0].name;

        const pays = (paysRes.data || []).map((d: any) => {
          const child = kids.find(k => k.id === d.student_id);
          const childYear = (child as any)?.academic_year || (child as any)?.academicYear;
          const itemYear = d.items?.find((it: any) => it.academic_year || it.academicYear)?.academic_year;
          const resolvedYear = d.academic_year || d.academicYear || itemYear || childYear || "2024-2025";
          return {
            ...d, 
            studentId: d.student_id, 
            schoolId: d.school_id, 
            parentId: d.parent_id, 
            createdAt: d.created_at, 
            date: d.payment_date ? new Date(d.payment_date).getTime() : new Date(d.created_at).getTime(),
            items: d.items || [],
            academic_year: resolvedYear,
            academicYear: resolvedYear
          };
        });
        
        pays.sort((a: any, b: any) => b.date - a.date);
        setAllPayments(pays);

        supabase.from('schools').select('*').eq('id', kids.length > 0 ? kids[0].schoolId : user.schoolId).single().then(({data}) => {
           if (data) setSettings(data as any);
        });
        
        // Handle URL search parameters
        const params = new URLSearchParams(window.location.search);
        const sId = params.get('studentId');
        const pay = params.get('pay');

        if (sId && kids.some(k => k.id === sId)) {
          setFilterStudentId(sId);
          setSelectedChildId(sId);
          const targetChild = kids.find(k => k.id === sId);
          if (targetChild) {
            setPayFilterLevel(targetChild.level || "");
            const childYear = targetChild.academic_year || targetChild.academicYear;
            setPayFilterYear(childYear || activeYear);
          }
        } else if (kids.length > 0) {
          setSelectedChildId(kids[0].id);
          setPayFilterLevel(kids[0].level || "");
          const childYear = kids[0].academic_year || kids[0].academicYear;
          setPayFilterYear(childYear || activeYear);
        } else {
          setPayFilterYear(activeYear);
        }

        if (pay === '1') {
          setShowPayModal(true);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadData();

    // Auto-refresh when notifications / payments change
    const handleRefresh = () => loadData();
    window.addEventListener('refresh_notifications', handleRefresh);
    return () => {
      window.removeEventListener('refresh_notifications', handleRefresh);
    };
  }, [user]);

  useEffect(() => {
    const now = new Date();
    
    const filtered = allPayments.filter(payment => {
      // Student filter
      if (filterStudentId !== "ALL" && payment.studentId !== filterStudentId) {
        return false;
      }
      
      // Academic Year filter
      if (filterYear !== "ALL") {
        const pYear = (payment as any).academic_year || (payment as any).academicYear;
        const child = children.find(c => c.id === payment.studentId);
        const cYear = child?.academicYear || child?.academic_year;
        if ((pYear || cYear) !== filterYear) {
          return false;
        }
      }

      // Date filter
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
  }, [allPayments, dateFilter, filterStudentId, filterYear, children]);

  // Derived available classes for the selected academic year in payment form
  const availableClassesForYear = useMemo(() => {
    const set = new Set<string>();
    children.forEach(c => {
      const cYear = (c as any).academic_year || (c as any).academicYear;
      if (!payFilterYear || !cYear || cYear === payFilterYear) {
        if (c.level) set.add(c.level);
      }
    });
    if (set.size === 0) {
      children.forEach(c => { if (c.level) set.add(c.level); });
    }
    return Array.from(set).sort();
  }, [children, payFilterYear]);

  // Derived children filtered by year and class for payment form
  const filteredChildrenForPay = useMemo(() => {
    return children.filter(c => {
      const cYear = (c as any).academic_year || (c as any).academicYear;
      const matchYear = !payFilterYear || !cYear || cYear === payFilterYear;
      const matchLevel = !payFilterLevel || c.level === payFilterLevel;
      return matchYear && matchLevel;
    });
  }, [children, payFilterYear, payFilterLevel]);

  const selectedChild = useMemo(() => children.find(c => c.id === selectedChildId), [children, selectedChildId]);

  const availableFees = useMemo(() => {
    if (!selectedChild) return [];
    const fees: any[] = [];
    const level = selectedChild.level || "";
    const studentCanteenOpts = (selectedChild as any).canteenOptions || [];
    const isUninterestedInCanteen = studentCanteenOpts.includes("Non intéressé");
    const isOldStudent = selectedChild.studentType === "OLD";
    const isNewStudent = selectedChild.studentType === "NEW" || !selectedChild.studentType;

    const FEE_NAME_MAPPINGS: Record<string, string> = {
      INSCRIPTION: "Frais d'inscription",
      INSCRIPTION_NEW: "Inscription Nouveau",
      INSCRIPTION_OLD: "Inscription Ancien",
      MONTHLY: "Scolarité (Tranches)",
      CANTEEN: "Cantine",
      SUPERVISED_CARE: "Garde surveillée",
      BOOKS: "Livres Scolaires",
      TD: "TD",
      ID_CARD: "Carte Scolaire",
      UNIFORMS: "Uniforme",
      SPORTS_WEAR: "Tenue de Sport",
      EVALUATION: "Frais d'évaluation",
      VACATION_CLASSES: "Cours de vacances",
      REINFORCEMENT_CLASSES: "Cours de renforcement",
      TRANSPORT: "Transport"
    };

    // Filter DB fee configs based on selected year, level, student type, and canteen preferences
    feeConfigs.forEach(fc => {
      if (payFilterYear && fc.academic_year && fc.academic_year !== payFilterYear) {
        return;
      }
      if (fc.level === 'ALL' || fc.level === level) {
        // Skip MONTHLY as it's already handled in "Scolarité par tranches"
        if (fc.fee_type === 'MONTHLY') {
          return;
        }
        if (isOldStudent && (fc.fee_type === 'INSCRIPTION_NEW' || fc.fee_type === 'INSCRIPTION')) {
          return;
        }
        if (isNewStudent && fc.fee_type === 'INSCRIPTION_OLD') {
          return;
        }
        if (isUninterestedInCanteen && (fc.fee_type === 'CANTEEN' || fc.fee_type === 'SUPERVISED_CARE')) {
          return;
        }
        fees.push({
          id: fc.id,
          name: FEE_NAME_MAPPINGS[fc.fee_type] || fc.fee_type,
          amount: fc.amount,
          feeType: fc.fee_type,
          level: fc.level,
          tranches: fc.tranches
        });
      }
    });

    // Fallbacks if no fee configs in DB yet
    if (fees.length === 0) {
      if (isNewStudent) {
        fees.push({ id: "inscription", name: "Frais d'inscription (Nouveau)", amount: 2000, feeType: 'INSCRIPTION_NEW' });
      }
      const isPrimary = level.startsWith("Maternelle") || level.startsWith("CI") || level.startsWith("CP") || level.startsWith("CE") || level.startsWith("CM");
      const isMiddleSchool = ["6ème", "5ème", "4ème", "3ème"].includes(level);
      const isHighSchool = level.startsWith("2nde") || level.startsWith("1ère") || level.startsWith("Terminale");
      let uniformeAmount = 0;
      if (isPrimary) uniformeAmount = selectedChild.gender === "FEMALE" ? 3500 : 5000;
      else if (isMiddleSchool) uniformeAmount = 5000;
      else if (isHighSchool) uniformeAmount = 7000;
      if (uniformeAmount > 0) fees.push({ id: "uniforme", name: "Achat Uniforme", amount: uniformeAmount, feeType: 'UNIFORMS' });
      fees.push({ id: "sport", name: "Tee-shirt de sport", amount: 2000, feeType: 'SPORTS_WEAR' });
      if (["CI", "CP", "CE1", "CE2"].includes(level)) {
        fees.push({ id: "td", name: "Frais de TD", amount: 5000, feeType: 'TD' });
      } else if (["CM1", "CM2"].includes(level)) {
        fees.push({ id: "td", name: "Frais de TD", amount: 10000, feeType: 'TD' });
      }
      fees.push({ id: "eval", name: "Frais d'évaluation", amount: 3000, feeType: 'EVALUATION' });
      if (["Maternelle 1", "Maternelle 2", "CM2", "3ème"].includes(level)) {
        fees.push({ id: "carte", name: "Carte scolaire", amount: 1500, feeType: 'ID_CARD' });
      }
    }

    return fees;
  }, [selectedChild, feeConfigs, payFilterYear]);

  const levelTranches = useMemo(() => {
    if (!selectedChild) return [];
    const level = selectedChild.level || "";
    const levelFee = feeConfigs.find(fc =>
      fc.fee_type === 'MONTHLY' &&
      (fc.level === level || fc.level === 'ALL') &&
      (!payFilterYear || !fc.academic_year || fc.academic_year === payFilterYear)
    );
    if (levelFee && levelFee.tranches && levelFee.tranches.length > 0) {
      return levelFee.tranches.map((t: any) => ({ id: t.id, name: t.name, limit: t.limit, amount: t.amount }));
    }
    return getTranchesForLevel(level);
  }, [selectedChild, feeConfigs, payFilterYear]);

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
        if (fee) {
          const maxRemaining = Math.max(0, fee.amount - (paidAmountsPerFee[fee.id] || 0));
          const val = feeAmountsToPay[fee.id] !== undefined ? Number(feeAmountsToPay[fee.id]) : maxRemaining;
          t += Math.min(Math.max(0, val), maxRemaining);
        }
      }
    });
    return t;
  }, [selectedFeeIds, availableFees, levelTranches, trancheAmounts, feeAmountsToPay, paidAmountsPerFee]);

  const transactionFee = useMemo(() => Math.ceil(totalAmount * 0.01), [totalAmount]);
  const totalAmountWithFee = useMemo(() => totalAmount + transactionFee, [totalAmount, transactionFee]);

  const handleFeeToggle = (id: string, isChecked: boolean, defaultAmount?: number) => {
    if (isChecked) {
      setSelectedFeeIds(prev => [...prev, id]);
      if (defaultAmount !== undefined) {
        setFeeAmountsToPay(prev => ({ ...prev, [id]: defaultAmount.toString() }));
      }
    } else {
      setSelectedFeeIds(prev => prev.filter(f => f !== id));
      setFeeAmountsToPay(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
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
          const oldRemaining = Math.max(0, fee.amount - (paidAmountsPerFee[fee.id] || 0));
          const amountToPay = feeAmountsToPay[fee.id] !== undefined ? Number(feeAmountsToPay[fee.id]) : oldRemaining;
          items.push({ id, name: fee.name, amount: amountToPay, remaining: Math.max(0, oldRemaining - amountToPay) });
        }
      }
    });
    return items;
  }, [selectedFeeIds, availableFees, levelTranches, trancheAmounts, feeAmountsToPay, paidAmountsPerFee]);

  const hasPartialPayment = useMemo(() => {
    return currentPaymentItemsTemplate.some(item => item.remaining && item.remaining > 0);
  }, []);

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

const confirmPayment = async () => {
    if (!user) return;

    const child = children.find(c => c.id === selectedChildId);
    if (!child) return;
    
    let reference = 'PAY-' + Date.now();
    let ussdCode = "";
    if (network === "MTN Bénin") {
       ussdCode = `*880*41*681199*${totalAmountWithFee}#`;
    } else if (network === "Moov Bénin") {
       ussdCode = `*855*1*1*1*0195741278*0195741278*${totalAmountWithFee}#`;
    } else if (network === "Celtiis Bénin") {
       ussdCode = `*889*4*1*0140688598*0140688598*${totalAmountWithFee}#`;
    }

    const paymentYear = payFilterYear || (child as any).academic_year || (child as any).academicYear || "2024-2025";
    const paymentItems = currentPaymentItemsTemplate.map(i => ({
      id: i.id,
      name: i.name,
      amount: i.amount,
      academic_year: paymentYear
    }));
    
    // Attempt insert into Supabase
    const payload: any = {
       school_id: child.schoolId || user.schoolId || (child as any).school_id,
       student_id: selectedChildId,
       parent_id: user.id,
       amount: totalAmountWithFee,
       status: 'PENDING',
       network: network,
       reference: reference,
       items: paymentItems,
       next_payment_date: (hasPartialPayment && nextPaymentDate) ? nextPaymentDate : null
    };

    let { data: inserted, error } = await supabase.from('payments').insert(payload).select().single();

    // Fallbacks if optional columns don't exist in Supabase schema cache
    if (error && error.message && error.message.includes("Could not find the 'items' column")) {
       delete payload.items;
       const retry = await supabase.from('payments').insert(payload).select().single();
       inserted = retry.data;
       error = retry.error;
    }
    if (error && error.message && error.message.includes("Could not find the 'next_payment_date' column")) {
       delete payload.next_payment_date;
       const retry = await supabase.from('payments').insert(payload).select().single();
       inserted = retry.data;
       error = retry.error;
    }
    if (error && error.message && error.message.includes("Could not find the 'academic_year' column")) {
       delete payload.academic_year;
       const retry = await supabase.from('payments').insert(payload).select().single();
       inserted = retry.data;
       error = retry.error;
    }
    
    if (error) {
       console.error("Payment insert error:", error);
       alert("Erreur lors de l'enregistrement de la transaction: " + (error.message || ""));
       return;
    }
    
    // We still update local state for immediate UI feedback
    const newPayment: any = { 
       id: inserted ? inserted.id : Date.now().toString(), 
       amount: totalAmountWithFee, 
       date: inserted ? new Date(inserted.created_at).getTime() : Date.now(), 
       reference: reference, 
       studentId: selectedChildId,
       academic_year: paymentYear,
       academicYear: paymentYear,
       status: 'PENDING',
       network: network,
       items: currentPaymentItemsTemplate
    };

    const updatedPays = [newPayment, ...allPayments];
    updatedPays.sort((a,b) => b.date - a.date);
    setAllPayments(updatedPays);
    
    setShowConfirmModal(false);
    setShowPayModal(false);
    
    // Alert the user that the status is pending verification
    alert("Votre paiement est passé en statut En Vérification. Vous allez être redirigé vers l'interface USSD pour finaliser le paiement.");
    
    // Launch USSD code
    if (ussdCode) {
       window.location.href = `tel:${ussdCode.replace('#', '%23')}`;
    }
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
        margin:       [0.3, 0.3, 0.3, 0.3] as [number, number, number, number], // top, left, bottom, right
        filename:     `Recu_${payment.reference}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
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
      const child = children.find(c => c.id === payment.studentId);
const childName = child ? `${child.lastName} ${child.firstName}` : "Inconnu";
      const date = new Date(payment.date).toLocaleDateString();
      return [
        date,
        payment.reference,
        childName,
        payment.network,
        payment.amount.toString(),
        payment.status === 'PENDING' ? 'En vérification' : (payment.status === 'FAILED' ? 'Échoué' : 'Validé')
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl my-8 flex flex-col animate-in zoom-in-95 fade-in overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-gray-800 text-base">Nouveau Paiement - Mobile Money</h3>
                <p className="text-slate-500 text-xs mt-0.5">Réglez la scolarité et les frais scolaires en quelques clics</p>
              </div>
              <button 
                onClick={() => setShowPayModal(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 overflow-y-auto max-h-[80vh] flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Année Scolaire */}
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide flex items-center justify-between">
                    <span>1. Année Scolaire</span>
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      Direction
                    </span>
                  </label>
                  <select 
                    required 
                    value={payFilterYear} 
                    onChange={e => {
                      const newYear = e.target.value;
                      setPayFilterYear(newYear);
                      setPayFilterLevel("");
                      setSelectedChildId("");
                      setSelectedFeeIds([]);
                      setTrancheAmounts({});
                      setFeeAmountsToPay({});
                    }} 
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white font-medium shadow-sm transition-all"
                  >
                    <option value="">Sélectionnez l'année...</option>
                    {academicYears.map((y, idx) => (
                      <option key={y.id || y.name || idx} value={y.name}>
                        {y.name} {y.status === 'ACTIVE' ? '★ (En cours)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Classe */}
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide flex items-center justify-between">
                    <span>2. Classe</span>
                    {payFilterYear && (
                      <span className="text-[10px] font-normal text-slate-500">
                        {availableClassesForYear.length} classe(s)
                      </span>
                    )}
                  </label>
                  <select 
                    required 
                    disabled={!payFilterYear}
                    value={payFilterLevel} 
                    onChange={e => {
                      const newClass = e.target.value;
                      setPayFilterLevel(newClass);
                      setSelectedChildId("");
                      setSelectedFeeIds([]);
                      setTrancheAmounts({});
                      setFeeAmountsToPay({});
                    }} 
                    className={`w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-medium shadow-sm transition-all ${
                      !payFilterYear ? 'bg-slate-100 cursor-not-allowed text-slate-400' : 'bg-white text-gray-800'
                    }`}
                  >
                    <option value="">
                      {!payFilterYear ? "Choisissez d'abord l'année..." : "Sélectionnez une classe..."}
                    </option>
                    {availableClassesForYear.map(lvl => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Élève */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>3. Élève</span>
                      {payFilterLevel && (
                        <span className="text-[10px] font-normal text-slate-500">
                          ({filteredChildrenForPay.length} enfant{filteredChildrenForPay.length > 1 ? 's' : ''})
                        </span>
                      )}
                    </div>
                    {selectedChild && (
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${selectedChild.studentType === 'OLD' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {selectedChild.studentType === 'OLD' ? 'Ancien élève' : 'Nouvel élève'}
                      </span>
                    )}
                  </label>
                  <select 
                    required 
                    disabled={!payFilterLevel}
                    value={selectedChildId} 
                    onChange={e => {
                      setSelectedChildId(e.target.value);
                      setSelectedFeeIds([]);
                      setTrancheAmounts({});
                      setFeeAmountsToPay({});
                    }} 
                    className={`w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-medium shadow-sm transition-all ${
                      !payFilterLevel ? 'bg-slate-100 cursor-not-allowed text-slate-400' : 'bg-white text-gray-800'
                    }`}
                  >
                    {!payFilterYear ? (
                      <option value="">Veuillez d'abord choisir une année scolaire...</option>
                    ) : !payFilterLevel ? (
                      <option value="">Veuillez d'abord choisir une classe...</option>
                    ) : filteredChildrenForPay.length === 0 ? (
                      <option value="">Aucun enfant trouvé pour cette sélection</option>
                    ) : (
                      <>
                        <option value="">Sélectionnez votre enfant...</option>
                        {filteredChildrenForPay.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.lastName?.toUpperCase()} {c.firstName} ({c.level}) - {c.studentType === 'OLD' ? 'Ancien' : 'Nouveau'}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* 4. Éléments à Payer */}
              {selectedChild && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="text-xs font-bold uppercase text-gray-700 mb-3 tracking-wide flex items-center justify-between">
                    <span>Éléments à Payer</span>
                    <span className="text-[10px] font-normal text-slate-500">Cochez les éléments à régler</span>
                  </h4>
                  <div className="space-y-3">
                    {/* Scolarité par tranches */}
                    <div className="pt-2 pb-3 mb-3 border-b border-slate-200 flex flex-col gap-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Scolarité par tranches</p>
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
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedFeeIds(prev => [...prev, tranche.id]);
                                    setTrancheAmounts(prev => ({ ...prev, [tranche.id]: remaining.toString() }));
                                  } else {
                                    setSelectedFeeIds(prev => prev.filter(id => id !== tranche.id));
                                  }
                                }} 
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
                                  className="w-28 px-2 py-1 border border-slate-300 rounded text-sm outline-none text-right font-semibold text-gray-700 focus:border-emerald-500" 
                                />
                              )}
                              <span className="text-xs font-bold text-slate-600 min-w-16 whitespace-nowrap text-right">
                                {isPaidOut ? "Payé" : `Reste: ${remaining.toLocaleString()} / ${tranche.amount.toLocaleString()}F`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Autres Frais calculés dynamiquement */}
                    {availableFees.length > 0 && (
                      <div className="flex flex-col gap-2.5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Autres Frais & Activités</p>
                        {availableFees.map(fee => {
                          const paid = paidAmountsPerFee[fee.id] || 0;
                          const remaining = Math.max(0, fee.amount - paid);
                          const isPaidOut = remaining <= 0;
                          return (
                            <div key={fee.id} className={`flex items-center justify-between gap-3 ${isPaidOut ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              <label className="flex items-center gap-2 cursor-pointer flex-1">
                                <input 
                                  type="checkbox" 
                                  disabled={isPaidOut}
                                  checked={selectedFeeIds.includes(fee.id) && !isPaidOut}
                                  onChange={e => handleFeeToggle(fee.id, e.target.checked, remaining)}
                                  className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 disabled:opacity-50" 
                                />
                                <span className="text-sm font-medium text-gray-700">{fee.name}</span>
                              </label>
                              <div className="flex items-center gap-2">
                                {selectedFeeIds.includes(fee.id) && !isPaidOut && (
                                  <input 
                                    type="number" 
                                    required 
                                    max={remaining}
                                    placeholder="Montant"
                                    value={feeAmountsToPay[fee.id] ?? remaining.toString()} 
                                    onChange={e => {
                                      const val = Number(e.target.value);
                                      if (val > remaining) {
                                        setFeeAmountsToPay(prev => ({ ...prev, [fee.id]: remaining.toString() }));
                                      } else {
                                        setFeeAmountsToPay(prev => ({ ...prev, [fee.id]: e.target.value }));
                                      }
                                    }} 
                                    className="w-28 px-2 py-1 border border-slate-300 rounded text-sm outline-none text-right font-semibold text-gray-700 focus:border-emerald-500" 
                                  />
                                )}
                                <span className="text-xs font-bold text-slate-600 min-w-16 whitespace-nowrap text-right">
                                  {isPaidOut ? "Payé" : (paid > 0 ? `Reste: ${remaining.toLocaleString()}F (Total: ${fee.amount.toLocaleString()}F)` : `${fee.amount.toLocaleString()} F`)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Total à payer (dont 1% frais) */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-900">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-600">Sous-total :</span>
                  <span className="font-semibold text-gray-700">{totalAmount.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-emerald-200">
                  <span className="text-slate-600">Frais Mobile Money (1%) :</span>
                  <span className="font-semibold text-emerald-700">+{transactionFee.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-black uppercase tracking-wide text-gray-800">Total à payer (dont 1% frais)</span>
                  <span className="font-mono text-xl font-black text-emerald-700">{totalAmountWithFee.toLocaleString()} FCFA</span>
                </div>
              </div>

              {/* Réseau Mobile */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Réseau Mobile Money</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["MTN Bénin", "Moov Bénin", "Celtiis Bénin"] as const).map(net => (
                    <button
                      key={net}
                      type="button"
                      onClick={() => setNetwork(net)}
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                        network === net
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <span className="truncate">{net.replace(' Bénin', '')}</span>
                      <span className="text-[10px] font-normal text-slate-500">
                        {net === 'MTN Bénin' ? 'MoMo *880#' : (net === 'Moov Bénin' ? 'Moov *855#' : 'Celtiis *889#')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              {hasPartialPayment && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Date du prochain règlement</label>
                  <input 
                    type="date" 
                    required 
                    value={nextPaymentDate} 
                    onChange={e => setNextPaymentDate(e.target.value)} 
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" 
                    min={new Date().toISOString().split('T')[0]} 
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowPayModal(false)} 
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg uppercase tracking-wider transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={totalAmount <= 0 || !selectedChildId} 
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <CreditCard size={15} />
                  Continuer vers le paiement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 animate-in zoom-in-95 fade-in">
            <div className="text-center mb-6">
               <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard size={32} />
               </div>
               <h3 className="text-xl font-bold text-gray-800">Confirmer le paiement</h3>
               <p className="text-slate-500 text-xs mt-1">Vérifiez les détails de la transaction avant l'envoi du code USSD.</p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2.5 mb-5 text-sm">
               <div className="flex justify-between">
                 <span className="text-slate-500 font-medium text-xs">Année Scolaire</span>
                 <span className="font-bold text-emerald-700">{payFilterYear || "2024-2025"}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-slate-500 font-medium text-xs">Enfant</span>
                 <span className="font-bold text-gray-800">
                   {selectedChild ? `${selectedChild.lastName?.toUpperCase()} ${selectedChild.firstName} (${selectedChild.level})` : '-'}
                 </span>
               </div>
               <div className="flex justify-between">
                 <span className="text-slate-500 font-medium text-xs">Réseau Mobile</span>
                 <span className="font-bold text-gray-800">{network}</span>
               </div>
               <div className="border-t border-slate-200 pt-2 flex justify-between">
                 <span className="text-slate-500 font-medium text-xs">Sous-total</span>
                 <span className="font-semibold text-gray-700">{totalAmount.toLocaleString()} FCFA</span>
               </div>
               <div className="flex justify-between text-xs text-slate-500">
                 <span>Frais Mobile Money (1%)</span>
                 <span>+{transactionFee.toLocaleString()} FCFA</span>
               </div>
               <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                 <span className="text-xs font-black uppercase text-gray-800">Total à payer</span>
                 <span className="font-mono text-xl font-black text-emerald-600">{totalAmountWithFee.toLocaleString()} FCFA</span>
               </div>
            </div>
            
            <p className="text-[11px] text-amber-700 font-medium mb-6 text-center bg-amber-50 p-2.5 rounded-lg border border-amber-200">
               En cliquant sur "Payer", votre application de téléphone s'ouvrira avec le code USSD pour autoriser le prélèvement.
            </p>

            <div className="flex flex-col gap-2.5">
              <button 
                onClick={confirmPayment}
                className="w-full inline-flex justify-center items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <CreditCard size={18} />
                Payer via USSD ({network === 'MTN Bénin' ? '*880#' : network === 'Moov Bénin' ? '*855#' : '*889#'})
              </button>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="w-full px-4 py-2.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 uppercase tracking-wider transition-colors"
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
            <div className="flex gap-2 items-center flex-wrap">
              <select value={filterStudentId} onChange={e => setFilterStudentId(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded text-xs text-gray-700 outline-none">
                <option value="ALL">Tous les enfants</option>
                {children.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
              <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded text-xs text-gray-700 outline-none">
                <option value="ALL">Toutes les années</option>
                {academicYears.map(y => <option key={y.name} value={y.name}>{y.name}</option>)}
              </select>
              <div className="flex p-1 bg-slate-100 overflow-x-auto whitespace-nowrap hide-scrollbar rounded overflow-x-auto">
                 <button onClick={() => setDateFilter('ALL')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${dateFilter === 'ALL' ? 'bg-white shadow-sm text-gray-700' : 'text-slate-500 hover:text-gray-700'}`}>Tous</button>
                 <button onClick={() => setDateFilter('DAY')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${dateFilter === 'DAY' ? 'bg-white shadow-sm text-gray-700' : 'text-slate-500 hover:text-gray-700'}`}>Jour</button>
                 <button onClick={() => setDateFilter('WEEK')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${dateFilter === 'WEEK' ? 'bg-white shadow-sm text-gray-700' : 'text-slate-500 hover:text-gray-700'}`}>Sem</button>
                 <button onClick={() => setDateFilter('MONTH')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${dateFilter === 'MONTH' ? 'bg-white shadow-sm text-gray-700' : 'text-slate-500 hover:text-gray-700'}`}>Mois</button>
                 <button onClick={() => setDateFilter('YEAR')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${dateFilter === 'YEAR' ? 'bg-white shadow-sm text-gray-700' : 'text-slate-500 hover:text-gray-700'}`}>An</button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile View: Cards showing child, academic year, amount, status */}
        <div className="sm:hidden divide-y divide-slate-100">
          {filteredPayments.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              Aucun paiement trouvé pour cette sélection.
            </div>
          ) : (
            filteredPayments.map(payment => {
              const child = children.find(c => c.id === payment.studentId);
              const childName = child ? `${child.lastName?.toUpperCase()} ${child.firstName}` : "Élève";
              const paymentYear = (payment as any).academic_year || (payment as any).academicYear || (child as any)?.academicYear || (child as any)?.academic_year || "Année standard";
              let networkDotColor = "bg-yellow-400";
              if (payment.network === "Moov Bénin") networkDotColor = "bg-emerald-500";
              if (payment.network === "Celtiis Bénin") networkDotColor = "bg-red-500";

              return (
                <div key={payment.id} className="p-4 flex flex-col gap-2 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 text-sm">{childName}</span>
                    <span className="font-mono font-bold text-emerald-600 text-sm">{payment.amount.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span>{child?.level || '-'}</span>
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] font-semibold">
                        {paymentYear}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 font-mono text-gray-700 text-xs font-semibold">
                      <Clock size={11} className="text-emerald-600" />
                      <span>
                        {new Date(payment.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        {payment.date ? ` à ${new Date(payment.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${networkDotColor}`}></span>
                      <span className="text-slate-600 text-[11px]">{payment.network.replace(' Bénin', '')}</span>
                      <span className="font-mono text-slate-400 text-[10px] uppercase">({payment.reference})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {payment.status === 'PENDING' ? (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold uppercase">En Vérif.</span>
                      ) : payment.status === 'FAILED' ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase">Échoué</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">Validé</span>
                      )}
                      <button 
                        onClick={() => setShowReceiptModal(payment)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors"
                        title="Voir le reçu"
                      >
                        <FileText size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Desktop View: Table */}
        <div className="hidden sm:block flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold sticky top-0">
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3">Date & Heure</th>
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

                  const child = children.find(c => c.id === payment.studentId);
                  const childName = child ? `${child.lastName} ${child.firstName}` : "Inconnu";
                  const paymentYear = (payment as any).academic_year || (payment as any).academicYear || (child as any)?.academicYear || (child as any)?.academic_year || "Année standard";

                  return (
                    <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs">
                        <span className="font-semibold text-gray-800">
                          {new Date(payment.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                        {payment.date && (
                          <span className="text-[11px] text-emerald-600 font-mono font-medium flex items-center gap-1 mt-0.5">
                            <Clock size={11} className="text-emerald-500" />
                            {new Date(payment.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[10px] uppercase">{payment.reference}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-700 text-xs">{childName}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span>{child?.level || '-'}</span>
                          <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] font-semibold">
                            {paymentYear}
                          </span>
                        </p>
                      </td>
                      <td className="px-4 py-3">
                         <span className="flex items-center gap-2 text-xs">
                           <span className={`w-2 h-2 rounded-full ${networkDotColor}`}></span>
                           {payment.network.replace(' Bénin', '')}
                         </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-xs">{payment.amount.toLocaleString()} F</td>
                      <td className="px-4 py-3 text-right">
                         {payment.status === 'PENDING' ? (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold uppercase tracking-wider">En Vérification</span>
                         ) : payment.status === 'FAILED' ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Échoué</span>
                         ) : (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Validé</span>
                         )}
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
