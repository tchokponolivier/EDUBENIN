import React, { useState, useEffect } from "react";
import { db } from "../lib/db";
import { Student, Payment, SchoolSettings, Announcement } from "../types";
import { Users, GraduationCap, ArrowUpRight, Search, Settings, Megaphone, Trash2, Edit, Mail, Plus, Calendar, DollarSign, FileText, Download } from "lucide-react";

import { useAuth } from "../lib/auth";

export function SchoolAdminDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [activeTab, setActiveTab] = useState<"DASHBOARD" | "ACADEMIC_YEARS" | "FEES" | "MEMBERS" | "ANNOUNCEMENTS" | "SETTINGS">("DASHBOARD");
  const [members, setMembers] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);

  // Invitations state
  const [invitations, setInvitations] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("TEACHER");
  const [isInviting, setIsInviting] = useState(false);

  // Announcement Form State
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [logoBase64, setLogoBase64] = useState("");

  useEffect(() => {
    fetchDashboardData();
    setSettings(db.getSchoolSettings());
    setAnnouncements(db.getAnnouncements());
    fetchInvitations();
    fetchMembers();
    fetchAcademicYears();
    fetchFees();
  }, []);

  
  const fetchDashboardData = async () => {
    if (!user?.schoolId) return;
    try {
      const loadedStudents = db.getStudents({ schoolId: user.schoolId });
      const loadedPayments = db.getPayments({ schoolId: user.schoolId });
      setStudents(loadedStudents);
      setPayments(loadedPayments);
    } catch (err) {
      console.error("Local DB fetch failed", err);
    }
  };

  

  
  const fetchMembers = async () => {
    setMembers([
      { id: '1', email: 'director@school.com', name: 'Directeur', role: 'SCHOOL_ADMIN', status: 'ACTIVE' },
      { id: '2', email: 'sec@school.com', name: 'Secrétaire', role: 'SECRETARY', status: 'ACTIVE' }
    ]);
  };
  
  const fetchAcademicYears = async () => {
    setAcademicYears([
      { id: '1', name: '2025-2026', start_date: '2025-09-01', end_date: '2026-06-30', is_active: true },
      { id: '2', name: '2024-2025', start_date: '2024-09-01', end_date: '2025-06-30', is_active: false }
    ]);
  };
  
  const fetchFees = async () => {
    setFees([
      { id: '1', level: '6ème', fee_type: 'Scolarité', name: 'Tranche 1', amount: 35000 },
      { id: '2', level: 'Terminale', fee_type: 'Scolarité', name: 'Tranche 1', amount: 45000 }
    ]);
  };

  const fetchInvitations = async () => {
    setInvitations([]);
  };

  const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);

  
  const [newYear, setNewYear] = useState("");
  const [newYearStart, setNewYearStart] = useState("");
  const [newYearEnd, setNewYearEnd] = useState("");
  const [newFeeLevel, setNewFeeLevel] = useState("6ème");
  const [newFeeType, setNewFeeType] = useState("Scolarité");
  const [newFeeAmount, setNewFeeAmount] = useState("");
  const [newFeeName, setNewFeeName] = useState("");
  
  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    alert("Année ajoutée (Mock)");
    setNewYear(""); setNewYearStart(""); setNewYearEnd("");
  };
  

  const handleToggleYear = async (id: string, currentStatus: boolean) => {
    alert("Basculée (Mock)");
  };

  
  const handleAddFee = async (e: React.FormEvent) => {
    e.preventDefault();
    alert("Frais ajoutés (Mock)");
    setNewFeeName(""); setNewFeeAmount("");
  };
  
  const handleMemberStatus = async (id: string, currentStatus: string) => {
    alert("Statut changé (Mock)");
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    alert("Invitation envoyée (Mock)");
    setInviteEmail("");
  };

  const handleSettingsSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!settings) return;
    const formData = new FormData(e.currentTarget);
    const updates = {
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      contact: formData.get("contact") as string,
      motto: formData.get("motto") as string,
      academicYear: formData.get("academicYear") as string,
      enrollmentContractTemplate: formData.get("enrollmentContractTemplate") as string,
      logo: logoBase64 || settings.logo,
    };
    db.updateSchoolSettings(updates);
    setSettings({ ...settings, ...updates });
    alert("Paramètres enregistrés avec succès.");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    const newAnnouncement = db.addAnnouncement({
      title: announcementTitle,
      content: announcementContent,
      authorName: user?.name || "Administration"
    });
    setAnnouncements(prev => [newAnnouncement, ...prev]);
    setAnnouncementTitle("");
    setAnnouncementContent("");
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
      db.deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-700">Administration Ecole</h1>
          <p className="text-xs text-slate-500 mt-1">Supervisez l'évolution des inscriptions et paramètres</p>
        </div>
        <div className="flex p-1 bg-slate-100 rounded-lg shrink-0 overflow-x-auto max-w-full">
          
          <button 
            onClick={() => setActiveTab("DASHBOARD")} 
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "DASHBOARD" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Vue d'ensemble
          </button>
          <button 
            onClick={() => setActiveTab("ACADEMIC_YEARS")} 
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "ACADEMIC_YEARS" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Années Scolaires
          </button>
          <button 
            onClick={() => setActiveTab("FEES")} 
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "FEES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Frais & Scolarité
          </button>
          <button 
            onClick={() => setActiveTab("MEMBERS")} 
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "MEMBERS" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Membres & Personnel
          </button>
          <button 
            onClick={() => setActiveTab("ANNOUNCEMENTS")} 
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "ANNOUNCEMENTS" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            <span className="flex items-center gap-2"><Megaphone size={14} /> Annonces</span>
          </button>
          <button 
            onClick={() => setActiveTab("SETTINGS")} 
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "SETTINGS" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            <span className="flex items-center gap-2"><Settings size={14} /> Paramètres</span>
          </button>
        </div>
      </div>

      {activeTab === "DASHBOARD" && (
        <>
          {/* Stat Cards - Dense Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-medium uppercase mb-2">Élèves Inscrits</div>
              <div className="text-3xl font-bold text-gray-700">{students.length}</div>
              <div className="mt-2 text-emerald-600 text-xs font-semibold">Total inscrits</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-medium uppercase mb-2">Recettes (FCFA)</div>
              <div className="text-3xl font-bold text-gray-700">{totalRevenue.toLocaleString()} FCFA</div>
              <div className="mt-2 text-slate-400 text-xs">Total cumulé</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-medium uppercase mb-2">Classes Actives</div>
              <div className="text-3xl font-bold text-gray-700">14</div>
              <div className="mt-2 text-slate-400 text-xs">Maternelle à Terminale</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-medium uppercase mb-2">Taux d'Inscriptions</div>
              <div className="text-3xl font-bold text-gray-700">84.2%</div>
              <div className="mt-2 text-blue-600 text-xs font-semibold">Taux de croissance</div>
            </div>
          </div>

          {/* Recents Students Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <h3 className="font-bold text-gray-700">Inscriptions Récentes</h3>
              <div className="relative">
                 <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                 <input 
                   type="text" 
                   placeholder="Rechercher..." 
                   className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                 />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold">
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3">Nom de l'élève</th>
                    <th className="px-4 py-3">Niveau / Classe</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-500 text-xs">
                        Aucun élève inscrit pour le moment.
                      </td>
                    </tr>
                  ) : (
                    students.slice(0, 5).map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-xs text-gray-700">
                          {student.firstName} {student.lastName}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{student.level}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      
      {activeTab === "ACADEMIC_YEARS" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Calendar className="text-emerald-600" size={20} />
              Nouvelle Année Scolaire
            </h2>
            <form onSubmit={handleAddYear} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom (ex: 2025-2026)</label>
                <input required type="text" value={newYear} onChange={e => setNewYear(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Début</label>
                <input required type="date" value={newYearStart} onChange={e => setNewYearStart(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
                <input required type="date" value={newYearEnd} onChange={e => setNewYearEnd(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-medium">
                <Plus size={18} /> Créer
              </button>
            </form>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <h3 className="px-6 py-4 border-b border-gray-100 font-bold text-gray-700 bg-slate-50">Années Scolaires</h3>
            <ul className="divide-y divide-gray-100">
              {academicYears.map(year => (
                <li key={year.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-bold text-gray-800">{year.name}</p>
                    <p className="text-xs text-slate-500 mt-1">Du {year.start_date} au {year.end_date}</p>
                  </div>
                  <div>
                    
                    <button onClick={() => handleToggleYear(year.id, year.is_active)} className={`px-4 py-1.5 rounded-full text-xs font-bold ${year.is_active ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                      {year.is_active ? 'Clôturer & Basculer Effectifs' : 'Activer'}
                    </button>
                  </div>
                </li>
              ))}
              {academicYears.length === 0 && <li className="p-6 text-center text-slate-500">Aucune année configurée</li>}
            </ul>
          </div>
        </div>
      )}
      {activeTab === "FEES" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
              <DollarSign className="text-emerald-600" size={20} />
              Configurer un Tarif
            </h2>
            <form onSubmit={handleAddFee} className="flex flex-col sm:flex-row gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Classe / Niveau</label>
                <select value={newFeeLevel} onChange={e => setNewFeeLevel(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                  <option value="Toutes">Toutes</option>
                  <option value="6ème">6ème</option>
                  <option value="5ème">5ème</option>
                  <option value="4ème">4ème</option>
                  <option value="3ème">3ème</option>
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de frais</label>
                <select value={newFeeType} onChange={e => setNewFeeType(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                  <option value="Inscription">Inscription</option>
                  <option value="Scolarité">Mensualité / Tranche</option>
                  <option value="Cantine">Cantine</option>
                  <option value="Transport">Transport</option>
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Libellé</label>
                <input required type="text" value={newFeeName} onChange={e => setNewFeeName(e.target.value)} placeholder="Ex: Tranche 1" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
                <input required type="number" value={newFeeAmount} onChange={e => setNewFeeAmount(e.target.value)} placeholder="0" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-medium">
                <Plus size={18} /> Ajouter
              </button>
            </form>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <h3 className="px-6 py-4 border-b border-gray-100 font-bold text-gray-700 bg-slate-50">Grille Tarifaire</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Niveau</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Libellé</th>
                    <th className="px-6 py-3">Montant (FCFA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fees.map(fee => (
                    <tr key={fee.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium">{fee.level}</td>
                      <td className="px-6 py-3">{fee.fee_type}</td>
                      <td className="px-6 py-3 text-slate-600">{fee.name}</td>
                      <td className="px-6 py-3 font-bold text-gray-800">{fee.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {fees.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-slate-500">Aucun tarif défini</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {activeTab === "MEMBERS" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Mail className="text-emerald-600" size={20} />
              Inviter un membre du personnel
            </h2>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Google</label>
                <input type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="email@gmail.com" />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="TEACHER">Professeur</option>
                  <option value="SECRETARY">Secrétaire</option>
                  <option value="CASHIER">Caissier(e)</option>
                </select>
              </div>
              <button type="submit" disabled={isInviting} className="w-full sm:w-auto px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 font-medium disabled:opacity-50">
                {isInviting ? "En cours..." : <><Plus size={18} /> Inviter</>}
              </button>
            </form>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <h3 className="px-6 py-4 border-b border-gray-100 font-bold text-gray-700 bg-slate-50 flex justify-between items-center">
              Personnel Actif
            </h3>
            <ul className="divide-y divide-gray-100">
              {members.map(member => (
                <li key={member.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-bold text-gray-800">{member.full_name || member.email}</p>
                    <p className="text-xs text-slate-500 mt-1">Rôle: <span className="font-semibold text-blue-600">{member.role}</span> | Statut: <span className={member.status === 'SUSPENDED' ? 'text-red-500' : 'text-emerald-500'}>{member.status || 'ACTIVE'}</span></p>
                  </div>
                  <div>
                    <button onClick={() => handleMemberStatus(member.id, member.status)} className={`px-4 py-1.5 rounded-full text-xs font-bold ${member.status === 'SUSPENDED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {member.status === 'SUSPENDED' ? 'Réactiver' : 'Suspendre'}
                    </button>
                  </div>
                </li>
              ))}
              {members.length === 0 && <li className="p-6 text-center text-slate-500">Aucun membre trouvé</li>}
            </ul>
          </div>
        </div>
      )}{activeTab === "SETTINGS" && settings && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-2xl">
           <h3 className="font-bold text-gray-700 mb-6 pb-2 border-b border-slate-100">En-tête des Bulletins & Documents</h3>
           <form onSubmit={handleSettingsSave} className="space-y-4">
             <div>
               <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Logo de l'établissement</label>
               <div className="flex items-center gap-4">
                 {(logoBase64 || settings.logo) && (
                   <img src={logoBase64 || settings.logo} alt="Logo" className="w-16 h-16 object-contain rounded border border-slate-200" />
                 )}
                 <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-gray-700 hover:file:bg-emerald-100 outline-none" />
               </div>
             </div>
             <div>
               <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Nom de l'établissement</label>
               <input name="name" defaultValue={settings.name} required type="text" className="w-full px-4 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
             </div>
             <div>
               <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Adresse complète</label>
               <input name="address" defaultValue={settings.address} required type="text" className="w-full px-4 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
             </div>
             <div>
               <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Contacts (Tél / Email)</label>
               <input name="contact" defaultValue={settings.contact} required type="text" className="w-full px-4 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
             </div>
             <div>
               <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Devise</label>
               <input name="motto" defaultValue={settings.motto} required type="text" className="w-full px-4 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
             </div>
             <div>
               <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Année académique en cours</label>
               <input name="academicYear" defaultValue={settings.academicYear} required type="text" className="w-full px-4 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
             </div>
             <div>
               <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Modèle de la fiche d'engagement</label>
               <textarea name="enrollmentContractTemplate" defaultValue={settings.enrollmentContractTemplate || ""} rows={10} className="w-full px-4 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none" placeholder="Laissez vide pour utiliser le modèle par défaut..." />
               <p className="text-[10px] text-slate-500 mt-1">Utilisez les variables: {'{ecole_nom}'}, {'{directeur_nom}'}, {'{parent_nom}'}, {'{parent_profession}'}, {'{parent_telephone}'}, {'{parent_adresse}'}, {'{eleve_nom}'}, {'{eleve_classe}'}, {'{frais_scolarite}'}</p>
             </div>
             <div className="pt-4 mt-4 border-t border-slate-100">
               <button type="submit" className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded shadow-sm uppercase tracking-wider transition-colors">
                 Enregistrer les paramètres
               </button>
             </div>
           </form>
        </div>
      )}

      {activeTab === "ANNOUNCEMENTS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
            <h3 className="font-bold text-gray-700 mb-5 border-b border-slate-100 pb-2">Publier une annonce</h3>
            <form onSubmit={handleAddAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Titre de l'annonce</label>
                <input 
                  required
                  value={announcementTitle}
                  onChange={e => setAnnouncementTitle(e.target.value)}
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Contenu</label>
                <textarea 
                  required
                  value={announcementContent}
                  onChange={e => setAnnouncementContent(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none" 
                />
              </div>
              <button type="submit" className="w-full px-4 py-2 bg-emerald-600 text-white rounded text-sm font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors">
                Publier
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-gray-700">Annonces récentes</h3>
            {announcements.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
                <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Aucune annonce publiée pour le moment.</p>
              </div>
            ) : (
              announcements.map(announcement => (
                <div key={announcement.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                      <h4 className="font-bold text-lg text-gray-700">{announcement.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Publié le {new Date(announcement.date).toLocaleDateString()} par {announcement.authorName}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {announcement.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
