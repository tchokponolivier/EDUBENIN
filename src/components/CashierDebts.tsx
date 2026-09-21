import React, { useState, useMemo } from "react";
import { Student, Payment, FeeConfig, LEVELS } from "../types";
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  MessageCircle, 
  Printer, 
  User, 
  Calendar, 
  DollarSign, 
  ChevronRight, 
  Phone, 
  ArrowUpDown, 
  Download, 
  X,
  FileText,
  BadgeAlert,
  Coins
} from "lucide-react";
import { getRandomStudentPhoto } from "../lib/studentPhotos";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";

interface CashierDebtsProps {
  students: Student[];
  payments: Payment[];
  academicYears: { id?: string; name: string; status?: string }[];
  feeConfigs: any[];
  onSelectStudentForPayment?: (studentId: string) => void;
  getTranchesForLevel: (level: string) => { id: string; name: string; limit: string; amount: number }[];
}

export interface UnpaidItem {
  id: string;
  name: string;
  category: "Scolarité" | "Inscription" | "Cantine" | "Transport" | "Autre";
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  limitStr: string;
  deadlineDate: Date | null;
  isOverdue: boolean;
  daysOverdue: number;
}

export interface StudentDebtProfile {
  student: Student;
  academicYear: string;
  totalExpected: number;
  totalPaid: number;
  totalRemaining: number;
  unpaidItems: UnpaidItem[];
  allFeeItems: UnpaidItem[];
  hasOverdueAlert: boolean;
  overdueCount: number;
  maxDaysOverdue: number;
  percentPaid: number;
}

// Parses deadline string like "31 Octobre", "30 Novembre", "30 Décembre", "Fin Octobre", or ISO "2024-11-15"
export function parseDeadlineDate(limitStr: string | undefined, academicYearStr?: string): Date | null {
  if (!limitStr) return null;
  const clean = limitStr.trim();
  
  // 1. Try ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) return d;
  }

  // 2. Academic year bounds (e.g. "2024-2025")
  let startYear = new Date().getFullYear();
  let endYear = startYear + 1;
  if (academicYearStr) {
    const match = academicYearStr.match(/(\d{4})\s*[-/]\s*(\d{4})/);
    if (match) {
      startYear = parseInt(match[1]);
      endYear = parseInt(match[2]);
    }
  }

  const lower = clean.toLowerCase();
  const months: Record<string, { month: number; defaultDay: number; useEndYear?: boolean }> = {
    "septembre": { month: 8, defaultDay: 30 },
    "octobre": { month: 9, defaultDay: 31 },
    "novembre": { month: 10, defaultDay: 30 },
    "décembre": { month: 11, defaultDay: 31 },
    "decembre": { month: 11, defaultDay: 31 },
    "janvier": { month: 0, defaultDay: 31, useEndYear: true },
    "février": { month: 1, defaultDay: 28, useEndYear: true },
    "fevrier": { month: 1, defaultDay: 28, useEndYear: true },
    "mars": { month: 2, defaultDay: 31, useEndYear: true },
    "avril": { month: 3, defaultDay: 30, useEndYear: true },
    "mai": { month: 4, defaultDay: 31, useEndYear: true },
    "juin": { month: 5, defaultDay: 30, useEndYear: true },
    "juillet": { month: 6, defaultDay: 31, useEndYear: true }
  };

  for (const [mName, mInfo] of Object.entries(months)) {
    if (lower.includes(mName)) {
      const dayMatch = lower.match(/\b(\d{1,2})\b/);
      const day = dayMatch ? parseInt(dayMatch[1]) : mInfo.defaultDay;
      const year = mInfo.useEndYear ? endYear : startYear;
      return new Date(year, mInfo.month, day, 23, 59, 59);
    }
  }

  return null;
}

