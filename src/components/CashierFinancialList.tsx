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
  ChevronDown,
  Layers,
  Sparkles,
  CheckCircle2,
  Maximize2
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
  categoryGroup: "SCOLARITE" | "TRANCHES" | "INSCRIPTIONS" | "SERVICES" | "SALAIRES" | "DEPENSES";
  title: string;
  partyName: string; // Élève, employé ou fournisseur
  studentClass?: string; // Classe de l'élève (ex: "6ème", "CM2")
  partySubtext?: string;
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

  // Filters State
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
  const [exportScope, setExportScope] = useState<"FILTERED" | "SELECTED" | "INCOME_ONLY" | "SALARIES_ONLY" | "EXPENSES_ONLY">("FILTERED");

  // PDF Export States
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [shareSuccessMessage, setShareSuccessMessage] = useState<string | null>(null);
  const [selectedTransactionDetail, setSelectedTransactionDetail] = useState<UnifiedTransaction | null>(null);
  const [viewMode, setViewMode] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");

  const effectiveSchoolId = useMemo(() => {
    return propSchoolId || user?.schoolId || localStorage.getItem("edubenin_active_school_id") || "11111111-1111-4111-8111-111111111111";
  }, [propSchoolId, user?.schoolId]);

  // Load all financial records with distinct unbundled categories
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
      } catch (err) {}

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
      const rawPayments = paymentsData && paymentsData.length > 0 ? paymentsData : [];
      rawPayments.forEach((p: any) => {
        const st = studentsMap.get(p.student_id);
        const stName = st
          ? `${st.first_name || ""} ${st.last_name || ""}`.trim()
          : p.student_name || "Élève non renseigné";
        const stClass = st?.level || st?.classe || "Non spécifiée";
        const dateRaw = p.payment_date || p.created_at || new Date().toISOString();
        const dateObj = new Date(dateRaw);
        const dateStr = !isNaN(dateObj.getTime())
          ? dateObj.toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];
        const timestamp = !isNaN(dateObj.getTime()) ? dateObj.getTime() : Date.now();
        const pRef = p.reference || `REC-${String(p.id).slice(0, 8).toUpperCase()}`;
        const pYear = p.academic_year || st?.academic_year || schoolInfo?.academic_year || "2024-2025";
        const pMethod = p.payment_method || p.network || "Espèces";
        const pStatus =
          p.status === "PENDING"
            ? "PENDING"
            : p.status === "CANCELLED"
            ? "CANCELLED"
            : "COMPLETED";

        const items = Array.isArray(p.items) && p.items.length > 0 ? p.items : null;

        if (items && items.length > 0) {
          // Decompose each fee item into its own distinct line
          items.forEach((item: any, idx: number) => {
            const itemName = (item.name || "").trim();
            const itemLower = itemName.toLowerCase();
            const itemAmount = Number(item.amount) || 0;
            if (itemAmount <= 0) return;

            let catKey = "SCOLARITE";
            let catLabel = "Scolarité";
            let catGroup: UnifiedTransaction["categoryGroup"] = "SCOLARITE";

            if (
              itemLower.includes("tranche 1") ||
              item.id === "tranche1" ||
              itemLower.includes("1ère tranche") ||
              itemLower.includes("1ere tranche")
            ) {
              catKey = "TRANCHE_1";
              catLabel = "1ère Tranche";
              catGroup = "TRANCHES";
            } else if (
              itemLower.includes("tranche 2") ||
              item.id === "tranche2" ||
              itemLower.includes("2ème tranche") ||
              itemLower.includes("2eme tranche")
            ) {
              catKey = "TRANCHE_2";
              catLabel = "2ème Tranche";
              catGroup = "TRANCHES";
            } else if (
              itemLower.includes("tranche 3") ||
              item.id === "tranche3" ||
              itemLower.includes("3ème tranche") ||
              itemLower.includes("3eme tranche")
            ) {
              catKey = "TRANCHE_3";
              catLabel = "3ème Tranche";
              catGroup = "TRANCHES";
            } else if (itemLower.includes("réinscript") || itemLower.includes("reinscript")) {
              catKey = "REINSCRIPTION";
              catLabel = "Réinscription";
              catGroup = "INSCRIPTIONS";
            } else if (itemLower.includes("inscript")) {
              catKey = "INSCRIPTION";
              catLabel = "Inscription";
              catGroup = "INSCRIPTIONS";
            } else if (itemLower.includes("cantin")) {
              catKey = "CANTINE";
              catLabel = "Cantine";
              catGroup = "SERVICES";
            } else if (itemLower.includes("transport") || itemLower.includes("bus")) {
              catKey = "TRANSPORT";
              catLabel = "Transport";
              catGroup = "SERVICES";
            } else if (itemLower.includes("tenue") || itemLower.includes("uniforme")) {
              catKey = "TENUES";
              catLabel = "Tenues";
              catGroup = "SERVICES";
            } else if (
              itemLower.includes("fourniture") ||
              itemLower.includes("livre") ||
              itemLower.includes("manuel")
            ) {
              catKey = "FOURNITURES";
              catLabel = "Fournitures";
              catGroup = "SERVICES";
            } else if (itemLower.includes("scolarité") || itemLower.includes("scolarite")) {
              catKey = "SCOLARITE";
              catLabel = "Scolarité";
              catGroup = "SCOLARITE";
            } else {
              catKey = "AUTRE_RECETTE";
              catLabel = itemName || "Autre recette";
              catGroup = "SERVICES";
            }

            unified.push({
              id: `pay_${p.id}_item_${idx}`,
              type: "INCOME",
              categoryKey: catKey,
              categoryLabel: catLabel,
              categoryGroup: catGroup,
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
          // Single payment without items
          const pAmount = Number(p.amount) || 0;
          const refLower = pRef.toLowerCase();
          const typeLower = (p.payment_type || "").toLowerCase();

          let catKey = "SCOLARITE";
          let catLabel = "Scolarité";
          let catGroup: UnifiedTransaction["categoryGroup"] = "SCOLARITE";

          if (
            refLower.includes("tranche 1") ||
            refLower.includes("tr1") ||
            typeLower.includes("tranche 1")
          ) {
            catKey = "TRANCHE_1";
            catLabel = "1ère Tranche";
            catGroup = "TRANCHES";
          } else if (
            refLower.includes("tranche 2") ||
            refLower.includes("tr2") ||
            typeLower.includes("tranche 2")
          ) {
            catKey = "TRANCHE_2";
            catLabel = "2ème Tranche";
            catGroup = "TRANCHES";
          } else if (
            refLower.includes("tranche 3") ||
            refLower.includes("tr3") ||
            typeLower.includes("tranche 3")
          ) {
            catKey = "TRANCHE_3";
            catLabel = "3ème Tranche";
            catGroup = "TRANCHES";
          } else if (refLower.includes("reinsc") || typeLower.includes("reinsc")) {
            catKey = "REINSCRIPTION";
            catLabel = "Réinscription";
            catGroup = "INSCRIPTIONS";
          } else if (refLower.includes("insc") || typeLower.includes("insc")) {
            catKey = "INSCRIPTION";
            catLabel = "Inscription";
            catGroup = "INSCRIPTIONS";
          } else if (refLower.includes("cantin") || typeLower.includes("cantin")) {
            catKey = "CANTINE";
            catLabel = "Cantine";
            catGroup = "SERVICES";
          } else if (refLower.includes("transp") || typeLower.includes("transp")) {
            catKey = "TRANSPORT";
            catLabel = "Transport";
            catGroup = "SERVICES";
          } else {
            catKey = "SCOLARITE";
            catLabel = "Scolarité";
            catGroup = "SCOLARITE";
          }

          unified.push({
            id: `pay_${p.id}`,
            type: "INCOME",
            categoryKey: catKey,
            categoryLabel: catLabel,
            categoryGroup: catGroup,
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
            notes: `Règlement direct ${catLabel}`
          });
        }
      });

      // B. Process Expenses into Discrete Categories (NO BUNDLING)
      const combinedExpenses = [...(expensesData || []), ...localExpenses];
      const seenExpenseIds = new Set<string>();
      combinedExpenses.forEach((e: any) => {
        if (!e.id || seenExpenseIds.has(e.id)) return;
        seenExpenseIds.add(e.id);

        const dateRaw = e.expense_date || e.created_at || new Date().toISOString();
        const dateObj = new Date(dateRaw);
        const dateStr = !isNaN(dateObj.getTime())
          ? dateObj.toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];
        const timestamp = !isNaN(dateObj.getTime()) ? dateObj.getTime() : Date.now();

        const rawCat = (e.category || "").toUpperCase();
        let catKey = "AUTRE_DEPENSE";
        let catLabel = "Autre charge";

        if (
          rawCat === "MATERIEL_FOURNITURE" ||
          rawCat.includes("FOURNITURE") ||
          rawCat.includes("BUREAU")
        ) {
          catKey = "MATERIEL_FOURNITURE";
          catLabel = "Matériels et Fournitures de Bureau";
        } else if (
          rawCat === "ENTRETIEN_REPARATION" ||
          rawCat.includes("ENTRETIEN") ||
          rawCat.includes("REPARATION")
        ) {
          catKey = "ENTRETIEN_REPARATION";
          catLabel = "Entretien et réparations";
        } else if (rawCat === "TRAVAUX" || rawCat.includes("BATIMENT")) {
          catKey = "TRAVAUX";
          catLabel = "Travaux et rénovations";
        } else if (rawCat === "PRELEVEMENTS_BANQUE" || rawCat.includes("BANQUE")) {
          catKey = "PRELEVEMENTS_BANQUE";
          catLabel = "Prélèvements BANQUE";
        } else if (rawCat === "UNIFORMES" || rawCat.includes("TENUE")) {
          catKey = "UNIFORMES_DEPENSE";
          catLabel = "Uniformes et tenues";
        } else if (rawCat === "LIVRES" || rawCat.includes("MANUEL")) {
          catKey = "LIVRES";
          catLabel = "Livres et manuels";
        } else if (rawCat === "CANTINE") {
          catKey = "CANTINE_DEPENSE";
          catLabel = "Cantine";
        } else if (rawCat === "COMMUNICATIONS" || rawCat.includes("TELECOM")) {
          catKey = "COMMUNICATIONS";
          catLabel = "Communications et télécoms";
        } else if (rawCat === "PRESTATAIRES") {
          catKey = "PRESTATAIRES";
          catLabel = "Prestataires extérieurs";
        } else if (rawCat === "IMPOTS" || rawCat.includes("TAXE")) {
          catKey = "IMPOTS";
          catLabel = "Impôts et taxes";
        } else if (rawCat === "COLLATIONS") {
          catKey = "COLLATIONS";
          catLabel = "Collations et réceptions";
        } else if (rawCat === "MATERIEL_DIDACTIQUE") {
          catKey = "MATERIEL_DIDACTIQUE";
          catLabel = "Matériels didactiques";
        } else if (rawCat === "PRIMES") {
          catKey = "PRIMES";
          catLabel = "Primes et gratifications";
        } else if (
          rawCat === "FACTURE" ||
          rawCat.includes("EAU") ||
          rawCat.includes("ELECTRICITE") ||
          rawCat.includes("SBEE")
        ) {
          catKey = "FACTURE_EAU_ELEC";
          catLabel = "Factures Eau et Électricité";
        } else if (rawCat.includes("CARBURANT") || rawCat.includes("TRANSPORT")) {
          catKey = "CARBURANT";
          catLabel = "Carburant et transport";
        } else {
          catKey = `DEPENSE_${rawCat || "AUTRE"}`;
          catLabel = e.category || "Autre charge";
        }

        unified.push({
          id: `exp_${e.id}`,
          type: "EXPENSE",
          categoryKey: catKey,
          categoryLabel: catLabel,
          categoryGroup: "DEPENSES",
          title: e.description || catLabel,
          partyName: e.beneficiary || e.supplier || "Fournisseur / Prestataire",
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

      // C. Process Salaries into Specific Roles (SEPARATED FROM OPERATING EXPENSES)
      const combinedSalaries = [...salariesData, ...localSalaries];
      const seenSalaryIds = new Set<string>();
      combinedSalaries.forEach((s: any) => {
        if (!s.id || seenSalaryIds.has(s.id)) return;
        seenSalaryIds.add(s.id);

        const dateRaw = s.payment_date || s.created_at || new Date().toISOString();
        const dateObj = new Date(dateRaw);
        const dateStr = !isNaN(dateObj.getTime())
          ? dateObj.toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];
        const timestamp = !isNaN(dateObj.getTime()) ? dateObj.getTime() : Date.now();

        const role = (s.employee_role || s.employeeRole || "Autre").trim();
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
          categoryGroup: "SALAIRES",
          title: `Salaire (${s.month || "Mois"}) - ${s.employee_name || s.employeeName || "Personnel"}`,
          partyName: s.employee_name || s.employeeName || "Personnel",
          partySubtext: `Fonction : ${role}`,
          amount: Number(s.amount) || 0,
          dateStr: dateStr,
          timestamp: timestamp,
          paymentMethod: s.payment_method || "Virement / Caisse",
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

      // 3. Class Filter
      if (filterClass !== "ALL") {
        if (!t.studentClass || t.studentClass !== filterClass) return false;
      }

      // 4. Category Filter (Discrete OR Collective groups)
      if (filterCategory !== "ALL") {
        if (filterCategory === "ALL_TRANCHES") {
          if (t.categoryKey !== "TRANCHE_1" && t.categoryKey !== "TRANCHE_2" && t.categoryKey !== "TRANCHE_3") {
            return false;
          }
        } else if (filterCategory === "ALL_INSCRIPTIONS") {
          if (t.categoryKey !== "INSCRIPTION" && t.categoryKey !== "REINSCRIPTION") {
            return false;
          }
        } else if (filterCategory === "ALL_SALARIES") {
          if (t.categoryGroup !== "SALAIRES") return false;
        } else if (filterCategory === "ALL_EXPENSES") {
          if (t.categoryGroup !== "DEPENSES") return false;
        } else {
          // Specific discrete category
          if (t.categoryKey !== filterCategory) return false;
        }
      }

      // 5. Date Filter
      if (!isDateInPreset(t.dateStr, filterDatePreset)) return false;

      // 6. Academic Year
      if (filterYear !== "ALL" && t.academicYear !== filterYear) return false;

      // 7. Payment Method
      if (filterPaymentMethod !== "ALL") {
        const methodLower = (t.paymentMethod || "").toLowerCase();
        if (filterPaymentMethod === "CASH" && !methodLower.includes("esp")) return false;
        if (
          filterPaymentMethod === "MOBILE" &&
          !methodLower.includes("mtn") &&
          !methodLower.includes("moov") &&
          !methodLower.includes("celtiis") &&
          !methodLower.includes("wave") &&
          !methodLower.includes("mobile")
        )
          return false;
        if (filterPaymentMethod === "BANK" && !methodLower.includes("vir") && !methodLower.includes("banq"))
          return false;
        if (filterPaymentMethod === "CHECK" && !methodLower.includes("chèq") && !methodLower.includes("cheq"))
          return false;
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

  // Category Metrics: 3 SEPARATED BOXES, NO CUMUL, NO "&"
  const financialMetrics = useMemo(() => {
    let totalIn = 0;
    let totalSalaries = 0;
    let totalExpenses = 0;
    let countIn = 0;
    let countSalaries = 0;
    let countExpenses = 0;

    // Distinct Category Maps
    const incomeCategoriesMap: Record<string, { label: string; amount: number; count: number }> = {};
    const salaryCategoriesMap: Record<string, { label: string; amount: number; count: number }> = {};
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
        } else if (t.categoryGroup === "SALAIRES") {
          totalSalaries += t.amount;
          countSalaries++;
          if (!salaryCategoriesMap[t.categoryKey]) {
            salaryCategoriesMap[t.categoryKey] = { label: t.categoryLabel, amount: 0, count: 0 };
          }
          salaryCategoriesMap[t.categoryKey].amount += t.amount;
          salaryCategoriesMap[t.categoryKey].count++;
        } else {
          totalExpenses += t.amount;
          countExpenses++;
          if (!expenseCategoriesMap[t.categoryKey]) {
            expenseCategoriesMap[t.categoryKey] = { label: t.categoryLabel, amount: 0, count: 0 };
          }
          expenseCategoriesMap[t.categoryKey].amount += t.amount;
          expenseCategoriesMap[t.categoryKey].count++;
        }
      }
    });

    const totalOut = totalSalaries + totalExpenses;

    // Standard ordering for incomes: Scolarité, Tranches 1, 2, 3, Inscription, Réinscription, etc.
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

    const sortedSalaries = Object.entries(salaryCategoriesMap).sort(
      (a, b) => b[1].amount - a[1].amount
    );

    const sortedExpenses = Object.entries(expenseCategoriesMap).sort(
      (a, b) => b[1].amount - a[1].amount
    );

    const netBalance = totalIn - totalOut;

    // Recharts Data
    const chartData = [
      ...sortedIncomes.map(([_, v]) => ({
        name: v.label,
        type: "Recette",
        montant: v.amount,
        fill: "#10b981"
      })),
      ...sortedSalaries.map(([_, v]) => ({
        name: v.label,
        type: "Salaire",
        montant: v.amount,
        fill: "#6366f1"
      })),
      ...sortedExpenses.map(([_, v]) => ({
        name: v.label,
        type: "Dépense",
        montant: v.amount,
        fill: "#f43f5e"
      }))
    ];

    return {
      totalIn,
      totalOut,
      totalSalaries,
      totalExpenses,
      netBalance,
      countIn,
      countSalaries,
      countExpenses,
      sortedIncomes,
      sortedSalaries,
      sortedExpenses,
      chartData
    };
  }, [filteredTransactions]);

  // Handle Checkbox Selection
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
    if (exportScope === "INCOME_ONLY") {
      return filteredTransactions.filter((t) => t.type === "INCOME");
    }
    if (exportScope === "SALARIES_ONLY") {
      return filteredTransactions.filter((t) => t.categoryGroup === "SALAIRES");
    }
    if (exportScope === "EXPENSES_ONLY") {
      return filteredTransactions.filter((t) => t.categoryGroup === "DEPENSES");
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

  // Export to PDF with 100% Guaranteed Non-Blank Rendering
  const handleExportPDF = () => {
    const element = document.getElementById("printable-financial-doc");
    if (!element) {
      alert("Erreur : Impossible de charger le conteneur du document.");
      return;
    }

    setExportingPdf(true);
    const dateFormatted = new Date().toISOString().split("T")[0];
    const schoolNameSlug = (schoolInfo?.name || "Ecole").replace(/[^a-zA-Z0-9]/g, "_");
    const classSuffix = filterClass !== "ALL" ? `_${filterClass.replace(/ /g, "_")}` : "";
    const catSuffix = filterCategory !== "ALL" ? `_${filterCategory}` : "";
    const fileName = `Liste_Financiere_${schoolNameSlug}${classSuffix}${catSuffix}_${dateFormatted}.pdf`;

    // Make element visible and positioned for html2canvas
    element.style.display = "block";
    element.style.visibility = "visible";
    element.style.position = "fixed";
    element.style.left = "0px";
    element.style.top = "0px";
    element.style.width = "1120px";
    element.style.zIndex = "999999";
    element.style.backgroundColor = "#ffffff";

    setTimeout(() => {
      const opt = {
        margin: [8, 8, 8, 8] as [number, number, number, number],
        filename: fileName,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 1.5, useCORS: true, logging: false },
        jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "landscape" as const },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] }
      };

      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
          element.style.display = "none";
          element.style.visibility = "hidden";
          element.style.zIndex = "-1000";
          setExportingPdf(false);
          setShareSuccessMessage("Document PDF téléchargé avec succès !");
          setTimeout(() => setShareSuccessMessage(null), 3500);
        })
        .catch((err: any) => {
          console.error("Erreur PDF:", err);
          element.style.display = "none";
          element.style.visibility = "hidden";
          setExportingPdf(false);
          alert("Erreur lors de la génération. Vous pouvez également cliquer sur Imprimer.");
        });
    }, 350);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const summaryText = `📊 ÉTAT FINANCIER & CAISSE - ${schoolInfo?.name || "Établissement Scolaire"}
🏛️ Classe: ${filterClass === "ALL" ? "Toutes classes" : filterClass} | Catégorie: ${filterCategory === "ALL" ? "Toutes" : filterCategory}
📅 Période: ${filterDatePreset === "ALL" ? "Globale" : filterDatePreset}
--------------------------------------
📈 Recettes (Entrées) : ${financialMetrics.totalIn.toLocaleString()} FCFA (${financialMetrics.countIn} opérations)
👥 Salaires Personnel : ${financialMetrics.totalSalaries.toLocaleString()} FCFA (${financialMetrics.countSalaries} règlements)
🏢 Dépenses Exploitation : ${financialMetrics.totalExpenses.toLocaleString()} FCFA (${financialMetrics.countExpenses} charges)
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
    searchTerm ||
    filterFlow !== "ALL" ||
    filterClass !== "ALL" ||
    filterCategory !== "ALL" ||
    filterDatePreset !== "ALL" ||
    filterYear !== "ALL" ||
    filterPaymentMethod !== "ALL" ||
    filterStatus !== "ALL";

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {shareSuccessMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 font-bold text-xs">
          <CheckCircle size={18} />
          <span>{shareSuccessMessage}</span>
        </div>
      )}

      {/* Loading Modal during PDF export */}
      {exportingPdf && (
        <div className="fixed inset-0 z-[9999999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-pulse">
              <Download size={24} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-base">Génération du Document PDF</h3>
              <p className="text-xs text-slate-500 mt-1">
                Compilation des écritures et calcul des totaux en cours...
              </p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-600 h-2 rounded-full animate-indeterminate"></div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <FileSpreadsheet size={22} />
            </span>
            <h1 className="text-xl font-black text-gray-900">
              Liste Financière & Grand Livre
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {filteredTransactions.length} transaction{filteredTransactions.length > 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Consultation analytique des recettes, salaires et dépenses. Catégories strictes sans cumul, filtres précis par classe et export PDF ciblé.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchAllFinancialData}
            disabled={refreshing}
            className="p-2.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            title="Rafraîchir les données"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>

          <button
            onClick={() => setShowPreviewModal(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition"
            title="Prévisualiser le document avant impression ou export"
          >
            <Eye size={15} />
            <span>Aperçu Document</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition"
            title="Imprimer directement"
          >
            <Printer size={15} />
            <span>Imprimer</span>
          </button>

          <button
            onClick={handleShare}
            className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-2 transition"
            title="Partager le récapitulatif"
          >
            <Share2 size={15} />
            <span>Partager</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exportingPdf}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
            title="Télécharger le document PDF"
          >
            <Download size={15} />
            <span>Télécharger PDF</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD ANALYTIQUE EN 3 BLOCS INDIVIDUELS (SANS CUMUL) */}
      <div className="space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 1. Total Recettes */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Recettes
              </span>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <ArrowUpRight size={18} />
              </span>
            </div>
            <div className="text-2xl font-black text-gray-900">
              +{financialMetrics.totalIn.toLocaleString()}{" "}
              <span className="text-xs font-bold text-slate-500">FCFA</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              {financialMetrics.countIn} versement{financialMetrics.countIn > 1 ? "s" : ""} encaissé{financialMetrics.countIn > 1 ? "s" : ""}
            </div>
          </div>

          {/* 2. Total Salaires */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Salaires Personnel
              </span>
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Users size={18} />
              </span>
            </div>
            <div className="text-2xl font-black text-gray-900">
              -{financialMetrics.totalSalaries.toLocaleString()}{" "}
              <span className="text-xs font-bold text-slate-500">FCFA</span>
            </div>
            <div className="text-[11px] text-indigo-600 font-semibold mt-1">
              {financialMetrics.countSalaries} rémunération{financialMetrics.countSalaries > 1 ? "s" : ""} réglée{financialMetrics.countSalaries > 1 ? "s" : ""}
            </div>
          </div>

          {/* 3. Total Dépenses d'Exploitation */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Charges d'Exploitation
              </span>
              <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <ArrowDownRight size={18} />
              </span>
            </div>
            <div className="text-2xl font-black text-gray-900">
              -{financialMetrics.totalExpenses.toLocaleString()}{" "}
              <span className="text-xs font-bold text-slate-500">FCFA</span>
            </div>
            <div className="text-[11px] text-rose-600 font-semibold mt-1">
              {financialMetrics.countExpenses} charge{financialMetrics.countExpenses > 1 ? "s" : ""} payée{financialMetrics.countExpenses > 1 ? "s" : ""}
            </div>
          </div>

          {/* 4. Solde Net */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Solde Net de Caisse
              </span>
              <span
                className={`p-2 rounded-xl ${
                  financialMetrics.netBalance >= 0
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                <Wallet size={18} />
              </span>
            </div>
            <div
              className={`text-2xl font-black ${
                financialMetrics.netBalance >= 0 ? "text-emerald-700" : "text-rose-600"
              }`}
            >
              {financialMetrics.netBalance >= 0 ? "+" : ""}
              {financialMetrics.netBalance.toLocaleString()}{" "}
              <span className="text-xs font-bold text-slate-500">FCFA</span>
            </div>
            <div className="text-[11px] text-slate-500 font-semibold mt-1">
              Total Sorties : -{financialMetrics.totalOut.toLocaleString()} FCFA
            </div>
          </div>
        </div>

        {/* 3 COLONNES DÉTAILLÉES UNE PAR UNE SANS AUCUN CUMUL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bloc 1 : Recettes par Catégorie (Scolarités, Tranches, Inscriptions une par une) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wide">
                  1. Recettes par Catégorie
                </h3>
              </div>
              <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                +{financialMetrics.totalIn.toLocaleString()} FCFA
              </span>
            </div>

            <div className="space-y-2.5 flex-1 max-h-80 overflow-y-auto pr-1">
              {financialMetrics.sortedIncomes.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs italic">
                  Aucune recette pour la sélection.
                </div>
              ) : (
                financialMetrics.sortedIncomes.map(([key, item]) => {
                  const percentage =
                    financialMetrics.totalIn > 0
                      ? Math.round((item.amount / financialMetrics.totalIn) * 100)
                      : 0;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5 truncate">
                          <GraduationCap size={13} className="text-emerald-600 shrink-0" />
                          <span className="truncate">{item.label}</span>
                          <span className="text-slate-400 font-normal shrink-0">
                            ({item.count})
                          </span>
                        </span>
                        <span className="font-bold text-gray-900 shrink-0 text-right">
                          {item.amount.toLocaleString()} FCFA{" "}
                          <span className="text-slate-400 font-normal text-[10px]">
                            ({percentage}%)
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bloc 2 : Salaires par Poste (Séparés strictement des dépenses) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wide">
                  2. Salaires par Poste
                </h3>
              </div>
              <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                -{financialMetrics.totalSalaries.toLocaleString()} FCFA
              </span>
            </div>

            <div className="space-y-2.5 flex-1 max-h-80 overflow-y-auto pr-1">
              {financialMetrics.sortedSalaries.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs italic">
                  Aucun salaire pour la sélection.
                </div>
              ) : (
                financialMetrics.sortedSalaries.map(([key, item]) => {
                  const percentage =
                    financialMetrics.totalSalaries > 0
                      ? Math.round((item.amount / financialMetrics.totalSalaries) * 100)
                      : 0;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5 truncate">
                          <Users size={13} className="text-indigo-600 shrink-0" />
                          <span className="truncate">{item.label}</span>
                          <span className="text-slate-400 font-normal shrink-0">
                            ({item.count})
                          </span>
                        </span>
                        <span className="font-bold text-gray-900 shrink-0 text-right">
                          {item.amount.toLocaleString()} FCFA{" "}
                          <span className="text-slate-400 font-normal text-[10px]">
                            ({percentage}%)
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bloc 3 : Dépenses d'Exploitation (Chaque catégorie réelle une par une) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wide">
                  3. Charges d'Exploitation
                </h3>
              </div>
              <span className="text-[11px] font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                -{financialMetrics.totalExpenses.toLocaleString()} FCFA
              </span>
            </div>

            <div className="space-y-2.5 flex-1 max-h-80 overflow-y-auto pr-1">
              {financialMetrics.sortedExpenses.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs italic">
                  Aucune charge d'exploitation pour la sélection.
                </div>
              ) : (
                financialMetrics.sortedExpenses.map(([key, item]) => {
                  const percentage =
                    financialMetrics.totalExpenses > 0
                      ? Math.round((item.amount / financialMetrics.totalExpenses) * 100)
                      : 0;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5 truncate">
                          <FileText size={13} className="text-rose-500 shrink-0" />
                          <span className="truncate">{item.label}</span>
                          <span className="text-slate-400 font-normal shrink-0">
                            ({item.count})
                          </span>
                        </span>
                        <span className="font-bold text-gray-900 shrink-0 text-right">
                          {item.amount.toLocaleString()} FCFA{" "}
                          <span className="text-slate-400 font-normal text-[10px]">
                            ({percentage}%)
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-rose-500 h-1.5 rounded-full transition-all duration-500"
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
              <h3 className="font-bold text-gray-800 text-xs flex items-center gap-2">
                <BarChart3 size={16} className="text-emerald-600" />
                Comparatif des Flux par Catégorie
              </h3>
              <div className="flex items-center gap-4 text-[11px] font-bold">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                  <span>Recettes</span>
                </span>
                <span className="flex items-center gap-1.5 text-indigo-700">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span>
                  <span>Salaires</span>
                </span>
                <span className="flex items-center gap-1.5 text-rose-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
                  <span>Charges</span>
                </span>
              </div>
            </div>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialMetrics.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickFormatter={(val) => `${(val / 1000).toLocaleString()}k`}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${Number(value).toLocaleString()} FCFA`, undefined]}
                    contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                  />
                  <Bar dataKey="montant" radius={[4, 4, 0, 0]}>
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

      {/* FILTRES PERTINENTS (AVEC FILTRE PAR CLASSE & CATÉGORIES NON JUMELÉES) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-emerald-600" />
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wide">
              Filtres Pertinents & Précis
            </h3>
            {hasActiveFilters && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Actifs
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 transition"
            >
              <X size={14} />
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Recherche plein texte */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Recherche globale
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Élève, personnel, motif, reçu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
              />
            </div>
          </div>

          {/* 2. Filtre par Classe (Essentiel pour voir 1ère tranche par classe, etc.) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Classe de l'élève
            </label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
            >
              <option value="ALL">Toutes les classes</option>
              {availableClasses.map((cl) => (
                <option key={cl} value={cl}>
                  Classe : {cl}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Catégorie Précise (NON JUMELÉE, SANS &) */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Catégorie Précise (Sans Jumelage)
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
            >
              <option value="ALL">Toutes les catégories</option>

              {/* TRANCHES DE SCOLARITÉ */}
              <optgroup label="--- TRANCHES DE SCOLARITÉ ---">
                <option value="ALL_TRANCHES">Toutes les tranches ensemble (Tranches 1, 2 et 3)</option>
                <option value="TRANCHE_1">1ère Tranche uniquement</option>
                <option value="TRANCHE_2">2ème Tranche uniquement</option>
                <option value="TRANCHE_3">3ème Tranche uniquement</option>
              </optgroup>

              {/* SCOLARITÉS */}
              <optgroup label="--- SCOLARITÉ GLOBALE ---">
                <option value="SCOLARITE">Scolarité (Solde / Reste à payer)</option>
              </optgroup>

              {/* INSCRIPTIONS */}
              <optgroup label="--- INSCRIPTIONS ---">
                <option value="ALL_INSCRIPTIONS">Toutes les inscriptions (Nouvelles & Réinscriptions)</option>
                <option value="INSCRIPTION">Nouvelle Inscription uniquement</option>
                <option value="REINSCRIPTION">Réinscription uniquement</option>
              </optgroup>

              {/* SERVICES SCOLAIRES */}
              <optgroup label="--- SERVICES SCOLAIRES ---">
                <option value="CANTINE">Cantine</option>
                <option value="TRANSPORT">Transport</option>
                <option value="TENUES">Tenues</option>
                <option value="FOURNITURES">Fournitures</option>
                <option value="AUTRE_RECETTE">Autres recettes</option>
              </optgroup>

              {/* SALAIRES DU PERSONNEL */}
              <optgroup label="--- SALAIRES DU PERSONNEL ---">
                <option value="ALL_SALARIES">Tous les salaires réunis</option>
                <option value="SALAIRE_PROFESSEUR">Salaires - Professeurs</option>
                <option value="SALAIRE_DIRECTION">Salaires - Direction</option>
                <option value="SALAIRE_ETUDES">Salaires - Direction des Études</option>
                <option value="SALAIRE_SECRETARIAT">Salaires - Secrétariat</option>
                <option value="SALAIRE_SURVEILLANCE">Salaires - Surveillance</option>
                <option value="SALAIRE_GARDIENNAGE">Salaires - Gardiennage</option>
                <option value="SALAIRE_COMPTABILITE">Salaires - Caisse & Comptabilité</option>
                <option value="SALAIRE_CHAUFFEUR">Salaires - Chauffeur</option>
                <option value="SALAIRE_AUTRE">Salaires - Autre personnel</option>
              </optgroup>

              {/* CHARGES D'EXPLOITATION */}
              <optgroup label="--- CHARGES D'EXPLOITATION ---">
                <option value="ALL_EXPENSES">Toutes les charges d'exploitation réunies</option>
                <option value="MATERIEL_FOURNITURE">Matériels et Fournitures de Bureau</option>
                <option value="ENTRETIEN_REPARATION">Entretien et réparations</option>
                <option value="TRAVAUX">Travaux et rénovations</option>
                <option value="FACTURE_EAU_ELEC">Factures Eau et Électricité</option>
                <option value="CARBURANT">Carburant et transport</option>
                <option value="PRESTATAIRES">Prestataires extérieurs</option>
                <option value="IMPOTS">Impôts et taxes</option>
                <option value="COLLATIONS">Collations et réceptions</option>
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
              <option value="ALL">Toute la période</option>
              <option value="TODAY">Aujourd'hui</option>
              <option value="THIS_WEEK">Cette semaine</option>
              <option value="THIS_MONTH">Ce mois-ci</option>
              <option value="THIS_TRIMESTER">Ce trimestre</option>
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
                  {y.name} {y.status === "ACTIVE" ? "(En cours)" : ""}
                </option>
              ))}
              {schoolYears.length === 0 && (
                <option value="2024-2025">2024-2025 (Par défaut)</option>
              )}
            </select>
          </div>

          {/* 6. Mode de paiement */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Mode de paiement
            </label>
            <select
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
            >
              <option value="ALL">Tous les modes</option>
              <option value="CASH">Espèces (Caisse)</option>
              <option value="MOBILE">Mobile Money (MTN / Moov / Celtiis)</option>
              <option value="BANK">Virement Bancaire</option>
              <option value="CHECK">Chèque</option>
            </select>
          </div>

          {/* 7. Type de flux */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Sens du flux
            </label>
            <select
              value={filterFlow}
              onChange={(e) => setFilterFlow(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
            >
              <option value="ALL">Tous les flux (Entrées et Sorties)</option>
              <option value="INCOME">🟢 Entrées (Recettes)</option>
              <option value="EXPENSE">🔴 Sorties (Salaires et Dépenses)</option>
            </select>
          </div>
        </div>

        {/* Date Personnalisée */}
        {filterDatePreset === "CUSTOM" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 animate-in fade-in">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Du :</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Au :</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* TOOLBAR TÉLÉCHARGEMENT CIBLÉ & SÉLECTION PRÉCISE */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Selection badges */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
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

          {selectedIds.size > 0 && (
            <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
              {selectedIds.size} ligne{selectedIds.size > 1 ? "s" : ""} cochée{selectedIds.size > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Scope Selector & Download Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-bold">Périmètre d'export :</span>
            <select
              value={exportScope}
              onChange={(e) => setExportScope(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="FILTERED">
                Données filtrées à l'écran ({filteredTransactions.length})
              </option>
              <option value="SELECTED" disabled={selectedIds.size === 0}>
                Lignes cochées ({selectedIds.size})
              </option>
              <option value="INCOME_ONLY">Recettes uniquement</option>
              <option value="SALARIES_ONLY">Salaires uniquement</option>
              <option value="EXPENSES_ONLY">Dépenses uniquement</option>
            </select>
          </div>

          <button
            onClick={handleExportPDF}
            disabled={exportingPdf}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            title="Télécharger spécifiquement ce périmètre en PDF"
          >
            <Download size={14} />
            <span>
              Télécharger PDF ({exportScope === "SELECTED" ? selectedIds.size : transactionsToExport.length})
            </span>
          </button>
        </div>
      </div>

      {/* TABLE PRINCIPALE DES ÉCRITURES FINANCIÈRES */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table View Tab Headers */}
        <div className="border-b border-slate-100 px-5 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Toutes les écritures ({transactions.length})
            </button>
            <button
              onClick={() => setViewMode("INCOME")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === "INCOME"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              Recettes ({transactions.filter((t) => t.type === "INCOME").length})
            </button>
            <button
              onClick={() => setViewMode("EXPENSE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === "EXPENSE"
                  ? "bg-rose-600 text-white"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
            >
              Salaires et Dépenses ({transactions.filter((t) => t.type === "EXPENSE").length})
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Affichage de{" "}
            <span className="font-bold text-gray-900">{filteredTransactions.length}</span> sur{" "}
            <span className="font-bold text-gray-900">{transactions.length}</span> enregistrements
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.size === filteredTransactions.length &&
                      filteredTransactions.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">Date et Réf</th>
                <th className="py-3.5 px-4">Catégorie (Sans cumul)</th>
                <th className="py-3.5 px-4">Classe</th>
                <th className="py-3.5 px-4">Tiers / Élève / Employé</th>
                <th className="py-3.5 px-4">Mode & Statut</th>
                <th className="py-3.5 px-4 text-right">Montant (FCFA)</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={20} className="animate-spin text-emerald-600" />
                      <span>Chargement du grand livre financier...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                    Aucune transaction ne correspond aux critères de filtre.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => {
                  const isSelected = selectedIds.has(t.id);
                  const isIncome = t.type === "INCOME";

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? "bg-emerald-50/40" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRowSelect(t.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* Date & Réf */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900">
                          {new Date(t.dateStr).toLocaleDateString("fr-FR")}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">{t.reference}</div>
                      </td>

                      {/* Catégorie (INDIVIDUAL, NO & BUNDLING) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isIncome
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : t.categoryGroup === "SALAIRES"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isIncome
                                ? "bg-emerald-500"
                                : t.categoryGroup === "SALAIRES"
                                ? "bg-indigo-500"
                                : "bg-rose-500"
                            }`}
                          ></span>
                          <span>{t.categoryLabel}</span>
                        </span>
                      </td>

                      {/* Classe de l'élève */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {t.studentClass && t.studentClass !== "Non spécifiée" ? (
                          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[11px] border border-blue-200">
                            {t.studentClass}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Tiers / Élève / Personnel */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{t.partyName}</div>
                        {t.partySubtext && (
                          <div className="text-[10px] text-slate-400">{t.partySubtext}</div>
                        )}
                      </td>

                      {/* Mode & Statut */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-slate-700 font-semibold">{t.paymentMethod}</div>
                        <div className="text-[10px] text-slate-400">
                          {t.status === "COMPLETED" ? "Validé" : t.status === "PENDING" ? "En attente" : "Annulé"}
                        </div>
                      </td>

                      {/* Montant */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-black text-sm ${
                            isIncome ? "text-emerald-700" : "text-rose-600"
                          }`}
                        >
                          {isIncome ? "+" : "-"}
                          {t.amount.toLocaleString()} FCFA
                        </span>
                      </td>

                      {/* Détail */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedTransactionDetail(t)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                          title="Voir le détail de l'opération"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL FOR A SINGLE TRANSACTION */}
      {selectedTransactionDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                    selectedTransactionDetail.type === "INCOME"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {selectedTransactionDetail.type === "INCOME" ? (
                    <ArrowUpRight size={20} />
                  ) : (
                    <ArrowDownRight size={20} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">
                    {selectedTransactionDetail.categoryLabel}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400">
                    Réf : {selectedTransactionDetail.reference}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTransactionDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Montant :</span>
                <span
                  className={`font-black text-sm ${
                    selectedTransactionDetail.type === "INCOME"
                      ? "text-emerald-700"
                      : "text-rose-600"
                  }`}
                >
                  {selectedTransactionDetail.type === "INCOME" ? "+" : "-"}
                  {selectedTransactionDetail.amount.toLocaleString()} FCFA
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Tiers concerné :</span>
                <span className="font-bold text-gray-900">{selectedTransactionDetail.partyName}</span>
              </div>
              {selectedTransactionDetail.studentClass && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Classe :</span>
                  <span className="font-bold text-blue-700">
                    {selectedTransactionDetail.studentClass}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Date :</span>
                <span className="font-semibold text-gray-800">
                  {new Date(selectedTransactionDetail.dateStr).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Mode de paiement :</span>
                <span className="font-semibold text-gray-800">
                  {selectedTransactionDetail.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Année scolaire :</span>
                <span className="font-semibold text-gray-800">
                  {selectedTransactionDetail.academicYear}
                </span>
              </div>
              {selectedTransactionDetail.notes && (
                <div className="pt-1">
                  <span className="text-slate-500 block mb-1">Notes / Description :</span>
                  <div className="p-2.5 bg-slate-50 rounded-xl text-slate-700 text-[11px]">
                    {selectedTransactionDetail.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedTransactionDetail(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-700 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APERÇU DOCUMENT COMPLET AVANT TÉLÉCHARGEMENT PDF */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full p-6 space-y-4 my-8 animate-in zoom-in-95 max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-emerald-700" />
                <h3 className="font-black text-gray-900 text-base">
                  Aperçu du Document Officiel (Grand Livre Financier)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <Download size={14} />
                  <span>Télécharger PDF maintenant</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Printer size={14} />
                  <span>Imprimer</span>
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Preview Body */}
            <div className="flex-1 overflow-auto bg-slate-100 p-4 rounded-xl border border-slate-200">
              <div className="bg-white p-8 rounded-xl shadow-sm space-y-6 max-w-4xl mx-auto text-slate-900 font-sans">
                {/* Entête National Bénin */}
                <div className="border-b-2 border-emerald-700 pb-4 flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-500">
                      RÉPUBLIQUE DU BÉNIN
                    </div>
                    <div className="text-[9px] text-slate-400">
                      MINISTÈRE DES ENSEIGNEMENTS MATERNEL ET SECONDAIRE
                    </div>
                    <div className="text-lg font-black text-emerald-800 mt-1">
                      {schoolInfo?.name || "ÉTABLISSEMENT SCOLAIRE"}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {schoolInfo?.address || "Cotonou"} | Tél:{" "}
                      {schoolInfo?.phone || "+229 00 00 00 00"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-gray-900">
                      GRAND LIVRE FINANCIER & ÉTAT DE CAISSE
                    </div>
                    <div className="text-[11px] font-bold text-emerald-700">
                      Année Scolaire : {schoolInfo?.academic_year || "2024-2025"}
                    </div>
                    {filterClass !== "ALL" && (
                      <div className="text-xs font-bold text-blue-700">Classe : {filterClass}</div>
                    )}
                    {filterCategory !== "ALL" && (
                      <div className="text-xs font-bold text-emerald-700">
                        Catégorie : {filterCategory}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400">
                      Date : {new Date().toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                </div>

                {/* Synthèse 3 Chiffres Clés */}
                <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Total Recettes
                    </span>
                    <span className="text-sm font-black text-emerald-700">
                      +{exportMetrics.totIn.toLocaleString()} FCFA
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Total Charges & Salaires
                    </span>
                    <span className="text-sm font-black text-rose-600">
                      -{exportMetrics.totOut.toLocaleString()} FCFA
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Solde Net
                    </span>
                    <span
                      className={`text-sm font-black ${
                        exportMetrics.net >= 0 ? "text-emerald-800" : "text-rose-800"
                      }`}
                    >
                      {exportMetrics.net >= 0 ? "+" : ""}
                      {exportMetrics.net.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>

                {/* Table détaillée des transactions pour l'export */}
                <table className="w-full text-left border-collapse text-[10px]">
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
                        <td className="p-1.5 border font-mono text-[9px]">{t.reference}</td>
                        <td className="p-1.5 border font-semibold">{t.categoryLabel}</td>
                        <td className="p-1.5 border font-bold text-blue-700">
                          {t.studentClass || "-"}
                        </td>
                        <td className="p-1.5 border">{t.partyName}</td>
                        <td className="p-1.5 border">{t.paymentMethod}</td>
                        <td
                          className={`p-1.5 border text-right font-bold ${
                            t.type === "INCOME" ? "text-emerald-700" : "text-rose-600"
                          }`}
                        >
                          {t.type === "INCOME" ? "+" : "-"}
                          {t.amount.toLocaleString()}
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

      {/* DOCUMENT OFFICIEL DESTINÉ À L'EXPORT HTML2PDF (RENDU FORCÉ EN POSITION FIXÉE LORS DU TÉLÉCHARGEMENT) */}
      <div
        id="printable-financial-doc"
        ref={printContainerRef}
        style={{
          display: "none",
          width: "1120px",
          backgroundColor: "#ffffff",
          padding: "24px 30px",
          color: "#0f172a",
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
                  Classe : {filterClass}
                </div>
              )}
              {filterCategory !== "ALL" && (
                <div style={{ fontSize: "11px", fontWeight: "bold", color: "#047857", marginTop: "2px" }}>
                  Catégorie : {filterCategory}
                </div>
              )}
              <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>
                Date d'édition : {new Date().toLocaleDateString("fr-FR")} à{" "}
                {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        </div>

        {/* 1. Synthèse Analytique par Catégorie (Sans cumul) */}
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: "bold",
              textTransform: "uppercase",
              color: "#334155",
              marginBottom: "6px"
            }}
          >
            1. Synthèse Analytique par Catégorie
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                <th style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "left" }}>
                  Catégorie Recettes (Entrées)
                </th>
                <th style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "right" }}>
                  Montant FCFA
                </th>
                <th style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "left" }}>
                  Catégorie Salaires & Dépenses (Sorties)
                </th>
                <th style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "right" }}>
                  Montant FCFA
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({
                length: Math.max(
                  financialMetrics.sortedIncomes.length,
                  financialMetrics.sortedSalaries.length + financialMetrics.sortedExpenses.length,
                  1
                )
              }).map((_, idx) => {
                const inc = financialMetrics.sortedIncomes[idx];
                const combinedOut = [
                  ...financialMetrics.sortedSalaries,
                  ...financialMetrics.sortedExpenses
                ];
                const out = combinedOut[idx];
                return (
                  <tr key={idx}>
                    <td style={{ padding: "4px 8px", border: "1px solid #e2e8f0" }}>
                      {inc ? inc[1].label : "-"}
                    </td>
                    <td
                      style={{
                        padding: "4px 8px",
                        border: "1px solid #e2e8f0",
                        textAlign: "right",
                        fontWeight: "bold",
                        color: "#047857"
                      }}
                    >
                      {inc ? `${inc[1].amount.toLocaleString()} FCFA` : "-"}
                    </td>
                    <td style={{ padding: "4px 8px", border: "1px solid #e2e8f0" }}>
                      {out ? out[1].label : "-"}
                    </td>
                    <td
                      style={{
                        padding: "4px 8px",
                        border: "1px solid #e2e8f0",
                        textAlign: "right",
                        fontWeight: "bold",
                        color: "#e11d48"
                      }}
                    >
                      {out ? `${out[1].amount.toLocaleString()} FCFA` : "-"}
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
                  {exportMetrics.net >= 0 ? "+" : ""}
                  {exportMetrics.net.toLocaleString()} FCFA
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. Journal Détaillé */}
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: "bold",
              textTransform: "uppercase",
              color: "#334155",
              marginBottom: "6px"
            }}
          >
            2. Détail des Opérations ({transactionsToExport.length} écritures)
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
                <th style={{ padding: "5px", border: "1px solid #047857", textAlign: "right" }}>
                  Montant FCFA
                </th>
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
                  <td style={{ padding: "4px 5px", border: "1px solid #e2e8f0", fontFamily: "monospace" }}>
                    {t.reference}
                  </td>
                  <td style={{ padding: "4px 5px", border: "1px solid #e2e8f0", fontWeight: "bold" }}>
                    {t.categoryLabel}
                  </td>
                  <td
                    style={{
                      padding: "4px 5px",
                      border: "1px solid #e2e8f0",
                      fontWeight: "bold",
                      color: "#1d4ed8"
                    }}
                  >
                    {t.studentClass || "-"}
                  </td>
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
                    {t.type === "INCOME" ? "+" : "-"}
                    {t.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Emargements officiels */}
        <div style={{ marginTop: "30px", display: "flex", justifyContent: "space-between" }}>
          <div style={{ width: "40%", textAlign: "center", borderTop: "1px solid #94a3b8", paddingTop: "6px" }}>
            <div style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase" }}>
              Le Responsable Caisse / Comptabilité
            </div>
            <div style={{ fontSize: "8px", color: "#64748b" }}>(Visa et Signature)</div>
            <div style={{ height: "40px" }}></div>
          </div>
          <div style={{ width: "40%", textAlign: "center", borderTop: "1px solid #94a3b8", paddingTop: "6px" }}>
            <div style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase" }}>
              Le Directeur de l'Établissement
            </div>
            <div style={{ fontSize: "8px", color: "#64748b" }}>(Cachet Officiel et Signature)</div>
            <div style={{ height: "40px" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
