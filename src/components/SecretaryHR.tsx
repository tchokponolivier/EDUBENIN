import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { 
  Users, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  FileCheck, 
  AlertCircle, 
  FileSpreadsheet, 
  DollarSign, 
  Briefcase,
  CheckCircle,
  Building,
  UserCheck
} from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  role: "TEACHER" | "ADMIN" | "SERVICE" | "SURVEILLANT" | "OTHER";
  contractType: "CDI" | "CDD" | "VACATAIRE";
  hourlyRate?: number;
  monthlyBaseSalary?: number;
  phone: string;
  cin?: string;
  status: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
}

interface StaffAttendance {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  hoursWorked: number;
  notes?: string;
}

export function SecretaryHR() {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<"PERSONNEL" | "PRESENCE" | "PAIE_PREP">("PERSONNEL");
  
  const localStaffKey = `secretary_staff_${user?.schoolId || "default"}`;
  const localAttendKey = `secretary_staff_attend_${user?.schoolId || "default"}`;

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [attendances, setAttendances] = useState<StaffAttendance[]>([]);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // New staff form
  const [name, setName] = useState("");
  const [role, setRole] = useState<StaffMember["role"]>("TEACHER");
  const [contractType, setContractType] = useState<StaffMember["contractType"]>("VACATAIRE");
  const [hourlyRate, setHourlyRate] = useState<number>(3500);
  const [monthlyBaseSalary, setMonthlyBaseSalary] = useState<number>(120000);
  const [phone, setPhone] = useState("");

  // Attendance form
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [attendDate, setAttendDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendStatus, setAttendStatus] = useState<StaffAttendance["status"]>("PRESENT");
  const [hoursWorked, setHoursWorked] = useState<number>(4);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    try {
      const storedStaff = localStorage.getItem(localStaffKey);
      if (storedStaff) {
        setStaffList(JSON.parse(storedStaff));
      } else {
        const seedStaff: StaffMember[] = [
          { id: "st-1", name: "M. DOSSOU Jean", role: "TEACHER", contractType: "VACATAIRE", hourlyRate: 3500, phone: "+229 97 12 34 56", status: "ACTIVE" },
          { id: "st-2", name: "Mme. MENSAH Claire", role: "TEACHER", contractType: "CDI", monthlyBaseSalary: 180000, phone: "+229 96 11 22 33", status: "ACTIVE" },
          { id: "st-3", name: "M. AGOSSOU Paul", role: "SURVEILLANT", contractType: "CDI", monthlyBaseSalary: 130000, phone: "+229 95 44 55 66", status: "ACTIVE" },
          { id: "st-4", name: "Mme. KIKI Viviane", role: "SERVICE", contractType: "CDD", monthlyBaseSalary: 75000, phone: "+229 67 88 99 00", status: "ACTIVE" }
        ];
        setStaffList(seedStaff);
        localStorage.setItem(localStaffKey, JSON.stringify(seedStaff));
      }

      const storedAttend = localStorage.getItem(localAttendKey);
      if (storedAttend) {
        setAttendances(JSON.parse(storedAttend));
      } else {
        const today = new Date().toISOString().split("T")[0];
        const seedAttend: StaffAttendance[] = [
          { id: "att-1", staffId: "st-1", staffName: "M. DOSSOU Jean", date: today, status: "PRESENT", hoursWorked: 4, notes: "Cours Maths 3ème" },
          { id: "att-2", staffId: "st-2", staffName: "Mme. MENSAH Claire", date: today, status: "PRESENT", hoursWorked: 6, notes: "Cours Français 6ème" },
          { id: "att-3", staffId: "st-3", staffName: "M. AGOSSOU Paul", date: today, status: "PRESENT", hoursWorked: 8, notes: "Permanence matin & après-midi" },
        ];
        setAttendances(seedAttend);
        localStorage.setItem(localAttendKey, JSON.stringify(seedAttend));
      }
    } catch (e) {
      console.error(e);
    }
  }, [user?.schoolId]);

  const saveStaff = (items: StaffMember[]) => {
    setStaffList(items);
    localStorage.setItem(localStaffKey, JSON.stringify(items));
  };

  const saveAttendances = (items: StaffAttendance[]) => {
    setAttendances(items);
    localStorage.setItem(localAttendKey, JSON.stringify(items));
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const newStaff: StaffMember = {
      id: `st-${Date.now()}`,
      name,
      role,
      contractType,
      hourlyRate: contractType === "VACATAIRE" ? hourlyRate : undefined,
      monthlyBaseSalary: contractType !== "VACATAIRE" ? monthlyBaseSalary : undefined,
      phone,
      status: "ACTIVE"
    };

    saveStaff([...staffList, newStaff]);
    setShowAddStaffModal(false);
    setName("");
    setPhone("");
  };

  const handleAddAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffList.find(s => s.id === selectedStaffId);
    if (!staff) return alert("Sélectionnez un membre du personnel");

    const newAttend: StaffAttendance = {
      id: `att-${Date.now()}`,
      staffId: staff.id,
      staffName: staff.name,
      date: attendDate,
      status: attendStatus,
      hoursWorked: attendStatus === "PRESENT" ? Number(hoursWorked) : 0,
      notes
    };

    saveAttendances([newAttend, ...attendances]);
    setShowAttendanceModal(false);
    setNotes("");
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
              <Briefcase size={12} /> Gestion du Personnel
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Personnel, Pointage & Prépa Paie</h2>
          <p className="text-xs text-slate-500">
            Suivi des présences quotidiennes des enseignants/personnel et relevé des heures pour la rémunération.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === "PERSONNEL" && (
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition"
            >
              <Plus size={16} /> Nouveau Collaborateur
            </button>
          )}

          {activeSubTab === "PRESENCE" && (
            <button
              onClick={() => setShowAttendanceModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition"
            >
              <CheckCircle size={16} /> Pointer Présence / Heures
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-sm gap-1">
        <button
          onClick={() => setActiveSubTab("PERSONNEL")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition ${
            activeSubTab === "PERSONNEL" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Annuaire du Personnel ({staffList.length})
        </button>

        <button
          onClick={() => setActiveSubTab("PRESENCE")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition ${
            activeSubTab === "PRESENCE" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Pointage & Présences Journalières
        </button>

        <button
          onClick={() => setActiveSubTab("PAIE_PREP")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition ${
            activeSubTab === "PAIE_PREP" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          État Récapitulatif Pré-Paie
        </button>
      </div>

      {/* SUBTAB 1: ANNUAIRE PERSONNEL */}
      {activeSubTab === "PERSONNEL" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <div className="relative w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <span className="text-xs text-slate-400 font-semibold">{staffList.length} employé(s) actif(s)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-[10px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Nom & Prénoms</th>
                  <th className="px-5 py-3">Fonction / Rôle</th>
                  <th className="px-5 py-3">Type Contrat</th>
                  <th className="px-5 py-3">Base / Taux Horaire</th>
                  <th className="px-5 py-3">Téléphone</th>
                  <th className="px-5 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(st => (
                  <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-gray-800">{st.name}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {st.role === "TEACHER" ? "Enseignant" : st.role === "SURVEILLANT" ? "Surveillant" : st.role === "SERVICE" ? "Agent de Service" : "Administration"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        st.contractType === "CDI" ? "bg-emerald-100 text-emerald-800" :
                        st.contractType === "CDD" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {st.contractType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-700">
                      {st.contractType === "VACATAIRE" ? `${st.hourlyRate?.toLocaleString()} FCFA / heure` : `${st.monthlyBaseSalary?.toLocaleString()} FCFA / mois`}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">{st.phone}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Actif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: POINTAGE & PRESENCE */}
      {activeSubTab === "PRESENCE" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Calendar size={16} className="text-indigo-600" />
              Registre des Pointages de Présence
            </h3>
            <span className="text-xs text-slate-500">Heures dispensées / effectives</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-[10px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Collaborateur</th>
                  <th className="px-5 py-3">Pointage</th>
                  <th className="px-5 py-3">Volume Horaire Effectué</th>
                  <th className="px-5 py-3">Observation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendances.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">Aucun pointage enregistré.</td>
                  </tr>
                ) : (
                  attendances.map(att => (
                    <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-600 whitespace-nowrap">
                        {new Date(att.date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-gray-800">{att.staffName}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          att.status === "PRESENT" ? "bg-emerald-100 text-emerald-800" :
                          att.status === "LATE" ? "bg-amber-100 text-amber-800" :
                          att.status === "EXCUSED" ? "bg-blue-100 text-blue-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {att.status === "PRESENT" ? "Présent" : att.status === "LATE" ? "Retard" : att.status === "EXCUSED" ? "Excusé" : "Absent"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-indigo-700">
                        {att.hoursWorked} h
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 italic">
                        {att.notes || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: PRE-PAIE RECAP */}
      {activeSubTab === "PAIE_PREP" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-600 w-4 h-4" />
                Fiche Récapitulative Mensuelle pour la Caisse & Direction
              </h3>
              <p className="text-[11px] text-slate-500">
                Calcul des heures cumulées pour les vacataires et bases contractuelles à transmettre à la caisse.
              </p>
            </div>
            <button 
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition"
            >
              Imprimer l'état
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-[10px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Employé / Enseignant</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Contrat</th>
                  <th className="px-4 py-3">Heures Effectuées (Mois)</th>
                  <th className="px-4 py-3">Taux ou Salaire Base</th>
                  <th className="px-4 py-3 text-right">Rémunération Estimée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map(st => {
                  const staffAtts = attendances.filter(a => a.staffId === st.id);
                  const totalHours = staffAtts.reduce((sum, a) => sum + (Number(a.hoursWorked) || 0), 0);
                  const estimatedPay = st.contractType === "VACATAIRE" 
                    ? totalHours * (st.hourlyRate || 0)
                    : (st.monthlyBaseSalary || 0);

                  return (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-gray-800">{st.name}</td>
                      <td className="px-4 py-3 text-slate-600">{st.role}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{st.contractType}</td>
                      <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                        {st.contractType === "VACATAIRE" ? `${totalHours} h` : "Forfaitaire"}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {st.contractType === "VACATAIRE" ? `${st.hourlyRate?.toLocaleString()} F/h` : `${st.monthlyBaseSalary?.toLocaleString()} F`}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-emerald-700">
                        {estimatedPay.toLocaleString()} FCFA
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add Staff */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-base text-gray-800">Nouveau Membre du Personnel</h3>
              <button onClick={() => setShowAddStaffModal(false)} className="text-slate-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleAddStaff} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Nom & Prénoms complets <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: M. KOUAME Yao"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Fonction / Rôle
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="TEACHER">Enseignant</option>
                    <option value="SURVEILLANT">Surveillant</option>
                    <option value="SERVICE">Agent de service</option>
                    <option value="ADMIN">Administration</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Contrat
                  </label>
                  <select
                    value={contractType}
                    onChange={e => setContractType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="VACATAIRE">Vacataire (à l'heure)</option>
                    <option value="CDI">CDI (salaire mensuel)</option>
                    <option value="CDD">CDD (salaire mensuel)</option>
                  </select>
                </div>
              </div>

              {contractType === "VACATAIRE" ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Taux Horaire (FCFA / heure)
                  </label>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={e => setHourlyRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Salaire de base mensuel (FCFA)
                  </label>
                  <input
                    type="number"
                    value={monthlyBaseSalary}
                    onChange={e => setMonthlyBaseSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Téléphone de contact
                </label>
                <input
                  type="text"
                  placeholder="+229 97 00 00 00"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Attendance */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-base text-gray-800">Pointer Présence / Heures du Personnel</h3>
              <button onClick={() => setShowAttendanceModal(false)} className="text-slate-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleAddAttendance} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Collaborateur <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedStaffId}
                  onChange={e => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Sélectionnez un employé...</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={attendDate}
                    onChange={e => setAttendDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Statut
                  </label>
                  <select
                    value={attendStatus}
                    onChange={e => setAttendStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PRESENT">Présent</option>
                    <option value="LATE">Retard</option>
                    <option value="ABSENT">Absent</option>
                    <option value="EXCUSED">Excusé / Congé</option>
                  </select>
                </div>
              </div>

              {attendStatus === "PRESENT" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Volume d'heures dispensées ou travaillées
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="16"
                    value={hoursWorked}
                    onChange={e => setHoursWorked(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-indigo-700"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Observations / Matière / Classe
                </label>
                <input
                  type="text"
                  placeholder="Ex: Cours d'Histoire 4ème B (2h) + Devoir surveillé (2h)"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAttendanceModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition"
                >
                  Valider Pointage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
