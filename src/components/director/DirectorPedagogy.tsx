import React, { useState } from "react";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Plus, 
  TrendingUp, 
  Layers, 
  Award,
  Users
} from "lucide-react";

interface SubjectProgram {
  id: string;
  name: string;
  level: string;
  weeklyHours: number;
  coefficient: number;
  totalChapters: number;
  completedChapters: number;
  teacherAssigned: string;
  status: "ON_TRACK" | "BEHIND" | "AHEAD";
}

interface PedagogicalMeeting {
  id: string;
  title: string;
  date: string;
  time: string;
  audience: string;
  agenda: string;
  status: "PLANNED" | "HELD";
}

export function DirectorPedagogy() {
  const [activeTab, setActiveTab] = useState<"PROGRAMMES" | "PROGRESSION" | "CONCERTATIONS">("PROGRAMMES");

  const [programs, setPrograms] = useState<SubjectProgram[]>([
    {
      id: "prog-1",
      name: "Mathématiques",
      level: "Terminale D",
      weeklyHours: 6,
      coefficient: 6,
      totalChapters: 12,
      completedChapters: 6,
      teacherAssigned: "M. DOSSOU Jean",
      status: "ON_TRACK"
    },
    {
      id: "prog-2",
      name: "Physique-Chimie",
      level: "Terminale D",
      weeklyHours: 5,
      coefficient: 5,
      totalChapters: 14,
      completedChapters: 5,
      teacherAssigned: "M. BIO Sanni",
      status: "BEHIND"
    },
    {
      id: "prog-3",
      name: "Français & Littérature",
      level: "3ème A",
      weeklyHours: 5,
      coefficient: 4,
      totalChapters: 10,
      completedChapters: 6,
      teacherAssigned: "Mme. MENSAH Claire",
      status: "ON_TRACK"
    },
    {
      id: "prog-4",
      name: "SVT",
      level: "3ème A",
      weeklyHours: 3,
      coefficient: 3,
      totalChapters: 8,
      completedChapters: 5,
      teacherAssigned: "M. KOUTON Eric",
      status: "AHEAD"
    }
  ]);

  const [meetings, setMeetings] = useState<PedagogicalMeeting[]>([
    {
      id: "meet-1",
      title: "Conseil Pédagogique - Bilan Mi-Parcours Trimestre 1",
      date: "2024-11-28",
      time: "15:00",
      audience: "Tous les professeurs principaux & responsables de départements",
      agenda: "Harmonisation des devoirs surveillés, APC et remédiation des élèves en difficulté.",
      status: "PLANNED"
    },
    {
      id: "meet-2",
      title: "Cellule Mathématiques & Sciences",
      date: "2024-11-20",
      time: "10:30",
      audience: "Enseignants de Mathématiques & PCT",
      agenda: "Validation des épreuves types pour le 1er devoir départemental.",
      status: "HELD"
    }
  ]);

  const [showAddProgram, setShowAddProgram] = useState(false);
  const [showAddMeeting, setShowAddMeeting] = useState(false);

  // Form states program
  const [newProgName, setNewProgName] = useState("");
  const [newProgLevel, setNewProgLevel] = useState("6ème A");
  const [newProgHours, setNewProgHours] = useState(4);
  const [newProgCoef, setNewProgCoef] = useState(3);
  const [newProgChapters, setNewProgChapters] = useState(10);
  const [newProgTeacher, setNewProgTeacher] = useState("");

  // Form states meeting
  const [newMeetTitle, setNewMeetTitle] = useState("");
  const [newMeetDate, setNewMeetDate] = useState("");
  const [newMeetTime, setNewMeetTime] = useState("15:00");
  const [newMeetAudience, setNewMeetAudience] = useState("");
  const [newMeetAgenda, setNewMeetAgenda] = useState("");

  const handleAddProg = (e: React.FormEvent) => {
    e.preventDefault();
    setPrograms([
      ...programs,
      {
        id: `prog-${Date.now()}`,
        name: newProgName,
        level: newProgLevel,
        weeklyHours: Number(newProgHours),
        coefficient: Number(newProgCoef),
        totalChapters: Number(newProgChapters),
        completedChapters: 0,
        teacherAssigned: newProgTeacher || "Non assigné",
        status: "ON_TRACK"
      }
    ]);
    setShowAddProgram(false);
    setNewProgName("");
    setNewProgTeacher("");
  };

  const handleAddMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    setMeetings([
      {
        id: `meet-${Date.now()}`,
        title: newMeetTitle,
        date: newMeetDate,
        time: newMeetTime,
        audience: newMeetAudience,
        agenda: newMeetAgenda,
        status: "PLANNED"
      },
      ...meetings
    ]);
    setShowAddMeeting(false);
    setNewMeetTitle("");
    setNewMeetAgenda("");
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <BookOpen size={12} /> Pilotage Pédagogique
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Direction des Études : Programmes & Coordination</h2>
          <p className="text-xs text-slate-500">
            Supervision de l'avancement des cours, respect des curricula officiels (APC) et animation des réunions pédagogiques.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "PROGRAMMES" && (
            <button
              onClick={() => setShowAddProgram(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition"
            >
              <Plus size={16} /> Ajouter une Matière / Curricula
            </button>
          )}

          {activeTab === "CONCERTATIONS" && (
            <button
              onClick={() => setShowAddMeeting(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition"
            >
              <Plus size={16} /> Planifier Conseil / Réunion
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-sm gap-1">
        <button
          onClick={() => setActiveTab("PROGRAMMES")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition ${
            activeTab === "PROGRAMMES" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Curricula & Coefficients ({programs.length})
        </button>

        <button
          onClick={() => setActiveTab("PROGRESSION")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition ${
            activeTab === "PROGRESSION" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Progression Pédagogique & APC
        </button>

        <button
          onClick={() => setActiveTab("CONCERTATIONS")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition ${
            activeTab === "CONCERTATIONS" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Conseils Pédagogiques & Concertations ({meetings.length})
        </button>
      </div>

      {/* TAB 1: CURRICULA & COEFF */}
      {activeTab === "PROGRAMMES" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-[10px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Discipline</th>
                  <th className="px-5 py-3">Classe</th>
                  <th className="px-5 py-3">Vol. Hebdo</th>
                  <th className="px-5 py-3">Coefficient</th>
                  <th className="px-5 py-3">Professeur Chargé</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {programs.map(prog => (
                  <tr key={prog.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-gray-800 text-sm flex items-center gap-2">
                      <Layers size={15} className="text-emerald-600" />
                      {prog.name}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-700">{prog.level}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-700">{prog.weeklyHours} h / sem</td>
                    <td className="px-5 py-3.5 font-mono font-black text-emerald-700">Coef. {prog.coefficient}</td>
                    <td className="px-5 py-3.5 text-slate-600">{prog.teacherAssigned}</td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button 
                        onClick={() => {
                          const newT = window.prompt("Nom du professeur assigné:", prog.teacherAssigned);
                          if (newT) setPrograms(programs.map(p => p.id === prog.id ? { ...p, teacherAssigned: newT } : p));
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition"
                      >
                        Assigner Professeur
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PROGRESSION PEDAGOGIQUE */}
      {activeTab === "PROGRESSION" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programs.map(prog => {
              const pct = Math.round((prog.completedChapters / prog.totalChapters) * 100);
              return (
                <div key={prog.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-800 text-base">{prog.name}</h4>
                      <span className="text-xs text-slate-500 font-semibold">{prog.level} • {prog.teacherAssigned}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      prog.status === "AHEAD" ? "bg-purple-100 text-purple-800" :
                      prog.status === "ON_TRACK" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}>
                      {prog.status === "AHEAD" ? "En avance" : prog.status === "ON_TRACK" ? "Dans les temps" : "En retard"}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1 text-slate-600">
                      <span>Progression : {prog.completedChapters} / {prog.totalChapters} chapitres réalisés</span>
                      <span className="text-emerald-700 font-black">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct >= 60 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Objectif fin T1 : 50%</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setPrograms(programs.map(p => p.id === prog.id ? { 
                            ...p, 
                            completedChapters: Math.min(p.totalChapters, p.completedChapters + 1) 
                          } : p));
                        }}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-bold transition"
                      >
                        + 1 Chapitre validé
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CONSEILS & CONCERTATIONS */}
      {activeTab === "CONCERTATIONS" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Calendar size={16} className="text-emerald-600" />
              Réunions & Concertations Pédagogiques
            </h3>
            <span className="text-xs text-slate-500">Ordres du jour & comptes-rendus</span>
          </div>

          <div className="divide-y divide-slate-100">
            {meetings.map(meet => (
              <div key={meet.id} className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      meet.status === "HELD" ? "bg-slate-100 text-slate-700" : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {meet.status === "HELD" ? "Tenue" : "Prévue"}
                    </span>
                    <h4 className="font-bold text-gray-800 text-base">{meet.title}</h4>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-4">
                    <span>📅 {new Date(meet.date).toLocaleDateString("fr-FR")} à {meet.time}</span>
                    <span>👥 {meet.audience}</span>
                  </div>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                    <strong className="text-gray-700">Ordre du jour : </strong>{meet.agenda}
                  </p>
                </div>

                <div className="flex items-center gap-2 whitespace-nowrap">
                  <button
                    onClick={() => {
                      setMeetings(meetings.map(m => m.id === meet.id ? {
                        ...m,
                        status: m.status === "PLANNED" ? "HELD" : "PLANNED"
                      } : m));
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider transition"
                  >
                    {meet.status === "PLANNED" ? "Marquer Tenue" : "Rétablir"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Add Program */}
      {showAddProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-base text-gray-800">Ajouter une Matière & Curricula</h3>
              <button onClick={() => setShowAddProgram(false)} className="text-slate-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleAddProg} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Matière <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Mathématiques, Histoire-Géo, Anglais..."
                  value={newProgName}
                  onChange={e => setNewProgName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Classe
                  </label>
                  <input
                    type="text"
                    value={newProgLevel}
                    onChange={e => setNewProgLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Coefficient
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newProgCoef}
                    onChange={e => setNewProgCoef(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Volume Hebdo (heures)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={newProgHours}
                    onChange={e => setNewProgHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Nombre total de chapitres
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={newProgChapters}
                    onChange={e => setNewProgChapters(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Professeur Assigné
                </label>
                <input
                  type="text"
                  placeholder="Ex: M. DOSSOU Jean"
                  value={newProgTeacher}
                  onChange={e => setNewProgTeacher(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddProgram(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Meeting */}
      {showAddMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-base text-gray-800">Planifier une Concertation Pédagogique</h3>
              <button onClick={() => setShowAddMeeting(false)} className="text-slate-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleAddMeeting} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Intitulé de la rencontre <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Conseil d'enseignement - Département de Français"
                  value={newMeetTitle}
                  onChange={e => setNewMeetTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newMeetDate}
                    onChange={e => setNewMeetDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Heure
                  </label>
                  <input
                    type="time"
                    value={newMeetTime}
                    onChange={e => setNewMeetTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Participants convoqués
                </label>
                <input
                  type="text"
                  placeholder="Ex: Tous les enseignants du premier cycle"
                  value={newMeetAudience}
                  onChange={e => setNewMeetAudience(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Ordre du jour détaillé
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Évaluation des acquis, organisation des devoirs groupés..."
                  value={newMeetAgenda}
                  onChange={e => setNewMeetAgenda(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddMeeting(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition"
                >
                  Enregistrer Rencontre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
