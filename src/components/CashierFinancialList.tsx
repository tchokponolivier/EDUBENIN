import React, { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import html2pdf from "html2pdf.js";
import {
  FileSpreadsheet,
  Download,
  Share2,
  Printer,
  Search,
  Filter,
  Calendar,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  CheckCircle,
  Clock,
  Building,
  GraduationCap,
  Users,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Check,
  X,
  CreditCard,
  FileText,
  AlertCircle,
  HelpCircle,
  ChevronDown
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";

export interface UnifiedTransaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: 
    | "SCOLARITE"
    | "INSCRIPTION"
    | "CANTINE"
    | "TRANSPORT"
    | "FOURNITURES_TENUES"
    | "AUTRE_RECETTE"
    | "SALAIRE"
    | "MATERIEL_FOURNITURE"
    | "MAINTENANCE"
    | "UTILITES"
    | "CARBURANT"
    | "AUTRE_DEPENSE";
  categoryLabel: string;
  title: string;
  partyName: string; // Élève, employé ou fournisseur
  partySubtext?: string; // Classe de l'élève ou Rôle de l'employé
  amount: number;
  dateStr: string; // YYYY-MM-DD
  timestamp: number;
  paymentMethod: string;
  reference: string;
  academicYear: string;
  status: "COMPLETED" | "PENDING" | "CANCELLED";
  rawOrigin: "PAYMENT" | "EXPENSE" | "SALARY" | "ENROLLMENT";
  notes?: string;
}

interface CashierFinancialListProps {
  schoolId?: string;
  schoolSettings?: any;
  academicYears?: { id?: string; name: string; status?: string }[];
}

export function CashierFinancialList({
  schoolId: propSchoolId,
  schoolSettings: propSchoolSettings,
  academicYears: propAcademicYears = []
}: CashierFinancialListProps) {
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<any>(propSchoolSettings || null);
  const [schoolYears, setSchoolYears] = useState<any[]>(propAcademicYears || []);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFlow, setFilterFlow] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterDatePreset, setFilterDatePreset] = useState<"ALL" | "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_TRIMESTER" | "CUSTOM">("ALL");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [filterYear, setFilterYear] = useState<string>("ALL");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "COMPLETED" | "PENDING">("ALL");

  // UI state
  const [exportingPdf, setExportingPdf] = useState(false);
  const [shareSuccessMessage, setShareSuccessMessage] = useState<string | null>(null);
  const [selectedTransactionDetail, setSelectedTransactionDetail] = useState<UnifiedTransaction | null>(null);
  const [viewMode, setViewMode] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");

  const effectiveSchoolId = useMemo(() => {
    return propSchoolId || user?.schoolId || localStorage.getItem("edubenin_active_school_id") || "11111111-1111-4111-8111-111111111111";
  }, [propSchoolId, user?.schoolId]);

  // Load all data
  const fetchAllFinancialData = async () => {
    try {
      setRefreshing(true);

      // Fetch School details if missing
      if (!schoolInfo?.name) {
        const { data: scData } = await supabase
          .from("schools")
          .select("*")
          .eq("id", effectiveSchoolId)
          .maybeSingle();
        if (scData) setSchoolInfo(scData);
      }

      // Fetch Academic Years if missing
      if (schoolYears.length === 0) {
        const { data: yData } = await supabase
          .from("academic_years")
          .select("*")
          .eq("school_id", effectiveSchoolId)
          .order("created_at", { ascending: false });
        if (yData && yData.length > 0) setSchoolYears(yData);
      }

      // Fetch students for lookup
      const { data: studentsData } = await supabase
        .from("students")
        .select("*")
        .eq("school_id", effectiveSchoolId);

      const studentsMap = new Map<string, any>();
      (studentsData || []).forEach((st: any) => {
        studentsMap.set(st.id, st);
      });

      // 1. Fetch Payments (Scolarités, Inscriptions, Cantines, Tenues)
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("*")
        .eq("school_id", effectiveSchoolId);

      // 2. Fetch Expenses (Dépenses courantes)
      const { data: expensesData } = await supabase
        .from("expenses")
        .select("*")
        .eq("school_id", effectiveSchoolId);

      // 3. Fetch Salaries (Salaires du personnel)
      let salariesData: any[] = [];
      try {
        const { data: salData, error: salErr } = await supabase
          .from("salaries")
          .select("*")
          .eq("school_id", effectiveSchoolId);
        if (!salErr && salData) {
          salariesData = salData;
        }
      } catch (err) {
        console.warn("Salaries table fetch warning:", err);
      }

      // 4. Also check local cached items for resilience
      let localSalaries: any[] = [];
      try {
        const loc = localStorage.getItem("mock_db_salaries");
        if (loc) localSalaries = JSON.parse(loc);
      } catch (e) {
        // ignore
      }

      let localExpenses: any[] = [];
      try {
        const locE = localStorage.getItem("mock_db_expenses");
        if (locE) localExpenses = JSON.parse(locE);
      } catch (e) {
        // ignore
      }

      const unified: UnifiedTransaction[] = [];

      // Process Payments -> Inflow (Recettes)
      const rawPayments = (paymentsData && paymentsData.length > 0) ? paymentsData : [];
      rawPayments.forEach((p: any) => {
        const st = studentsMap.get(p.student_id);
        const stName = st ? `${st.first_name || ""} ${st.last_name || ""}`.trim() : (p.student_name || "Élève non renseigné");
        const stClass = st?.level || st?.classe || "Classe non précisée";
        const dateRaw = p.payment_date || p.created_at || new Date().toISOString();
        const dateObj = new Date(dateRaw);
        const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
        const timestamp = !isNaN(dateObj.getTime()) ? dateObj.getTime() : Date.now();

        // Categorize payment based on items or description
        let cat: UnifiedTransaction["category"] = "SCOLARITE";
        let catLabel = "Scolarité";
        const items = Array.isArray(p.items) ? p.items : [];
        const itemsNames = items.map((i: any) => (i.name || "").toLowerCase()).join(" ");
        const refStr = (p.reference || "").toLowerCase();

        if (
          itemsNames.includes("inscript") || 
          itemsNames.includes("réinscript") || 
          refStr.includes("insc") || 
          (p.payment_type || "").toLowerCase().includes("inscript")
        ) {
          cat = "INSCRIPTION";
          catLabel = "Inscription / Réinscription";
        } else if (itemsNames.includes("cantin") || refStr.includes("cantin")) {
          cat = "CANTINE";
          catLabel = "Cantine scolaire";
        } else if (itemsNames.includes("transport") || itemsNames.includes("bus")) {
          cat = "TRANSPORT";
          catLabel = "Transport scolaire";
        } else if (itemsNames.includes("tenue") || itemsNames.includes("uniforme") || itemsNames.includes("fourniture") || itemsNames.includes("livret")) {
          cat = "FOURNITURES_TENUES";
          catLabel = "Tenues & Fournitures";
        } else {
          cat = "SCOLARITE";
          catLabel = "Scolarité & Tranches";
        }

        const itemsDisplay = items.length > 0 ? items.map((i: any) => i.name).join(", ") : "Paiement de scolarité";
        const title = `Paiement ${catLabel} - ${stName}`;

        unified.push({
          id: `pay_${p.id}`,
          type: "INCOME",
          category: cat,
          categoryLabel: catLabel,
          title: title,
          partyName: stName,
          partySubtext: `Élève - ${stClass}`,
          amount: Number(p.amount) || 0,
          dateStr: dateStr,
          timestamp: timestamp,
          paymentMethod: p.payment_method || p.network || "Espèces",
          reference: p.reference || `REC-${p.id.slice(0, 8).toUpperCase()}`,
          academicYear: p.academic_year || st?.academic_year || schoolInfo?.academic_year || "2024-2025",
          status: p.status === "PENDING" ? "PENDING" : (p.status === "CANCELLED" ? "CANCELLED" : "COMPLETED"),
          rawOrigin: "PAYMENT",
          notes: itemsDisplay
        });
      });

      // Process Expenses -> Outflow (Dépenses courantes)
      const combinedExpenses = [...(expensesData || []), ...localExpenses];
      const seenExpenseIds = new Set<string>();
      combinedExpenses.forEach((e: any) => {
        if (!e.id || seenExpenseIds.has(e.id)) return;
        seenExpenseIds.add(e.id);

        const dateRaw = e.expense_date || e.created_at || new Date().toISOString();
        const dateObj = new Date(dateRaw);
        const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
        const timestamp = !isNaN(dateObj.getTime()) ? dateObj.getTime() : Date.now();

        let cat: UnifiedTransaction["category"] = "AUTRE_DEPENSE";
        let catLabel = "Autre dépense";
        const rawCat = (e.category || "").toUpperCase();

        if (rawCat.includes("MATERIEL") || rawCat.includes("FOURNITURE") || rawCat.includes("PEDAGOG")) {
          cat = "MATERIEL_FOURNITURE";
          catLabel = "Matériel & Fournitures";
        } else if (rawCat.includes("MAINTENANCE") || rawCat.includes("REPARATION") || rawCat.includes("TRAVAUX")) {
          cat = "MAINTENANCE";
          catLabel = "Maintenance & Bâtiments";
        } else if (rawCat.includes("EAU") || rawCat.includes("ELECTRICITE") || rawCat.includes("ENERGIE") || rawCat.includes("INTERNET")) {
          cat = "UTILITES";
          catLabel = "Électricité / Eau / Net";
        } else if (rawCat.includes("CARBURANT") || rawCat.includes("TRANSPORT")) {
          cat = "CARBURANT";
          catLabel = "Carburant & Transport";
        } else {
          cat = "AUTRE_DEPENSE";
          catLabel = e.category || "Dépense de fonctionnement";
        }

        unified.push({
          id: `exp_${e.id}`,
          type: "EXPENSE",
          category: cat,
          categoryLabel: catLabel,
          title: e.description || `Dépense ${catLabel}`,
          partyName: e.beneficiary || e.supplier || "Fournisseur / Prestataire",
          partySubtext: `Opération - ${catLabel}`,
          amount: Number(e.amount) || 0,
          dateStr: dateStr,
          timestamp: timestamp,
          paymentMethod: e.payment_method || "Espèces (Caisse)",
          reference: e.reference || `DEP-${String(e.id).slice(0, 8).toUpperCase()}`,
          academicYear: e.academic_year || schoolInfo?.academic_year || "2024-2025",
          status: "COMPLETED",
          rawOrigin: "EXPENSE",
          notes: e.description
        });
      });

      // Process Salaries -> Outflow (Salaires et honoraires)
      const combinedSalaries = [...salariesData, ...localSalaries];
      const seenSalaryIds = new Set<string>();
      combinedSalaries.forEach((s: any) => {
        if (!s.id || seenSalaryIds.has(s.id)) return;
        seenSalaryIds.add(s.id);

        const dateRaw = s.payment_date || s.created_at || new Date().toISOString();
        const dateObj = new Date(dateRaw);
        const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
        const timestamp = !isNaN(dateObj.getTime()) ? dateObj.getTime() : Date.now();

        unified.push({
          id: `sal_${s.id}`,
          type: "EXPENSE",
          category: "SALAIRE",
          categoryLabel: "Salaires & Rémunérations",
          title: `Salaire ${s.month || ""} - ${s.employee_name || "Personnel"}`,
          partyName: s.employee_name || "Employé non spécifié",
          partySubtext: `Poste: ${s.employee_role || "Personnel"}`,
          amount: Number(s.amount) || 0,
          dateStr: dateStr,
          timestamp: timestamp,
          paymentMethod: s.payment_method || "Virement / Espèces",
          reference: s.reference || `SAL-${String(s.id).slice(0, 8).toUpperCase()}`,
          academicYear: s.academic_year || schoolInfo?.academic_year || "2024-2025",
          status: s.status === "EN_ATTENTE" ? "PENDING" : "COMPLETED",
          rawOrigin: "SALARY",
          notes: `Période: ${s.period_start || ""} au ${s.period_end || ""} | Déductions: ${s.deductions || "Aucune"}`
        });
      });

      // Sort chronological descending
      unified.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(unified);
    } catch (error) {
      console.error("Error loading financial list data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllFinancialData();
  }, [effectiveSchoolId]);

  // Handle Date Presets
  const isDateInPreset = (tDateStr: string, preset: string): boolean => {
    if (preset === "ALL") return true;
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const tDate = new Date(tDateStr);

    if (preset === "TODAY") {
      return tDateStr === todayStr;
    }
    if (preset === "THIS_WEEK") {
      const dayOfWeek = now.getDay() || 7; // 1 = Monday
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek + 1);
      monday.setHours(0, 0, 0, 0);
      return tDate.getTime() >= monday.getTime();
    }
    if (preset === "THIS_MONTH") {
      return (
        tDate.getFullYear() === now.getFullYear() &&
        tDate.getMonth() === now.getMonth()
      );
    }
    if (preset === "THIS_TRIMESTER") {
      // 3-month window
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      return tDate.getTime() >= threeMonthsAgo.getTime();
    }
    if (preset === "CUSTOM") {
      if (customStartDate && tDateStr < customStartDate) return false;
      if (customEndDate && tDateStr > customEndDate) return false;
      return true;
    }
    return true;
  };

  // Filter Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          t.title.toLowerCase().includes(q) ||
          t.partyName.toLowerCase().includes(q) ||
          (t.partySubtext && t.partySubtext.toLowerCase().includes(q)) ||
          t.reference.toLowerCase().includes(q) ||
          t.categoryLabel.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Flow
      if (filterFlow !== "ALL" && t.type !== filterFlow) {
        return false;
      }

      // Quick View Mode tabs
      if (viewMode !== "ALL" && t.type !== viewMode) {
        return false;
      }

      // Category
      if (filterCategory !== "ALL") {
        if (t.category !== filterCategory) return false;
      }

      // Date Preset
      if (!isDateInPreset(t.dateStr, filterDatePreset)) {
        return false;
      }

      // Academic Year
      if (filterYear !== "ALL") {
        if (t.academicYear !== filterYear) return false;
      }

      // Payment Method
      if (filterPaymentMethod !== "ALL") {
        const methodLower = (t.paymentMethod || "").toLowerCase();
        if (filterPaymentMethod === "CASH" && !methodLower.includes("esp")) return false;
        if (filterPaymentMethod === "MOBILE" && !methodLower.includes("mtn") && !methodLower.includes("moov") && !methodLower.includes("celtiis") && !methodLower.includes("wave") && !methodLower.includes("mobile")) return false;
        if (filterPaymentMethod === "BANK" && !methodLower.includes("vir") && !methodLower.includes("banq")) return false;
        if (filterPaymentMethod === "CHECK" && !methodLower.includes("chèq") && !methodLower.includes("cheq")) return false;
      }

      // Status
      if (filterStatus !== "ALL" && t.status !== filterStatus) {
        return false;
      }

      return true;
    });
  }, [
    transactions,
    searchTerm,
    filterFlow,
    viewMode,
    filterCategory,
    filterDatePreset,
    customStartDate,
    customEndDate,
    filterYear,
    filterPaymentMethod,
    filterStatus
  ]);

  // Aggregate Metrics & Category Breakdown
  const financialMetrics = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let countIn = 0;
    let countOut = 0;

    const inByCategory: Record<string, { label: string; amount: number; count: number }> = {
      SCOLARITE: { label: "Scolarités & Tranches", amount: 0, count: 0 },
      INSCRIPTION: { label: "Inscriptions & Réinscriptions", amount: 0, count: 0 },
      CANTINE: { label: "Cantine scolaire", amount: 0, count: 0 },
      TRANSPORT: { label: "Transport scolaire", amount: 0, count: 0 },
      FOURNITURES_TENUES: { label: "Tenues & Fournitures", amount: 0, count: 0 },
      AUTRE_RECETTE: { label: "Autres Recettes", amount: 0, count: 0 }
    };

    const outByCategory: Record<string, { label: string; amount: number; count: number }> = {
      SALAIRE: { label: "Salaires & Rémunérations", amount: 0, count: 0 },
      MATERIEL_FOURNITURE: { label: "Matériel & Fournitures", amount: 0, count: 0 },
      MAINTENANCE: { label: "Maintenance & Travaux", amount: 0, count: 0 },
      UTILITES: { label: "Électricité / Eau / Net", amount: 0, count: 0 },
      CARBURANT: { label: "Carburant & Transport", amount: 0, count: 0 },
      AUTRE_DEPENSE: { label: "Autres charges", amount: 0, count: 0 }
    };

    filteredTransactions.forEach((t) => {
      if (t.status === "COMPLETED") {
        if (t.type === "INCOME") {
          totalIn += t.amount;
          countIn++;
          if (inByCategory[t.category]) {
            inByCategory[t.category].amount += t.amount;
            inByCategory[t.category].count++;
          } else {
            inByCategory.AUTRE_RECETTE.amount += t.amount;
            inByCategory.AUTRE_RECETTE.count++;
          }
        } else {
          totalOut += t.amount;
          countOut++;
          if (outByCategory[t.category]) {
            outByCategory[t.category].amount += t.amount;
            outByCategory[t.category].count++;
          } else {
            outByCategory.AUTRE_DEPENSE.amount += t.amount;
            outByCategory.AUTRE_DEPENSE.count++;
          }
        }
      }
    });

    const netBalance = totalIn - totalOut;
    const coverageRate = totalOut > 0 ? Math.round((totalIn / totalOut) * 100) : 100;

    // Format for chart
    const chartData = [
      ...Object.entries(inByCategory)
        .filter(([_, v]) => v.amount > 0)
        .map(([k, v]) => ({
          name: v.label,
          type: "Recette",
          montant: v.amount,
          fill: "#10b981"
        })),
      ...Object.entries(outByCategory)
        .filter(([_, v]) => v.amount > 0)
        .map(([k, v]) => ({
          name: v.label,
          type: "Dépense",
          montant: v.amount,
          fill: "#f43f5e"
        }))
    ];

    return {
      totalIn,
      totalOut,
      netBalance,
      coverageRate,
      countIn,
      countOut,
      inByCategory,
      outByCategory,
      chartData
    };
  }, [filteredTransactions]);

  // Export to PDF using html2pdf
  const handleExportPDF = () => {
    const element = printRef.current;
    if (!element) return;

    setExportingPdf(true);
    const dateFormatted = new Date().toISOString().split("T")[0];
    const schoolNameSlug = (schoolInfo?.name || "Ecole").replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `Liste_Financiere_${schoolNameSlug}_${dateFormatted}.pdf`;

    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: fileName,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm" as const, format: "a4", orientation: "landscape" as const }
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        setExportingPdf(false);
      })
      .catch((err: any) => {
        console.error("Erreur PDF:", err);
        setExportingPdf(false);
      });
  };

  // Direct Print
  const handlePrint = () => {
    window.print();
  };

  // Share PDF or Summary
  const handleShare = async () => {
    const summaryText = `📊 ÉTAT FINANCIER & CAISSE - ${schoolInfo?.name || "Établissement Scolaire"}
📅 Période: ${filterDatePreset === "ALL" ? "Global" : filterDatePreset} | Édité le: ${new Date().toLocaleDateString("fr-FR")}
--------------------------------------
📈 Total Entrées (Recettes) : ${financialMetrics.totalIn.toLocaleString()} FCFA (${financialMetrics.countIn} opérations)
📉 Total Sorties (Dépenses/Salaires) : ${financialMetrics.totalOut.toLocaleString()} FCFA (${financialMetrics.countOut} opérations)
💼 Solde Net : ${financialMetrics.netBalance.toLocaleString()} FCFA
--------------------------------------
• Scolarités & Tranches : ${financialMetrics.inByCategory.SCOLARITE.amount.toLocaleString()} FCFA
• Inscriptions : ${financialMetrics.inByCategory.INSCRIPTION.amount.toLocaleString()} FCFA
• Salaires Personnel : ${financialMetrics.outByCategory.SALAIRE.amount.toLocaleString()} FCFA
• Dépenses & Fournitures : ${(financialMetrics.totalOut - financialMetrics.outByCategory.SALAIRE.amount).toLocaleString()} FCFA
--------------------------------------
Émis par la Direction Générale / EduBénin`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Liste Financière - ${schoolInfo?.name || "EduBénin"}`,
          text: summaryText
        });
        setShareSuccessMessage("Rapport partagé avec succès !");
        setTimeout(() => setShareSuccessMessage(null), 3500);
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        copySummaryToClipboard(summaryText);
      }
    } else {
      copySummaryToClipboard(summaryText);
    }
  };

  const copySummaryToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShareSuccessMessage("Rapport de synthèse copié dans le presse-papier !");
    setTimeout(() => setShareSuccessMessage(null), 3500);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilterFlow("ALL");
    setViewMode("ALL");
    setFilterCategory("ALL");
    setFilterDatePreset("ALL");
    setCustomStartDate("");
    setCustomEndDate("");
    setFilterYear("ALL");
    setFilterPaymentMethod("ALL");
    setFilterStatus("ALL");
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    filterFlow !== "ALL" ||
    filterCategory !== "ALL" ||
    filterDatePreset !== "ALL" ||
    filterYear !== "ALL" ||
    filterPaymentMethod !== "ALL" ||
    filterStatus !== "ALL";

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {shareSuccessMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-3">
          <CheckCircle size={20} className="text-emerald-300" />
          <span className="text-sm font-semibold">{shareSuccessMessage}</span>
        </div>
      )}

      {/* Top Header / Actions Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                Liste Financière & Grand Livre
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  Vue Directeur
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Suivi unifié et exhaustif des entrées (scolarités, inscriptions, cantines) et sorties (dépenses, salaires).
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Export PDF, Print, Share, Refresh */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
          <button
            onClick={fetchAllFinancialData}
            disabled={refreshing}
            className="p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1.5"
            title="Rafraîchir les données"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5 shadow-2xs"
            title="Imprimer directement"
          >
            <Printer size={16} />
            <span>Imprimer</span>
          </button>

          <button
            onClick={handleShare}
            className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5 shadow-2xs"
            title="Partager le rapport financier"
          >
            <Share2 size={16} />
            <span>Partager</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exportingPdf}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all text-xs font-bold flex items-center gap-2 shadow-xs hover:shadow"
            title="Télécharger le document PDF certifié"
          >
            <Download size={16} />
            <span>{exportingPdf ? "Génération PDF..." : "Enregistrer en PDF"}</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD PAR CATÉGORIE (Montants par catégorie & Cartes KPI) */}
      <div className="space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Entrées */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Recettes / Entrées
              </span>
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowDownRight size={18} />
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-700">
              {financialMetrics.totalIn.toLocaleString()} <span className="text-sm font-bold">FCFA</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{financialMetrics.countIn} opération{financialMetrics.countIn > 1 ? "s" : ""} encaissée{financialMetrics.countIn > 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Total Sorties */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Dépenses & Salaires
              </span>
              <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <ArrowUpRight size={18} />
              </span>
            </div>
            <div className="text-2xl font-black text-rose-600">
              {financialMetrics.totalOut.toLocaleString()} <span className="text-sm font-bold">FCFA</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
              <span>{financialMetrics.countOut} opération{financialMetrics.countOut > 1 ? "s" : ""} décaissée{financialMetrics.countOut > 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Solde Net */}
          <div className={`p-4 rounded-2xl border shadow-xs relative overflow-hidden ${financialMetrics.netBalance >= 0 ? "bg-emerald-50/70 border-emerald-200" : "bg-rose-50/70 border-rose-200"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Solde Net de Caisse
              </span>
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${financialMetrics.netBalance >= 0 ? "bg-emerald-200 text-emerald-800" : "bg-rose-200 text-rose-800"}`}>
                <Wallet size={18} />
              </span>
            </div>
            <div className={`text-2xl font-black ${financialMetrics.netBalance >= 0 ? "text-emerald-900" : "text-rose-900"}`}>
              {financialMetrics.netBalance >= 0 ? "+" : ""}{financialMetrics.netBalance.toLocaleString()} <span className="text-sm font-bold">FCFA</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-600">
              {financialMetrics.netBalance >= 0 ? "✅ Solde excédentaire" : "⚠️ Déficit de trésorerie"}
            </div>
          </div>

          {/* Taux de couverture & Volumes */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Couverture des Charges
              </span>
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <TrendingUp size={18} />
              </span>
            </div>
            <div className="text-2xl font-black text-indigo-950">
              {financialMetrics.coverageRate}%
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {financialMetrics.totalOut === 0 ? "Aucune charge enregistrée" : `${Math.round((financialMetrics.totalIn / (financialMetrics.totalOut || 1)) * 10) / 10}x le volume des charges`}
            </div>
          </div>
        </div>

        {/* Breakdown Panel: Entrées par Catégorie VS Sorties par Catégorie */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 1. Volet Entrées par Catégorie */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
                  Recettes par Catégorie
                </h3>
              </div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {financialMetrics.totalIn.toLocaleString()} FCFA
              </span>
            </div>

            <div className="space-y-3.5">
              {Object.entries(financialMetrics.inByCategory).map(([key, item]) => {
                const percentage = financialMetrics.totalIn > 0 ? Math.round((item.amount / financialMetrics.totalIn) * 100) : 0;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        {key === "SCOLARITE" && <GraduationCap size={14} className="text-emerald-600" />}
                        {key === "INSCRIPTION" && <Users size={14} className="text-blue-600" />}
                        {item.label}
                        <span className="text-slate-400 font-normal">({item.count})</span>
                      </span>
                      <span className="font-bold text-gray-900">
                        {item.amount.toLocaleString()} FCFA <span className="text-slate-400 font-normal">({percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Volet Sorties par Catégorie */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
                  Dépenses & Salaires par Catégorie
                </h3>
              </div>
              <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                {financialMetrics.totalOut.toLocaleString()} FCFA
              </span>
            </div>

            <div className="space-y-3.5">
              {Object.entries(financialMetrics.outByCategory).map(([key, item]) => {
                const percentage = financialMetrics.totalOut > 0 ? Math.round((item.amount / financialMetrics.totalOut) * 100) : 0;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        {key === "SALAIRE" && <Users size={14} className="text-indigo-600" />}
                        {key === "MATERIEL_FOURNITURE" && <FileText size={14} className="text-amber-600" />}
                        {item.label}
                        <span className="text-slate-400 font-normal">({item.count})</span>
                      </span>
                      <span className="font-bold text-gray-900">
                        {item.amount.toLocaleString()} FCFA <span className="text-slate-400 font-normal">({percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Graphical Overview if transactions exist */}
        {financialMetrics.chartData.length > 0 && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <BarChart3 size={18} className="text-slate-600" />
                Distribution Visuelle des Flux Financiers
              </h3>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                  <span>Recettes (Entrées)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                  <span>Dépenses (Sorties)</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={financialMetrics.chartData}
                  margin={{ top: 10, right: 10, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickFormatter={(val) => `${(val / 1000).toLocaleString()}k`}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${Number(value).toLocaleString()} FCFA`, "Montant"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  />
                  <Bar dataKey="montant" radius={[6, 6, 0, 0]}>
                    {financialMetrics.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* FILTRES PERTINENTS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-emerald-600" />
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
              Filtres Pertinents
            </h3>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                Filtres actifs
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs text-slate-500 font-medium">
              {filteredTransactions.length} résultat{filteredTransactions.length > 1 ? "s" : ""} trouvé{filteredTransactions.length > 1 ? "s" : ""}
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg transition-colors"
              >
                <X size={13} />
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Recherche */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Recherche Globale
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Élève, personnel, reçu, motif..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
              />
            </div>
          </div>

          {/* 2. Type de Flux */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Sens du Flux
            </label>
            <select
              value={filterFlow}
              onChange={(e) => setFilterFlow(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
            >
              <option value="ALL">Tous les flux (Entrées & Sorties)</option>
              <option value="INCOME">🟢 Entrées uniquement (+)</option>
              <option value="EXPENSE">🔴 Sorties uniquement (-)</option>
            </select>
          </div>

          {/* 3. Catégorie */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Catégorie
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
            >
              <option value="ALL">Toutes les catégories</option>
              <optgroup label="Entrées / Recettes">
                <option value="SCOLARITE">Scolarités & Tranches</option>
                <option value="INSCRIPTION">Inscriptions & Réinscriptions</option>
                <option value="CANTINE">Cantine scolaire</option>
                <option value="TRANSPORT">Transport scolaire</option>
                <option value="FOURNITURES_TENUES">Tenues & Fournitures</option>
                <option value="AUTRE_RECETTE">Autres recettes</option>
              </optgroup>
              <optgroup label="Sorties / Dépenses">
                <option value="SALAIRE">Salaires du personnel</option>
                <option value="MATERIEL_FOURNITURE">Matériel & Fournitures</option>
                <option value="MAINTENANCE">Maintenance & Bâtiments</option>
                <option value="UTILITES">Électricité / Eau / Net</option>
                <option value="CARBURANT">Carburant & Transport</option>
                <option value="AUTRE_DEPENSE">Autres charges</option>
              </optgroup>
            </select>
          </div>

          {/* 4. Période */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Période
            </label>
            <select
              value={filterDatePreset}
              onChange={(e) => setFilterDatePreset(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
            >
              <option value="ALL">Toutes les dates</option>
              <option value="TODAY">Aujourd'hui</option>
              <option value="THIS_WEEK">Cette semaine</option>
              <option value="THIS_MONTH">Ce mois-ci</option>
              <option value="THIS_TRIMESTER">Ce trimestre (3 mois)</option>
              <option value="CUSTOM">Période personnalisée...</option>
            </select>
          </div>

          {/* 5. Année Scolaire */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Année Scolaire
            </label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
            >
              <option value="ALL">Toutes les années</option>
              {schoolYears.map((y) => (
                <option key={y.id || y.name} value={y.name}>
                  {y.name} {y.status === "ACTIVE" ? "(Actuelle)" : ""}
                </option>
              ))}
              {schoolYears.length === 0 && (
                <>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Row 2: Secondary Filters (Mode de règlement, Statut, Dates personnalisées) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Mode de Règlement
            </label>
            <select
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
            >
              <option value="ALL">Tous les modes</option>
              <option value="CASH">Espèces (Guichet)</option>
              <option value="MOBILE">Mobile Money (MTN / Moov / Celtiis)</option>
              <option value="BANK">Virement Bancaire</option>
              <option value="CHECK">Chèque</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Statut
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="COMPLETED">Validé / Réglé</option>
              <option value="PENDING">En attente / À vérifier</option>
            </select>
          </div>

          {filterDatePreset === "CUSTOM" && (
            <>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Date Début (Du)
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Date Fin (Au)
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* QUICK VIEW MODE TABS (Tous / Entrées / Sorties) */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("ALL")}
            className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              viewMode === "ALL"
                ? "border-emerald-600 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Toutes les Opérations ({transactions.length})
          </button>
          <button
            onClick={() => setViewMode("INCOME")}
            className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              viewMode === "INCOME"
                ? "border-emerald-600 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Recettes / Entrées ({transactions.filter((t) => t.type === "INCOME").length})
          </button>
          <button
            onClick={() => setViewMode("EXPENSE")}
            className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              viewMode === "EXPENSE"
                ? "border-rose-600 text-rose-800"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Dépenses & Salaires ({transactions.filter((t) => t.type === "EXPENSE").length})
          </button>
        </div>
      </div>

      {/* TABLE DES OPÉRATIONS FINANCIÈRES */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-emerald-600" />
            <p className="text-sm font-semibold">Chargement du journal financier complet...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-300" />
            <h4 className="font-bold text-gray-700">Aucune opération financière trouvée</h4>
            <p className="text-xs max-w-md mx-auto text-slate-400">
              Aucun mouvement ne correspond aux filtres sélectionnés. Essayez d'élargir la période ou de réinitialiser vos critères de recherche.
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-3 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Date & Réf</th>
                  <th className="py-3.5 px-4">Flux & Catégorie</th>
                  <th className="py-3.5 px-4">Libellé / Objet</th>
                  <th className="py-3.5 px-4">Tiers / Élève / Personnel</th>
                  <th className="py-3.5 px-4">Règlement</th>
                  <th className="py-3.5 px-4 text-center">Statut</th>
                  <th className="py-3.5 px-4 text-right">Montant FCFA</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTransactions.map((t) => {
                  const isIncome = t.type === "INCOME";
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setSelectedTransactionDetail(t)}
                    >
                      {/* Date & Réf */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900">{t.dateStr}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{t.reference}</div>
                      </td>

                      {/* Flux & Catégorie */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isIncome
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {isIncome ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                          {t.categoryLabel}
                        </span>
                      </td>

                      {/* Libellé / Objet */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-gray-900 truncate" title={t.title}>
                          {t.title}
                        </div>
                        {t.notes && (
                          <div className="text-[10px] text-slate-500 truncate" title={t.notes}>
                            {t.notes}
                          </div>
                        )}
                      </td>

                      {/* Tiers / Élève */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-gray-800">{t.partyName}</div>
                        {t.partySubtext && (
                          <div className="text-[10px] text-slate-400">{t.partySubtext}</div>
                        )}
                      </td>

                      {/* Mode de règlement */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-[11px]">
                          {t.paymentMethod}
                        </span>
                      </td>

                      {/* Statut */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {t.status === "COMPLETED" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <Check size={11} /> Validé
                          </span>
                        ) : t.status === "PENDING" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Clock size={11} /> En attente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                            Annulé
                          </span>
                        )}
                      </td>

                      {/* Montant */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-sm">
                        <span className={isIncome ? "text-emerald-700" : "text-rose-600"}>
                          {isIncome ? "+" : "-"}{t.amount.toLocaleString()} FCFA
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTransactionDetail(t);
                          }}
                          className="px-2.5 py-1 text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg text-[11px] font-bold transition"
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Table Footer Totals */}
              <tfoot>
                <tr className="bg-slate-100 font-bold text-gray-800 border-t-2 border-slate-300">
                  <td colSpan={6} className="py-3.5 px-4 text-right text-xs uppercase tracking-wide">
                    Total Net de la sélection ({filteredTransactions.length} opérations) :
                  </td>
                  <td className="py-3.5 px-4 text-right text-sm">
                    <div className="text-emerald-700">+{financialMetrics.totalIn.toLocaleString()} FCFA</div>
                    <div className="text-rose-600">-{financialMetrics.totalOut.toLocaleString()} FCFA</div>
                    <div className={`pt-1 border-t border-slate-300 font-black ${financialMetrics.netBalance >= 0 ? "text-emerald-900" : "text-rose-900"}`}>
                      Solde : {financialMetrics.netBalance.toLocaleString()} FCFA
                    </div>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedTransactionDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                    selectedTransactionDetail.type === "INCOME"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {selectedTransactionDetail.type === "INCOME" ? (
                    <ArrowDownRight size={20} />
                  ) : (
                    <ArrowUpRight size={20} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Détail de l'opération</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedTransactionDetail.reference}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTransactionDetail(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Sens du flux</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-full ${
                    selectedTransactionDetail.type === "INCOME"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {selectedTransactionDetail.type === "INCOME" ? "Entrée (Recette)" : "Sortie (Dépense / Salaire)"}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Catégorie</span>
                <span className="font-bold text-gray-900">{selectedTransactionDetail.categoryLabel}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Date d'opération</span>
                <span className="font-bold text-gray-900">{selectedTransactionDetail.dateStr}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Tiers / Élève / Bénéficiaire</span>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{selectedTransactionDetail.partyName}</div>
                  {selectedTransactionDetail.partySubtext && (
                    <div className="text-slate-400 text-[10px]">{selectedTransactionDetail.partySubtext}</div>
                  )}
                </div>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Mode de paiement</span>
                <span className="font-bold text-gray-900">{selectedTransactionDetail.paymentMethod}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Année Scolaire</span>
                <span className="font-bold text-gray-900">{selectedTransactionDetail.academicYear}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Statut</span>
                <span className="font-bold text-emerald-700">{selectedTransactionDetail.status}</span>
              </div>

              {selectedTransactionDetail.notes && (
                <div className="py-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 font-bold block mb-1">Détails / Notes :</span>
                  <p className="text-slate-700 italic">{selectedTransactionDetail.notes}</p>
                </div>
              )}

              <div className="pt-2 flex justify-between items-center text-sm">
                <span className="font-bold text-gray-800">Montant :</span>
                <span
                  className={`text-lg font-black ${
                    selectedTransactionDetail.type === "INCOME" ? "text-emerald-700" : "text-rose-600"
                  }`}
                >
                  {selectedTransactionDetail.type === "INCOME" ? "+" : "-"}
                  {selectedTransactionDetail.amount.toLocaleString()} FCFA
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedTransactionDetail(null)}
                className="px-5 py-2.5 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-slate-700 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFF-SCREEN DOCUMENT FOR CERTIFIED PDF PRINT / EXPORT */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <div
          ref={printRef}
          style={{
            width: "280mm",
            backgroundColor: "#ffffff",
            padding: "20mm 15mm",
            color: "#1e293b",
            fontFamily: "Arial, sans-serif"
          }}
        >
          {/* Header République du Bénin & École */}
          <div style={{ borderBottom: "2px solid #0f766e", paddingBottom: "15px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "#475569" }}>
                  RÉPUBLIQUE DU BÉNIN
                </div>
                <div style={{ fontSize: "9px", color: "#64748b" }}>
                  MINISTÈRE DES ENSEIGNEMENTS MATERNEL ET PRIMAIRE / SECONDAIRE
                </div>
                <div style={{ fontSize: "18px", fontWeight: "900", color: "#0f766e", marginTop: "5px" }}>
                  {schoolInfo?.name || "ÉTABLISSEMENT SCOLAIRE"}
                </div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>
                  {schoolInfo?.address || "Cotonou, Bénin"} | Tél: {schoolInfo?.phone || "+229 00 00 00 00"}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "16px", fontWeight: "900", color: "#0f172a" }}>
                  GRAND LIVRE FINANCIER & ÉTAT DE CAISSE
                </div>
                <div style={{ fontSize: "11px", fontWeight: "bold", color: "#0f766e", marginTop: "3px" }}>
                  Année Scolaire : {schoolInfo?.academic_year || "2024-2025"}
                </div>
                <div style={{ fontSize: "10px", color: "#64748b", marginTop: "3px" }}>
                  Date d'extraction : {new Date().toLocaleDateString("fr-FR")} à {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>
                  Édité par : {user?.name || "La Direction Générale"}
                </div>
              </div>
            </div>
          </div>

          {/* Synthèse par Catégorie */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", color: "#334155", marginBottom: "8px" }}>
              1. Synthèse Analytique des Flux Financiers
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9", textAlign: "left" }}>
                  <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Catégorie Recettes (Entrées)</th>
                  <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>Montant FCFA</th>
                  <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Catégorie Dépenses & Salaires (Sorties)</th>
                  <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>Montant FCFA</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0" }}>Scolarités & Tranches</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "bold", color: "#059669" }}>
                    {financialMetrics.inByCategory.SCOLARITE.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0" }}>Salaires du personnel</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "bold", color: "#e11d48" }}>
                    {financialMetrics.outByCategory.SALAIRE.amount.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0" }}>Inscriptions & Réinscriptions</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "bold", color: "#059669" }}>
                    {financialMetrics.inByCategory.INSCRIPTION.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0" }}>Matériel & Fournitures pédagogiques</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "bold", color: "#e11d48" }}>
                    {financialMetrics.outByCategory.MATERIEL_FOURNITURE.amount.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0" }}>Cantine scolaire</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "bold", color: "#059669" }}>
                    {financialMetrics.inByCategory.CANTINE.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0" }}>Maintenance & Travaux</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "bold", color: "#e11d48" }}>
                    {financialMetrics.outByCategory.MAINTENANCE.amount.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0" }}>Transport & Tenues</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "bold", color: "#059669" }}>
                    {(financialMetrics.inByCategory.TRANSPORT.amount + financialMetrics.inByCategory.FOURNITURES_TENUES.amount).toLocaleString()}
                  </td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0" }}>Électricité, Eau & Télécoms</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "bold", color: "#e11d48" }}>
                    {financialMetrics.outByCategory.UTILITES.amount.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0" }}>Autres recettes</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "bold", color: "#059669" }}>
                    {financialMetrics.inByCategory.AUTRE_RECETTE.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0" }}>Carburant & Autres charges</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "bold", color: "#e11d48" }}>
                    {(financialMetrics.outByCategory.CARBURANT.amount + financialMetrics.outByCategory.AUTRE_DEPENSE.amount).toLocaleString()}
                  </td>
                </tr>
                <tr style={{ backgroundColor: "#f8fafc", fontWeight: "bold" }}>
                  <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>TOTAL ENTRÉES (RECETTES)</td>
                  <td style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right", color: "#047857", fontSize: "11px" }}>
                    {financialMetrics.totalIn.toLocaleString()} FCFA
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>TOTAL SORTIES (CHARGES)</td>
                  <td style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right", color: "#be123c", fontSize: "11px" }}>
                    {financialMetrics.totalOut.toLocaleString()} FCFA
                  </td>
                </tr>
                <tr style={{ backgroundColor: "#f1f5f9", fontWeight: "900", fontSize: "12px" }}>
                  <td colSpan={2} style={{ padding: "10px", border: "1px solid #94a3b8", textAlign: "right" }}>
                    SOLDE NET DE TRÉSORERIE :
                  </td>
                  <td
                    colSpan={2}
                    style={{
                      padding: "10px",
                      border: "1px solid #94a3b8",
                      textAlign: "right",
                      color: financialMetrics.netBalance >= 0 ? "#047857" : "#be123c"
                    }}
                  >
                    {financialMetrics.netBalance >= 0 ? "+" : ""}{financialMetrics.netBalance.toLocaleString()} FCFA
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tableau Détaillé des Opérations */}
          <div style={{ marginBottom: "30px" }}>
            <div style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", color: "#334155", marginBottom: "8px" }}>
              2. Journal Exhaustif des Transactions ({filteredTransactions.length} enregistrements)
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px" }}>
              <thead>
                <tr style={{ backgroundColor: "#0f766e", color: "#ffffff", textAlign: "left" }}>
                  <th style={{ padding: "6px", border: "1px solid #0d9488" }}>Date</th>
                  <th style={{ padding: "6px", border: "1px solid #0d9488" }}>Réf.</th>
                  <th style={{ padding: "6px", border: "1px solid #0d9488" }}>Type / Catégorie</th>
                  <th style={{ padding: "6px", border: "1px solid #0d9488" }}>Libellé / Objet</th>
                  <th style={{ padding: "6px", border: "1px solid #0d9488" }}>Tiers / Élève / Employé</th>
                  <th style={{ padding: "6px", border: "1px solid #0d9488" }}>Mode</th>
                  <th style={{ padding: "6px", border: "1px solid #0d9488", textAlign: "right" }}>Montant FCFA</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t, idx) => (
                  <tr
                    key={t.id}
                    style={{
                      backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                      borderBottom: "1px solid #e2e8f0"
                    }}
                  >
                    <td style={{ padding: "5px 6px", border: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>{t.dateStr}</td>
                    <td style={{ padding: "5px 6px", border: "1px solid #e2e8f0", fontFamily: "monospace" }}>{t.reference}</td>
                    <td style={{ padding: "5px 6px", border: "1px solid #e2e8f0" }}>
                      <span style={{ color: t.type === "INCOME" ? "#059669" : "#e11d48", fontWeight: "bold" }}>
                        {t.type === "INCOME" ? "[RECETTE] " : "[DÉPENSE] "}
                      </span>
                      {t.categoryLabel}
                    </td>
                    <td style={{ padding: "5px 6px", border: "1px solid #e2e8f0" }}>{t.title}</td>
                    <td style={{ padding: "5px 6px", border: "1px solid #e2e8f0" }}>{t.partyName} {t.partySubtext ? `(${t.partySubtext})` : ""}</td>
                    <td style={{ padding: "5px 6px", border: "1px solid #e2e8f0" }}>{t.paymentMethod}</td>
                    <td
                      style={{
                        padding: "5px 6px",
                        border: "1px solid #e2e8f0",
                        textAlign: "right",
                        fontWeight: "bold",
                        color: t.type === "INCOME" ? "#047857" : "#be123c",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {t.type === "INCOME" ? "+" : "-"}{t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures officielles */}
          <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-between", pageBreakInside: "avoid" }}>
            <div style={{ width: "40%", textAlign: "center", borderTop: "1px solid #94a3b8", paddingTop: "8px" }}>
              <div style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", color: "#334155" }}>
                Le Chef Comptable / Caisse
              </div>
              <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>
                (Mention « Vu et Vérifié » & Signature)
              </div>
              <div style={{ height: "45px" }}></div>
            </div>

            <div style={{ width: "40%", textAlign: "center", borderTop: "1px solid #94a3b8", paddingTop: "8px" }}>
              <div style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", color: "#334155" }}>
                Le Directeur de l'Établissement
              </div>
              <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>
                (Cachet Officiel & Signature)
              </div>
              <div style={{ height: "45px" }}></div>
            </div>
          </div>

          {/* Mention légale de bas de page */}
          <div style={{ marginTop: "25px", borderTop: "1px dashed #cbd5e1", paddingTop: "8px", textAlign: "center", fontSize: "8px", color: "#94a3b8" }}>
            Document officiel généré électroniquement via la plateforme de gestion scolaire EduBénin. Toute altération manuelle rend ce document nul et non avenu.
          </div>
        </div>
      </div>
    </div>
  );
}
