import React, { useState, useEffect } from "react";
import { Student, Payment, SchoolSettings, Announcement } from "../types";
import { Users, GraduationCap, ArrowUpRight, Search, Settings, Megaphone, Trash2, Edit, Mail, Plus } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { SchoolAdminAcademic } from "../components/SchoolAdminAcademic";
import { SchoolAdminFees } from "../components/SchoolAdminFees";

export function SchoolAdminDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [activeTab, setActiveTab] = useState<"DASHBOARD" | "MEMBERS" | "ANNOUNCEMENTS" | "SETTINGS" | "ACADEMIC" | "FEES">("DASHBOARD");

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
    fetchSchoolSettings();
    fetchAnnouncements();
    fetchInvitations();
  }, []);

  
  
  const fetchSchoolSettings = async () => {
    if (!user?.schoolId) return;
    const { data } = await supabase.from('schools').select('*').eq('id', user.schoolId).single();
    if (data) {
      let extra = {};
      try {
        const savedExtra = localStorage.getItem('schoolSettings_extra_' + user.schoolId);
        if (savedExtra) extra = JSON.parse(savedExtra);
      } catch (e) {}
      setSettings({
        name: data.name,
        address: data.locality,
        contact: data.contacts,
        motto: data.motto || "",
        logo: data.logo_url || "",
        academicYear: (extra as any).academicYear || "",
        enrollmentContractTemplate: (extra as any).enrollmentContractTemplate || ""
      } as any);
    }
  };


  const fetchAnnouncements = async () => {
    if (!user?.schoolId) return;
    const { data } = await supabase.from('announcements').select('*').eq('school_id', user.schoolId).order('created_at', { ascending: false });
    if (data) {
      setAnnouncements(data.map((d: any) => ({
        id: d.id,
        title: d.title,
        content: d.content,
        authorName: d.author_name,
        date: new Date(d.created_at).getTime()
      })));
    }
  };

  const fetchDashboardData = async () => {
    if (!user?.schoolId) return;
    
    try {
      const [studentsRes, paymentsRes] = await Promise.all([
        supabase.from('students').select('*').eq('school_id', user.schoolId),
        supabase.from('payments').select('*').eq('school_id', user.schoolId)
      ]);
      
      if (studentsRes.data) {
        setStudents(studentsRes.data.map(d => ({...d, createdAt: d.created_at, firstName: d.first_name, lastName: d.last_name})) as any);
      }
      if (paymentsRes.data) {
        setPayments(paymentsRes.data as any);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data from supabase", err);
    }
  };

  const fetchInvitations = async () => {
    if (!user?.schoolId) return;
    const { data } = await supabase.from('invitations').select('*').eq('school_id', user.schoolId).order('created_at', { ascending: false });
    if (data) setInvitations(data);
  };

  const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;
    setIsInviting(true);
    try {
      const { error } = await supabase.from('invitations').insert([{
        school_id: user.schoolId,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole
      }]);
      if (error) throw error;
      alert("Invitation créée avec succès ! L'utilisateur sera automatiquement associé lors de sa connexion avec Google.");
      setInviteEmail("");
      fetchInvitations();
    } catch (err: any) {
      console.error(err);
      alert(`Erreur: ${err.message}`);
    } finally {
      setIsInviting(false);
    }
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
    
    supabase.from('schools').update({
      name: updates.name,
      locality: updates.address,
      contacts: updates.contact,
      motto: updates.motto
      // logo_url: updates.logo (if it existed)
    }).eq('id', user?.schoolId).then(({ error }) => {
       if (error) {
         alert("Erreur: " + error.message);
       } else {
         localStorage.setItem('schoolSettings_extra_' + user.schoolId, JSON.stringify({
           academicYear: updates.academicYear,
           enrollmentContractTemplate: updates.enrollmentContractTemplate
         }));
         setSettings({ ...settings, ...updates });
         alert("Paramètres enregistrés avec succès.");
       }
    });

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

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('announcements').insert({
      school_id: user?.schoolId,
      title: announcementTitle,
      content: announcementContent,
      author_name: user?.name || "Administration"
    }).select().single();
    if (!error && data) {
      setAnnouncements(prev => [{
        id: data.id,
        title: data.title,
        content: data.content,
        authorName: data.author_name,
        date: new Date(data.created_at).getTime()
      }, ...prev]);
      setAnnouncementTitle("");
      setAnnouncementContent("");
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (!error) {
         setAnnouncements(prev => prev.filter(a => a.id !== id));
      }
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
            onClick={() => setActiveTab("MEMBERS")} 
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "MEMBERS" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Membres & Invitations
          </button>
          <button 
            onClick={() => setActiveTab("ACADEMIC")} 
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "ACADEMIC" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Années & Classes
          </button>
          <button 
            onClick={() => setActiveTab("FEES")} 
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "FEES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Frais de scolarité
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

      {activeTab === "MEMBERS" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Mail className="text-emerald-600" size={20} />
              Inviter un membre ou un parent
            </h2>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Google</label>
                <input 
                  type="email" 
                  required 
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="email@gmail.com"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select 
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="TEACHER">Professeur (Teacher)</option>
                  <option value="SECRETARY">Secrétaire (Secretary)</option>
                  <option value="CASHIER">Caissier(e) (Cashier)</option>
                  <option value="PARENT">Parent (Parent)</option>
                  <option value="DIRECTOR_OF_STUDIES">Directeur des Études</option>
                  <option value="SUPERVISOR">Surveillant</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={isInviting}
                className="w-full sm:w-auto px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 font-medium disabled:opacity-50"
              >
                {isInviting ? "En cours..." : <><Plus size={18} /> Inviter</>}
              </button>
            </form>
            <p className="text-sm text-slate-500 mt-4">
              L'utilisateur doit se connecter avec ce compte Google pour être automatiquement associé à votre établissement.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <h3 className="px-6 py-4 border-b border-gray-100 font-bold text-gray-700 bg-slate-50">Invitations en attente</h3>
            {invitations.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Aucune invitation en attente.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {invitations.map(inv => (
                  <li key={inv.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-medium text-gray-800">{inv.email}</p>
                      <p className="text-xs text-slate-500 mt-1">Rôle: <span className="font-semibold text-emerald-600">{inv.role}</span> | Créé le: {new Date(inv.created_at).toLocaleDateString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {activeTab === "SETTINGS" && settings && (
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
               <input name="name" defaultValue={settings?.name || ""} required type="text" className="w-full px-4 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
             </div>
             <div>
               <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Adresse complète</label>
               <input name="address" defaultValue={settings?.address || ""} required type="text" className="w-full px-4 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
             </div>
             <div>
               <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Contacts (Tél / Email)</label>
               <input name="contact" defaultValue={settings?.contact || ""} required type="text" className="w-full px-4 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
             </div>
             <div>
               <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Devise</label>
               <input name="motto" defaultValue={settings?.motto || ""} required type="text" className="w-full px-4 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
             </div>
             <div>
               <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Année académique en cours</label>
               <input name="academicYear" defaultValue={settings?.academicYear || ""} required type="text" className="w-full px-4 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
             </div>
             <div>
               <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Modèle de la fiche d'engagement</label>
               <textarea name="enrollmentContractTemplate" defaultValue={settings?.enrollmentContractTemplate || ""} rows={10} className="w-full px-4 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none" placeholder="Laissez vide pour utiliser le modèle par défaut..." />
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

      {activeTab === "ACADEMIC" && <SchoolAdminAcademic />}
      {activeTab === "FEES" && <SchoolAdminFees />}

    </div>
  );
}
