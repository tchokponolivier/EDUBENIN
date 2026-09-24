import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
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
  UserCheck,
  Edit2,
  Trash2,
  Phone,
  Mail,
  User
} from "lucide-react";

export interface StaffMember {
  id: string;
  name: string;
  email?: string;
  role: "TEACHER" | "ADMIN" | "SERVICE" | "SURVEILLANT" | "CASHIER" | "SECRETARY" | "OTHER";
  roleLabel?: string;
  contractType: "CDI" | "CDD" | "VACATAIRE";
  hourlyRate?: number;
  monthlyBaseSalary?: number;
  phone: string;
  cin?: string;
  status: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
  isRealProfile?: boolean;
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
  
  const localStaffMetaKey = `secretary_staff_meta_${user?.schoolId || "default"}`;
  const localDeletedStaffKey = `secretary_deleted_staff_${user?.schoolId || "default"}`;
  const localAttendKey = `secretary_staff_attend_${user?.schoolId || "default"}`;

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [attendances, setAttendances] = useState<StaffAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [filterContract, setFilterContract] = useState<string>("ALL");

  // New staff form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffMember["role"]>("TEACHER");
  const [contractType, setContractType] = useState<StaffMember["contractType"]>("VACATAIRE");
  const [hourlyRate, setHourlyRate] = useState<number>(3500);
  const [monthlyBaseSalary, setMonthlyBaseSalary] = useState<number>(150000);
  const [phone, setPhone] = useState("");

  // Edit staff form
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<StaffMember["role"]>("TEACHER");
  const [editContractType, setEditContractType] = useState<StaffMember["contractType"]>("VACATAIRE");
  const [editHourlyRate, setEditHourlyRate] = useState<number>(3500);
  const [editMonthlyBaseSalary, setEditMonthlyBaseSalary] = useState<number>(150000);
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState<StaffMember["status"]>("ACTIVE");

  // Attendance form
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [attendDate, setAttendDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendStatus, setAttendStatus] = useState<StaffAttendance["status"]>("PRESENT");
  const [hoursWorked, setHoursWorked] = useState<number>(4);
  const [notes, setNotes] = useState("");

