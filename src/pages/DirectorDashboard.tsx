import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  BookOpen, 
  GraduationCap, 
  Layers,
  X,
  CalendarCheck
} from "lucide-react";

export interface ExamSchedule {
  id: string;
  title: string;
  classes: string[]; // e.g. ["6ème", "5ème"] or ["3ème"] or ["Terminale D"]
  academicYear: string;
  period: "1er Trimestre" | "2ème Trimestre" | "3ème Trimestre";
  type: "Composition Trimestrielle" | "Devoir Surveillé" | "Examen Blanc" | "Contrôle Continu" | "Rattrapage";
  startDate: string;
  endDate: string;
  timeSlot?: string;
  rooms?: string;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "VALIDATED";
  instructions?: string;
  createdAt: number;
}

const DEFAULT_SCHEDULES: ExamSchedule[] = [
  {
    id: "exam-1",
    title: "Devoir Surveillé N°1 (DS1)",
    classes: ["6ème", "5ème", "4ème", "3ème"],
    academicYear: "2024-2025",
    period: "1er Trimestre",
    type: "Devoir Surveillé",
    startDate: "2024-10-21",
    endDate: "2024-10-25",
    timeSlot: "08h00 - 12h00",
    rooms: "Salles 101 à 108",
    status: "COMPLETED",
    instructions: "Épreuves communes en Français, Mathématiques et Anglais.",
    createdAt: Date.now() - 10000000
  },
  {
    id: "exam-2",
    title: "Devoir Surveillé N°2 (DS2)",
    classes: ["2nde A", "2nde C", "1ère A", "1ère D", "Terminale A", "Terminale D"],
    academicYear: "2024-2025",
    period: "1er Trimestre",
    type: "Devoir Surveillé",
    startDate: "2024-11-18",
    endDate: "2024-11-22",
    timeSlot: "08h00 - 12h00 & 15h00 - 18h00",
    rooms: "Bâtiment Principal",
    status: "VALIDATED",
    instructions: "Surveillance stricte assurée par 2 enseignants par salle.",
    createdAt: Date.now() - 8000000
  },
  {
    id: "exam-3",
    title: "Compositions du 1er Trimestre",
    classes: ["6ème", "5ème", "4ème", "3ème", "2nde A", "2nde C", "1ère D", "Terminale D"],
    academicYear: "2024-2025",
    period: "1er Trimestre",
    type: "Composition Trimestrielle",
    startDate: "2024-12-09",
    endDate: "2024-12-14",
    timeSlot: "07h30 - 12h30",
    rooms: "Toutes les salles de cours",
    status: "VALIDATED",
    instructions: "Arrêt des cours à 12h30 chaque jour. Délibérations prévues le 17 Décembre.",
    createdAt: Date.now() - 5000000
  },
  {
    id: "exam-4",
    title: "Examen Blanc N°1 (BEPC & BAC)",
    classes: ["3ème", "Terminale A", "Terminale D"],
    academicYear: "2024-2025",
    period: "2ème Trimestre",
    type: "Examen Blanc",
    startDate: "2025-02-17",
    endDate: "2025-02-21",
    timeSlot: "08h00 - 17h00",
    rooms: "Centre d'examen - Blocs A & B",
    status: "PLANNED",
    instructions: "Format officiel identique aux épreuves nationales du Ministère (DDTFP).",
    createdAt: Date.now() - 2000000
  },
  {
    id: "exam-5",
    title: "Compositions du 2ème Trimestre",
    classes: ["6ème", "5ème", "4ème", "3ème", "2nde A", "1ère D", "Terminale D"],
    academicYear: "2024-2025",
    period: "2ème Trimestre",
    type: "Composition Trimestrielle",
    startDate: "2025-03-24",
    endDate: "2025-03-29",
    timeSlot: "08h00 - 12h30",
    rooms: "Toutes les salles",
    status: "PLANNED",
    instructions: "Saisie impérative des notes sur EDU-BENIN avant le 04 Avril.",
    createdAt: Date.now()
  }
];

