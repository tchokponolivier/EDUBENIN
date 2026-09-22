import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  UserX, 
  AlertTriangle, 
  Calendar, 
  Send, 
  PhoneCall, 
  FileText, 
  Clock, 
  CheckCircle,
  Users
} from "lucide-react";
import { Student, LEVELS } from "../types";

export interface DisciplinaryRecord {
  id: string;
  studentId: string;
  studentName: string;
  level: string;
  sanctionType: "AVERTISSEMENT" | "BLAME" | "RETENUE" | "EXCLUSION_TEMP" | "CONVOCATION_PARENT";
  motif: string;
  date: string;
  reportedBy: string;
  parentNotified: boolean;
  parentPhone?: string;
  status: "ACTIVE" | "RESOLVED" | "APPEALED";
  durationHours?: number; // for retenue or exclusion
  notes?: string;
  createdAt: string;
}

export function SupervisorDiscipline() {
  const { user } = useAuth();
  const [records, setRecords] = useState<DisciplinaryRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterLevel, setFilterLevel] = useState("ALL");

  // Form states
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [sanctionType, setSanctionType] = useState<DisciplinaryRecord["sanctionType"]>("AVERTISSEMENT");
  const [motif, setMotif] = useState("");
  const [sanctionDate, setSanctionDate] = useState(new Date().toISOString().split("T")[0]);
  const [durationHours, setDurationHours] = useState<number>(2);
  const [notes, setNotes] = useState("");

  const localKey = `supervisor_discipline_${user?.schoolId || "default"}`;

  // Fetch students & discipline records
  useEffect(() => {
    const fetchStudentsAndRecords = async () => {
      if (!user?.schoolId) return;

      const { data } = await supabase
        .from("students")
        .select("*")
        .eq("school_id", user.schoolId);

      if (data) {
        setStudents(data.map(d => ({
          ...d,
          firstName: d.first_name,
          lastName: d.last_name,
          fatherContact: d.father_contact,
          motherContact: d.mother_contact,
          guardianContact: d.guardian_contact
        })));
      }

      try {
        const stored = localStorage.getItem(localKey);
        if (stored) {
          setRecords(JSON.parse(stored));
        } else {
          // Demo seed
          const seed: DisciplinaryRecord[] = [
            {
              id: "disc-1",
              studentId: "demo-1",
              studentName: "ADANHO Marc",
              level: "3ème A",
              sanctionType: "RETENUE",
              motif: "Bavardages incessants et refus d'obtempérer en cours d'anglais",
              date: new Date().toISOString().split("T")[0],
              reportedBy: "M. Dossou (Surveillant)",
              parentNotified: true,
              parentPhone: "+22997000000",
              status: "ACTIVE",
              durationHours: 2,
              notes: "Retenue prévue samedi matin à 8h00 avec devoir de réflexion.",
              createdAt: new Date().toISOString()
            },
            {
              id: "disc-2",
              studentId: "demo-2",
              studentName: "HOUNGBO Mireille",
              level: "2nde C",
              sanctionType: "CONVOCATION_PARENT",
              motif: "Absences répétées non justifiées (plus de 12h cumulées)",
              date: new Date().toISOString().split("T")[0],
              reportedBy: "Direction de la Surveillance",
              parentNotified: true,
              parentPhone: "+22996000000",
              status: "ACTIVE",
              notes: "Rendez-vous fixé avec les parents ce jeudi à 10h.",
              createdAt: new Date().toISOString()
            }
          ];
          setRecords(seed);
          localStorage.setItem(localKey, JSON.stringify(seed));
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchStudentsAndRecords();
  }, [user?.schoolId]);

  const saveRecords = (newRecords: DisciplinaryRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem(localKey, JSON.stringify(newRecords));
  };

  const handleAddSanction = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find(s => s.id === selectedStudentId);
    if (!st) return alert("Veuillez sélectionner un élève");

    const phone = st.fatherContact || st.motherContact || st.guardianContact || "";

    const newRecord: DisciplinaryRecord = {
      id: `disc-${Date.now()}`,
      studentId: st.id,
      studentName: `${st.lastName} ${st.firstName}`,
      level: st.level,
      sanctionType,
      motif,
      date: sanctionDate,
      reportedBy: user?.name || "Surveillant Général",
      parentNotified: false,
      parentPhone: phone,
      status: "ACTIVE",
      durationHours: ["RETENUE", "EXCLUSION_TEMP"].includes(sanctionType) ? durationHours : undefined,
      notes,
      createdAt: new Date().toISOString()
    };

    const updated = [newRecord, ...records];
    saveRecords(updated);
    setShowAddModal(false);

    // Reset form
    setSelectedStudentId("");
    setMotif("");
    setNotes("");
  };

  const toggleParentNotified = (id: string) => {
    const updated = records.map(r => {
      if (r.id === id) {
        return { ...r, parentNotified: !r.parentNotified };
      }
      return r;
    });
    saveRecords(updated);
  };

  const resolveSanction = (id: string) => {
    const updated = records.map(r => {
      if (r.id === id) {
        return { ...r, status: r.status === "RESOLVED" ? ("ACTIVE" as const) : ("RESOLVED" as const) };
      }
      return r;
    });
    saveRecords(updated);
  };

  const notifyParentWhatsApp = (record: DisciplinaryRecord) => {
    if (!record.parentPhone) return alert("Aucun numéro de contact parent renseigné pour cet élève.");
    const cleanPhone = record.parentPhone.replace(/\D/g, "");
    const msg = `*NOTIFICATION DISCIPLINAIRE - SURVEILLANCE GÉNÉRALE*\n\nMadame/Monsieur,\nNous vous informons de la mesure prise à l'encontre de votre enfant *${record.studentName}* (${record.level}):\n- Mesure: *${record.sanctionType}*\n- Motif: ${record.motif}\n- Date: ${new Date(record.date).toLocaleDateString("fr-FR")}\n\nMerci de vous rapprocher de la vie scolaire ou de contacter la surveillance.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");

    if (!record.parentNotified) {
      toggleParentNotified(record.id);
    }
  };

  const filteredRecords = records.filter(r => {
    const matchSearch = r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.motif.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === "ALL" || r.sanctionType === filterType;
    const matchLevel = filterLevel === "ALL" || r.level === filterLevel;
    return matchSearch && matchType && matchLevel;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner & Stats */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
              <ShieldAlert size={12} /> Discipline & Sanctions
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Registre Disciplinaire & Convocations</h2>
          <p className="text-xs text-slate-500">
            Avertissements, retenues, exclusions temporaires et liaison directe avec les familles.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition"
        >
          <Plus size={16} /> Notifier une Sanction / Convocation
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avertissements</span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {records.filter(r => r.sanctionType === "AVERTISSEMENT").length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Retenues / Heures de colle</span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {records.filter(r => r.sanctionType === "RETENUE").length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exclusions Temporaires</span>
          <div className="text-2xl font-black text-purple-700 mt-1">
            {records.filter(r => r.sanctionType === "EXCLUSION_TEMP").length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Convocations Parents</span>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {records.filter(r => r.sanctionType === "CONVOCATION_PARENT").length}
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par élève ou motif..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none bg-white font-semibold text-slate-700"
          >
            <option value="ALL">Toutes sanctions</option>
            <option value="AVERTISSEMENT">Avertissement</option>
            <option value="BLAME">Blâme</option>
            <option value="RETENUE">Retenue (Colle)</option>
            <option value="EXCLUSION_TEMP">Exclusion temporaire</option>
            <option value="CONVOCATION_PARENT">Convocation Parent</option>
          </select>

          <select
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none bg-white font-semibold text-slate-700"
          >
            <option value="ALL">Toutes les classes</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-[10px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Élève & Classe</th>
                <th className="px-5 py-3">Sanction / Mesure</th>
                <th className="px-5 py-3">Motif & Rapport</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Famille Notifiée</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    Aucun dossier disciplinaire correspondant.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-gray-800 text-sm">{rec.studentName}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{rec.level}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                        rec.sanctionType === "AVERTISSEMENT" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                        rec.sanctionType === "RETENUE" ? "bg-rose-100 text-rose-800 border border-rose-200" :
                        rec.sanctionType === "EXCLUSION_TEMP" ? "bg-purple-100 text-purple-800 border border-purple-200" :
                        rec.sanctionType === "CONVOCATION_PARENT" ? "bg-blue-100 text-blue-800 border border-blue-200" :
                        "bg-slate-100 text-slate-800"
                      }`}>
                        {rec.sanctionType === "RETENUE" && <Clock size={11} />}
                        {rec.sanctionType === "CONVOCATION_PARENT" && <PhoneCall size={11} />}
                        {rec.sanctionType.replace("_", " ")}
                        {rec.durationHours ? ` (${rec.durationHours}h)` : ""}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="font-semibold text-gray-700">{rec.motif}</div>
                      {rec.notes && <div className="text-[11px] text-slate-400 italic mt-0.5">{rec.notes}</div>}
                      <div className="text-[10px] text-slate-400 mt-1">Par: {rec.reportedBy}</div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-600 font-medium">
                      {new Date(rec.date).toLocaleDateString("fr-FR")}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {rec.parentNotified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle size={11} /> Notifié
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock size={11} /> À informer
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        rec.status === "RESOLVED" ? "bg-slate-100 text-slate-600" : "bg-rose-50 text-rose-700 font-bold"
                      }`}>
                        {rec.status === "RESOLVED" ? "Clôturé" : "En cours"}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => notifyParentWhatsApp(rec)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[11px] font-bold inline-flex items-center gap-1 transition"
                        title="Informer les parents par WhatsApp"
                      >
                        <Send size={11} /> WhatsApp
                      </button>

                      <button
                        onClick={() => resolveSanction(rec.id)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition"
                      >
                        {rec.status === "RESOLVED" ? "Rouvrir" : "Clôturer"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Sanction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-base text-gray-800 flex items-center gap-2">
                <ShieldAlert className="text-rose-600 w-5 h-5" />
                Enregistrer une Sanction ou Convocation
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleAddSanction} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Élève concerné <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Sélectionnez un élève...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.lastName} {s.firstName} - {s.level}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Nature de la sanction <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={sanctionType}
                    onChange={e => setSanctionType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                  >
                    <option value="AVERTISSEMENT">Avertissement écrit</option>
                    <option value="BLAME">Blâme</option>
                    <option value="RETENUE">Heures de retenue / Colle</option>
                    <option value="EXCLUSION_TEMP">Exclusion temporaire</option>
                    <option value="CONVOCATION_PARENT">Convocation des parents</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Date d'effet / Convocation
                  </label>
                  <input
                    type="date"
                    value={sanctionDate}
                    onChange={e => setSanctionDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {["RETENUE", "EXCLUSION_TEMP"].includes(sanctionType) && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Durée ({sanctionType === "RETENUE" ? "Nombre d'heures" : "Nombre de jours"})
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={durationHours}
                    onChange={e => setDurationHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Motif exact du manquement <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Bagarre dans la cour, insubordination envers enseignant..."
                  value={motif}
                  onChange={e => setMotif(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Consignes / Notes additionnelles
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Devoir de punition à rendre, rendez-vous fixé à 10h au bureau du surveillant..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