  const fetchStaffData = async () => {
    if (!user?.schoolId) return;
    setLoading(true);

    try {
      // 1. Fetch real profiles from Supabase
      const [profilesRes, invitationsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("school_id", user.schoolId),
        supabase.from("invitations").select("*").eq("school_id", user.schoolId)
      ]);

      const realProfiles = profilesRes.data || [];
      const invitations = invitationsRes.data || [];

      // Read local custom meta & deletions
      let metaMap: Record<string, Partial<StaffMember>> = {};
      try {
        const raw = localStorage.getItem(localStaffMetaKey);
        if (raw) metaMap = JSON.parse(raw);
      } catch (e) {}

      let deletedSet: Set<string> = new Set();
      try {
        const raw = localStorage.getItem(localDeletedStaffKey);
        if (raw) deletedSet = new Set(JSON.parse(raw));
      } catch (e) {}

      // Map roles
      const formatRole = (rawRole: string): { role: StaffMember["role"]; label: string } => {
        const r = (rawRole || "").toUpperCase();
        if (r === "TEACHER") return { role: "TEACHER", label: "Enseignant" };
        if (r === "SCHOOL_ADMIN" || r === "SUPER_ADMIN") return { role: "ADMIN", label: "Directeur Général" };
        if (r === "DIRECTOR_OF_STUDIES") return { role: "ADMIN", label: "Directeur des Études" };
        if (r === "CASHIER" || r === "ACCOUNTANT") return { role: "CASHIER", label: "Comptable / Caissier" };
        if (r === "SECRETARY") return { role: "SECRETARY", label: "Secrétaire" };
        if (r === "SURVEILLANT") return { role: "SURVEILLANT", label: "Surveillant Général" };
        if (r === "SERVICE") return { role: "SERVICE", label: "Agent de Service" };
        return { role: "OTHER", label: rawRole || "Personnel" };
      };

      const members: StaffMember[] = [];
      const seenIds = new Set<string>();

      // A. Real profiles
      for (const p of realProfiles) {
        if (deletedSet.has(p.id)) continue;
        const roleInfo = formatRole(p.role);
        const meta = metaMap[p.id] || {};

        members.push({
          id: p.id,
          name: meta.name || p.full_name || p.email?.split("@")[0] || "Membre",
          email: meta.email || p.email || "",
          role: (meta.role || roleInfo.role) as any,
          roleLabel: meta.role ? (meta.role === "TEACHER" ? "Enseignant" : meta.role === "ADMIN" ? "Direction / Admin" : meta.role === "CASHIER" ? "Comptable / Caissier" : meta.role === "SURVEILLANT" ? "Surveillant" : meta.role === "SERVICE" ? "Agent de Service" : "Personnel") : roleInfo.label,
          contractType: meta.contractType || (roleInfo.role === "TEACHER" ? "VACATAIRE" : "CDI"),
          hourlyRate: meta.hourlyRate !== undefined ? meta.hourlyRate : 3500,
          monthlyBaseSalary: meta.monthlyBaseSalary !== undefined ? meta.monthlyBaseSalary : (roleInfo.role === "TEACHER" ? 120000 : 180000),
          phone: meta.phone || p.phone || "",
          status: meta.status || "ACTIVE",
          isRealProfile: true
        });
        seenIds.add(p.id);
      }

      // B. Real pending invitations (if not already converted)
      for (const inv of invitations) {
        const invId = `inv_${inv.id}`;
        if (deletedSet.has(invId)) continue;
        const roleInfo = formatRole(inv.role);
        const meta = metaMap[invId] || {};

        members.push({
          id: invId,
          name: meta.name || (inv.email ? inv.email.split("@")[0].toUpperCase() : "Invité"),
          email: meta.email || inv.email || "",
          role: (meta.role || roleInfo.role) as any,
          roleLabel: `${roleInfo.label} (Invité)`,
          contractType: meta.contractType || "VACATAIRE",
          hourlyRate: meta.hourlyRate !== undefined ? meta.hourlyRate : 3500,
          monthlyBaseSalary: meta.monthlyBaseSalary !== undefined ? meta.monthlyBaseSalary : 140000,
          phone: meta.phone || "",
          status: meta.status || "ACTIVE",
          isRealProfile: false
        });
        seenIds.add(invId);
      }

      // C. Extra custom staff added through UI
      for (const [key, val] of Object.entries(metaMap)) {
        if (!seenIds.has(key) && !deletedSet.has(key) && key.startsWith("custom_")) {
          members.push({
            id: key,
            name: val.name || "Personnel",
            email: val.email || "",
            role: val.role || "OTHER",
            roleLabel: val.role === "TEACHER" ? "Enseignant" : val.role === "SURVEILLANT" ? "Surveillant" : val.role === "SERVICE" ? "Agent de Service" : "Administration",
            contractType: val.contractType || "CDD",
            hourlyRate: val.hourlyRate || 3500,
            monthlyBaseSalary: val.monthlyBaseSalary || 120000,
            phone: val.phone || "",
            status: val.status || "ACTIVE",
            isRealProfile: false
          });
        }
      }

      setStaffList(members);

      // Fetch attendances
      const storedAttend = localStorage.getItem(localAttendKey);
      if (storedAttend) {
        setAttendances(JSON.parse(storedAttend));
      }
    } catch (err) {
      console.error("Error loading real staff data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [user?.schoolId]);

  const saveAttendances = (items: StaffAttendance[]) => {
    setAttendances(items);
    localStorage.setItem(localAttendKey, JSON.stringify(items));
  };

  const handleOpenEditModal = (st: StaffMember) => {
    setEditingStaff(st);
    setEditName(st.name);
    setEditEmail(st.email || "");
    setEditRole(st.role);
    setEditContractType(st.contractType);
    setEditHourlyRate(st.hourlyRate || 3500);
    setEditMonthlyBaseSalary(st.monthlyBaseSalary || 150000);
    setEditPhone(st.phone || "");
    setEditStatus(st.status || "ACTIVE");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !user?.schoolId) return;

    try {
      // 1. Update in local storage meta map
      let metaMap: Record<string, Partial<StaffMember>> = {};
      try {
        const raw = localStorage.getItem(localStaffMetaKey);
        if (raw) metaMap = JSON.parse(raw);
      } catch (err) {}

      metaMap[editingStaff.id] = {
        name: editName.trim(),
        email: editEmail.trim(),
        role: editRole,
        contractType: editContractType,
        hourlyRate: editContractType === "VACATAIRE" ? editHourlyRate : undefined,
        monthlyBaseSalary: editContractType !== "VACATAIRE" ? editMonthlyBaseSalary : undefined,
        phone: editPhone.trim(),
        status: editStatus
      };

      localStorage.setItem(localStaffMetaKey, JSON.stringify(metaMap));

      // 2. If it's a real profile in Supabase, update full_name and phone directly in Supabase
      if (editingStaff.isRealProfile && !editingStaff.id.startsWith("inv_") && !editingStaff.id.startsWith("custom_")) {
        await supabase.from("profiles").update({
          full_name: editName.trim(),
          phone: editPhone.trim()
        }).eq("id", editingStaff.id);
      }

      setEditingStaff(null);
      await fetchStaffData();
    } catch (err: any) {
      alert("Erreur lors de la mise à jour: " + err.message);
    }
  };

  const handleDeleteStaff = async (st: StaffMember) => {
    if (!window.confirm(`Confirmez-vous la suppression de ${st.name} du personnel ?`)) return;

    try {
      let deletedSet: Set<string> = new Set();
      try {
        const raw = localStorage.getItem(localDeletedStaffKey);
        if (raw) deletedSet = new Set(JSON.parse(raw));
      } catch (err) {}

      deletedSet.add(st.id);
      localStorage.setItem(localDeletedStaffKey, JSON.stringify(Array.from(deletedSet)));

      // If it's an invitation, delete from Supabase if possible
      if (st.id.startsWith("inv_")) {
        const invId = st.id.replace("inv_", "");
        await supabase.from("invitations").delete().eq("id", invId);
      }

      await fetchStaffData();
    } catch (err: any) {
      alert("Erreur lors de la suppression: " + err.message);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;

    try {
      const customId = `custom_${Date.now()}`;
      
      let metaMap: Record<string, Partial<StaffMember>> = {};
      try {
        const raw = localStorage.getItem(localStaffMetaKey);
        if (raw) metaMap = JSON.parse(raw);
      } catch (err) {}

      metaMap[customId] = {
        name: name.trim(),
        email: email.trim(),
        role,
        contractType,
        hourlyRate: contractType === "VACATAIRE" ? hourlyRate : undefined,
        monthlyBaseSalary: contractType !== "VACATAIRE" ? monthlyBaseSalary : undefined,
        phone: phone.trim(),
        status: "ACTIVE"
      };

      localStorage.setItem(localStaffMetaKey, JSON.stringify(metaMap));

      setShowAddStaffModal(false);
      setName("");
      setEmail("");
      setPhone("");
      await fetchStaffData();
    } catch (err: any) {
      alert("Erreur lors de l'ajout: " + err.message);
    }
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

  const filteredStaff = staffList.filter(s => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchEmail = s.email?.toLowerCase().includes(q);
      const matchPhone = s.phone?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }
    if (filterRole !== "ALL" && s.role !== filterRole) return false;
    if (filterContract !== "ALL" && s.contractType !== filterContract) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <Briefcase size={12} /> Personnel Réel & Équipe Scolaire
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
              Synchronisé avec les comptes réels
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Personnel, RH, Pointage & Prépa Paie</h2>
          <p className="text-xs text-slate-500">
            Gestion du personnel effectif de l'école (enseignants, administration, surveillance, services), contrats et paies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === "PERSONNEL" && (
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition"
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
            activeSubTab === "PERSONNEL" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Annuaire du Personnel Réel ({staffList.length})
        </button>

        <button
          onClick={() => setActiveSubTab("PRESENCE")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition ${
            activeSubTab === "PRESENCE" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Pointage & Présences Journalières
        </button>

        <button
          onClick={() => setActiveSubTab("PAIE_PREP")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition ${
            activeSubTab === "PAIE_PREP" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          État Récapitulatif Pré-Paie
        </button>
      </div>

      {/* SUBTAB 1: ANNUAIRE PERSONNEL */}
      {activeSubTab === "PERSONNEL" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4">
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email ou téléphone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white outline-none"
              >
                <option value="ALL">Toutes les fonctions</option>
                <option value="TEACHER">Enseignants</option>
                <option value="ADMIN">Direction & Administration</option>
                <option value="CASHIER">Comptabilité & Caisse</option>
                <option value="SECRETARY">Secrétariat</option>
                <option value="SURVEILLANT">Surveillants</option>
                <option value="SERVICE">Agents de Service</option>
                <option value="OTHER">Autres</option>
              </select>

              <select
                value={filterContract}
                onChange={e => setFilterContract(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white outline-none"
              >
                <option value="ALL">Tous les contrats</option>
                <option value="VACATAIRE">Vacataires</option>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
              </select>

              <span className="text-xs text-slate-400 font-semibold ml-2">
                {filteredStaff.length} membre{filteredStaff.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-[10px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Nom & Coordonnées</th>
                  <th className="px-4 py-3">Fonction / Rôle</th>
                  <th className="px-4 py-3">Type Contrat</th>
                  <th className="px-4 py-3">Base / Taux Horaire</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      Chargement des membres réels du personnel...
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      Aucun membre du personnel trouvé avec ces critères.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map(st => (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                            {st.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-gray-800 block text-xs">{st.name}</span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              {st.email && <span className="flex items-center gap-1"><Mail size={11} /> {st.email}</span>}
                              {st.phone && <span className="flex items-center gap-1"><Phone size={11} /> {st.phone}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          st.role === "TEACHER" ? "bg-emerald-100 text-emerald-800" :
                          st.role === "ADMIN" ? "bg-indigo-100 text-indigo-800" :
                          st.role === "CASHIER" ? "bg-purple-100 text-purple-800" :
                          st.role === "SURVEILLANT" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                        }`}>
                          {st.roleLabel || st.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          st.contractType === "CDI" ? "bg-emerald-100 text-emerald-800" :
                          st.contractType === "CDD" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {st.contractType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-700">
                        {st.contractType === "VACATAIRE" 
                          ? `${Number(st.hourlyRate || 3500).toLocaleString()} FCFA / heure` 
                          : `${Number(st.monthlyBaseSalary || 150000).toLocaleString()} FCFA / mois`}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          st.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          st.status === "ON_LEAVE" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {st.status === "ACTIVE" ? "Actif" : st.status === "ON_LEAVE" ? "En congé" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(st)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Modifier les informations"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(st)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Supprimer du personnel"
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
      )}

      {/* SUBTAB 2: POINTAGE & PRESENCE */}
      {activeSubTab === "PRESENCE" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Calendar size={16} className="text-emerald-600" />
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
                      <td className="px-5 py-3.5 font-mono font-bold text-emerald-700">
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
                  <th className="px-4 py-3">Fonction</th>
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
                    ? totalHours * (st.hourlyRate || 3500)
                    : (st.monthlyBaseSalary || 150000);

                  return (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-gray-800">{st.name}</td>
                      <td className="px-4 py-3 text-slate-600">{st.roleLabel || st.role}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{st.contractType}</td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-700">
                        {st.contractType === "VACATAIRE" ? `${totalHours} h` : "Forfaitaire"}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {st.contractType === "VACATAIRE" ? `${(st.hourlyRate || 3500).toLocaleString()} F/h` : `${(st.monthlyBaseSalary || 150000).toLocaleString()} F`}
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

      {/* Modal Edit Staff */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-base text-gray-800">Modifier le Collaborateur</h3>
              <button onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Nom & Prénoms complets <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder="+229..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    placeholder="email@..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Fonction / Rôle
                  </label>
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="TEACHER">Enseignant</option>
                    <option value="ADMIN">Direction & Admin</option>
                    <option value="CASHIER">Comptabilité / Caisse</option>
                    <option value="SECRETARY">Secrétariat</option>
                    <option value="SURVEILLANT">Surveillant</option>
                    <option value="SERVICE">Agent de service</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Type Contrat
                  </label>
                  <select
                    value={editContractType}
                    onChange={e => setEditContractType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="VACATAIRE">Vacataire (au taux horaire)</option>
                    <option value="CDI">CDI (salaire fixe)</option>
                    <option value="CDD">CDD (salaire fixe)</option>
                  </select>
                </div>
              </div>

              {editContractType === "VACATAIRE" ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Taux Horaire (FCFA / heure)
                  </label>
                  <input
                    type="number"
                    value={editHourlyRate}
                    onChange={e => setEditHourlyRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Salaire de base mensuel (FCFA)
                  </label>
                  <input
                    type="number"
                    value={editMonthlyBaseSalary}
                    onChange={e => setEditMonthlyBaseSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Statut d'activité
                </label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ACTIVE">Actif</option>
                  <option value="ON_LEAVE">En congé / Absent</option>
                  <option value="INACTIVE">Inactif / Fin de contrat</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition"
                >
                  Enregistrer Modifications
                </button>
              </div>
            </form>
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    placeholder="+229..."
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="email@..."
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Fonction / Rôle
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="TEACHER">Enseignant</option>
                    <option value="ADMIN">Direction & Administration</option>
                    <option value="CASHIER">Comptable / Caisse</option>
                    <option value="SECRETARY">Secrétariat</option>
                    <option value="SURVEILLANT">Surveillant</option>
                    <option value="SERVICE">Agent de service</option>
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition"
                >
                  Ajouter au Personnel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Attendance */}
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
                  <option value="">-- Choisir un collaborateur --</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.roleLabel || s.role})
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
                    <option value="LATE">En retard</option>
                    <option value="EXCUSED">Excusé</option>
                    <option value="ABSENT">Absent</option>
                  </select>
                </div>
              </div>

              {attendStatus === "PRESENT" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Nombre d'heures dispensées / travaillées
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={hoursWorked}
                    onChange={e => setHoursWorked(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Observations / Motif
                </label>
                <input
                  type="text"
                  placeholder="Ex: Cours de SVT 4ème A; ou Justificatif médical..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
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
                  Enregistrer Pointage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