export function DirectorDashboard() {
  const { user } = useAuth();

  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Configured Academic Year
  const [configuredYear, setConfiguredYear] = useState<string>("");
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string }[]>([]);

  // Filters
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterClass, setFilterClass] = useState<string>("ALL");
  const [filterPeriod, setFilterPeriod] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modal State for Add / Edit
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingExam, setEditingExam] = useState<ExamSchedule | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formClasses, setFormClasses] = useState<string[]>(["6ème"]);
  const [formAcademicYear, setFormAcademicYear] = useState("");
  const [formPeriod, setFormPeriod] = useState<"1er Trimestre" | "2ème Trimestre" | "3ème Trimestre">("1er Trimestre");
  const [formType, setFormType] = useState<ExamSchedule["type"]>("Composition Trimestrielle");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formTimeSlot, setFormTimeSlot] = useState("");
  const [formRooms, setFormRooms] = useState("");
  const [formStatus, setFormStatus] = useState<ExamSchedule["status"]>("PLANNED");
  const [formInstructions, setFormInstructions] = useState("");

  const activeSchoolId = user?.schoolId || localStorage.getItem('edubenin_active_school_id') || "11111111-1111-4111-8111-111111111111";

  // Available classes list
  const ALL_CLASSES = [
    "Toutes les classes",
    "6ème", "5ème", "4ème", "3ème",
    "2nde A", "2nde B", "2nde C", "2nde D",
    "1ère A", "1ère B", "1ère C", "1ère D",
    "Terminale A", "Terminale B", "Terminale C", "Terminale D"
  ];

  // Load configured academic year and schedules
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        let targetSchoolId = user?.schoolId || localStorage.getItem('edubenin_active_school_id');
        if (!targetSchoolId) {
          const { data: sc } = await supabase.from('schools').select('id, academic_year').order('created_at', { ascending: false }).limit(1).maybeSingle();
          if (sc?.id) targetSchoolId = sc.id;
        }
        if (!targetSchoolId) targetSchoolId = "11111111-1111-4111-8111-111111111111";

        // 1. Fetch real configured year from school settings
        let realConfigYear = "";
        try {
          const savedExtra = localStorage.getItem('schoolSettings_extra_' + targetSchoolId);
          if (savedExtra) {
            const parsed = JSON.parse(savedExtra);
            if (parsed.academicYear) realConfigYear = parsed.academicYear;
          }
        } catch (e) {}

        const [schoolRes, yearsRes] = await Promise.all([
          supabase.from('schools').select('academic_year').eq('id', targetSchoolId).maybeSingle(),
          supabase.from('academic_years').select('id, name').eq('school_id', targetSchoolId)
        ]);

        if (!realConfigYear && schoolRes.data?.academic_year) {
          realConfigYear = schoolRes.data.academic_year;
        }

        const realYears: { id: string; name: string }[] = [];
        if (yearsRes.data && yearsRes.data.length > 0) {
          yearsRes.data.forEach((y: any) => realYears.push(y));
        }
        if (realConfigYear && !realYears.some(y => y.name === realConfigYear)) {
          realYears.push({ id: `sc_${realConfigYear}`, name: realConfigYear });
        }

        const effectiveYear = realConfigYear || (realYears[0]?.name) || "2026-2027";
        setConfiguredYear(effectiveYear);
        setAcademicYears(realYears);
        setFilterYear(effectiveYear);
        setFormAcademicYear(effectiveYear);

        // 2. Load schedules
        const storageKey = `school_academic_exam_schedules_${targetSchoolId}`;
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          // Filter out dummy/mock DEFAULT_SCHEDULES if any was previously auto-seeded with exam-1, exam-2, etc.
          const realSchedules = Array.isArray(parsed) 
            ? parsed.filter((s: any) => !s.id?.startsWith('exam-') || s.createdAt > Date.now() - 3600000) 
            : [];
          setSchedules(realSchedules);
          if (realSchedules.length !== parsed.length) {
            localStorage.setItem(storageKey, JSON.stringify(realSchedules));
          }
        } else {
          setSchedules([]);
        }
      } catch (err) {
        console.error("Error loading schedules:", err);
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [user?.schoolId]);

  const saveSchedulesToStorage = (updatedList: ExamSchedule[]) => {
    setSchedules(updatedList);
    try {
      localStorage.setItem(`school_academic_exam_schedules_${activeSchoolId}`, JSON.stringify(updatedList));
    } catch (e) {
      console.error(e);
    }
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingExam(null);
    setFormTitle("");
    setFormClasses(["6ème"]);
    setFormAcademicYear(filterYear !== "ALL" ? filterYear : (configuredYear || "2026-2027"));
    setFormPeriod(filterPeriod !== "ALL" ? (filterPeriod as any) : "1er Trimestre");
    setFormType("Composition Trimestrielle");
    setFormStartDate(new Date().toISOString().split("T")[0]);
    setFormEndDate(new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0]);
    setFormTimeSlot("08h00 - 12h00");
    setFormRooms("Salles du bloc pédagogique");
    setFormStatus("PLANNED");
    setFormInstructions("");
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (exam: ExamSchedule) => {
    setEditingExam(exam);
    setFormTitle(exam.title);
    setFormClasses(exam.classes);
    setFormAcademicYear(exam.academicYear);
    setFormPeriod(exam.period);
    setFormType(exam.type);
    setFormStartDate(exam.startDate);
    setFormEndDate(exam.endDate);
    setFormTimeSlot(exam.timeSlot || "");
    setFormRooms(exam.rooms || "");
    setFormStatus(exam.status);
    setFormInstructions(exam.instructions || "");
    setShowModal(true);
  };

  // Delete an exam schedule
  const handleDelete = (id: string) => {
    const toDelete = schedules.find(s => s.id === id);
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la programmation "${toDelete?.title || 'cet examen'}" ?`)) {
      return;
    }
    const updated = schedules.filter(s => s.id !== id);
    saveSchedulesToStorage(updated);
    setFeedback("Date d'examen supprimée avec succès.");
    setTimeout(() => setFeedback(null), 3000);
  };

  // Save (Create or Update)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert("Veuillez saisir le titre de l'évaluation ou de l'examen.");
      return;
    }
    if (!formStartDate || !formEndDate) {
      alert("Veuillez renseigner les dates de début et de fin prévues.");
      return;
    }

    if (editingExam) {
      // Update
      const updated = schedules.map(item => {
        if (item.id === editingExam.id) {
          return {
            ...item,
            title: formTitle.trim(),
            classes: formClasses,
            academicYear: formAcademicYear,
            period: formPeriod,
            type: formType,
            startDate: formStartDate,
            endDate: formEndDate,
            timeSlot: formTimeSlot.trim(),
            rooms: formRooms.trim(),
            status: formStatus,
            instructions: formInstructions.trim()
          };
        }
        return item;
      });
      saveSchedulesToStorage(updated);
      setFeedback("Examen mis à jour avec succès.");
    } else {
      // Create
      const newExam: ExamSchedule = {
        id: `exam_${Date.now()}`,
        title: formTitle.trim(),
        classes: formClasses,
        academicYear: formAcademicYear,
        period: formPeriod,
        type: formType,
        startDate: formStartDate,
        endDate: formEndDate,
        timeSlot: formTimeSlot.trim(),
        rooms: formRooms.trim(),
        status: formStatus,
        instructions: formInstructions.trim(),
        createdAt: Date.now()
      };
      saveSchedulesToStorage([newExam, ...schedules]);
      setFeedback("Nouvelle programmation d'examen créée avec succès !");
    }

    setShowModal(false);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter(exam => {
      // Filter Year
      if (filterYear !== "ALL" && exam.academicYear !== filterYear) return false;
      // Filter Period
      if (filterPeriod !== "ALL" && exam.period !== filterPeriod) return false;
      // Filter Status
      if (filterStatus !== "ALL" && exam.status !== filterStatus) return false;
      // Filter Class
      if (filterClass !== "ALL") {
        const hasClass = exam.classes.includes("Toutes les classes") || exam.classes.includes(filterClass);
        if (!hasClass) return false;
      }
      // Search Term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = exam.title.toLowerCase().includes(q);
        const matchesType = exam.type.toLowerCase().includes(q);
        const matchesRooms = (exam.rooms || "").toLowerCase().includes(q);
        const matchesClasses = exam.classes.some(c => c.toLowerCase().includes(q));
        if (!matchesTitle && !matchesType && !matchesRooms && !matchesClasses) return false;
      }
      return true;
    });
  }, [schedules, filterYear, filterClass, filterPeriod, filterStatus, searchTerm]);

  // Quick Stats
  const stats = useMemo(() => {
    const targetYear = filterYear !== "ALL" ? filterYear : (configuredYear || "2026-2027");
    const activeList = filterYear !== "ALL" 
      ? schedules.filter(s => s.academicYear === filterYear)
      : schedules;

    const total = schedules.length;
    const currentYearCount = schedules.filter(s => s.academicYear === targetYear).length;
    const planned = activeList.filter(s => s.status === "PLANNED").length;
    const validated = activeList.filter(s => s.status === "VALIDATED" || s.status === "COMPLETED").length;
    return { total, currentYearCount, planned, validated, targetYear };
  }, [schedules, filterYear, configuredYear]);

  return (
    <div className="animate-in fade-in space-y-6 pb-12">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <CalendarCheck className="text-emerald-600" />
            Planification Académique
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Programmation et gestion des dates prévues des examens et compositions par classe et par année scolaire.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition shadow-sm"
        >
          <Plus size={16} /> Planifier un Examen
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Tableau des Dates Prévues des Examens */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-emerald-600" size={18} />
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
              Dates Prévues des Examens & Compositions
            </h2>
          </div>
          {configuredYear && (
            <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold">
              Année Scolaire Active : {configuredYear}
            </span>
          )}
        </div>

        <div className="p-4 md:p-6 bg-slate-50/50">
          <div className="space-y-6">
              {/* KPIs de planification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Examens Programmés</div>
                  <div className="text-2xl font-black text-gray-800 mt-1">{stats.total}</div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-1">Toutes sessions confondues</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Année Sélectionnée</div>
                  <div className="text-2xl font-black text-emerald-600 mt-1">{stats.currentYearCount}</div>
                  <div className="text-[11px] text-slate-500 font-semibold mt-1">Année {filterYear !== "ALL" ? filterYear : (stats.targetYear || "Toutes")}</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Sessions à Venir</div>
                  <div className="text-2xl font-black text-blue-600 mt-1">{stats.planned}</div>
                  <div className="text-[11px] text-slate-500 font-semibold mt-1">Statut planifié</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Sessions Clôturées / Validées</div>
                  <div className="text-2xl font-black text-purple-600 mt-1">{stats.validated}</div>
                  <div className="text-[11px] text-slate-500 font-semibold mt-1">Épreuves terminées</div>
                </div>
              </div>

              {/* Barre de filtres du tableau */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-44">
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide flex items-center gap-1">
                    <Filter size={13} className="text-emerald-600" /> Année Scolaire
                  </label>
                  <select
                    value={filterYear}
                    onChange={e => setFilterYear(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="ALL">Toutes les années</option>
                    {academicYears.length > 0 ? (
                      academicYears.map(y => (
                        <option key={y.id} value={y.name}>{y.name}</option>
                      ))
                    ) : configuredYear ? (
                      <option value={configuredYear}>{configuredYear}</option>
                    ) : null}
                  </select>
                </div>

                <div className="w-full md:w-44">
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide flex items-center gap-1">
                    <GraduationCap size={13} className="text-emerald-600" /> Classe
                  </label>
                  <select
                    value={filterClass}
                    onChange={e => setFilterClass(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="ALL">Toutes les classes</option>
                    {ALL_CLASSES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="w-full md:w-44">
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide flex items-center gap-1">
                    <CalendarIcon size={13} className="text-emerald-600" /> Trimestre
                  </label>
                  <select
                    value={filterPeriod}
                    onChange={e => setFilterPeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="ALL">Tous les trimestres</option>
                    <option value="1er Trimestre">1er Trimestre</option>
                    <option value="2ème Trimestre">2ème Trimestre</option>
                    <option value="3ème Trimestre">3ème Trimestre</option>
                  </select>
                </div>

                <div className="w-full md:w-40">
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide flex items-center gap-1">
                    Statut
                  </label>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="ALL">Tous les statuts</option>
                    <option value="PLANNED">Planifié</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="COMPLETED">Terminé</option>
                    <option value="VALIDATED">Validé</option>
                  </select>
                </div>

                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
                    Recherche
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Nom de l'épreuve, classe, salle..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* TABLEAU DES DATES PRÉVUES DES EXAMENS */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                      <CalendarCheck size={18} className="text-emerald-600" />
                      Tableau des Dates Prévues des Examens & Compositions
                    </h3>
                    <p className="text-xs text-slate-500">
                      {filteredSchedules.length} session(s) d'évaluation planifiée(s)
                    </p>
                  </div>

                  <button
                    onClick={handleOpenCreate}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition"
                  >
                    <Plus size={14} /> Ajouter une date d'examen
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Examen / Évaluation</th>
                        <th className="px-4 py-3">Classe(s) Concernée(s)</th>
                        <th className="px-3 py-3 text-center">Année Scolaire</th>
                        <th className="px-3 py-3 text-center">Trimestre</th>
                        <th className="px-4 py-3">Dates Prévues</th>
                        <th className="px-4 py-3">Horaires & Salles</th>
                        <th className="px-3 py-3 text-center">Statut</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredSchedules.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                            Aucun examen trouvé pour ces critères de filtre.
                          </td>
                        </tr>
                      ) : (
                        filteredSchedules.map(exam => (
                          <tr key={exam.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Titre et type */}
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-gray-900 text-sm">{exam.title}</div>
                              <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold uppercase ${
                                exam.type === "Composition Trimestrielle" ? "bg-purple-100 text-purple-800" :
                                exam.type === "Examen Blanc" ? "bg-amber-100 text-amber-800" :
                                exam.type === "Devoir Surveillé" ? "bg-blue-100 text-blue-800" :
                                "bg-slate-100 text-slate-700"
                              }`}>
                                {exam.type}
                              </span>
                              {exam.instructions && (
                                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic" title={exam.instructions}>
                                  {exam.instructions}
                                </p>
                              )}
                            </td>

                            {/* Classes concernées */}
                            <td className="px-4 py-3.5">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {exam.classes.map((cls, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[11px] font-bold">
                                    {cls}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {/* Année scolaire */}
                            <td className="px-3 py-3.5 text-center font-bold text-slate-700">
                              <span className="px-2 py-1 bg-slate-100 rounded text-xs">
                                {exam.academicYear}
                              </span>
                            </td>

                            {/* Période / Trimestre */}
                            <td className="px-3 py-3.5 text-center font-semibold text-slate-600">
                              {exam.period}
                            </td>

                            {/* Dates prévues */}
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-gray-800 flex items-center gap-1.5">
                                <CalendarIcon size={14} className="text-emerald-600 shrink-0" />
                                <span>
                                  {new Date(exam.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                  {' → '}
                                  {new Date(exam.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            </td>

                            {/* Horaires et salles */}
                            <td className="px-4 py-3.5 text-slate-600 text-xs">
                              {exam.timeSlot && (
                                <div className="flex items-center gap-1 font-medium">
                                  <Clock size={12} className="text-slate-400" />
                                  <span>{exam.timeSlot}</span>
                                </div>
                              )}
                              {exam.rooms && (
                                <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs" title={exam.rooms}>
                                  Lieu : {exam.rooms}
                                </div>
                              )}
                            </td>

                            {/* Statut */}
                            <td className="px-3 py-3.5 text-center">
                              <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                exam.status === "VALIDATED" ? "bg-emerald-100 text-emerald-800" :
                                exam.status === "COMPLETED" ? "bg-slate-200 text-slate-800" :
                                exam.status === "IN_PROGRESS" ? "bg-amber-100 text-amber-800 animate-pulse" :
                                "bg-blue-100 text-blue-800"
                              }`}>
                                {exam.status === "VALIDATED" ? "Validé" :
                                 exam.status === "COMPLETED" ? "Terminé" :
                                 exam.status === "IN_PROGRESS" ? "En cours" : "Planifié"}
                              </span>
                            </td>

                            {/* Actions Édition et Suppression */}
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEdit(exam)}
                                  className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg transition"
                                  title="Modifier cette programmation"
                                >
                                  <Edit3 size={15} />
                                </button>
                                <button
                                  onClick={() => handleDelete(exam.id)}
                                  className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                                  title="Supprimer cette programmation"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* MODAL CRÉATION / ÉDITION D'UNE DATE D'EXAMEN */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <CalendarCheck className="text-emerald-600" />
                  {editingExam ? "Modifier la programmation de l'examen" : "Planifier une nouvelle date d'examen"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Renseignez les dates, classes concernées et modalités de la session.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Intitulé de l'examen / Évaluation *
                </label>
                <input
                  required
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="Ex: Compositions du 1er Trimestre"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Année Scolaire *
                  </label>
                  <select
                    value={formAcademicYear}
                    onChange={e => setFormAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    {academicYears.length > 0 ? (
                      academicYears.map(y => (
                        <option key={y.id} value={y.name}>{y.name}</option>
                      ))
                    ) : configuredYear ? (
                      <option value={configuredYear}>{configuredYear}</option>
                    ) : (
                      <option value="">Aucune année configurée</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Période / Trimestre *
                  </label>
                  <select
                    value={formPeriod}
                    onChange={e => setFormPeriod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="1er Trimestre">1er Trimestre</option>
                    <option value="2ème Trimestre">2ème Trimestre</option>
                    <option value="3ème Trimestre">3ème Trimestre</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Type d'évaluation *
                  </label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="Composition Trimestrielle">Composition Trimestrielle</option>
                    <option value="Devoir Surveillé">Devoir Surveillé</option>
                    <option value="Examen Blanc">Examen Blanc</option>
                    <option value="Contrôle Continu">Contrôle Continu</option>
                    <option value="Rattrapage">Rattrapage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Statut de la session
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="PLANNED">Planifié</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="COMPLETED">Terminé</option>
                    <option value="VALIDATED">Validé</option>
                  </select>
                </div>
              </div>

              {/* Sélection des classes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex justify-between">
                  <span>Classes concernées par l'examen *</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (formClasses.includes("Toutes les classes")) {
                        setFormClasses(["6ème"]);
                      } else {
                        setFormClasses(["Toutes les classes"]);
                      }
                    }}
                    className="text-[11px] text-emerald-600 font-bold hover:underline"
                  >
                    {formClasses.includes("Toutes les classes") ? "Choisir par classe" : "Toutes les classes"}
                  </button>
                </label>

                {formClasses.includes("Toutes les classes") ? (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} /> Toutes les classes de l'établissement sont concernées.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
                    {ALL_CLASSES.filter(c => c !== "Toutes les classes").map(cls => {
                      const isChecked = formClasses.includes(cls);
                      return (
                        <label key={cls} className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setFormClasses(formClasses.filter(c => c !== cls));
                              } else {
                                setFormClasses([...formClasses, cls]);
                              }
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{cls}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dates prévues */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Date de début prévue *
                  </label>
                  <input
                    required
                    type="date"
                    value={formStartDate}
                    onChange={e => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Date de fin prévue *
                  </label>
                  <input
                    required
                    type="date"
                    value={formEndDate}
                    onChange={e => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Horaires et salles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Plages Horaires
                  </label>
                  <input
                    type="text"
                    value={formTimeSlot}
                    onChange={e => setFormTimeSlot(e.target.value)}
                    placeholder="Ex: 08h00 - 12h00 & 15h00 - 18h00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Salles / Emplacements
                  </label>
                  <input
                    type="text"
                    value={formRooms}
                    onChange={e => setFormRooms(e.target.value)}
                    placeholder="Ex: Bâtiment A, Salles 101 à 108"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Consignes / Observations particulières
                </label>
                <textarea
                  rows={3}
                  value={formInstructions}
                  onChange={e => setFormInstructions(e.target.value)}
                  placeholder="Instructions de surveillance, matériel autorisé, convocation des élèves..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-gray-700 rounded-lg text-xs font-bold uppercase hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition shadow-sm"
                >
                  {editingExam ? "Enregistrer les modifications" : "Créer la programmation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
