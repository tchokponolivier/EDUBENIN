import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { 
  Calendar, 
  ArrowDownRight, 
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  Wallet, 
  Building2, 
  Smartphone, 
  ShieldCheck, 
  AlertCircle,
  FileText,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";

interface DailyRemittance {
  id?: string;
  school_id: string;
  date: string; // YYYY-MM-DD
  total_in: number;
  total_out: number;
  net_balance: number;
  handover_method: "HAND" | "BANK" | "MOBILE_MONEY";
  handover_details?: string;
  cashier_name: string;
  cashier_id: string;
  director_confirmed: boolean;
  director_confirmed_at?: string;
  director_confirmed_by?: string;
  director_note?: string;
  created_at?: string;
}

export function CashierDailySummary() {
  const { user } = useAuth();
  const isDirector = user?.role === "SCHOOL_ADMIN" || user?.role === "DIRECTOR_OF_STUDIES" || user?.role === "SUPER_ADMIN";
  const isCashier = user?.role === "CASHIER";

  // Mode: Point journalier (07h30-23h00) ou Registre Multi-Dates
  const [activeTab, setActiveTab] = useState<"DAILY" | "ALL_TRANSACTIONS">("DAILY");

  // Default to today
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [remittances, setRemittances] = useState<DailyRemittance[]>([]);
  const [loading, setLoading] = useState(false);

  // Form for submitting / updating daily remittance
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [handoverMethod, setHandoverMethod] = useState<"HAND" | "BANK" | "MOBILE_MONEY">("HAND");
  const [handoverDetails, setHandoverDetails] = useState("");
  const [submittingRemittance, setSubmittingRemittance] = useState(false);

  // Director validation modal/note
  const [directorNote, setDirectorNote] = useState("");
  const [showDirectorModal, setShowDirectorModal] = useState(false);

  // Multi-dates search & filters state
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [filterFlowType, setFilterFlowType] = useState<"ALL" | "IN" | "OUT">("ALL");
  const [filterNetwork, setFilterNetwork] = useState<string>("ALL");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [filterValidationStatus, setFilterValidationStatus] = useState<"ALL" | "CONFIRMED" | "PENDING">("ALL");

  // Fetch data
  const fetchData = async () => {
    if (!user?.schoolId) return;
    setLoading(true);

    try {
      // Fetch payments
      const { data: pData } = await supabase
        .from("payments")
        .select("*")
        .eq("school_id", user.schoolId)
        .order("created_at", { ascending: false });

      if (pData) setPayments(pData);

      // Fetch expenses
      const { data: eData } = await supabase
        .from("expenses")
        .select("*")
        .eq("school_id", user.schoolId)
        .order("created_at", { ascending: false });

      if (eData) setExpenses(eData);

      // Fetch daily remittances from localStorage with fallback (or custom table if present)
      try {
        const localKey = `daily_remittances_${user.schoolId}`;
        const stored = localStorage.getItem(localKey);
        if (stored) {
          setRemittances(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Local remittances error", err);
      }
    } catch (err) {
      console.error("Error fetching daily transactions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.schoolId]);

  // Filter entries for the selected day between 07:30 and 23:00
  // Or if transaction is dated on that day, verify its time window
  const isWithinWorkHours = (dateObj: Date) => {
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const timeInMins = hours * 60 + minutes;
    const startMins = 7 * 60 + 30; // 07:30 = 450
    const endMins = 23 * 60;      // 23:00 = 1380
    return timeInMins >= startMins && timeInMins <= endMins;
  };

  const getRecordDateStr = (rawDate: any, createdAt: any) => {
    if (createdAt) {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
    }
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
    }
    return "";
  };

  // Day transactions
  const dayPayments = useMemo(() => {
    return payments.filter(p => {
      if (p.status !== "COMPLETED") return false;
      const created = p.created_at ? new Date(p.created_at) : (p.date ? new Date(p.date) : null);
      if (!created || isNaN(created.getTime())) return false;
      
      const dateStr = created.toISOString().split("T")[0];
      if (dateStr !== selectedDate) return false;
      
      // Check 07:30 to 23:00 interval
      return isWithinWorkHours(created);
    });
  }, [payments, selectedDate]);

  const dayExpenses = useMemo(() => {
    return expenses.filter(e => {
      const created = e.created_at ? new Date(e.created_at) : (e.expense_date ? new Date(e.expense_date) : null);
      if (!created || isNaN(created.getTime())) return false;
      
      const dateStr = created.toISOString().split("T")[0];
      if (dateStr !== selectedDate) return false;
      
      // Check 07:30 to 23:00 interval
      return isWithinWorkHours(created);
    });
  }, [expenses, selectedDate]);

  const totalIn = useMemo(() => dayPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0), [dayPayments]);
  const totalOut = useMemo(() => dayExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0), [dayExpenses]);
  const netBalance = totalIn - totalOut;

  // Hourly distribution for the graph (from 7 to 23)
  const hourlyStats = useMemo(() => {
    const hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
    return hours.map(h => {
      const pSum = dayPayments
        .filter(p => {
          const d = new Date(p.created_at || p.date);
          return d.getHours() === h;
        })
        .reduce((s, p) => s + (Number(p.amount) || 0), 0);

      const eSum = dayExpenses
        .filter(e => {
          const d = new Date(e.created_at || e.expense_date);
          return d.getHours() === h;
        })
        .reduce((s, e) => s + (Number(e.amount) || 0), 0);

      return {
        hourLabel: `${h}h`,
        hour: h,
        inAmount: pSum,
        outAmount: eSum
      };
    });
  }, [dayPayments, dayExpenses]);

  const maxHourlyVal = useMemo(() => {
    const max = Math.max(...hourlyStats.map(h => Math.max(h.inAmount, h.outAmount)), 10000);
    return max;
  }, [hourlyStats]);

  // Current day remittance record
  const currentRemittance = useMemo(() => {
    return remittances.find(r => r.date === selectedDate);
  }, [remittances, selectedDate]);

  // Consolidated transactions across all dates
  const consolidatedTransactions = useMemo(() => {
    const list: any[] = [];
    payments.forEach(p => {
      if (p.status !== "COMPLETED") return;
      const d = p.created_at ? new Date(p.created_at) : (p.date ? new Date(p.date) : null);
      const dateStr = d && !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : "";
      const remit = remittances.find(r => r.date === dateStr);
      list.push({
        id: `p-${p.id}`,
        rawId: p.id,
        type: "IN",
        date: d,
        dateStr,
        amount: Number(p.amount) || 0,
        reference: p.reference || "ENC-" + String(p.id).substring(0, 6),
        network: p.network || "Espèces",
        description: p.student_name ? `Paiement scolarité • ${p.student_name} (${p.class || p.level || ""})` : "Encaissement scolarité",
        cashier: p.cashier_name || "Caisse",
        isConfirmed: Boolean(remit?.director_confirmed),
        confirmedBy: remit?.director_confirmed_by,
        raw: p
      });
    });

    expenses.forEach(e => {
      const d = e.created_at ? new Date(e.created_at) : (e.expense_date ? new Date(e.expense_date) : null);
      const dateStr = d && !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : "";
      const remit = remittances.find(r => r.date === dateStr);
      list.push({
        id: `e-${e.id}`,
        rawId: e.id,
        type: "OUT",
        date: d,
        dateStr,
        amount: Number(e.amount) || 0,
        reference: e.reference || "DEC-" + String(e.id).substring(0, 6),
        network: e.payment_method || "Espèces",
        description: `${e.description || "Dépense"} • ${e.category || "Général"}`,
        cashier: e.author_name || "Caisse",
        isConfirmed: Boolean(remit?.director_confirmed),
        confirmedBy: remit?.director_confirmed_by,
        raw: e
      });
    });

    // Sort descending by date/time
    return list.sort((a, b) => {
      const timeA = a.date ? a.date.getTime() : 0;
      const timeB = b.date ? b.date.getTime() : 0;
      return timeB - timeA;
    });
  }, [payments, expenses, remittances]);

  // Filtered multi-date transactions
  const filteredMultiTransactions = useMemo(() => {
    return consolidatedTransactions.filter(tx => {
      if (filterFlowType !== "ALL" && tx.type !== filterFlowType) return false;
      if (filterNetwork !== "ALL" && tx.network?.toLowerCase() !== filterNetwork.toLowerCase()) return false;
      if (filterValidationStatus === "CONFIRMED" && !tx.isConfirmed) return false;
      if (filterValidationStatus === "PENDING" && tx.isConfirmed) return false;
      
      if (filterStartDate && tx.dateStr < filterStartDate) return false;
      if (filterEndDate && tx.dateStr > filterEndDate) return false;

      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matchRef = tx.reference?.toLowerCase().includes(q);
        const matchDesc = tx.description?.toLowerCase().includes(q);
        const matchCashier = tx.cashier?.toLowerCase().includes(q);
        const matchDate = tx.dateStr?.includes(q);
        if (!matchRef && !matchDesc && !matchCashier && !matchDate) return false;
      }
      return true;
    });
  }, [consolidatedTransactions, filterFlowType, filterNetwork, filterValidationStatus, filterStartDate, filterEndDate, searchFilter]);

  const multiTotalIn = useMemo(() => {
    return filteredMultiTransactions.filter(t => t.type === "IN").reduce((sum, t) => sum + t.amount, 0);
  }, [filteredMultiTransactions]);

  const multiTotalOut = useMemo(() => {
    return filteredMultiTransactions.filter(t => t.type === "OUT").reduce((sum, t) => sum + t.amount, 0);
  }, [filteredMultiTransactions]);

  const multiNetBalance = multiTotalIn - multiTotalOut;

  // Save remittance
  const saveRemittances = (updated: DailyRemittance[]) => {
    setRemittances(updated);
    if (user?.schoolId) {
      localStorage.setItem(`daily_remittances_${user.schoolId}`, JSON.stringify(updated));
    }
  };

  const handleSubmitRemittance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;

    setSubmittingRemittance(true);
    const existingIndex = remittances.findIndex(r => r.date === selectedDate);
    const newRecord: DailyRemittance = {
      id: currentRemittance?.id || `remit-${Date.now()}`,
      school_id: user.schoolId,
      date: selectedDate,
      total_in: totalIn,
      total_out: totalOut,
      net_balance: netBalance,
      handover_method: handoverMethod,
      handover_details: handoverDetails,
      cashier_name: user.name || "Caisse",
      cashier_id: user.id,
      director_confirmed: currentRemittance?.director_confirmed || false,
      director_confirmed_at: currentRemittance?.director_confirmed_at,
      director_confirmed_by: currentRemittance?.director_confirmed_by,
      director_note: currentRemittance?.director_note,
      created_at: currentRemittance?.created_at || new Date().toISOString()
    };

    let updatedList: DailyRemittance[] = [];
    if (existingIndex >= 0) {
      updatedList = [...remittances];
      updatedList[existingIndex] = newRecord;
    } else {
      updatedList = [newRecord, ...remittances];
    }

    saveRemittances(updatedList);
    setSubmittingRemittance(false);
    setShowSubmitModal(false);
  };

  const handleDirectorConfirm = (confirmed: boolean) => {
    if (!user?.schoolId) return;
    const existingIndex = remittances.findIndex(r => r.date === selectedDate);
    
    let record: DailyRemittance;
    if (existingIndex >= 0) {
      record = {
        ...remittances[existingIndex],
        director_confirmed: confirmed,
        director_confirmed_at: confirmed ? new Date().toISOString() : undefined,
        director_confirmed_by: confirmed ? (user.name || "Direction") : undefined,
        director_note: directorNote || remittances[existingIndex].director_note
      };
    } else {
      // Create if cashier hadn't formally submitted but director wants to confirm
      record = {
        id: `remit-${Date.now()}`,
        school_id: user.schoolId,
        date: selectedDate,
        total_in: totalIn,
        total_out: totalOut,
        net_balance: netBalance,
        handover_method: handoverMethod,
        handover_details: "Saisie directe",
        cashier_name: "Caisse",
        cashier_id: user.id,
        director_confirmed: confirmed,
        director_confirmed_at: confirmed ? new Date().toISOString() : undefined,
        director_confirmed_by: confirmed ? (user.name || "Direction") : undefined,
        director_note: directorNote,
        created_at: new Date().toISOString()
      };
    }

    const updatedList = existingIndex >= 0 
      ? remittances.map((r, i) => i === existingIndex ? record : r)
      : [record, ...remittances];

    saveRemittances(updatedList);
    setShowDirectorModal(false);
  };

  // Past 14 days list for fast navigation
  const recentDays = useMemo(() => {
    const days: string[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }
    return days;
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header & Day Selector */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
              Guichet & Opérations Journalières
            </span>
            {currentRemittance?.director_confirmed ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-600 text-white flex items-center gap-1 shadow-sm">
                <CheckCircle size={12} /> Validé par la Direction
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500 text-white flex items-center gap-1 shadow-sm">
                <Clock size={12} /> Non Validé (En attente du Directeur)
              </span>
            )}
          </div>
          <h2 className="text-xl font-black text-gray-800">Caisse du Jour & Registre des Flux</h2>
          <p className="text-xs text-slate-500">
            Clôture journalière (07h30 - 23h00) avec visa du Directeur et registre complet des entrées/sorties filtrables par date.
          </p>
        </div>

        {/* Date Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button 
              onClick={() => {
                const cur = new Date(selectedDate);
                cur.setDate(cur.getDate() - 1);
                setSelectedDate(cur.toISOString().split("T")[0]);
              }}
              className="p-1.5 hover:bg-white rounded text-slate-600 transition"
              title="Jour précédent"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-2 px-3 py-1 font-bold text-xs text-gray-700">
              <Calendar size={14} className="text-emerald-600" />
              <input 
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent font-bold text-gray-800 outline-none cursor-pointer text-xs"
              />
            </div>

            <button 
              onClick={() => {
                const cur = new Date(selectedDate);
                cur.setDate(cur.getDate() + 1);
                setSelectedDate(cur.toISOString().split("T")[0]);
              }}
              className="p-1.5 hover:bg-white rounded text-slate-600 transition"
              title="Jour suivant"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button 
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${selectedDate === todayStr ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Aujourd'hui
          </button>

          <button 
            onClick={fetchData}
            className="p-2 bg-slate-100 text-slate-600 hover:text-gray-800 hover:bg-slate-200 rounded-lg transition"
            title="Rafraîchir"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-emerald-600" : ""} />
          </button>
        </div>
      </div>

      {/* Mode Switcher: Point de Caisse du Jour vs Registre Toutes les Entrées & Sorties */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-sm gap-1">
        <button
          onClick={() => setActiveTab("DAILY")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg uppercase tracking-wider transition flex items-center justify-center gap-2 ${
            activeTab === "DAILY" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Clock size={15} /> Point de Caisse Journalier ({new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR")})
        </button>

        <button
          onClick={() => setActiveTab("ALL_TRANSACTIONS")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg uppercase tracking-wider transition flex items-center justify-center gap-2 ${
            activeTab === "ALL_TRANSACTIONS" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FileText size={15} /> Toutes les Entrées & Sorties (Toutes Dates & Filtres)
        </button>
      </div>

      {/* Quick Day Chips with CLEAR COLORS (Green for validated by Director, Orange for non-validated) */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Historique des Dates (Couleurs : Vert = Validé par le Directeur | Orange = Non validé) :
          </span>
          <div className="flex items-center gap-3 text-[11px] font-semibold">
            <span className="flex items-center gap-1 text-emerald-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Validé (Vert)
            </span>
            <span className="flex items-center gap-1 text-amber-800">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Non validé (Orange)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {recentDays.map(dStr => {
            const isSelected = dStr === selectedDate;
            const isToday = dStr === todayStr;
            const dayRemit = remittances.find(r => r.date === dStr);
            const isConfirmed = Boolean(dayRemit?.director_confirmed);
            const dateObj = new Date(dStr + "T00:00:00");
            const label = isToday ? "Aujourd'hui" : dateObj.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

            return (
              <button
                key={dStr}
                onClick={() => setSelectedDate(dStr)}
                className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-2 border-2 ${
                  isConfirmed
                    ? isSelected
                      ? "bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400 shadow-md"
                      : "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
                    : isSelected
                      ? "bg-amber-600 text-white border-amber-600 ring-2 ring-amber-400 shadow-md"
                      : "bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100"
                }`}
              >
                <span>{label}</span>
                {isConfirmed ? (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase flex items-center gap-0.5 ${isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-200 text-emerald-900'}`}>
                    <CheckCircle size={10} /> Validé
                  </span>
                ) : (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase flex items-center gap-0.5 ${isSelected ? 'bg-amber-800 text-amber-100' : 'bg-amber-200 text-amber-900'}`}>
                    <Clock size={10} /> Non validé
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>


      {activeTab === "DAILY" && (
        <>
          {/* KPI Cards for the day */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Entrées (Recettes)</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600">
              +{totalIn.toLocaleString()} <span className="text-xs text-emerald-700 font-bold">FCFA</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {dayPayments.length} encaissement{dayPayments.length > 1 ? "s" : ""} validé{dayPayments.length > 1 ? "s" : ""}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sorties (Dépenses)</span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600">
              -{totalOut.toLocaleString()} <span className="text-xs text-rose-700 font-bold">FCFA</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {dayExpenses.length} décaissement{dayExpenses.length > 1 ? "s" : ""} enregistré{dayExpenses.length > 1 ? "s" : ""}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Solde Net Journalier</span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${netBalance >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
              <Wallet size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black ${netBalance >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
              {netBalance >= 0 ? `+${netBalance.toLocaleString()}` : netBalance.toLocaleString()} <span className="text-xs font-bold">FCFA</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Montant physique attendu en caisse
            </div>
          </div>
        </div>

        {/* Validation / Remittance Box */}
        <div className={`p-5 rounded-xl border shadow-sm flex flex-col justify-between ${
          currentRemittance?.director_confirmed 
            ? "bg-emerald-50/80 border-emerald-200" 
            : currentRemittance 
              ? "bg-amber-50/80 border-amber-200" 
              : "bg-slate-50 border-slate-200"
        }`}>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Statut Clôture</span>
              {currentRemittance?.director_confirmed ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white uppercase flex items-center gap-1">
                  <CheckCircle size={10} /> Validé
                </span>
              ) : currentRemittance ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white uppercase flex items-center gap-1">
                  <Clock size={10} /> En attente
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-300 text-slate-700 uppercase">
                  Non clôturé
                </span>
              )}
            </div>

            <div className="text-xs text-slate-700 mt-2 space-y-1">
              {currentRemittance ? (
                <>
                  <div className="flex items-center gap-1 font-semibold text-slate-800">
                    {currentRemittance.handover_method === "HAND" && <><Wallet size={13} className="text-emerald-700"/> En main propre</>}
                    {currentRemittance.handover_method === "BANK" && <><Building2 size={13} className="text-blue-700"/> Versement bancaire</>}
                    {currentRemittance.handover_method === "MOBILE_MONEY" && <><Smartphone size={13} className="text-amber-700"/> Mobile Money</>}
                  </div>
                  {currentRemittance.handover_details && (
                    <div className="text-[11px] text-slate-500 italic truncate max-w-full">
                      « {currentRemittance.handover_details} »
                    </div>
                  )}
                  {currentRemittance.director_confirmed && currentRemittance.director_confirmed_by && (
                    <div className="text-[11px] text-emerald-800 font-medium">
                      Confirmé par {currentRemittance.director_confirmed_by}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-[11px] text-slate-500">
                  La caisse doit déclarer le mode de remise des fonds.
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            {/* Cashier button */}
            <button
              onClick={() => {
                if (currentRemittance) {
                  setHandoverMethod(currentRemittance.handover_method);
                  setHandoverDetails(currentRemittance.handover_details || "");
                }
                setShowSubmitModal(true);
              }}
              className="flex-1 py-1.5 px-2 bg-white border border-slate-300 hover:bg-slate-50 rounded text-xs font-bold text-slate-700 uppercase tracking-wide transition shadow-sm"
            >
              {currentRemittance ? "Modifier Remise" : "Déclarer Remise"}
            </button>

            {/* Director button - ONLY FOR DIRECTOR, NEVER CASHIER */}
            {isDirector && !isCashier && (
              <button
                onClick={() => {
                  setDirectorNote(currentRemittance?.director_note || "");
                  setShowDirectorModal(true);
                }}
                className={`py-1.5 px-3 rounded text-xs font-bold uppercase tracking-wide transition flex items-center gap-1 ${
                  currentRemittance?.director_confirmed 
                    ? "bg-slate-700 hover:bg-slate-800 text-white" 
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                }`}
              >
                <ShieldCheck size={14} />
                {currentRemittance?.director_confirmed ? "Avis Direction" : "Valider"}
              </button>
            )}
          </div>

          {isCashier && (
            <p className="text-[10px] text-amber-800 bg-amber-100/70 p-1.5 rounded border border-amber-200 mt-2">
              ℹ️ <strong>Rôle Caisse :</strong> Vous déclarez la remise. Le bouton de validation de clôture n'apparaît que chez le Directeur.
            </p>
          )}
        </div>
      </div>

      {/* Graph Visual: Hourly Activity Between 07:30 and 23:00 */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
              <TrendingUp className="text-emerald-600 w-4 h-4" />
              Répartition Horaire des Flux (07h30 à 23h00)
            </h3>
            <p className="text-[11px] text-slate-500">Visualisation des flux entrants (vert) et sortants (rose) par heure</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Entrées
            </span>
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Sorties
            </span>
          </div>
        </div>

        {/* Bar chart bars */}
        <div className="h-44 w-full flex items-end gap-1.5 pt-6 pb-2 px-1 overflow-x-auto">
          {hourlyStats.map(stat => {
            const inHeight = maxHourlyVal > 0 ? (stat.inAmount / maxHourlyVal) * 100 : 0;
            const outHeight = maxHourlyVal > 0 ? (stat.outAmount / maxHourlyVal) * 100 : 0;

            return (
              <div key={stat.hour} className="flex-1 min-w-[34px] flex flex-col items-center h-full justify-end group relative">
                {/* Tooltip on hover */}
                <div className="hidden group-hover:flex flex-col absolute -top-12 z-20 bg-slate-900 text-white text-[10px] rounded px-2 py-1 shadow-lg whitespace-nowrap pointer-events-none">
                  <span className="font-bold">{stat.hour}h00 - {stat.hour + 1}h00</span>
                  <span className="text-emerald-400">+{stat.inAmount.toLocaleString()} F</span>
                  <span className="text-rose-400">-{stat.outAmount.toLocaleString()} F</span>
                </div>

                <div className="w-full flex items-end justify-center gap-1 h-32 border-b border-slate-100">
                  {/* In bar */}
                  <div 
                    className="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t transition-all"
                    style={{ height: `${Math.max(inHeight, stat.inAmount > 0 ? 8 : 0)}%` }}
                    title={`Entrées: ${stat.inAmount.toLocaleString()} FCFA`}
                  />
                  {/* Out bar */}
                  <div 
                    className="w-1/2 bg-rose-400 hover:bg-rose-500 rounded-t transition-all"
                    style={{ height: `${Math.max(outHeight, stat.outAmount > 0 ? 8 : 0)}%` }}
                    title={`Sorties: ${stat.outAmount.toLocaleString()} FCFA`}
                  />
                </div>

                <span className="text-[10px] font-bold text-slate-500 mt-1">
                  {stat.hourLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabular Details of the Selected Day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entrées du jour */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-emerald-50/60 border-b border-emerald-100 flex justify-between items-center">
            <h4 className="font-bold text-sm text-emerald-900 flex items-center gap-2">
              <ArrowDownRight size={16} className="text-emerald-700" />
              Détail des Entrées ({dayPayments.length})
            </h4>
            <span className="text-xs font-black text-emerald-800">
              +{totalIn.toLocaleString()} FCFA
            </span>
          </div>

          <div className="overflow-x-auto flex-1 max-h-[350px]">
            {dayPayments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Aucun encaissement validé sur ce créneau (07h30 - 23h00).
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase font-bold sticky top-0 border-b border-slate-100">
                  <tr>
                    <th className="px-3 py-2.5">Heure</th>
                    <th className="px-3 py-2.5">Réf & Mode</th>
                    <th className="px-3 py-2.5">Élève</th>
                    <th className="px-3 py-2.5 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dayPayments.map(p => {
                    const d = new Date(p.created_at || p.date);
                    const timeStr = !isNaN(d.getTime()) ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "-";
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3 py-2.5 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                          {timeStr}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-mono font-bold text-gray-700 block text-[11px]">{p.reference}</span>
                          <span className="text-[10px] text-slate-400 uppercase">{p.network || "Espèces"}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-semibold text-gray-800 block">{p.student_name || "Élève"}</span>
                          <span className="text-[10px] text-slate-500">{p.class || p.level || ""}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                          +{Number(p.amount || 0).toLocaleString()} F
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sorties du jour */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-rose-50/60 border-b border-rose-100 flex justify-between items-center">
            <h4 className="font-bold text-sm text-rose-900 flex items-center gap-2">
              <ArrowUpRight size={16} className="text-rose-700" />
              Détail des Sorties ({dayExpenses.length})
            </h4>
            <span className="text-xs font-black text-rose-800">
              -{totalOut.toLocaleString()} FCFA
            </span>
          </div>

          <div className="overflow-x-auto flex-1 max-h-[350px]">
            {dayExpenses.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Aucun décaissement enregistré sur ce créneau (07h30 - 23h00).
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase font-bold sticky top-0 border-b border-slate-100">
                  <tr>
                    <th className="px-3 py-2.5">Heure</th>
                    <th className="px-3 py-2.5">Motif / Catégorie</th>
                    <th className="px-3 py-2.5 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dayExpenses.map(e => {
                    const d = new Date(e.created_at || e.expense_date);
                    const timeStr = !isNaN(d.getTime()) ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "-";
                    return (
                      <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3 py-2.5 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                          {timeStr}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-semibold text-gray-800 block">{e.description}</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wide">{e.category || "Autre"}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                          -{Number(e.amount || 0).toLocaleString()} F
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      </>
      )}

      {/* TAB 2: TOUTES LES ENTRÉES ET SORTIES (REGISTRE MULTI-DATES ET FILTRAGE PAR DATE) */}
      {activeTab === "ALL_TRANSACTIONS" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <Filter size={16} className="text-emerald-600" />
                  Filtres du Registre Global Multi-Dates
                </h3>
                <p className="text-[11px] text-slate-500">
                  Consultez et filtrez l'ensemble des encaissements et décaissements de toutes les dates.
                </p>
              </div>

              {/* Quick Date Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => {
                    setFilterStartDate(todayStr);
                    setFilterEndDate(todayStr);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                >
                  Aujourd'hui
                </button>
                <button
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 1);
                    const yStr = d.toISOString().split("T")[0];
                    setFilterStartDate(yStr);
                    setFilterEndDate(yStr);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                >
                  Hier
                </button>
                <button
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 7);
                    setFilterStartDate(d.toISOString().split("T")[0]);
                    setFilterEndDate(todayStr);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                >
                  7 derniers jours
                </button>
                <button
                  onClick={() => {
                    const d = new Date();
                    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
                    setFilterStartDate(firstDay);
                    setFilterEndDate(todayStr);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                >
                  Ce mois
                </button>
                <button
                  onClick={() => {
                    setFilterStartDate("");
                    setFilterEndDate("");
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition border border-emerald-200"
                >
                  Toutes les dates
                </button>
              </div>
            </div>

            {/* Filter Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Date Début */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Date de Début
                </label>
                <div className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg bg-white">
                  <Calendar size={14} className="text-slate-400" />
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={e => setFilterStartDate(e.target.value)}
                    className="w-full text-xs font-semibold text-gray-800 outline-none"
                  />
                </div>
              </div>

              {/* Date Fin */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Date de Fin
                </label>
                <div className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg bg-white">
                  <Calendar size={14} className="text-slate-400" />
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={e => setFilterEndDate(e.target.value)}
                    className="w-full text-xs font-semibold text-gray-800 outline-none"
                  />
                </div>
              </div>

              {/* Type de flux */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Type de Flux
                </label>
                <select
                  value={filterFlowType}
                  onChange={e => setFilterFlowType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-gray-800 bg-white outline-none"
                >
                  <option value="ALL">Tous les flux (+ et -)</option>
                  <option value="IN">Entrées uniquement (+)</option>
                  <option value="OUT">Sorties uniquement (-)</option>
                </select>
              </div>

              {/* Statut Validation Direction */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Statut Visa Direction
                </label>
                <select
                  value={filterValidationStatus}
                  onChange={e => setFilterValidationStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-gray-800 bg-white outline-none"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="CONFIRMED">Validés par le Directeur (Vert)</option>
                  <option value="PENDING">Non validés (Orange)</option>
                </select>
              </div>

              {/* Recherche libre */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Recherche
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Élève, réf, motif, caissier..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filtered KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Recettes Filtrées</span>
              <div className="text-xl font-black text-emerald-600 mt-1">
                +{multiTotalIn.toLocaleString()} <span className="text-xs font-medium text-slate-400">FCFA</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Dépenses Filtrées</span>
              <div className="text-xl font-black text-rose-600 mt-1">
                -{multiTotalOut.toLocaleString()} <span className="text-xs font-medium text-slate-400">FCFA</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Solde Net de la Période</span>
              <div className={`text-xl font-black mt-1 ${multiNetBalance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {multiNetBalance >= 0 ? "+" : ""}{multiNetBalance.toLocaleString()} <span className="text-xs font-medium text-slate-400">FCFA</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nombre d'opérations</span>
                <div className="text-xl font-black text-gray-800 mt-1">
                  {filteredMultiTransactions.length}
                </div>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition"
              >
                <Printer size={14} /> Imprimer
              </button>
            </div>
          </div>

          {/* Master Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-gray-800 text-sm">
                Registre des Opérations Multi-Dates ({filteredMultiTransactions.length} résultat{filteredMultiTransactions.length > 1 ? "s" : ""})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-[10px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Date & Heure</th>
                    <th className="px-4 py-3">Statut Clôture</th>
                    <th className="px-4 py-3">Sens</th>
                    <th className="px-4 py-3">Référence & Mode</th>
                    <th className="px-4 py-3">Description / Tiers</th>
                    <th className="px-4 py-3">Caissier / Auteur</th>
                    <th className="px-4 py-3 text-right">Montant (FCFA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMultiTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-xs">
                        Aucun flux financier ne correspond aux filtres sélectionnés.
                      </td>
                    </tr>
                  ) : (
                    filteredMultiTransactions.map(tx => {
                      const dateStr = tx.date && !isNaN(tx.date.getTime()) 
                        ? tx.date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) 
                        : tx.dateStr || "-";
                      const timeStr = tx.date && !isNaN(tx.date.getTime()) 
                        ? tx.date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) 
                        : "";

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-bold text-gray-800 block">{dateStr}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{timeStr}</span>
                          </td>

                          {/* Statut Visa Clôture Date */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {tx.isConfirmed ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-fit">
                                <CheckCircle size={11} className="text-emerald-600" /> Validé
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 w-fit">
                                <Clock size={11} className="text-amber-600" /> Non validé
                              </span>
                            )}
                          </td>

                          {/* Sens */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {tx.type === "IN" ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Entrée (+)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                                Sortie (-)
                              </span>
                            )}
                          </td>

                          {/* Réf & Mode */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-mono font-bold text-gray-700 block text-[11px]">{tx.reference}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{tx.network}</span>
                          </td>

                          {/* Description */}
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-800 block text-xs">{tx.description}</span>
                          </td>

                          {/* Caissier */}
                          <td className="px-4 py-3 whitespace-nowrap text-slate-600 text-xs">
                            {tx.cashier}
                          </td>

                          {/* Montant */}
                          <td className={`px-4 py-3 text-right font-mono font-black text-sm whitespace-nowrap ${
                            tx.type === "IN" ? "text-emerald-700" : "text-rose-700"
                          }`}>
                            {tx.type === "IN" ? "+" : "-"}{tx.amount.toLocaleString()} F
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-base text-gray-800">Déclaration de Remise de Caisse</h3>
                <p className="text-xs text-slate-500">Clôture du {new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR")}</p>
              </div>
              <button 
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRemittance} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Recettes validées :</span>
                  <span className="font-bold text-emerald-700">+{totalIn.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dépenses effectuées :</span>
                  <span className="font-bold text-rose-700">-{totalOut.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 text-sm font-black">
                  <span>Solde net à remettre :</span>
                  <span className={netBalance >= 0 ? "text-indigo-700" : "text-rose-700"}>
                    {netBalance.toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Manière dont le solde est remis <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setHandoverMethod("HAND")}
                    className={`p-3 rounded-lg border text-center transition flex flex-col items-center gap-1.5 ${
                      handoverMethod === "HAND"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-bold"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600 text-xs"
                    }`}
                  >
                    <Wallet size={18} />
                    <span className="text-[11px]">En main propre</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHandoverMethod("BANK")}
                    className={`p-3 rounded-lg border text-center transition flex flex-col items-center gap-1.5 ${
                      handoverMethod === "BANK"
                        ? "border-blue-600 bg-blue-50 text-blue-800 font-bold"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600 text-xs"
                    }`}
                  >
                    <Building2 size={18} />
                    <span className="text-[11px]">À la banque</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHandoverMethod("MOBILE_MONEY")}
                    className={`p-3 rounded-lg border text-center transition flex flex-col items-center gap-1.5 ${
                      handoverMethod === "MOBILE_MONEY"
                        ? "border-amber-600 bg-amber-50 text-amber-800 font-bold"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600 text-xs"
                    }`}
                  >
                    <Smartphone size={18} />
                    <span className="text-[11px]">Mobile Money</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Précisions / Référence de bordereau / Reçu
                </label>
                <textarea
                  value={handoverDetails}
                  onChange={e => setHandoverDetails(e.target.value)}
                  placeholder="Ex: Remis en espèces à M. le Directeur contre décharge; ou Bordereau BOA N° 84920..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingRemittance}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition"
                >
                  Enregistrer Remise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Director Verification & Confirmation */}
      {showDirectorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-emerald-600 w-5 h-5" />
                <div>
                  <h3 className="font-bold text-base text-gray-800">Vérification Physique Direction</h3>
                  <p className="text-xs text-slate-500">Validation du point de caisse du {selectedDate}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDirectorModal(false)}
                className="text-slate-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1.5 text-xs">
                <div className="font-bold text-emerald-900 text-sm">Récapitulatif physique :</div>
                <div className="flex justify-between text-slate-600">
                  <span>Solde comptable calculé :</span>
                  <span className="font-black text-gray-800">{netBalance.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Mode déclaré par la caisse :</span>
                  <span className="font-bold text-emerald-800">
                    {currentRemittance?.handover_method === "HAND" && "En main propre"}
                    {currentRemittance?.handover_method === "BANK" && "À la banque"}
                    {currentRemittance?.handover_method === "MOBILE_MONEY" && "Mobile Money"}
                    {!currentRemittance && "Non encore déclaré"}
                  </span>
                </div>
                {currentRemittance?.handover_details && (
                  <div className="text-[11px] text-slate-600 border-t border-emerald-200/50 pt-1">
                    Détails : {currentRemittance.handover_details}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Observations / Note de la Direction
                </label>
                <textarea
                  value={directorNote}
                  onChange={e => setDirectorNote(e.target.value)}
                  placeholder="Ex: Billets et pièces comptés conformes au montant net. Validé."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDirectorConfirm(false)}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold uppercase tracking-wider"
                >
                  Marquer Non Conforme
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDirectorModal(false)}
                    className="px-3 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50"
                  >
                    Fermer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectorConfirm(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition flex items-center gap-1.5"
                  >
                    <CheckCircle size={14} /> Confirmer au Vert
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
