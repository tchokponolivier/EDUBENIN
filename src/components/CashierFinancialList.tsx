import React, { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { LEVELS } from "../types";
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
  CheckSquare,
  Square,
  Eye,
  SlidersHorizontal,
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
  categoryKey: string;
  categoryLabel: string;
  title: string;
  partyName: string; // Élève, employé ou fournisseur
  studentClass?: string; // Classe de l'élève (ex: "6ème", "CM2")
  partySubtext?: string; // Information complémentaire (ex: "Professeur de Maths")
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
  const printContainerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<any>(propSchoolSettings || null);
  const [schoolYears, setSchoolYears] = useState<any[]>(propAcademicYears || []);
  const [availableClasses, setAvailableClasses] = useState<string[]>(LEVELS);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFlow, setFilterFlow] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [filterClass, setFilterClass] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterDatePreset, setFilterDatePreset] = useState<"ALL" | "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_TRIMESTER" | "CUSTOM">("ALL");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [filterYear, setFilterYear] = useState<string>("ALL");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "COMPLETED" | "PENDING">("ALL");

  // Selection state for precise downloading
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportScope, setExportScope] = useState<"FILTERED" | "SELECTED" | "CLASS" | "CATEGORY">("FILTERED");

  // UI state
  const [exportingPdf, setExportingPdf] = useState(false);
  const [shareSuccessMessage, setShareSuccessMessage] = useState<string | null>(null);
  const [selectedTransactionDetail, setSelectedTransactionDetail] = useState<UnifiedTransaction | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [viewMode, setViewMode] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");

  const effectiveSchoolId = useMemo(() => {
    return propSchoolId || user?.schoolId || localStorage.getItem("edubenin_active_school_id") || "11111111-1111-4111-8111-111111111111";
  }, [propSchoolId, user?.schoolId]);

  // Load all financial data with decomposition
  const fetchAllFinancialData = async () => {
    try {
      setRefreshing(true);

      // School info
      if (!schoolInfo?.name) {
        const { data: scData } = await supabase
          .from("schools")
          .select("*")
          .eq("id", effectiveSchoolId)
          .maybeSingle();
        if (scData) setSchoolInfo(scData);
      }

      // Academic years
      if (schoolYears.length === 0) {
        const { data: yData } = await supabase
          .from("academic_years")
          .select("*")
          .eq("school_id", effectiveSchoolId)
          .order("created_at", { ascending: false });
        if (yData && yData.length > 0) setSchoolYears(yData);
      }

      // Students
      const { data: studentsData } = await supabase
        .from("students")
        .select("*")
        .eq("school_id", effectiveSchoolId);

      const studentsMap = new Map<string, any>();
      const classesSet = new Set<string>(LEVELS);
      (studentsData || []).forEach((st: any) => {
        studentsMap.set(st.id, st);
        const cl = st.level || st.classe;
        if (cl) classesSet.add(cl);
      });
      setAvailableClasses(Array.from(classesSet));

      // 1. Payments
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("*")
        .eq("school_id", effectiveSchoolId);

      // 2. Expenses
      const { data: expensesData } = await supabase
        .from("expenses")
        .select("*")
        .eq("school_id", effectiveSchoolId);

      // 3. Salaries
      let salariesData: any[] = [];
      try {
        const { data: salData } = await supabase
          .from("salaries")
          .select("*")
          .eq("school_id", effectiveSchoolId);
        if (salData) salariesData = salData;
      } catch (err) {
        console.warn("Salaries fetch warning:", err);
      }

      // Local storage fallbacks
      let localSalaries: any[] = [];
      try {
        const locS = localStorage.getItem("mock_db_salaries");
        if (locS) localSalaries = JSON.parse(locS);
      } catch (e) {}

      let localExpenses: any[] = [];
      try {
        const locE = localStorage.getItem("mock_db_expenses");
        if (locE) localExpenses = JSON.parse(locE);
      } catch (e) {}

      const unified: UnifiedTransaction[] = [];

      // A. Process Payments into Individual Unbundled Fee Categories
      const rawPayments = (paymentsData && paymentsData.length > 0) ? paymentsData : [];
      rawPayments.forEach((p: any) => {
        const st = studentsMap.get(p.student_id);
        const stName = st ? `${st.first_name || ""} ${st.last_name || ""}`.trim() : (p.student_name || "Élève non renseigné");
        const stClass = st?.level || st?.classe || "Non spécifiée";
        const dateRaw = p.payment_date || p.created_at || new Date().toISOString();
        const dateObj = new Date(dateRaw);
        const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
        const timestamp = !isNaN(dateObj.getTime()) ? dateObj.getTime() : Date.now();
        const pRef = p.reference || `REC-${String(p.id).slice(0, 8).toUpperCase()}`;
        const pYear = p.academic_year || st?.academic_year || schoolInfo?.academic_year || "2024-2025";
        const pMethod = p.payment_method || p.network || "Espèces";
        const pStatus = p.status === "PENDING" ? "PENDING" : (p.status === "CANCELLED" ? "CANCELLED" : "COMPLETED");

        const items = Array.isArray(p.items) && p.items.length > 0 ? p.items : null;

        if (items && items.length > 0) {
          // Decompose each fee item into its own distinct line so amounts and categories are 100% exact!
          items.forEach((item: any, idx: number) => {
            const itemName = (item.name || "").trim();
            const itemLower = itemName.toLowerCase();
            const itemAmount = Number(item.amount) || 0;
            if (itemAmount <= 0) return;

            let catKey = "SCOLARITE";
            let catLabel = "Scolarité";

            if (itemLower.includes("tranche 1") || item.id === "tranche1" || itemLower.includes("1ère tranche") || itemLower.includes("1ere tranche")) {
              catKey = "TRANCHE_1";
              catLabel = "Tranche 1";
            } else if (itemLower.includes("tranche 2") || item.id === "tranche2" || itemLower.includes("2ème tranche") || itemLower.includes("2eme tranche")) {
              catKey = "TRANCHE_2";
              catLabel = "Tranche 2";
            } else if (itemLower.includes("tranche 3") || item.id === "tranche3" || itemLower.includes("3ème tranche") || itemLower.includes("3eme tranche")) {
              catKey = "TRANCHE_3";
              catLabel = "Tranche 3";
            } else if (itemLower.includes("réinscript") || itemLower.includes("reinscript")) {
              catKey = "REINSCRIPTION";
              catLabel = "Réinscription";
            } else if (itemLower.includes("inscript")) {
              catKey = "INSCRIPTION";
              catLabel = "Inscription";
            } else if (itemLower.includes("cantin")) {
              catKey = "CANTINE";
              catLabel = "Cantine";
            } else if (itemLower.includes("transport") || itemLower.includes("bus")) {
              catKey = "TRANSPORT";
              catLabel = "Transport";
            } else if (itemLower.includes("tenue") || itemLower.includes("uniforme")) {
              catKey = "TENUES";
              catLabel = "Tenues";
            } else if (itemLower.includes("fourniture") || itemLower.includes("livre") || itemLower.includes("manuel")) {
              catKey = "FOURNITURES";
              catLabel = "Fournitures";
            } else if (itemLower.includes("scolarité") || itemLower.includes("scolarite")) {
              catKey = "SCOLARITE";
              catLabel = "Scolarité";
            } else {
              catKey = "AUTRE_RECETTE";
              catLabel = itemName || "Autre recette";
            }

            unified.push({
              id: `pay_${p.id}_item_${idx}`,
              type: "INCOME",
              categoryKey: catKey,
              categoryLabel: catLabel,
              title: `${catLabel} - ${stName}`,
              partyName: stName,
              studentClass: stClass,
              partySubtext: `Classe : ${stClass}`,
              amount: itemAmount,
              dateStr: dateStr,
              timestamp: timestamp,
              paymentMethod: pMethod,
              reference: pRef,
              academicYear: item.academic_year || pYear,
              status: pStatus,
              rawOrigin: "PAYMENT",
              notes: `Règlement de ${catLabel} pour ${stName} (${stClass})`
            });
          });
        } else {
          // Single payment without itemized decomposition
          const pAmount = Number(p.amount) || 0;
          const refLower = pRef.toLowerCase();
          const typeLower = (p.payment_type || "").toLowerCase();

          let catKey = "SCOLARITE";
          let catLabel = "Scolarité";

          if (refLower.includes("tranche 1") || refLower.includes("tr1") || typeLower.includes("tranche 1")) {
            catKey = "TRANCHE_1";
            catLabel = "Tranche 1";
          } else if (refLower.includes("tranche 2") || refLower.includes("tr2") || typeLower.includes("tranche 2")) {
            catKey = "TRANCHE_2";
            catLabel = "Tranche 2";
          } else if (refLower.includes("tranche 3") || refLower.includes("tr3") || typeLower.includes("tranche 3")) {
            catKey = "TRANCHE_3";
            catLabel = "Tranche 3";
          } else if (refLower.includes("reinsc") || typeLower.includes("reinsc")) {
            catKey = "REINSCRIPTION";
            catLabel = "Réinscription";
          } else if (refLower.includes("insc") || typeLower.includes("insc")) {
            catKey = "INSCRIPTION";
            catLabel = "Inscription";
          } else if (refLower.includes("cantin") || typeLower.includes("cantin")) {
            catKey = "CANTINE";
            catLabel = "Cantine";
          } else if (refLower.includes("transp") || typeLower.includes("transp")) {
            catKey = "TRANSPORT";
            catLabel = "Transport";
          } else {
            catKey = "SCOLARITE";
            catLabel = "Scolarité";
          }

          unified.push({
            id: `pay_${p.id}`,
            type: "INCOME",
            categoryKey: catKey,
            categoryLabel: catLabel,
            title: `${catLabel} - ${stName}`,
            partyName: stName,
            studentClass: stClass,
            partySubtext: `Classe : ${stClass}`,
            amount: pAmount,
            dateStr: dateStr,
            timestamp: timestamp,
            paymentMethod: pMethod,
            reference: pRef,
            academicYear: pYear,
            status: pStatus,
            rawOrigin: "PAYMENT",
            notes: `Règlement global ${catLabel}`
          });
        }
      });

      // B. Process Expenses into Discrete Categories
      const combinedExpenses = [...(expensesData || []), ...localExpenses];
      const seenExpenseIds = new Set<string>();
      combinedExpenses.forEach((e: any) => {
        if (!e.id || seenExpenseIds.has(e.id)) return;
        seenExpenseIds.add(e.id);

        const dateRaw = e.expense_date || e.created_at || new Date().toISOString();
        const dateObj = new Date(dateRaw);
        const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
        const timestamp = !isNaN(dateObj.getTime()) ? dateObj.getTime() : Date.now();

        const rawCat = (e.category || "").toUpperCase();
        let catKey = "AUTRE_DEPENSE";
        let catLabel = "Autre dépense";

        if (rawCat === "MATERIEL_FOURNITURE" || rawCat.includes("FOURNITURE") || rawCat.includes("BUREAU")) {
          catKey = "MATERIEL_FOURNITURE";
          catLabel = "Matériels et Fournitures de Bureau";
        } else if (rawCat === "ENTRETIEN_REPARATION" || rawCat.includes("ENTRETIEN") || rawCat.includes("REPARATION")) {
          catKey = "ENTRETIEN_REPARATION";
          catLabel = "Entretien & réparations";
        } else if (rawCat === "TRAVAUX" || rawCat.includes("BATIMENT")) {
          catKey = "TRAVAUX";
          catLabel = "Travaux";
        } else if (rawCat === "PRELEVEMENTS_BANQUE" || rawCat.includes("BANQUE")) {
          catKey = "PRELEVEMENTS_BANQUE";
          catLabel = "Prélèvements Banque";
        } else if (rawCat === "UNIFORMES" || rawCat.includes("TENUE")) {
          catKey = "UNIFORMES_DEPENSE";
          catLabel = "Uniformes";
        } else if (rawCat === "LIVRES" || rawCat.includes("MANUEL")) {
          catKey = "LIVRES";
          catLabel = "Livres";
        } else if (rawCat === "CANTINE") {
          catKey = "CANTINE_DEPENSE";
          catLabel = "Cantine";
        } else if (rawCat === "COMMUNICATIONS" || rawCat.includes("TELECOM")) {
          catKey = "COMMUNICATIONS";
          catLabel = "Communications";
        } else if (rawCat === "PRESTATAIRES") {
          catKey = "PRESTATAIRES";
          catLabel = "Prestataires";
        } else if (rawCat === "IMPOTS" || rawCat.includes("TAXE")) {
          catKey = "IMPOTS";
          catLabel = "Impôts";
        } else if (rawCat === "COLLATIONS") {
          catKey = "COLLATIONS";
          catLabel = "Collations";
        } else if (rawCat === "MATERIEL_DIDACTIQUE") {
          catKey = "MATERIEL_DIDACTIQUE";
          catLabel = "Matériels didactiques";
        } else if (rawCat === "PRIMES") {
          catKey = "PRIMES";
          catLabel = "Primes";
        } else if (rawCat === "FACTURE" || rawCat.includes("EAU") || rawCat.includes("ELECTRICITE") || rawCat.includes("SBEE")) {
          catKey = "FACTURE_EAU_ELEC";
          catLabel = "Factures Eau et Électricité";
        } else if (rawCat.includes("CARBURANT") || rawCat.includes("TRANSPORT")) {
          catKey = "CARBURANT";
          catLabel = "Carburant";
        } else {
          catKey = `DEPENSE_${rawCat || "AUTRE"}`;
          catLabel = e.category || "Autre dépense";
        }

        unified.push({
          id: `exp_${e.id}`,
          type: "EXPENSE",
          categoryKey: catKey,
          categoryLabel: catLabel,
          title: e.description || catLabel,
          partyName: e.beneficiary || e.supplier || "Prestataire / Fournisseur",
          partySubtext: `Poste de charge : ${catLabel}`,
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

      // C. Process Salaries into Specific Roles
      const combinedSalaries = [...salariesData, ...localSalaries];
      const seenSalaryIds = new Set<string>();
      combinedSalaries.forEach((s: any) => {
        if (!s.id || seenSalaryIds.has(s.id)) return;
        seenSalaryIds.add(s.id);

        const dateRaw = s.payment_date || s.created_at || new Date().toISOString();
        const dateObj = new Date(dateRaw);
        const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
        const timestamp = !isNaN(dateObj.getTime()) ? dateObj.getTime() : Date.now();

        const role = (s.employee_role || "Autre").trim();
        let catKey = "SALAIRE_AUTRE";
        let catLabel = `Salaires - ${role}`;

        if (role.toLowerCase().includes("prof") || role.toLowerCase().includes("enseignant")) {
          catKey = "SALAIRE_PROFESSEUR";
          catLabel = "Salaires - Professeurs";
        } else if (role.toLowerCase().includes("directeur des études")) {
          catKey = "SALAIRE_ETUDES";
          catLabel = "Salaires - Direction des Études";
        } else if (role.toLowerCase().includes("directeur")) {
          catKey = "SALAIRE_DIRECTION";
          catLabel = "Salaires - Direction";
        } else if (role.toLowerCase().includes("secrétaire") || role.toLowerCase().includes("secretaire")) {
          catKey = "SALAIRE_SECRETARIAT";
          catLabel = "Salaires - Secrétariat";
        } else if (role.toLowerCase().includes("surveillant")) {
          catKey = "SALAIRE_SURVEILLANCE";
          catLabel = "Salaires - Surveillance";
        } else if (role.toLowerCase().includes("gardien") || role.toLowerCase().includes("securite")) {
          catKey = "SALAIRE_GARDIENNAGE";
          catLabel = "Salaires - Gardiennage";
        } else if (role.toLowerCase().includes("caisse") || role.toLowerCase().includes("comptab")) {
          catKey = "SALAIRE_COMPTABILITE";
          catLabel = "Salaires - Caisse";
        } else if (role.toLowerCase().includes("chauffeur")) {
          catKey = "SALAIRE_CHAUFFEUR";
          catLabel = "Salaires - Chauffeur";
        }

        unified.push({
          id: `sal_${s.id}`,
          type: "EXPENSE",
          categoryKey: catKey,
          categoryLabel: catLabel,
          title: `Salaire (${s.month || "Mois"}) - ${s.employee_name || "Employé"}`,
          partyName: s.employee_name || "Personnel",
          partySubtext: `Fonction : ${role}`,
          amount: Number(s.amount) || 0,
          dateStr: dateStr,
          timestamp: timestamp,
          paymentMethod: s.payment_method || "Virement / Espèces",
          reference: s.reference || `SAL-${String(s.id).slice(0, 8).toUpperCase()}`,
          academicYear: s.academic_year || schoolInfo?.academic_year || "2024-2025",
          status: s.status === "EN_ATTENTE" ? "PENDING" : "COMPLETED",
          rawOrigin: "SALARY",
          notes: `Rémunération ${s.month || ""} | Retenues : ${s.deductions || "Aucune"}`
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

  // Date Presets filter
  const isDateInPreset = (tDateStr: string, preset: string): boolean => {
    if (preset === "ALL") return true;
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const tDate = new Date(tDateStr);

    if (preset === "TODAY") return tDateStr === todayStr;
    if (preset === "THIS_WEEK") {
      const dayOfWeek = now.getDay() || 7;
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

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // 1. Text Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          t.title.toLowerCase().includes(q) ||
          t.partyName.toLowerCase().includes(q) ||
          (t.studentClass && t.studentClass.toLowerCase().includes(q)) ||
          (t.partySubtext && t.partySubtext.toLowerCase().includes(q)) ||
          t.reference.toLowerCase().includes(q) ||
          t.categoryLabel.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // 2. Flow direction
      if (filterFlow !== "ALL" && t.type !== filterFlow) return false;
      if (viewMode !== "ALL" && t.type !== viewMode) return false;

      // 3. Class Filter (Very important for Director)
      if (filterClass !== "ALL") {
        if (!t.studentClass || t.studentClass !== filterClass) return false;
      }

      // 4. Category Filter (Discrete, unbundled)
      if (filterCategory !== "ALL") {
        if (t.categoryKey !== filterCategory) return false;
      }

      // 5. Date Filter
      if (!isDateInPreset(t.dateStr, filterDatePreset)) return false;

      // 6. Academic Year
      if (filterYear !== "ALL" && t.academicYear !== filterYear) return false;

      // 7. Payment Method
      if (filterPaymentMethod !== "ALL") {
        const methodLower = (t.paymentMethod || "").toLowerCase();
        if (filterPaymentMethod === "CASH" && !methodLower.includes("esp")) return false;
        if (filterPaymentMethod === "MOBILE" && !methodLower.includes("mtn") && !methodLower.includes("moov") && !methodLower.includes("celtiis") && !methodLower.includes("wave") && !methodLower.includes("mobile")) return false;
        if (filterPaymentMethod === "BANK" && !methodLower.includes("vir") && !methodLower.includes("banq")) return false;
        if (filterPaymentMethod === "CHECK" && !methodLower.includes("chèq") && !methodLower.includes("cheq")) return false;
      }

      // 8. Status
      if (filterStatus !== "ALL" && t.status !== filterStatus) return false;

      return true;
    });
  }, [
    transactions,
    searchTerm,
    filterFlow,
    viewMode,
    filterClass,
    filterCategory,
    filterDatePreset,
    customStartDate,
    customEndDate,
    filterYear,
    filterPaymentMethod,
    filterStatus
  ]);

  // Aggregate Category Metrics: NO CUMUL / NO & / DISCRETE CATEGORIES
  const financialMetrics = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let countIn = 0;
    let countOut = 0;

    // Separate Map for Incomes
    const incomeCategoriesMap: Record<string, { label: string; amount: number; count: number }> = {};
    // Separate Map for Expenses & Salaries
    const expenseCategoriesMap: Record<string, { label: string; amount: number; count: number }> = {};

    filteredTransactions.forEach((t) => {
      if (t.status === "COMPLETED") {
        if (t.type === "INCOME") {
          totalIn += t.amount;
          countIn++;
          if (!incomeCategoriesMap[t.categoryKey]) {
            incomeCategoriesMap[t.categoryKey] = { label: t.categoryLabel, amount: 0, count: 0 };
          }
          incomeCategoriesMap[t.categoryKey].amount += t.amount;
          incomeCategoriesMap[t.categoryKey].count++;
        } else {
          totalOut += t.amount;
          countOut++;
          if (!expenseCategoriesMap[t.categoryKey]) {
            expenseCategoriesMap[t.categoryKey] = { label: t.categoryLabel, amount: 0, count: 0 };
          }
          expenseCategoriesMap[t.categoryKey].amount += t.amount;
          expenseCategoriesMap[t.categoryKey].count++;
        }
      }
    });

    // Ensure standard order for income categories if present
    const standardIncomeOrder = [
      "SCOLARITE",
      "TRANCHE_1",
      "TRANCHE_2",
      "TRANCHE_3",
      "INSCRIPTION",
      "REINSCRIPTION",
      "CANTINE",
      "TRANSPORT",
      "TENUES",
      "FOURNITURES"
    ];

    const sortedIncomes = Object.entries(incomeCategoriesMap).sort((a, b) => {
      const idxA = standardIncomeOrder.indexOf(a[0]);
      const idxB = standardIncomeOrder.indexOf(b[0]);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return b[1].amount - a[1].amount;
    });

    const sortedExpenses = Object.entries(expenseCategoriesMap).sort((a, b) => {
      // Salaries first, then expenses
      const aIsSal = a[0].startsWith("SALAIRE");
      const bIsSal = b[0].startsWith("SALAIRE");
      if (aIsSal && !bIsSal) return -1;
      if (!aIsSal && bIsSal) return 1;
      return b[1].amount - a[1].amount;
    });

    const netBalance = totalIn - totalOut;
    const coverageRate = totalOut > 0 ? Math.round((totalIn / totalOut) * 100) : 100;

    // Recharts data
    const chartData = [
      ...sortedIncomes.map(([_, v]) => ({
        name: v.label,
        type: "Recette",
        montant: v.amount,
        fill: "#10b981"
      })),
      ...sortedExpenses.map(([_, v]) => ({
        name: v.label,
        type: "Dépense / Salaire",
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
      sortedIncomes,
      sortedExpenses,
      chartData
    };
  }, [filteredTransactions]);

  // Handle Row Checkbox Selection
  const toggleRowSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map((t) => t.id)));
    }
  };

  // Determine which transactions to print/export based on user scope choice
  const transactionsToExport = useMemo(() => {
    if (exportScope === "SELECTED") {
      const selected = filteredTransactions.filter((t) => selectedIds.has(t.id));
      return selected.length > 0 ? selected : filteredTransactions;
    }
    return filteredTransactions;
  }, [filteredTransactions, exportScope, selectedIds]);

  // Aggregate metrics specifically for the exported subset
  const exportMetrics = useMemo(() => {
    let totIn = 0;
    let totOut = 0;
    transactionsToExport.forEach((t) => {
      if (t.status === "COMPLETED") {
        if (t.type === "INCOME") totIn += t.amount;
        else totOut += t.amount;
      }
    });
    return {
      totIn,
      totOut,
      net: totIn - totOut,
      count: transactionsToExport.length
    };
  }, [transactionsToExport]);

  // Export to PDF (Robust, Non-Blank guarantee)
  const handleExportPDF = () => {
    const element = document.getElementById("printable-financial-doc");
    if (!element) {
      alert("Erreur : Impossible de charger le conteneur du document pour l'export.");
      return;
    }

    setExportingPdf(true);
    const dateFormatted = new Date().toISOString().split("T")[0];
    const schoolNameSlug = (schoolInfo?.name || "Ecole").replace(/[^a-zA-Z0-9]/g, "_");
    const classSuffix = filterClass !== "ALL" ? `_${filterClass.replace(/ /g, "_")}` : "";
    const catSuffix = filterCategory !== "ALL" ? `_${filterCategory}` : "";
    const fileName = `Liste_Financiere_${schoolNameSlug}${classSuffix}${catSuffix}_${dateFormatted}.pdf`;

    // Make element temporarily visible on top to guarantee html2canvas paints complete pixel canvas!
    element.style.display = "block";
    element.style.position = "fixed";
    element.style.left = "0px";
    element.style.top = "0px";
    element.style.width = "1120px";
    element.style.zIndex = "99999";
    element.style.backgroundColor = "#ffffff";

    setTimeout(() => {
      const opt = {
        margin: [8, 8, 8, 8] as [number, number, number, number],
        filename: fileName,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
        jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "landscape" as const }
      };

      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
          // Restore element styling
          element.style.display = "none";
          element.style.position = "absolute";
          element.style.zIndex = "-100";
          setExportingPdf(false);
          setShareSuccessMessage("Document PDF téléchargé avec succès !");
          setTimeout(() => setShareSuccessMessage(null), 3500);
        })
        .catch((err: any) => {
          console.error("Erreur PDF:", err);
          element.style.display = "none";
          setExportingPdf(false);
          alert("Erreur lors de la génération du PDF. Vous pouvez également utiliser le bouton Imprimer.");
        });
    }, 250);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const summaryText = `📊 ÉTAT FINANCIER & CAISSE - ${schoolInfo?.name || "Établissement Scolaire"}
🏛️ Classe: ${filterClass === "ALL" ? "Toutes classes" : filterClass} | Catégorie: ${filterCategory === "ALL" ? "Toutes" : filterCategory}
📅 Période: ${filterDatePreset === "ALL" ? "Globale" : filterDatePreset}
--------------------------------------
📈 Total Recettes (Entrées) : ${financialMetrics.totalIn.toLocaleString()} FCFA (${financialMetrics.countIn} opérations)
📉 Total Dépenses & Salaires : ${financialMetrics.totalOut.toLocaleString()} FCFA (${financialMetrics.countOut} opérations)
💼 Solde Net : ${financialMetrics.netBalance.toLocaleString()} FCFA
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
        copySummaryToClipboard(summaryText);
      }
    } else {
      copySummaryToClipboard(summaryText);
    }
  };

  const copySummaryToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShareSuccessMessage("Rapport copié dans le presse-papier !");
    setTimeout(() => setShareSuccessMessage(null), 3500);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilterFlow("ALL");
    setFilterClass("ALL");
    setFilterCategory("ALL");
    setFilterDatePreset("ALL");
    setCustomStartDate("");
    setCustomEndDate("");
    setFilterYear("ALL");
    setFilterPaymentMethod("ALL");
    setFilterStatus("ALL");
    setSelectedIds(new Set());
    setExportScope("FILTERED");
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    filterFlow !== "ALL" ||
    filterClass !== "ALL" ||
    filterCategory !== "ALL" ||
    filterDatePreset !== "ALL" ||
    filterYear !== "ALL" ||
    filterPaymentMethod !== "ALL" ||
    filterStatus !== "ALL" ||
    selectedIds.size > 0;

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
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-2xs">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Liste Financière & Grand Livre
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                Direction
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Suivi détaillé et ventilation sans cumul des tranches, scolarités, inscriptions, salaires et charges d'exploitation.
            </p>
          </div>
        </div>

        {/* Action Buttons: Export PDF, Preview, Print, Share, Refresh */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
          <button
            onClick={fetchAllFinancialData}
            disabled={refreshing}
            className="p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-xs font-semibold flex items-center gap-1.5"
            title="Rafraîchir"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition text-xs font-bold flex items-center gap-1.5"
            title="Imprimer directement"
          >
            <Printer size={16} />
            <span>Imprimer</span>
          </button>

          <button
            onClick={handleShare}
            className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl transition text-xs font-bold flex items-center gap-1.5"
            title="Partager le rapport financier"
          >
            <Share2 size={16} />
            <span>Partager</span>
          </button>

          <button
            onClick={() => setShowPreviewModal(true)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition text-xs font-bold flex items-center gap-1.5 shadow-xs"
            title="Aperçu avant export"
          >
            <Eye size={16} />
            <span>Aperçu PDF</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exportingPdf}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition text-xs font-bold flex items-center gap-2 shadow-xs"
            title="Télécharger le document PDF certifié"
          >
            <Download size={16} />
            <span>{exportingPdf ? "Génération PDF..." : "Enregistrer en PDF"}</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD PAR CATÉGORIE SANS CUMUL */}
      <div className="space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Recettes (Entrées)
              </span>
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowDownRight size={18} />
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-700">
              {financialMetrics.totalIn.toLocaleString()} <span className="text-sm font-bold">FCFA</span>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {financialMetrics.countIn} opération{financialMetrics.countIn > 1 ? "s" : ""} validée{financialMetrics.countIn > 1 ? "s" : ""}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Charges & Salaires
              </span>
              <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <ArrowUpRight size={18} />
              </span>
            </div>
            <div className="text-2xl font-black text-rose-600">
              {financialMetrics.totalOut.toLocaleString()} <span className="text-sm font-bold">FCFA</span>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {financialMetrics.countOut} opération{financialMetrics.countOut > 1 ? "s" : ""} décaissée{financialMetrics.countOut > 1 ? "s" : ""}
            </div>
          </div>

          <div className={`p-4 rounded-2xl border shadow-xs ${financialMetrics.netBalance >= 0 ? "bg-emerald-50/70 border-emerald-200" : "bg-rose-50/70 border-rose-200"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Solde Net de Trésorerie
              </span>
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${financialMetrics.netBalance >= 0 ? "bg-emerald-200 text-emerald-800" : "bg-rose-200 text-rose-800"}`}>
                <Wallet size={18} />
              </span>
            </div>
            <div className={`text-2xl font-black ${financialMetrics.netBalance >= 0 ? "text-emerald-900" : "text-rose-900"}`}>
              {financialMetrics.netBalance >= 0 ? "+" : ""}{financialMetrics.netBalance.toLocaleString()} <span className="text-sm font-bold">FCFA</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-600">
              {financialMetrics.netBalance >= 0 ? "✅ Solde excédentaire" : "⚠️ Déficit constaté"}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Taux de Couverture
              </span>
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <TrendingUp size={18} />
              </span>
            </div>
            <div className="text-2xl font-black text-indigo-950">
              {financialMetrics.coverageRate}%
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {financialMetrics.totalOut === 0 ? "Aucune charge" : `${Math.round((financialMetrics.totalIn / (financialMetrics.totalOut || 1)) * 10) / 10}x le volume des charges`}
            </div>
          </div>
        </div>

        {/* Breakdown: Recettes par catégorie (UNE PAR UNE SANS &) VS Dépenses & Salaires par catégorie (UNE PAR UNE SANS CUMUL) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 1. Recettes par Catégorie */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
                  Recettes par Catégorie (Détaillées une par une)
                </h3>
              </div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {financialMetrics.totalIn.toLocaleString()} FCFA
              </span>
            </div>

            <div className="space-y-3">
              {financialMetrics.sortedIncomes.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs italic">
                  Aucune recette pour la sélection actuelle.
                </div>
              ) : (
                financialMetrics.sortedIncomes.map(([key, item]) => {
                  const percentage = financialMetrics.totalIn > 0 ? Math.round((item.amount / financialMetrics.totalIn) * 100) : 0;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <GraduationCap size={13} className="text-emerald-600" />
                          <span>{item.label}</span>
                          <span className="text-slate-400 font-normal">({item.count} paiement{item.count > 1 ? "s" : ""})</span>
                        </span>
                        <span className="font-bold text-gray-900">
                          {item.amount.toLocaleString()} FCFA{" "}
                          <span className="text-slate-400 font-normal">({percentage}%)</span>
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
                })
              )}
            </div>
          </div>

          {/* 2. Dépenses & Salaires par Catégorie */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
                  Dépenses & Salaires par Catégorie (Sans cumul)
                </h3>
              </div>
              <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                {financialMetrics.totalOut.toLocaleString()} FCFA
              </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {financialMetrics.sortedExpenses.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs italic">
                  Aucune dépense ou salaire pour la sélection actuelle.
                </div>
              ) : (
                financialMetrics.sortedExpenses.map(([key, item]) => {
                  const percentage = financialMetrics.totalOut > 0 ? Math.round((item.amount / financialMetrics.totalOut) * 100) : 0;
                  const isSalary = key.startsWith("SALAIRE");
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          {isSalary ? (
                            <Users size={13} className="text-indigo-600" />
                          ) : (
                            <FileText size={13} className="text-amber-600" />
                          )}
                          <span>{item.label}</span>
                          <span className="text-slate-400 font-normal">({item.count} opération{item.count > 1 ? "s" : ""})</span>
                        </span>
                        <span className="font-bold text-gray-900">
                          {item.amount.toLocaleString()} FCFA{" "}
                          <span className="text-slate-400 font-normal">({percentage}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${isSalary ? "bg-indigo-500" : "bg-rose-500"}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Graphical Overview */}
        {financialMetrics.chartData.length > 0 && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <BarChart3 size={18} className="text-slate-600" />
                Distribution Visuelle des Flux par Catégorie
              </h3>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                  <span>Recettes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                  <span>Charges & Salaires</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={financialMetrics.chartData}
                  margin={{ top: 10, right: 10, left: 20, bottom: 45 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#64748b" }}
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

      {/* FILTRES PERTINENTS (AVEC FILTRE PAR CLASSE & CATÉGORIES INDIVIDUELLES) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-emerald-600" />
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
              Filtres Pertinents & Ciblés
            </h3>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                Filtres actifs
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs text-slate-500 font-medium">
              {filteredTransactions.length} opération{filteredTransactions.length > 1 ? "s" : ""} trouvée{filteredTransactions.length > 1 ? "s" : ""}
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg transition"
              >
                <X size={13} />
                Réinitialiser les filtres
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* 1. Recherche Globale */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Recherche Globale
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Élève, enseignant, reçu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
              />
            </div>
          </div>

          {/* 2. Filtre par Classe (DEMANDÉ PAR LE DIRECTEUR) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-1">
              Classe de l'Élève
            </label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-3 py-2 bg-emerald-50/70 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none transition"
            >
              <option value="ALL">Toutes les classes</option>
              {availableClasses.map((cl) => (
                <option key={cl} value={cl}>
                  {cl}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Catégorie Unique & Détaillée (SANS JUMELAGE / SANS &) */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Catégorie Précise
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
            >
              <option value="ALL">Toutes les catégories</option>
              <optgroup label="Scolarités & Tranches">
                <option value="TRANCHE_1">Tranche 1 (uniquement)</option>
                <option value="TRANCHE_2">Tranche 2 (uniquement)</option>
                <option value="TRANCHE_3">Tranche 3 (uniquement)</option>
                <option value="SCOLARITE">Scolarité générale</option>
              </optgroup>
              <optgroup label="Inscriptions & Services">
                <option value="INSCRIPTION">Inscription</option>
                <option value="REINSCRIPTION">Réinscription</option>
                <option value="CANTINE">Cantine</option>
                <option value="TRANSPORT">Transport</option>
                <option value="TENUES">Tenues</option>
                <option value="FOURNITURES">Fournitures</option>
                <option value="AUTRE_RECETTE">Autres recettes</option>
              </optgroup>
              <optgroup label="Rémunérations & Salaires">
                <option value="SALAIRE_PROFESSEUR">Salaires - Professeurs</option>
                <option value="SALAIRE_DIRECTION">Salaires - Direction</option>
                <option value="SALAIRE_ETUDES">Salaires - Direction des Études</option>
                <option value="SALAIRE_SECRETARIAT">Salaires - Secrétariat</option>
                <option value="SALAIRE_SURVEILLANCE">Salaires - Surveillance</option>
                <option value="SALAIRE_GARDIENNAGE">Salaires - Gardiennage</option>
                <option value="SALAIRE_COMPTABILITE">Salaires - Caisse</option>
                <option value="SALAIRE_CHAUFFEUR">Salaires - Chauffeur</option>
                <option value="SALAIRE_AUTRE">Salaires - Autre personnel</option>
              </optgroup>
              <optgroup label="Charges & Dépenses d'exploitation">
                <option value="MATERIEL_FOURNITURE">Matériels et Fournitures de Bureau</option>
                <option value="ENTRETIEN_REPARATION">Entretien & réparations</option>
                <option value="TRAVAUX">Travaux</option>
                <option value="FACTURE_EAU_ELEC">Factures Eau et Électricité</option>
                <option value="CARBURANT">Carburant</option>
                <option value="COMMUNICATIONS">Communications</option>
                <option value="PRESTATAIRES">Prestataires</option>
                <option value="IMPOTS">Impôts</option>
                <option value="COLLATIONS">Collations</option>
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
                  {y.name}
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

        {/* Row 2: Mode de paiement, Statut, Filtre personnalisé de dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Sens du flux
            </label>
            <select
              value={filterFlow}
              onChange={(e) => setFilterFlow(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
            >
              <option value="ALL">Tous les flux (Entrées & Sorties)</option>
              <option value="INCOME">🟢 Entrées (Recettes uniquement)</option>
              <option value="EXPENSE">🔴 Sorties (Dépenses & Salaires)</option>
            </select>
          </div>

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
              <option value="CASH">Espèces</option>
              <option value="MOBILE">Mobile Money (MTN / Moov / Celtiis)</option>
              <option value="BANK">Virement Bancaire</option>
              <option value="CHECK">Chèque</option>
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* BARRE D'ACTIONS DE TÉLÉCHARGEMENT SPÉCIFIQUE (EXPORT SELECTION BAR) */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
          >
            {selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0 ? (
              <CheckSquare size={16} className="text-emerald-600" />
            ) : (
              <Square size={16} className="text-slate-400" />
            )}
            <span>
              {selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0
                ? "Tout désélectionner"
                : "Tout sélectionner"}
            </span>
          </button>

          <span className="text-xs font-bold text-slate-700">
            {selectedIds.size > 0 ? (
              <span className="text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full">
                {selectedIds.size} ligne{selectedIds.size > 1 ? "s" : ""} sélectionnée{selectedIds.size > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-slate-500 font-normal">
                Cochez des lignes pour télécharger spécifiquement des données précises.
              </span>
            )}
          </span>
        </div>

        {/* Scope Selector & Download Buttons */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-medium">Télécharger :</span>
            <select
              value={exportScope}
              onChange={(e) => setExportScope(e.target.value as any)}
              className="font-bold text-gray-800 bg-transparent outline-none cursor-pointer"
            >
              <option value="FILTERED">Données filtrées affichées ({filteredTransactions.length})</option>
              <option value="SELECTED" disabled={selectedIds.size === 0}>
                Lignes cochées ({selectedIds.size})
              </option>
            </select>
          </div>

          <button
            onClick={handleExportPDF}
            disabled={exportingPdf}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Download size={15} />
            <span>
              {exportScope === "SELECTED" && selectedIds.size > 0
                ? `Télécharger les ${selectedIds.size} lignes en PDF`
                : "Télécharger en PDF"}
            </span>
          </button>
        </div>
      </div>

      {/* QUICK VIEW MODE TABS */}
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
            Recettes ({transactions.filter((t) => t.type === "INCOME").length})
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

      {/* TABLE DES OPÉRATIONS FINANCIÈRES AVEC CASES À COCHER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-emerald-600" />
            <p className="text-sm font-semibold">Chargement des opérations financières...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-300" />
            <h4 className="font-bold text-gray-700">Aucun résultat trouvé</h4>
            <p className="text-xs max-w-md mx-auto text-slate-400">
              Aucune opération ne correspond aux filtres choisis. Vous pouvez réinitialiser pour afficher l'ensemble des données.
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
                  <th className="py-3.5 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Date & Réf</th>
                  <th className="py-3.5 px-4">Flux & Catégorie</th>
                  <th className="py-3.5 px-4">Classe</th>
                  <th className="py-3.5 px-4">Tiers / Élève / Personnel</th>
                  <th className="py-3.5 px-4">Mode de règlement</th>
                  <th className="py-3.5 px-4 text-center">Statut</th>
                  <th className="py-3.5 px-4 text-right">Montant FCFA</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTransactions.map((t) => {
                  const isIncome = t.type === "INCOME";
                  const isSelected = selectedIds.has(t.id);
                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${isSelected ? "bg-emerald-50/40" : ""}`}
                      onClick={() => toggleRowSelect(t.id)}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRowSelect(t.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* Date & Réf */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900">{t.dateStr}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{t.reference}</div>
                      </td>

                      {/* Flux & Catégorie (Individual category, no & bundling) */}
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

                      {/* Classe de l'élève */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {t.studentClass ? (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200">
                            {t.studentClass}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">-</span>
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
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Clock size={11} /> En attente
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
                      <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedTransactionDetail(t)}
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
                  <td colSpan={7} className="py-3.5 px-4 text-right text-xs uppercase tracking-wide">
                    Total Sélection ({filteredTransactions.length} opérations) :
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

      {/* MODAL DE DÉTAIL */}
      {selectedTransactionDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95">
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
                  <h3 className="font-bold text-gray-900 text-base">Fiche de transaction</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedTransactionDetail.reference}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTransactionDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Catégorie</span>
                <span className="font-bold text-gray-900">{selectedTransactionDetail.categoryLabel}</span>
              </div>
              {selectedTransactionDetail.studentClass && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Classe</span>
                  <span className="font-bold text-blue-700">{selectedTransactionDetail.studentClass}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Tiers / Élève / Personnel</span>
                <span className="font-bold text-gray-900">{selectedTransactionDetail.partyName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Date</span>
                <span className="font-bold text-gray-900">{selectedTransactionDetail.dateStr}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Mode de paiement</span>
                <span className="font-bold text-gray-900">{selectedTransactionDetail.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Année scolaire</span>
                <span className="font-bold text-gray-900">{selectedTransactionDetail.academicYear}</span>
              </div>
              {selectedTransactionDetail.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block font-bold text-slate-500 mb-0.5">Notes / Objet :</span>
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
                className="px-5 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-slate-700 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL D'APERÇU PDF AVANT IMPRESSION OU TÉLÉCHARGEMENT */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full p-6 space-y-4 animate-in zoom-in-95 max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-700" size={22} />
                <h3 className="font-bold text-gray-900 text-base">
                  Aperçu du Document PDF Certifié
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  disabled={exportingPdf}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Download size={14} />
                  <span>{exportingPdf ? "Téléchargement..." : "Télécharger le PDF"}</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer size={14} />
                  <span>Imprimer</span>
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Document Preview Container */}
            <div className="flex-1 overflow-auto bg-slate-100 p-6 rounded-xl border border-slate-200 flex justify-center">
              <div className="bg-white p-8 rounded-lg shadow-sm w-full max-w-4xl text-slate-800 font-sans text-xs space-y-6">
                {/* School Letterhead */}
                <div className="border-b-2 border-emerald-700 pb-4 flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-500">RÉPUBLIQUE DU BÉNIN</div>
                    <div className="text-[9px] text-slate-400">MINISTÈRE DES ENSEIGNEMENTS MATERNEL ET SECONDAIRE</div>
                    <div className="text-lg font-black text-emerald-800 mt-1">{schoolInfo?.name || "ÉTABLISSEMENT SCOLAIRE"}</div>
                    <div className="text-[10px] text-slate-500">{schoolInfo?.address || "Cotonou"} | Tél: {schoolInfo?.phone || "+229 00 00 00 00"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-gray-900">GRAND LIVRE FINANCIER & ÉTAT DE CAISSE</div>
                    <div className="text-[11px] font-bold text-emerald-700">Année Scolaire : {schoolInfo?.academic_year || "2024-2025"}</div>
                    {filterClass !== "ALL" && (
                      <div className="text-xs font-bold text-blue-700">Classe : {filterClass}</div>
                    )}
                    {filterCategory !== "ALL" && (
                      <div className="text-xs font-bold text-emerald-700">Catégorie : {filterCategory}</div>
                    )}
                    <div className="text-[10px] text-slate-400">Date : {new Date().toLocaleDateString("fr-FR")}</div>
                  </div>
                </div>

                {/* Résumé synthétique */}
                <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Recettes</span>
                    <span className="text-sm font-black text-emerald-700">+{exportMetrics.totIn.toLocaleString()} FCFA</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Charges</span>
                    <span className="text-sm font-black text-rose-600">-{exportMetrics.totOut.toLocaleString()} FCFA</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Solde Net</span>
                    <span className={`text-sm font-black ${exportMetrics.net >= 0 ? "text-emerald-800" : "text-rose-800"}`}>
                      {exportMetrics.net >= 0 ? "+" : ""}{exportMetrics.net.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>

                {/* Table */}
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-emerald-800 text-white font-bold">
                      <th className="p-2 border">Date</th>
                      <th className="p-2 border">Réf.</th>
                      <th className="p-2 border">Catégorie</th>
                      <th className="p-2 border">Classe</th>
                      <th className="p-2 border">Tiers / Élève / Personnel</th>
                      <th className="p-2 border">Mode</th>
                      <th className="p-2 border text-right">Montant FCFA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionsToExport.map((t, idx) => (
                      <tr key={t.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="p-1.5 border">{t.dateStr}</td>
                        <td className="p-1.5 border font-mono text-[10px]">{t.reference}</td>
                        <td className="p-1.5 border font-semibold">{t.categoryLabel}</td>
                        <td className="p-1.5 border font-bold text-blue-700">{t.studentClass || "-"}</td>
                        <td className="p-1.5 border">{t.partyName}</td>
                        <td className="p-1.5 border">{t.paymentMethod}</td>
                        <td className={`p-1.5 border text-right font-bold ${t.type === "INCOME" ? "text-emerald-700" : "text-rose-600"}`}>
                          {t.type === "INCOME" ? "+" : "-"}{t.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT OFFRANT LE RENDU CERTIFIÉ POUR HTML2PDF (VISIBLE DANS LE FLUX AVEC DISPLAY NONE PAR DÉFAUT) */}
      <div
        id="printable-financial-doc"
        style={{
          display: "none",
          width: "1120px",
          backgroundColor: "#ffffff",
          padding: "24px 30px",
          color: "#1e293b",
          fontFamily: "Arial, sans-serif"
        }}
      >
        {/* Entête National Béninois & École */}
        <div style={{ borderBottom: "2px solid #047857", paddingBottom: "12px", marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", color: "#475569" }}>
                RÉPUBLIQUE DU BÉNIN
              </div>
              <div style={{ fontSize: "9px", color: "#64748b" }}>
                MINISTÈRE DES ENSEIGNEMENTS MATERNEL ET SECONDAIRE
              </div>
              <div style={{ fontSize: "16px", fontWeight: "900", color: "#047857", marginTop: "3px" }}>
                {schoolInfo?.name || "ÉTABLISSEMENT SCOLAIRE"}
              </div>
              <div style={{ fontSize: "9px", color: "#64748b" }}>
                {schoolInfo?.address || "Cotonou"} | Tél: {schoolInfo?.phone || "+229 00 00 00 00"}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "15px", fontWeight: "900", color: "#0f172a" }}>
                GRAND LIVRE FINANCIER & ÉTAT DE CAISSE
              </div>
              <div style={{ fontSize: "10px", fontWeight: "bold", color: "#047857", marginTop: "2px" }}>
                Année Scolaire : {schoolInfo?.academic_year || "2024-2025"}
              </div>
              {filterClass !== "ALL" && (
                <div style={{ fontSize: "11px", fontWeight: "bold", color: "#1d4ed8", marginTop: "2px" }}>
                  Classe sélectionnée : {filterClass}
                </div>
              )}
              {filterCategory !== "ALL" && (
                <div style={{ fontSize: "11px", fontWeight: "bold", color: "#047857", marginTop: "2px" }}>
                  Catégorie : {filterCategory}
                </div>
              )}
              <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>
                Date d'édition : {new Date().toLocaleDateString("fr-FR")} à {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div style={{ fontSize: "9px", color: "#64748b" }}>
                Émis par : {user?.name || "La Direction Générale"}
              </div>
            </div>
          </div>
        </div>

        {/* Synthèse par Catégorie sans cumul */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "#334155", marginBottom: "6px" }}>
            1. Synthèse Analytique par Catégorie
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                <th style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "left" }}>Catégorie Recettes (Entrées)</th>
                <th style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "right" }}>Montant FCFA</th>
                <th style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "left" }}>Catégorie Charges & Salaires (Sorties)</th>
                <th style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "right" }}>Montant FCFA</th>
              </tr>
            </thead>
            <tbody>
              {/* Combine up to max rows */}
              {Array.from({ length: Math.max(financialMetrics.sortedIncomes.length, financialMetrics.sortedExpenses.length, 1) }).map((_, idx) => {
                const inc = financialMetrics.sortedIncomes[idx];
                const exp = financialMetrics.sortedExpenses[idx];
                return (
                  <tr key={idx}>
                    <td style={{ padding: "4px 8px", border: "1px solid #e2e8f0" }}>{inc ? inc[1].label : "-"}</td>
                    <td style={{ padding: "4px 8px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "bold", color: "#047857" }}>
                      {inc ? `${inc[1].amount.toLocaleString()} FCFA` : "-"}
                    </td>
                    <td style={{ padding: "4px 8px", border: "1px solid #e2e8f0" }}>{exp ? exp[1].label : "-"}</td>
                    <td style={{ padding: "4px 8px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "bold", color: "#e11d48" }}>
                      {exp ? `${exp[1].amount.toLocaleString()} FCFA` : "-"}
                    </td>
                  </tr>
                );
              })}
              <tr style={{ backgroundColor: "#f1f5f9", fontWeight: "bold" }}>
                <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1" }}>TOTAL ENTRÉES</td>
                <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "right", color: "#047857" }}>
                  {exportMetrics.totIn.toLocaleString()} FCFA
                </td>
                <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1" }}>TOTAL SORTIES</td>
                <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "right", color: "#be123c" }}>
                  {exportMetrics.totOut.toLocaleString()} FCFA
                </td>
              </tr>
              <tr style={{ backgroundColor: "#e2e8f0", fontWeight: "900", fontSize: "10px" }}>
                <td colSpan={2} style={{ padding: "6px 8px", border: "1px solid #94a3b8", textAlign: "right" }}>
                  SOLDE NET :
                </td>
                <td
                  colSpan={2}
                  style={{
                    padding: "6px 8px",
                    border: "1px solid #94a3b8",
                    textAlign: "right",
                    color: exportMetrics.net >= 0 ? "#047857" : "#be123c"
                  }}
                >
                  {exportMetrics.net >= 0 ? "+" : ""}{exportMetrics.net.toLocaleString()} FCFA
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. Journal Détaillé */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "#334155", marginBottom: "6px" }}>
            2. Détail des Opérations ({transactionsToExport.length} enregistrements)
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8.5px" }}>
            <thead>
              <tr style={{ backgroundColor: "#047857", color: "#ffffff", textAlign: "left" }}>
                <th style={{ padding: "5px", border: "1px solid #047857" }}>Date</th>
                <th style={{ padding: "5px", border: "1px solid #047857" }}>Réf.</th>
                <th style={{ padding: "5px", border: "1px solid #047857" }}>Catégorie</th>
                <th style={{ padding: "5px", border: "1px solid #047857" }}>Classe</th>
                <th style={{ padding: "5px", border: "1px solid #047857" }}>Tiers / Élève / Personnel</th>
                <th style={{ padding: "5px", border: "1px solid #047857" }}>Mode</th>
                <th style={{ padding: "5px", border: "1px solid #047857", textAlign: "right" }}>Montant FCFA</th>
              </tr>
            </thead>
            <tbody>
              {transactionsToExport.map((t, idx) => (
                <tr
                  key={t.id}
                  style={{
                    backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                    borderBottom: "1px solid #e2e8f0"
                  }}
                >
                  <td style={{ padding: "4px 5px", border: "1px solid #e2e8f0" }}>{t.dateStr}</td>
                  <td style={{ padding: "4px 5px", border: "1px solid #e2e8f0", fontFamily: "monospace" }}>{t.reference}</td>
                  <td style={{ padding: "4px 5px", border: "1px solid #e2e8f0", fontWeight: "bold" }}>{t.categoryLabel}</td>
                  <td style={{ padding: "4px 5px", border: "1px solid #e2e8f0", fontWeight: "bold", color: "#1d4ed8" }}>{t.studentClass || "-"}</td>
                  <td style={{ padding: "4px 5px", border: "1px solid #e2e8f0" }}>{t.partyName}</td>
                  <td style={{ padding: "4px 5px", border: "1px solid #e2e8f0" }}>{t.paymentMethod}</td>
                  <td
                    style={{
                      padding: "4px 5px",
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

        {/* Emargements officiels */}
        <div style={{ marginTop: "30px", display: "flex", justifyContent: "space-between" }}>
          <div style={{ width: "40%", textAlign: "center", borderTop: "1px solid #94a3b8", paddingTop: "6px" }}>
            <div style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase" }}>Le Responsable Caisse / Comptabilité</div>
            <div style={{ fontSize: "8px", color: "#64748b" }}>(Visa & Signature)</div>
            <div style={{ height: "40px" }}></div>
          </div>
          <div style={{ width: "40%", textAlign: "center", borderTop: "1px solid #94a3b8", paddingTop: "6px" }}>
            <div style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase" }}>Le Directeur de l'Établissement</div>
            <div style={{ fontSize: "8px", color: "#64748b" }}>(Cachet Officiel & Signature)</div>
            <div style={{ height: "40px" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
