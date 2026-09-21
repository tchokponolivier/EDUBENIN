import React, { useState, useEffect, useMemo } from "react";
import { Payment, Student, LEVELS } from "../types";
import { useAuth } from "../lib/auth";
import { useLocation } from "react-router-dom";
import { CreditCard, History, Search, MessageCircle, Printer, Plus, Trash2, CheckSquare, Square, X, Wallet, TrendingUp, CheckCircle, Table, Clock, AlertTriangle, Coins } from "lucide-react";
import { supabase } from "../lib/supabase";
import { FeeTableModal } from "../components/FeeTableModal";
import { CashierExpenses } from "../components/CashierExpenses";
import { CashierDashboard } from "../components/CashierDashboard";
import { CashierEnrollment } from "../components/CashierEnrollment";
import { CashierSalaries } from "../components/CashierSalaries";
import { CashierVerification } from "../components/CashierVerification";
import { CashierDebts, parseDeadlineDate } from "../components/CashierDebts";
import { PaymentActorBadge } from "../components/PaymentActorBadge";

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

export function SchoolAdminPayments() {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"INSCRIPTIONS" | "PAYMENTS" | "EXPENSES" | "SALARIES" | "DASHBOARD" | "VERIFICATION" | "CREANCES">(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const validTabs = ["INSCRIPTIONS", "PAYMENTS", "EXPENSES", "SALARIES", "DASHBOARD", "VERIFICATION", "CREANCES"];
    if (tab && validTabs.includes(tab)) return tab as any;
    return "PAYMENTS";
  });
  const [academicYears, setAcademicYears] = useState<{ id?: string; name: string; status?: string }[]>([]);
  const [feeConfigs, setFeeConfigs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Sync state if URL changes
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const validTabs = ["INSCRIPTIONS", "PAYMENTS", "EXPENSES", "SALARIES", "DASHBOARD", "VERIFICATION", "CREANCES"];
    if (tab && validTabs.includes(tab)) setActiveTab(tab as any);
  }, [location.search]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState<"COMPLETED" | "ALL" | "PENDING">("COMPLETED");
  const [filterActor, setFilterActor] = useState("ALL");

  const pendingCount = useMemo(() => {
    return payments.filter(p => p.status === 'PENDING').length;
  }, [payments]);

  const overdueCountGlobal = useMemo(() => {
    const now = new Date();
    let count = 0;
    students.forEach(student => {
      const level = student.level || "";
      const studentYear = student.academic_year || student.academicYear || "2024-2025";
      
      const levelMonthlyFee = feeConfigs.find(fc =>
        fc.fee_type === 'MONTHLY' &&
        (fc.level === 'ALL' || fc.level === level) &&
        (!fc.academic_year || fc.academic_year === studentYear)
      );

      const tranches = (levelMonthlyFee && levelMonthlyFee.tranches && levelMonthlyFee.tranches.length > 0)
        ? levelMonthlyFee.tranches
        : getTranchesForLevel(level);

      const studentPayments = payments.filter(p => p.studentId === student.id && p.status === "COMPLETED");
      const paidPerFee: Record<string, number> = {};
      studentPayments.forEach(p => {
        p.items?.forEach(i => {
          if (i.id) paidPerFee[i.id] = (paidPerFee[i.id] || 0) + (Number(i.amount) || 0);
        });
      });

      let isOverdue = false;
      for (const t of tranches) {
        const paid = paidPerFee[t.id] || 0;
        if (paid < t.amount) {
          const d = parseDeadlineDate(t.limit, studentYear);
          if (d && now.getTime() > d.getTime()) {
            isOverdue = true;
            break;
          }
        }
      }
      if (isOverdue) count++;
    });
    return count;
  }, [students, payments, feeConfigs]);
  
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
  const [feeAmountsToPay, setFeeAmountsToPay] = useState<Record<string, string>>({});
  const [customItems, setCustomItems] = useState<{name: string; amount: string}[]>([{name: "", amount: ""}]);
  const [paymentMethod, setPaymentMethod] = useState<"ESPÈCES" | "MTN Bénin" | "Moov Bénin" | "Celtiis Bénin">("ESPÈCES");
  const [nextPaymentDate, setNextPaymentDate] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showFeeTableModal, setShowFeeTableModal] = useState(false);

  useEffect(() => {
    fetchData();

    const handleRefresh = () => {
      fetchData();
    };
    window.addEventListener('refresh_notifications', handleRefresh);
    return () => {
      window.removeEventListener('refresh_notifications', handleRefresh);
    };
  }, [user]);

  const fetchData = async () => {
    if (!user?.schoolId) return;
    
    try {
      const [studentsRes, paymentsRes, yearsRes, settingsRes, feeConfigsRes, profilesRes] = await Promise.all([
        supabase.from('students').select('*').eq('school_id', user.schoolId),
        supabase.from('payments').select('*').eq('school_id', user.schoolId),
        supabase.from('academic_years').select('id, name, status').eq('school_id', user.schoolId).order('created_at', { ascending: false }),
        supabase.from('schools').select('*').eq('id', user.schoolId).single(),
        supabase.from('fee_config').select('*').eq('school_id', user.schoolId),
        supabase.from('profiles').select('id, full_name, role').eq('school_id', user.schoolId)
      ]);
      if (profilesRes.data) setProfiles(profilesRes.data);
      if (feeConfigsRes.data) setFeeConfigs(feeConfigsRes.data);
      if (yearsRes.data && yearsRes.data.length > 0) {
        setAcademicYears(yearsRes.data);
      } else if (settingsRes.data) {
        setAcademicYears([{ name: settingsRes.data.academic_year || settingsRes.data.academicYear || "2024-2025", status: "ACTIVE" }]);
      }
      if (settingsRes.data) setSettings(settingsRes.data);
      
      if (studentsRes.data) {
        setStudents(studentsRes.data.map(d => ({
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
        })) as any);
      }
      if (paymentsRes.data) {
        const studentList = (studentsRes.data || []) as any[];
        setPayments(paymentsRes.data.map(d => {
          const student = studentList.find((s: any) => s.id === d.student_id);
          const studentYear = student?.academic_year || student?.academicYear;
          const itemYear = d.items?.find((it: any) => it.academic_year || it.academicYear)?.academic_year;
          const resolvedYear = d.academic_year || d.academicYear || itemYear || studentYear || "2024-2025";
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
        }) as any);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data from supabase", err);
    }
  };

  // Synchronisation si un élève est présélectionné
  useEffect(() => {
    if (selectedStudentId && students.length > 0) {
      const s = students.find(st => st.id === selectedStudentId);
      if (s) {
        if (s.level && !payFilterLevel) {
          setPayFilterLevel(s.level);
        }
        const sYear = s.academic_year || s.academicYear;
        if (sYear && !payFilterYear) {
          setPayFilterYear(sYear);
        }
      }
    }
  }, [selectedStudentId, students]);

  // 1. Étudiants correspondant à l'année scolaire sélectionnée
  const studentsInSelectedYear = useMemo(() => {
    if (!payFilterYear) return [];
    const hasAnyWithYear = students.some(s => (s.academic_year || s.academicYear) === payFilterYear);
    return students.filter(s => {
      const sYear = s.academic_year || s.academicYear;
      return hasAnyWithYear ? sYear === payFilterYear : true;
    });
  }, [students, payFilterYear]);

  // 2. Effectif par classe pour l'année sélectionnée
  const studentCountByClass = useMemo(() => {
    const counts: Record<string, number> = {};
    studentsInSelectedYear.forEach(s => {
      if (s.level) {
        counts[s.level] = (counts[s.level] || 0) + 1;
      }
    });
    return counts;
  }, [studentsInSelectedYear]);

  // Classes disponibles ordonnées
  const availableClassesForYear = useMemo(() => {
    const classes = [...LEVELS];
    students.forEach(s => {
      if (s.level && !classes.includes(s.level)) {
        classes.push(s.level);
      }
    });
    return classes;
  }, [students]);

  // 3. Élèves filtrés pour le formulaire : année sélectionnée + classe sélectionnée
  const filteredStudentsForPay = useMemo(() => {
    if (!payFilterLevel) return [];
    return studentsInSelectedYear
      .filter(s => s.level === payFilterLevel)
      .sort((a, b) => (a.lastName || "").localeCompare(b.lastName || ""));
  }, [studentsInSelectedYear, payFilterLevel]);

  const handleOpenPayModal = () => {
    if (!payFilterYear) {
      if (filterYear !== "ALL" && filterYear) {
        setPayFilterYear(filterYear);
      } else {
        const activeYear = academicYears.find(y => y.status === 'ACTIVE') || academicYears[0];
        const defaultYear = activeYear?.name || settings?.academic_year || settings?.academicYear || "2024-2025";
        setPayFilterYear(defaultYear);
      }
    }
    if (filterClass !== "ALL" && filterClass && !payFilterLevel) {
      setPayFilterLevel(filterClass);
    }
    setShowPayModal(true);
  };

  const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);

  const availableFees = useMemo(() => {
    if (!selectedStudent) return [];
    const fees: any[] = [];
    const level = selectedStudent.level || "";
    
    // Check canteenOptions on student
    const studentCanteenOpts = (selectedStudent as any).canteenOptions || [];
    const isUninterestedInCanteen = studentCanteenOpts.includes("Non intéressé");
    const isOldStudent = selectedStudent.studentType === "OLD";
    const isNewStudent = selectedStudent.studentType === "NEW" || !selectedStudent.studentType;

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
      // If payment modal has a selected academic year, only match fees of that year
      if (payFilterYear && fc.academic_year && fc.academic_year !== payFilterYear) {
        return;
      }

      if (fc.level === 'ALL' || fc.level === level) {
        // Skip MONTHLY as it's already handled in "Scolarité par tranches"
        if (fc.fee_type === 'MONTHLY') {
          return;
        }

        // Inscription filtering:
        // If student is Ancien élève -> skip INSCRIPTION_NEW and default INSCRIPTION
        if (isOldStudent && (fc.fee_type === 'INSCRIPTION_NEW' || fc.fee_type === 'INSCRIPTION')) {
          return;
        }
        // If student is Nouvel élève -> skip INSCRIPTION_OLD
        if (isNewStudent && fc.fee_type === 'INSCRIPTION_OLD') {
          return;
        }

        // Canteen and Supervised Care filtering:
        // If "Non intéressé" was selected during enrollment, hide Cantine and Garde surveillée
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
    
    // Fallbacks if no fees configured in DB yet
    if (isNewStudent && !fees.some(f => f.feeType === 'INSCRIPTION_NEW' || f.feeType === 'INSCRIPTION')) {
      fees.push({ id: "inscription_new", name: "Inscription Nouveau", amount: 2000, feeType: 'INSCRIPTION_NEW' });
    }
    if (isOldStudent && !fees.some(f => f.feeType === 'INSCRIPTION_OLD')) {
      fees.push({ id: "inscription_old", name: "Inscription Ancien", amount: 1000, feeType: 'INSCRIPTION_OLD' });
    }
    
    return fees;
  }, [selectedStudent, feeConfigs, payFilterYear]);

  const levelTranches = useMemo(() => {
     if (!selectedStudent) return [];
     const level = selectedStudent.level || "";
     const levelFee = feeConfigs.find(fc =>
       fc.fee_type === 'MONTHLY' &&
       (fc.level === 'ALL' || fc.level === level) &&
       (!payFilterYear || !fc.academic_year || fc.academic_year === payFilterYear)
     );
     if (levelFee && levelFee.tranches && levelFee.tranches.length > 0) {
        return levelFee.tranches.map((t: any) => ({ id: t.id, name: t.name, limit: t.limit, amount: t.amount }));
     }
     return getTranchesForLevel(level);
  }, [selectedStudent, feeConfigs, payFilterYear]);

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
          const totalPaid = paidAmountsPerFee[fee.id] || 0;
          const maxRemaining = Math.max(0, fee.amount - totalPaid);
          const customPay = feeAmountsToPay[fee.id] !== undefined ? Number(feeAmountsToPay[fee.id]) : maxRemaining;
          const amountToPay = Math.min(maxRemaining, Math.max(0, customPay));
          if (amountToPay > 0) {
            const rem = maxRemaining - amountToPay;
            items.push({ id, name: fee.name, amount: amountToPay, remaining: rem });
          }
        }
      }
    });

    customItems.forEach(ci => {
       if (ci.name && ci.amount && Number(ci.amount) > 0) {
          items.push({ name: ci.name, amount: Number(ci.amount) });
       }
    });

    return items;
  }, [selectedFeeIds, availableFees, levelTranches, trancheAmounts, feeAmountsToPay, paidAmountsPerFee]);

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
    const paymentYear = payFilterYear || selectedStudent.academic_year || selectedStudent.academicYear || "2024-2025";
    const items = currentPaymentItemsTemplate.map(i => ({ 
      id: i.id, 
      name: i.name, 
      amount: i.amount,
      academic_year: paymentYear
    }));

    const schoolId = user?.schoolId || selectedStudent.schoolId || (selectedStudent as any).school_id;
    const parentId = selectedStudent.parentId || (selectedStudent as any).parent_id || null;

    const roleForPayment = user?.role === "SCHOOL_ADMIN" ? "SCHOOL_ADMIN" : (user?.role === "CASHIER" ? "CASHIER" : (user?.role || "CASHIER"));
    const nameForPayment = user?.name || (roleForPayment === "SCHOOL_ADMIN" ? "Directeur" : "Caisse");

    const payload: any = {
       school_id: schoolId,
       student_id: selectedStudent.id,
       parent_id: parentId,
       amount: totalAmount,
       network: paymentMethod,
       status: 'PENDING',
       reference: reference,
       payment_date: new Date().toISOString(),
       items: items,
       next_payment_date: (hasPartialPayment && nextPaymentDate) ? nextPaymentDate : null,
       recorded_by_role: roleForPayment,
       recorded_by_name: nameForPayment,
       recorded_by_id: user?.id || null
    };

    let { data: inserted, error } = await supabase.from('payments').insert(payload).select().single();

    // Fallbacks if optional columns don't exist in Supabase schema cache
    if (error && error.message && (error.message.includes("recorded_by") || error.message.includes("Could not find the 'recorded_by"))) {
       delete payload.recorded_by_role;
       delete payload.recorded_by_name;
       delete payload.recorded_by_id;
       const retry = await supabase.from('payments').insert(payload).select().single();
       inserted = retry.data;
       error = retry.error;
    }
    if (error && error.message && error.message.includes("Could not find the 'payment_date' column")) {
       delete payload.payment_date;
       const retry = await supabase.from('payments').insert(payload).select().single();
       inserted = retry.data;
       error = retry.error;
    }
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
       alert("Erreur lors de l'enregistrement: " + error.message);
       return;
    }
    alert("Encaissement enregistré avec succès ! La transaction a été envoyée dans l'onglet Vérifications pour validation avant intégration à l'historique global.");
    
    fetchData(); // Reload dashboard data
    setShowConfirmModal(false);
    setShowPayModal(false);
    setSelectedStudentId("");
    setPayFilterLevel("");
    setSelectedFeeIds([]);
    setTrancheAmounts({});
    setFeeAmountsToPay({});
    setCustomItems([{name: "", amount: ""}]);
    setPaymentMethod("ESPÈCES");

    // Redirect to verification tab and trigger notification update
    setActiveTab("VERIFICATION");
    window.dispatchEvent(new CustomEvent('refresh_notifications'));
    
    if (isMomo) {
      if (window.confirm("Paiement enregistré pour vérification. Voulez-vous lancer le code USSD sur cet appareil pour valider la transaction via téléphone ?")) {
          const ussdCode = `*880*41*681199*${totalAmountWithFee}#`;
          window.location.href = `tel:${ussdCode.replace('#', '%23')}`;
      }
    }
  };
  const handleFeeToggle = (id: string, isChecked: boolean, remainingAmount?: number) => {
    if (isChecked) {
       setSelectedFeeIds(prev => [...prev, id]);
       if (remainingAmount !== undefined) {
          setTrancheAmounts(prev => ({ ...prev, [id]: remainingAmount.toString() }));
          setFeeAmountsToPay(prev => ({ ...prev, [id]: remainingAmount.toString() }));
       }
    } else {
       setSelectedFeeIds(prev => prev.filter(f => f !== id));
    }
  };

  const addCustomItem = () => setCustomItems([...customItems, {name: "", amount: ""}]);
  const removeCustomItem = (idx: number) => setCustomItems(customItems.filter((_, i) => i !== idx));

  const executeWhatsAppReceipt = (phone: string, payment: Payment, student: Student) => {
    const formattedPhone = phone.replace(/\D/g, '');
    
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
            
            ${settings?.logo ? `<img src="${settings.logo}" style="max-height: 60px; object-fit: contain; margin-bottom: 10px;" />` : ''}
            <h1 style="margin-top: 0;">${settings?.name || "L'École"}</h1>
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
    
    // Status filter: default to COMPLETED so pending encaissements do not update global history before validation
    if (filterStatus === "COMPLETED" && p.status === "PENDING") return false;
    if (filterStatus === "PENDING" && p.status !== "PENDING") return false;

    // Academic Year filter
    if (filterYear !== "ALL") {
      const pYear = (p as any).academic_year || (p as any).academicYear || student.academic_year || student.academicYear;
      if (pYear && pYear !== filterYear) return false;
    }

    // Type filter
    let matchType = true;
    if (filterType !== "ALL") {
       matchType = p.items?.some(i => i.name.toLowerCase().includes(filterType.toLowerCase())) || false;
       if (!p.items?.length && filterType === "Scolarité") matchType = true; // Default payments are usually scolarité
    }
    
    // Class filter
    let matchClass = true;
    if (filterClass !== "ALL") {
       matchClass = student.level === filterClass;
    }

    // Actor filter
    if (filterActor !== "ALL") {
      const role = ((p as any).recorded_by_role || (p as any).recordedByRole || "").toUpperCase();
      if (filterActor === "PARENT") {
        const isParent = role === "PARENT" || Boolean(p.parentId || (p as any).parent_id);
        if (!isParent) return false;
      } else if (filterActor === "CAISSE") {
        const isCaisse = role === "CASHIER" || (!p.parentId && !(p as any).parent_id && (p.network === "ESPÈCES" || p.network === "CASH" || !p.network));
        if (!isCaisse) return false;
      } else if (filterActor === "DIRECTEUR") {
        const isDir = role === "SCHOOL_ADMIN" || role === "DIRECTEUR";
        if (!isDir) return false;
      }
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
            className={`px-4 py-2 rounded text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${activeTab === "VERIFICATION" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            <span>Vérifications</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[10px] rounded-full font-bold animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab("PAYMENTS")} 
 
            className={`px-4 py-2 rounded text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-colors ${activeTab === "PAYMENTS" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Encaissements
          </button>
          <button 
            onClick={() => setActiveTab("CREANCES")} 
            className={`px-4 py-2 rounded text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${activeTab === "CREANCES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            <span>Créances</span>
            {overdueCountGlobal > 0 && (
              <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] rounded-full font-bold animate-pulse flex items-center gap-0.5" title={`${overdueCountGlobal} élève(s) avec date limite dépassée`}>
                <AlertTriangle size={10} />
                {overdueCountGlobal}
              </span>
            )}
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFeeTableModal(true)}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded font-bold uppercase tracking-wider text-xs hover:bg-indigo-100 transition shadow-sm"
              title="Consulter et modifier la grille générale des tarifs par classe"
            >
              <Table size={16} /> Grille des Frais
            </button>
            <button
              onClick={handleOpenPayModal}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded font-bold uppercase tracking-wider text-xs hover:bg-emerald-700 transition"
            >
              <CreditCard size={16} /> Encaisser
            </button>
          </div>
        )}
      </div>

      
      {activeTab === "PAYMENTS" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-2">
             <h3 className="font-bold text-gray-700 flex items-center gap-2"><History size={18}/> Historique Global</h3>
             <span className="text-xs text-slate-400">({filteredPayments.length} transaction{filteredPayments.length > 1 ? 's' : ''})</span>
           </div>
           <div className="flex flex-wrap items-center gap-2">
             <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="px-3 py-1.5 border border-slate-200 rounded-md text-xs font-semibold focus:ring-emerald-500 outline-none">
               <option value="COMPLETED">Validés uniquement</option>
               <option value="PENDING">En attente ({pendingCount})</option>
               <option value="ALL">Toutes les transactions</option>
             </select>

             <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-emerald-500 outline-none">
               <option value="ALL">Toutes les années</option>
               {academicYears.map(y => <option key={y.name} value={y.name}>{y.name}</option>)}
             </select>

             <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-emerald-500 outline-none">
               <option value="ALL">Toutes les classes</option>
               {Array.from(new Set(students.map(s => s.level))).filter(Boolean).map(level => (
                 <option key={level} value={level}>{level}</option>
               ))}
             </select>

             <select value={filterActor} onChange={e => setFilterActor(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-md text-xs font-semibold focus:ring-emerald-500 outline-none">
               <option value="ALL">Tous les initiateurs</option>
               <option value="PARENT">👤 Par Parent</option>
               <option value="CAISSE">💼 Par Caisse</option>
               <option value="DIRECTEUR">🏫 Par Directeur</option>
             </select>
             <div className="relative">
               <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
               <input 
                 type="text" 
                 placeholder="Recherche..." 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none w-44"
               />
             </div>
           </div>
         </div>

         {pendingCount > 0 && filterStatus === "COMPLETED" && (
           <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
             <div className="flex items-center gap-2">
               <Clock size={16} className="text-amber-600 shrink-0" />
               <span><strong>{pendingCount} transaction(s) en attente</strong> de validation dans l'onglet Vérifications avant intégration à l'historique global.</span>
             </div>
             <button 
               onClick={() => setActiveTab("VERIFICATION")} 
               className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold uppercase tracking-wider text-[10px] transition-colors shrink-0 ml-2"
             >
               Vérifier maintenant
             </button>
           </div>
         )}

         {/* Mobile Card View */}
         <div className="sm:hidden divide-y divide-slate-100">
           {filteredPayments.length === 0 ? (
             <div className="p-8 text-center text-slate-500 text-xs">
               Aucun encaissement trouvé.
             </div>
           ) : (
             filteredPayments.map(payment => {
               const student = students.find(s => s.id === payment.studentId);
               const studentName = student ? `${student.firstName} ${student.lastName}` : "Inconnu";
               const paymentDateObj = payment.date ? new Date(payment.date) : ((payment as any).created_at ? new Date((payment as any).created_at) : null);
               const dateStr = paymentDateObj && !isNaN(paymentDateObj.getTime()) ? paymentDateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
               const timeStr = paymentDateObj && !isNaN(paymentDateObj.getTime()) ? paymentDateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
               const paymentYear = (payment as any).academic_year || (payment as any).academicYear || student?.academic_year || student?.academicYear || "2024-2025";
               
               return (
                 <div key={payment.id} className="p-4 flex flex-col gap-2 hover:bg-slate-50 transition-colors">
                   <div className="flex items-center justify-between">
                     <span className="font-bold text-gray-800 text-sm">{studentName}</span>
                     <span className="font-mono font-bold text-emerald-600 text-sm">{payment.amount.toLocaleString()} FCFA</span>
                   </div>
                   <div className="flex items-center justify-between text-xs text-slate-500">
                     <span className="flex items-center gap-1.5">
                       <span>{student?.level || '-'}</span>
                       <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] font-semibold">
                         {paymentYear}
                       </span>
                     </span>
                     <span className="flex items-center gap-1 font-mono text-gray-700 text-xs font-semibold">
                       <Clock size={12} className="text-emerald-600" />
                       <span>{dateStr} à {timeStr || '--:--'}</span>
                     </span>
                   </div>
                   <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                     <div className="flex items-center gap-2">
                       <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                         {payment.network || 'ESPÈCES'}
                       </span>
                       <span className="font-mono text-slate-400 text-[10px]">({payment.reference})</span>
                     </div>
                     <div className="flex flex-wrap items-center gap-1.5">
                       <PaymentActorBadge payment={payment} profiles={profiles} size="sm" showName={true} />
                       {payment.status === 'PENDING' ? (
                         <span className="px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold uppercase">En Vérif.</span>
                       ) : (
                         <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold uppercase">Validé</span>
                       )}
                       {student && (
                         <div className="flex items-center gap-1 ml-1">
                           <button onClick={() => printReceipt(payment, student)} className="p-1.5 text-slate-500 hover:text-gray-700 hover:bg-slate-200 rounded" title="Imprimer le reçu">
                             <Printer size={15} />
                           </button>
                           <button onClick={() => sendWhatsAppReceipt(payment, student)} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded" title="WhatsApp">
                             <MessageCircle size={15} />
                           </button>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
               );
             })
           )}
         </div>

         {/* Desktop Table View */}
         <div className="hidden sm:block overflow-x-auto">
           <table className="w-full text-left border-collapse">
             <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold">
               <tr className="border-b border-slate-100">
                 <th className="px-4 py-3">Date & Heure</th>
                 <th className="px-4 py-3">Référence</th>
                 <th className="px-4 py-3">Élève</th>
                 <th className="px-4 py-3">Initié par</th>
                 <th className="px-4 py-3">Moyen</th>
                 <th className="px-4 py-3 text-right">Montant</th>
                 <th className="px-4 py-3 text-center">Statut</th>
                 <th className="px-4 py-3 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {filteredPayments.length === 0 ? (
                 <tr>
                   <td colSpan={8} className="p-8 text-center text-slate-500 text-xs">
                     Aucun encaissement trouvé pour ces critères.
                   </td>
                 </tr>
               ) : (
                 filteredPayments.map(payment => {
                   const student = students.find(s => s.id === payment.studentId);
                   const studentName = student ? `${student.firstName} ${student.lastName}` : "Inconnu";
                   const paymentDateObj = payment.date ? new Date(payment.date) : ((payment as any).created_at ? new Date((payment as any).created_at) : null);
                   const dateStr = paymentDateObj && !isNaN(paymentDateObj.getTime()) ? paymentDateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
                   const timeStr = paymentDateObj && !isNaN(paymentDateObj.getTime()) ? paymentDateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
                   
                   return (
                     <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                       <td className="px-4 py-3 text-xs">
                         <span className="font-semibold text-gray-800">{dateStr}</span>
                         {timeStr && (
                           <span className="text-[11px] text-emerald-600 font-mono font-medium flex items-center gap-1 mt-0.5">
                             <Clock size={11} className="text-emerald-500" />
                             {timeStr}
                           </span>
                         )}
                       </td>
                       <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{payment.reference}</td>
                       <td className="px-4 py-3">
                         <p className="text-xs font-semibold text-gray-700">{studentName}</p>
                         <p className="text-[10px] text-slate-500 mt-0.5">{student?.level || '-'} <span className="ml-1 px-1 bg-emerald-50 text-emerald-600 rounded font-semibold">{student?.academicYear || student?.academic_year || 'Année inconnue'}</span></p>
                       </td>
                       <td className="px-4 py-3">
                         <PaymentActorBadge payment={payment} profiles={profiles} size="sm" showName={true} />
                       </td>
                       <td className="px-4 py-3">
                         <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                           {payment.network || 'ESPÈCES'}
                         </span>
                       </td>
                       <td className="px-4 py-3 font-mono text-xs font-bold text-right">{payment.amount.toLocaleString()} F</td>
                       <td className="px-4 py-3 text-center">
                         {payment.status === 'PENDING' ? (
                           <span className="px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold uppercase">En Vérif.</span>
                         ) : (
                           <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold uppercase">Validé</span>
                         )}
                       </td>
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
                 })
               )}
             </tbody>
           </table>
         </div>
      </div>
      )}

      {activeTab === "VERIFICATION" && <CashierVerification />}
      {activeTab === "CREANCES" && (
        <CashierDebts
          students={students}
          payments={payments}
          academicYears={academicYears}
          feeConfigs={feeConfigs}
          getTranchesForLevel={getTranchesForLevel}
          onSelectStudentForPayment={(studentId) => {
            const s = students.find(st => st.id === studentId);
            if (s) {
              const sYear = s.academic_year || s.academicYear || "2024-2025";
              setPayFilterYear(sYear);
              if (s.level) setPayFilterLevel(s.level);
              setSelectedStudentId(s.id);
              setActiveTab("PAYMENTS");
              setShowPayModal(true);
            }
          }}
        />
      )}
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
            {/* 1. Année Scolaire (créée par le directeur) */}
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide flex items-center justify-between">
                <span>1. Année Scolaire</span>
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                  Créée par la direction
                </span>
              </label>
              <select 
                required 
                value={payFilterYear} 
                onChange={e => {
                  const newYear = e.target.value;
                  setPayFilterYear(newYear);
                  setPayFilterLevel("");
                  setSelectedStudentId("");
                  setSelectedFeeIds([]);
                  setTrancheAmounts({});
                  setFeeAmountsToPay({});
                }} 
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white font-medium shadow-sm transition-all"
              >
                <option value="">Sélectionnez l'année scolaire...</option>
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
                    {availableClassesForYear.filter(l => (studentCountByClass[l] || 0) > 0).length} classe(s) avec inscrits
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
                  setSelectedStudentId("");
                  setSelectedFeeIds([]);
                  setTrancheAmounts({});
                  setFeeAmountsToPay({});
                }} 
                className={`w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-medium shadow-sm transition-all ${
                  !payFilterYear ? 'bg-slate-100 cursor-not-allowed text-slate-400' : 'bg-white text-gray-800'
                }`}
              >
                <option value="">
                  {!payFilterYear ? "Veuillez d'abord choisir l'année..." : "Sélectionnez une classe..."}
                </option>
                {availableClassesForYear.map(lvl => {
                  const count = studentCountByClass[lvl] || 0;
                  return (
                    <option key={lvl} value={lvl}>
                      {lvl} {count > 0 ? `(${count} élève${count > 1 ? 's' : ''})` : '(0 élève)'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 3. Élève */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>3. Élève</span>
                  {payFilterLevel && (
                    <span className="text-[10px] font-normal text-slate-500">
                      ({filteredStudentsForPay.length} inscrit{filteredStudentsForPay.length > 1 ? 's' : ''} en {payFilterLevel})
                    </span>
                  )}
                </div>
                {selectedStudent && (
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${selectedStudent.studentType === 'OLD' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {selectedStudent.studentType === 'OLD' ? 'Ancien élève' : 'Nouvel élève'}
                  </span>
                )}
              </label>
              <select 
                required 
                disabled={!payFilterLevel}
                value={selectedStudentId} 
                onChange={e => {
                  setSelectedStudentId(e.target.value);
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
                ) : filteredStudentsForPay.length === 0 ? (
                  <option value="">Aucun élève trouvé en {payFilterLevel} pour l'année {payFilterYear}</option>
                ) : (
                  <>
                    <option value="">Sélectionnez un élève...</option>
                    {filteredStudentsForPay.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.lastName?.toUpperCase()} {c.firstName} {c.matricule ? `[${c.matricule}]` : ''} - {c.studentType === 'OLD' ? 'Ancien' : 'Nouveau'}
                      </option>
                    ))}
                  </>
                )}
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
                             onChange={e => handleFeeToggle(tranche.id, e.target.checked, remaining)} 
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
                     <div key={fee.id} className={`flex items-center justify-between gap-3 ${isPaidOut ? 'opacity-50' : ''}`}>
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
                              value={feeAmountsToPay[fee.id] !== undefined ? feeAmountsToPay[fee.id] : remaining}
                              onChange={e => {
                                const val = Number(e.target.value);
                                if (val > remaining) {
                                  setFeeAmountsToPay(prev => ({ ...prev, [fee.id]: remaining.toString() }));
                                } else {
                                  setFeeAmountsToPay(prev => ({ ...prev, [fee.id]: e.target.value }));
                                }
                              }} 
                              className="w-28 px-2 py-1 border border-slate-300 rounded text-sm outline-none text-right" 
                            />
                          )}
                          <span className="text-xs font-bold text-slate-600 min-w-16 whitespace-nowrap text-right">
                            {isPaidOut ? "Payé" : (paid > 0 ? `Reste: ${remaining.toLocaleString()}F / ${fee.amount.toLocaleString()}F` : `${fee.amount.toLocaleString()} F`)}
                          </span>
                        </div>
                     </div>
                   )})}
                 </div>
              </div>
            )}

            <div className="md:col-span-2">
               <div className="flex justify-between items-center bg-emerald-50 px-4 py-3 border border-emerald-100 rounded-lg mb-4">
                 <div>
                   <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                     Total à payer {isMomo && '(dont 1% frais)'}
                   </span>
                   {isMomo && transactionFee > 0 && (
                     <span className="block text-[10px] text-slate-500 font-medium mt-0.5">
                       Sous-total: {totalAmount.toLocaleString()} FCFA + Frais Mobile (1%): {transactionFee.toLocaleString()} FCFA
                     </span>
                   )}
                 </div>
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
              <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95 overflow-hidden">
                  <div className="p-4 border-b border-slate-100">
                    <h3 className="font-bold text-gray-700">Confirmer l'encaissement</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-slate-600 mb-4">Confirmez-vous l'encaissement pour cet élève ?</p>
                    {selectedStudent && (
                      <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">Année scolaire :</span>
                          <span className="font-bold text-slate-800">{payFilterYear}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">Classe :</span>
                          <span className="font-bold text-slate-800">{selectedStudent.level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">Élève :</span>
                          <span className="font-bold text-slate-800">{selectedStudent.lastName?.toUpperCase()} {selectedStudent.firstName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">Mode de règlement :</span>
                          <span className="font-bold text-emerald-700">{paymentMethod}</span>
                        </div>
                      </div>
                    )}
                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg flex justify-between items-center font-bold text-lg border border-emerald-100">
                      <span>Total à encaisser</span>
                      <span>{totalAmountWithFee.toLocaleString()} FCFA</span>
                    </div>
                    {isMomo && <p className="text-xs text-orange-600 mt-2">*Inclut 1% de frais de transaction réseau.</p>}
                  </div>
                  <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                    <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded transition-colors text-sm">Annuler</button>
                    <button onClick={confirmPayment} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded transition-colors text-sm">Oui, encaisser</button>
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
      {/* General Fee Matrix Modal */}
      <FeeTableModal
        isOpen={showFeeTableModal}
        onClose={() => setShowFeeTableModal(false)}
        academicYears={academicYears}
        currentYear={filterYear !== "ALL" ? filterYear : (academicYears[0]?.name || "2024-2025")}
        onSaved={() => {
          fetchData();
        }}
      />
    </div>
  );
}