export function CashierDebts({
  students,
  payments,
  academicYears,
  feeConfigs,
  onSelectStudentForPayment,
  getTranchesForLevel
}: CashierDebtsProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");
  const [filterAlert, setFilterAlert] = useState<"ALL" | "OVERDUE" | "UPCOMING">("ALL");
  const [sortBy, setSortBy] = useState<"DEBT_DESC" | "OVERDUE_DESC" | "NAME">("OVERDUE_DESC");
  
  // Selected student for details modal
  const [selectedProfile, setSelectedProfile] = useState<StudentDebtProfile | null>(null);
  const [notificationSent, setNotificationSent] = useState<string | null>(null);

  // Available classes list
  const availableClasses = useMemo(() => {
    const list = [...LEVELS];
    students.forEach(s => {
      if (s.level && !list.includes(s.level)) {
        list.push(s.level);
      }
    });
    return list;
  }, [students]);

  // Available academic years
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    academicYears.forEach(y => y.name && set.add(y.name));
    students.forEach(s => {
      const y = s.academic_year || s.academicYear;
      if (y) set.add(y);
    });
    return Array.from(set).sort().reverse();
  }, [academicYears, students]);

  // Compute debt profiles for all students
  const studentDebtProfiles = useMemo(() => {
    const now = new Date();

    const FEE_NAME_MAPPINGS: Record<string, string> = {
      INSCRIPTION: "Frais d'inscription",
      INSCRIPTION_NEW: "Inscription Nouveau",
      INSCRIPTION_OLD: "Inscription Ancien",
      TD: "Travaux Dirigés (TD)",
      ID_CARD: "Carte Scolaire",
      UNIFORMS: "Uniforme scolaire",
      SPORTS_WEAR: "Tenue de Sport",
      EVALUATION: "Frais d'évaluation",
      VACATION_CLASSES: "Cours de vacances",
      REINFORCEMENT_CLASSES: "Cours de renforcement",
      TRANSPORT: "Transport scolaire",
      CANTEEN: "Cantine scolaire",
      SUPERVISED_CARE: "Garde surveillée"
    };

    return students.map(student => {
      const level = student.level || "";
      const studentYear = student.academic_year || student.academicYear || "2024-2025";
      const isOldStudent = student.studentType === "OLD";
      const isNewStudent = student.studentType === "NEW" || !student.studentType;
      const studentCanteenOpts = (student as any).canteenOptions || [];
      const isUninterestedInCanteen = studentCanteenOpts.includes("Non intéressé");

      // 1. Gather all applicable fees & tranches
      const applicableFees: {
        id: string;
        name: string;
        category: "Scolarité" | "Inscription" | "Cantine" | "Transport" | "Autre";
        amount: number;
        limitStr: string;
      }[] = [];

      // A. Scolarité tranches (from fee_config MONTHLY or fallback)
      const levelMonthlyFee = feeConfigs.find(fc =>
        fc.fee_type === 'MONTHLY' &&
        (fc.level === 'ALL' || fc.level === level) &&
        (!fc.academic_year || fc.academic_year === studentYear)
      );

      let tranches: { id: string; name: string; limit: string; amount: number }[] = [];
      if (levelMonthlyFee && levelMonthlyFee.tranches && levelMonthlyFee.tranches.length > 0) {
        tranches = levelMonthlyFee.tranches.map((t: any) => ({
          id: t.id || `tranche-${t.name}`,
          name: t.name,
          limit: t.limit || "",
          amount: Number(t.amount) || 0
        }));
      } else {
        tranches = getTranchesForLevel(level);
      }

      tranches.forEach(t => {
        applicableFees.push({
          id: t.id,
          name: `Scolarité - ${t.name}`,
          category: "Scolarité",
          amount: t.amount,
          limitStr: t.limit
        });
      });

      // B. Ancillary fees (Inscription, Uniform, Cantine, etc.)
      feeConfigs.forEach(fc => {
        if (fc.fee_type === 'MONTHLY') return;
        if (fc.academic_year && fc.academic_year !== studentYear) return;
        if (fc.level !== 'ALL' && fc.level !== level) return;

        // Skip inscription variants according to student type
        if (isOldStudent && (fc.fee_type === 'INSCRIPTION_NEW' || fc.fee_type === 'INSCRIPTION')) return;
        if (isNewStudent && fc.fee_type === 'INSCRIPTION_OLD') return;
        if (isUninterestedInCanteen && (fc.fee_type === 'CANTEEN' || fc.fee_type === 'SUPERVISED_CARE')) return;

        let category: "Scolarité" | "Inscription" | "Cantine" | "Transport" | "Autre" = "Autre";
        if (fc.fee_type.includes("INSCRIPTION")) category = "Inscription";
        else if (fc.fee_type === "CANTEEN") category = "Cantine";
        else if (fc.fee_type === "TRANSPORT") category = "Transport";

        applicableFees.push({
          id: fc.id,
          name: FEE_NAME_MAPPINGS[fc.fee_type] || fc.fee_type,
          category,
          amount: Number(fc.amount) || 0,
          limitStr: fc.limit || "À l'inscription"
        });
      });

      // Fallback for inscription if not in feeConfigs
      if (isNewStudent && !applicableFees.some(f => f.category === 'Inscription')) {
        applicableFees.push({ id: "inscription_new", name: "Inscription Nouveau", category: "Inscription", amount: 2000, limitStr: "À l'inscription" });
      }
      if (isOldStudent && !applicableFees.some(f => f.category === 'Inscription')) {
        applicableFees.push({ id: "inscription_old", name: "Inscription Ancien", category: "Inscription", amount: 1000, limitStr: "À l'inscription" });
      }

      // 2. Fetch completed payments for this student
      const studentPayments = payments.filter(p => p.studentId === student.id && p.status === "COMPLETED");

      // Track paid amounts per fee item
      const paidPerFee: Record<string, number> = {};
      let nextPaymentDateFromPays: string | null = null;

      studentPayments.forEach(p => {
        if (p.nextPaymentDate || (p as any).next_payment_date) {
          nextPaymentDateFromPays = p.nextPaymentDate || (p as any).next_payment_date;
        }

        if (p.items && p.items.length > 0) {
          p.items.forEach(item => {
            if (item.id) {
              paidPerFee[item.id] = (paidPerFee[item.id] || 0) + (Number(item.amount) || 0);
            } else {
              // Match by name
              const match = applicableFees.find(f => f.name.toLowerCase() === item.name.toLowerCase());
              if (match) {
                paidPerFee[match.id] = (paidPerFee[match.id] || 0) + (Number(item.amount) || 0);
              }
            }
          });
        } else {
          // If untracked items, attribute payment sequentially to tranches
          let unallocated = Number(p.amount) || 0;
          for (const fee of applicableFees) {
            if (unallocated <= 0) break;
            const alreadyPaid = paidPerFee[fee.id] || 0;
            const need = Math.max(0, fee.amount - alreadyPaid);
            if (need > 0) {
              const take = Math.min(need, unallocated);
              paidPerFee[fee.id] = alreadyPaid + take;
              unallocated -= take;
            }
          }
        }
      });

      // 3. Build detailed items list & compute deadlines
      const allFeeItems: UnpaidItem[] = applicableFees.map(fee => {
        const paidAmount = paidPerFee[fee.id] || 0;
        const remainingAmount = Math.max(0, fee.amount - paidAmount);
        
        // Compute deadline date
        let deadlineDate = parseDeadlineDate(fee.limitStr, studentYear);
        // If there's an explicit next_payment_date recorded and fee has remaining amount, use it as commitment date
        if (remainingAmount > 0 && nextPaymentDateFromPays) {
          const nextDate = new Date(nextPaymentDateFromPays);
          if (!isNaN(nextDate.getTime())) {
            deadlineDate = nextDate;
          }
        }

        let isOverdue = false;
        let daysOverdue = 0;

        if (remainingAmount > 0 && deadlineDate) {
          if (now.getTime() > deadlineDate.getTime()) {
            isOverdue = true;
            daysOverdue = Math.max(1, Math.floor((now.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24)));
          }
        }

        return {
          id: fee.id,
          name: fee.name,
          category: fee.category,
          totalAmount: fee.amount,
          paidAmount,
          remainingAmount,
          limitStr: fee.limitStr,
          deadlineDate,
          isOverdue,
          daysOverdue
        };
      });

      const unpaidItems = allFeeItems.filter(item => item.remainingAmount > 0);
      const overdueItems = unpaidItems.filter(item => item.isOverdue);
      const totalExpected = allFeeItems.reduce((acc, curr) => acc + curr.totalAmount, 0);
      const totalPaid = allFeeItems.reduce((acc, curr) => acc + curr.paidAmount, 0);
      const totalRemaining = unpaidItems.reduce((acc, curr) => acc + curr.remainingAmount, 0);
      const percentPaid = totalExpected > 0 ? Math.min(100, Math.round((totalPaid / totalExpected) * 100)) : 100;
      const maxDaysOverdue = overdueItems.length > 0 ? Math.max(...overdueItems.map(i => i.daysOverdue)) : 0;

      return {
        student,
        academicYear: studentYear,
        totalExpected,
        totalPaid,
        totalRemaining,
        unpaidItems,
        allFeeItems,
        hasOverdueAlert: overdueItems.length > 0,
        overdueCount: overdueItems.length,
        maxDaysOverdue,
        percentPaid
      };
    });
  }, [students, payments, feeConfigs, academicYears, getTranchesForLevel]);

  // Filter students who owe money (debtors)
  const debtorProfiles = useMemo(() => {
    return studentDebtProfiles.filter(p => p.totalRemaining > 0);
  }, [studentDebtProfiles]);

  // Overall KPIs
  const kpiStats = useMemo(() => {
    const totalDebtsAmount = debtorProfiles.reduce((sum, p) => sum + p.totalRemaining, 0);
    const totalExpectedAmount = studentDebtProfiles.reduce((sum, p) => sum + p.totalExpected, 0);
    const totalPaidAmount = studentDebtProfiles.reduce((sum, p) => sum + p.totalPaid, 0);
    const totalOverdueDebtors = debtorProfiles.filter(p => p.hasOverdueAlert).length;
    const globalRecoveryRate = totalExpectedAmount > 0 ? Math.round((totalPaidAmount / totalExpectedAmount) * 100) : 0;

    return {
      totalDebtsAmount,
      totalDebtorsCount: debtorProfiles.length,
      totalOverdueDebtors,
      globalRecoveryRate
    };
  }, [debtorProfiles, studentDebtProfiles]);

  // Filtered and sorted profiles for the display
  const displayedProfiles = useMemo(() => {
    return debtorProfiles.filter(profile => {
      const student = profile.student;

      // Filter by academic year
      if (filterYear !== "ALL") {
        if (profile.academicYear !== filterYear) return false;
      }

      // Filter by class / level
      if (filterClass !== "ALL") {
        if (student.level !== filterClass) return false;
      }

      // Filter by alert status
      if (filterAlert === "OVERDUE" && !profile.hasOverdueAlert) return false;
      if (filterAlert === "UPCOMING" && profile.hasOverdueAlert) return false;

      // Filter by search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
        const matricule = (student.matricule || '').toLowerCase();
        if (!fullName.includes(query) && !matricule.includes(query)) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "OVERDUE_DESC") {
        if (a.hasOverdueAlert !== b.hasOverdueAlert) {
          return a.hasOverdueAlert ? -1 : 1;
        }
        return b.maxDaysOverdue - a.maxDaysOverdue || b.totalRemaining - a.totalRemaining;
      }
      if (sortBy === "DEBT_DESC") {
        return b.totalRemaining - a.totalRemaining;
      }
      if (sortBy === "NAME") {
        return (a.student.lastName || "").localeCompare(b.student.lastName || "");
      }
      return 0;
    });
  }, [debtorProfiles, filterYear, filterClass, filterAlert, searchTerm, sortBy]);

  // Send WhatsApp reminder to parent
  const handleSendWhatsAppReminder = (profile: StudentDebtProfile) => {
    const s = profile.student;
    const phone = s.fatherContact || s.motherContact || s.guardianContact || "";
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const parentName = s.fatherName || s.motherName || s.guardianName || "Parent d'élève";
    const studentName = `${s.firstName} ${s.lastName}`;

    const overdueLines = profile.unpaidItems
      .filter(item => item.isOverdue)
      .map(item => `• ${item.name} : ${item.remainingAmount.toLocaleString()} FCFA (Échéance : ${item.limitStr}, retard : ${item.daysOverdue} j)`)
      .join('\n');

    const generalLines = profile.unpaidItems
      .map(item => `• ${item.name} : ${item.remainingAmount.toLocaleString()} FCFA`)
      .join('\n');

    let text = `Bonjour M./Mme ${parentName},\n\nRappel de la Direction de l'Établissement concernant les frais scolaires de votre enfant *${studentName}* (${s.level || 'Classe non précisée'}).\n\n`;
    
    if (profile.hasOverdueAlert) {
      text += `🚨 *ATTENTION : Des échéances sont arrivées à dépassement :*\n${overdueLines}\n\n`;
    }

    text += `*Montant total restant à régulariser : ${profile.totalRemaining.toLocaleString()} FCFA*\n`;
    text += `Détail des impayés :\n${generalLines}\n\n`;
    text += `Nous vous prions de bien vouloir régulariser cette situation auprès de la caisse ou via votre portail parent dans les plus brefs délais.\n\nCordialement,\nLa Direction Financière.`;

    const encoded = encodeURIComponent(text);
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    }
  };

  // Send internal notification alert
  const handleSendInternalNotification = async (profile: StudentDebtProfile) => {
    try {
      const s = profile.student;
      const parentId = s.parentId || (s as any).parent_id;
      
      const payload: any = {
        school_id: user?.schoolId || s.schoolId,
        parent_id: parentId,
        student_id: s.id,
        title: `Rappel de créance : ${s.firstName} ${s.lastName}`,
        message: `Reste à payer : ${profile.totalRemaining.toLocaleString()} FCFA. ${profile.hasOverdueAlert ? `Attention, des échéances sont échues depuis ${profile.maxDaysOverdue} jour(s).` : 'Merci de régulariser la scolarité.'}`,
        type: 'PAYMENT_REMINDER',
        created_at: new Date().toISOString()
      };

      await supabase.from('notifications').insert(payload);
      
      // Dispatch refresh event
      window.dispatchEvent(new CustomEvent('refresh_notifications'));
      setNotificationSent(profile.student.id);
      setTimeout(() => setNotificationSent(null), 3500);
    } catch (err) {
      console.error("Erreur envoi notification créance:", err);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      
      {/* 1. Header & KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Créances */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Créances Dues</span>
            <h3 className="text-2xl font-black text-rose-600 mt-1 font-mono">
              {kpiStats.totalDebtsAmount.toLocaleString()} <span className="text-xs font-normal text-slate-500">FCFA</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Solde total impayé des élèves</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <Coins size={24} />
          </div>
        </div>

        {/* Élèves Débiteurs */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Élèves Débiteurs</span>
            <h3 className="text-2xl font-black text-gray-800 mt-1">
              {kpiStats.totalDebtorsCount} <span className="text-xs font-normal text-slate-500">élève{kpiStats.totalDebtorsCount > 1 ? 's' : ''}</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Sur un effectif de {students.length} inscrits</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <User size={24} />
          </div>
        </div>

        {/* Alertes Échéances Dépassées */}
        <div className={`p-5 rounded-xl border shadow-sm flex items-center justify-between transition-all ${
          kpiStats.totalOverdueDebtors > 0 ? "bg-amber-50/60 border-amber-200" : "bg-white border-slate-200"
        }`}>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Échéances Dépassées</span>
              {kpiStats.totalOverdueDebtors > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
            <h3 className="text-2xl font-black text-amber-700 mt-1">
              {kpiStats.totalOverdueDebtors} <span className="text-xs font-normal text-amber-900/70">retard{kpiStats.totalOverdueDebtors > 1 ? 's' : ''}</span>
            </h3>
            <p className="text-[11px] text-amber-700/80 mt-0.5">Date limite scolarité échue</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <AlertTriangle size={24} />
          </div>
        </div>

        {/* Taux de Recouvrement */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taux de Recouvrement</span>
            <h3 className="text-2xl font-black text-emerald-600 mt-1 font-mono">
              {kpiStats.globalRecoveryRate}%
            </h3>
            <div className="w-28 bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${kpiStats.globalRecoveryRate}%` }} 
              />
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 size={24} />
          </div>
        </div>

      </div>

      {/* 2. Overdue Critical Alert Notification Banner if any */}
      {kpiStats.totalOverdueDebtors > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
              <BadgeAlert size={22} className="animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-900">
                Alerte de gestion : {kpiStats.totalOverdueDebtors} élève(s) ont dépassé la date limite de scolarité
              </h4>
              <p className="text-xs text-amber-800/80 mt-0.5">
                Ces élèves ont une ou plusieurs tranches échues. Cliquez sur un élève pour consulter les impayés détaillés et envoyer une relance au parent.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterAlert(filterAlert === "OVERDUE" ? "ALL" : "OVERDUE")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition shrink-0 ${
              filterAlert === "OVERDUE" 
                ? "bg-amber-600 text-white border-amber-600 shadow-sm" 
                : "bg-white text-amber-800 border-amber-300 hover:bg-amber-100"
            }`}
          >
            {filterAlert === "OVERDUE" ? "Afficher tous les débiteurs" : "Filtrer uniquement les retards"}
          </button>
        </div>
      )}

      {/* 3. Filters & Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, matricule..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-slate-50/50"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Selectors: Academic Year, Class, Alert, Sort */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            
            {/* Filter Academic Year */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs">
              <Calendar size={14} className="text-slate-500" />
              <select
                value={filterYear}
                onChange={e => setFilterYear(e.target.value)}
                className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer"
              >
                <option value="ALL">Toutes les années</option>
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Filter Class / Level */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs">
              <Filter size={14} className="text-slate-500" />
              <select
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
                className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer"
              >
                <option value="ALL">Toutes les classes</option>
                {availableClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            {/* Filter Status Alert */}
            <select
              value={filterAlert}
              onChange={e => setFilterAlert(e.target.value as any)}
              className={`px-3 py-1.5 border rounded-lg text-xs font-bold outline-none cursor-pointer ${
                filterAlert === "OVERDUE"
                  ? "bg-rose-50 border-rose-300 text-rose-700"
                  : "bg-slate-50 border-slate-200 text-gray-700"
              }`}
            >
              <option value="ALL">Tous les débiteurs</option>
              <option value="OVERDUE">🚨 Échéance dépassée uniquement</option>
              <option value="UPCOMING">⏰ Échéances à venir</option>
            </select>

            {/* Sort order */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs">
              <ArrowUpDown size={14} className="text-slate-500" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer"
              >
                <option value="OVERDUE_DESC">Tri : Urgences / Retards d'abord</option>
                <option value="DEBT_DESC">Tri : Montant restant décroissant</option>
                <option value="NAME">Tri : Nom de famille (A-Z)</option>
              </select>
            </div>

          </div>
        </div>

        {/* Counter and helper hint */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span>Affichage de <strong>{displayedProfiles.length}</strong> élève(s) avec solde débiteur</span>
            {filterAlert === "OVERDUE" && (
              <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-bold text-[10px]">
                Filtre : Retards uniquement
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 italic">
            Cliquez sur un élève pour afficher le récapitulatif complet de tous ses impayés
          </span>
        </div>
      </div>

      {/* 4. Debtors List (Table & Mobile Cards) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {displayedProfiles.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="font-bold text-gray-700 text-base">Aucune créance trouvée</h4>
            <p className="text-xs text-slate-400 max-w-md mt-1">
              Tous les élèves correspondant aux filtres sélectionnés sont à jour de leurs paiements, ou aucun élève ne correspond aux critères.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="px-4 py-3">Élève & Classe</th>
                  <th className="px-4 py-3">Année</th>
                  <th className="px-4 py-3">Statut Échéance</th>
                  <th className="px-4 py-3 text-right">Total Dû</th>
                  <th className="px-4 py-3 text-right">Payé</th>
                  <th className="px-4 py-3 text-right">Reste à Payer (Créance)</th>
                  <th className="px-4 py-3 text-center">Progression</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {displayedProfiles.map(profile => {
                  const s = profile.student;
                  const fullName = `${s.firstName} ${s.lastName}`;
                  const photo = s.photo || getRandomStudentPhoto(s.gender, s.id);
                  const isOverdue = profile.hasOverdueAlert;

                  return (
                    <tr 
                      key={s.id}
                      onClick={() => setSelectedProfile(profile)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors group ${
                        isOverdue ? "bg-amber-50/20" : ""
                      }`}
                    >
                      {/* Élève & Classe */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={photo} 
                            alt={fullName}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-bold text-gray-800 group-hover:text-emerald-700 transition flex items-center gap-1.5">
                              {fullName}
                              {isOverdue && (
                                <span className="inline-block w-2 h-2 rounded-full bg-rose-500" title="Échéance dépassée" />
                              )}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                                {s.level || "Sans classe"}
                              </span>
                              {s.matricule && <span>Mat: {s.matricule}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Année */}
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {profile.academicYear}
                      </td>

                      {/* Statut Échéance (Alerte si dépassé) */}
                      <td className="px-4 py-3">
                        {isOverdue ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-full text-rose-700 font-bold text-[10px]">
                            <AlertTriangle size={12} className="shrink-0 text-rose-600 animate-pulse" />
                            <span>Retard : {profile.maxDaysOverdue} j ({profile.overdueCount} échu{profile.overdueCount > 1 ? 's' : ''})</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 font-medium text-[10px]">
                            <Clock size={12} className="shrink-0 text-emerald-600" />
                            <span>Dans les délais</span>
                          </div>
                        )}
                      </td>

                      {/* Total Dû */}
                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        {profile.totalExpected.toLocaleString()} F
                      </td>

                      {/* Payé */}
                      <td className="px-4 py-3 text-right font-mono text-emerald-600 font-semibold">
                        {profile.totalPaid.toLocaleString()} F
                      </td>

                      {/* Reste à Payer (Créance) */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-rose-600 text-sm">
                        {profile.totalRemaining.toLocaleString()} F
                      </td>

                      {/* Progression bar */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1 w-24 mx-auto">
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full ${
                                isOverdue ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${profile.percentPaid}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">{profile.percentPaid}% réglé</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedProfile(profile)}
                            className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded text-xs font-semibold flex items-center gap-1 transition"
                            title="Voir la liste détaillée des impayés"
                          >
                            <FileText size={14} /> Détails
                          </button>
                          
                          {onSelectStudentForPayment && (
                            <button
                              onClick={() => onSelectStudentForPayment(profile.student.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1 transition shadow-sm"
                              title="Encaisser les impayés de cet élève"
                            >
                              <CreditCard size={14} /> Encaisser
                            </button>
                          )}

                          <button
                            onClick={() => handleSendWhatsAppReminder(profile)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition"
                            title="Relancer le parent par WhatsApp"
                          >
                            <MessageCircle size={16} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* 5. Detailed Student Impayés Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden animate-in fade-in slide-in-from-top-4 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-4">
                <img 
                  src={selectedProfile.student.photo || getRandomStudentPhoto(selectedProfile.student.gender, selectedProfile.student.id)} 
                  alt={selectedProfile.student.firstName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-emerald-400 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">
                      {selectedProfile.student.firstName} {selectedProfile.student.lastName}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {selectedProfile.student.level || "Classe non précisée"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 flex items-center gap-3">
                    <span>Matricule : <strong>{selectedProfile.student.matricule || "N/A"}</strong></span>
                    <span>•</span>
                    <span>Année : <strong>{selectedProfile.academicYear}</strong></span>
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedProfile(null)}
                className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              
              {/* Alert banner in modal if overdue */}
              {selectedProfile.hasOverdueAlert ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-rose-900">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={24} className="text-rose-600 shrink-0 animate-pulse" />
                    <div>
                      <h4 className="font-bold text-sm">Échéance de scolarité dépassée</h4>
                      <p className="text-xs text-rose-700 mt-0.5">
                        Cet élève a <strong>{selectedProfile.overdueCount} impayé(s)</strong> ayant dépassé la date limite de règlement (retard maximal de {selectedProfile.maxDaysOverdue} jours).
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendWhatsAppReminder(selectedProfile)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-sm transition"
                  >
                    <MessageCircle size={14} /> Relance d'urgence
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900 text-xs">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <span>Cet élève a un solde à régler, mais <strong>aucune échéance n'est encore dépassée</strong> pour le moment.</span>
                </div>
              )}

              {/* Financial Summary Strip */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Total Attendu</span>
                  <p className="text-lg font-bold font-mono text-gray-800 mt-0.5">
                    {selectedProfile.totalExpected.toLocaleString()} F
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Déjà Versé</span>
                  <p className="text-lg font-bold font-mono text-emerald-600 mt-0.5">
                    {selectedProfile.totalPaid.toLocaleString()} F
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-rose-500 uppercase">Solde Impayé (Créance)</span>
                  <p className="text-xl font-black font-mono text-rose-600 mt-0.5">
                    {selectedProfile.totalRemaining.toLocaleString()} F
                  </p>
                </div>
              </div>

              {/* Parent & Contact Information */}
              <div className="p-4 bg-slate-50/60 border border-slate-200 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-gray-700 flex items-center gap-1.5">
                    <User size={14} /> Responsable légal / Parent
                  </span>
                  <p className="text-slate-600 mt-1">
                    {selectedProfile.student.fatherName || selectedProfile.student.motherName || selectedProfile.student.guardianName || "Non spécifié"}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {(selectedProfile.student.fatherContact || selectedProfile.student.motherContact || selectedProfile.student.guardianContact) ? (
                    <div className="flex items-center gap-2">
                      <a 
                        href={`tel:${selectedProfile.student.fatherContact || selectedProfile.student.motherContact || selectedProfile.student.guardianContact}`}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-100 flex items-center gap-1.5 transition"
                      >
                        <Phone size={14} /> Appeler ({selectedProfile.student.fatherContact || selectedProfile.student.motherContact || selectedProfile.student.guardianContact})
                      </a>
                      <button
                        onClick={() => handleSendWhatsAppReminder(selectedProfile)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm transition"
                      >
                        <MessageCircle size={14} /> WhatsApp
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Aucun numéro de contact renseigné</span>
                  )}
                </div>
              </div>

              {/* All Unpaid Fees / Dues Breakdown */}
              <div>
                <h4 className="font-bold text-sm text-gray-800 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <DollarSign size={16} className="text-emerald-600" />
                    Détail des Frais & Impayés ({selectedProfile.allFeeItems.length} rubriques)
                  </span>
                  <span className="text-xs font-normal text-slate-400">
                    {selectedProfile.unpaidItems.length} impayé(s) au total
                  </span>
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-600 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                        <th className="px-4 py-2.5">Rubrique / Frais</th>
                        <th className="px-4 py-2.5">Date Limite / Échéance</th>
                        <th className="px-4 py-2.5 text-right">Montant</th>
                        <th className="px-4 py-2.5 text-right">Réglé</th>
                        <th className="px-4 py-2.5 text-right">Reste Dû</th>
                        <th className="px-4 py-2.5 text-center">État</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedProfile.allFeeItems.map(item => {
                        const isSettled = item.remainingAmount <= 0;
                        const isOver = item.isOverdue;

                        return (
                          <tr 
                            key={item.id}
                            className={`${isSettled ? "bg-slate-50/40 text-slate-400" : isOver ? "bg-rose-50/30" : "bg-white"}`}
                          >
                            <td className="px-4 py-3 font-semibold text-gray-800">
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{item.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-normal">
                                  {item.category}
                                </span>
                              </div>
                            </td>
                            
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <Clock size={13} className={isOver ? "text-rose-500" : "text-slate-400"} />
                                <span className={isOver ? "font-bold text-rose-700" : "text-slate-600"}>
                                  {item.limitStr || "Non définie"}
                                </span>
                              </div>
                            </td>

                            <td className="px-4 py-3 text-right font-mono text-slate-600">
                              {item.totalAmount.toLocaleString()} F
                            </td>

                            <td className="px-4 py-3 text-right font-mono text-emerald-600 font-semibold">
                              {item.paidAmount.toLocaleString()} F
                            </td>

                            <td className="px-4 py-3 text-right font-mono font-bold text-sm">
                              {item.remainingAmount > 0 ? (
                                <span className="text-rose-600">{item.remainingAmount.toLocaleString()} F</span>
                              ) : (
                                <span className="text-emerald-600">0 F</span>
                              )}
                            </td>

                            <td className="px-4 py-3 text-center">
                              {isSettled ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase">
                                  Soldé
                                </span>
                              ) : isOver ? (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded-full text-[10px] font-black uppercase flex items-center justify-center gap-1">
                                  <AlertTriangle size={10} /> Dépassé ({item.daysOverdue} j)
                                </span>
                              ) : item.paidAmount > 0 ? (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold uppercase">
                                  Partiel
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold uppercase">
                                  Impayé
                                </span>
                              )}
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSendInternalNotification(selectedProfile)}
                  className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <MessageCircle size={14} /> Alerter via Notifications
                </button>
                {notificationSent === selectedProfile.student.id && (
                  <span className="text-xs text-emerald-600 font-semibold animate-fade-in flex items-center gap-1">
                    <CheckCircle2 size={14} /> Notification envoyée au parent !
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Printer size={14} /> Imprimer Fiche Créances
                </button>

                {onSelectStudentForPayment && (
                  <button
                    onClick={() => {
                      const id = selectedProfile.student.id;
                      setSelectedProfile(null);
                      onSelectStudentForPayment(id);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition"
                  >
                    <CreditCard size={16} /> Procéder à l'encaissement
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
