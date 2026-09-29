
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useToast } from "../lib/toast";
import { formatErrorMessage } from "../lib/errorHandler";
import { School, Building, Users, User, AlertCircle, Plus, Edit2, Trash2, Mail, X, CheckCircle, Search, Shield, Activity, DollarSign, GraduationCap, BarChart, Database, Copy, Check, AlertTriangle, ExternalLink } from "lucide-react";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function SuperAdminDashboard() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"DASHBOARD" | "SCHOOLS" | "USERS">("DASHBOARD");
  const [globalStats, setGlobalStats] = useState({ totalStudents: 0, totalPayments: 0, schoolStats: [] as any[] });
  const [schools, setSchools] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals state
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [schoolFormData, setSchoolFormData] = useState({ name: "", locality: "", contacts: "" });
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSchoolId, setInviteSchoolId] = useState<string>("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("SCHOOL_ADMIN");

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [profileRole, setProfileRole] = useState("");
  const [profileSchoolId, setProfileSchoolId] = useState<string | null>(null);

  // Database Reset Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const SQL_RESET_SCRIPT = `-- =========================================================================
-- SCRIPT DE RÉINITIALISATION COMPLÈTE DE LA BASE DE DONNÉES SUPABASE (EDU-BENIN)
-- À exécuter dans : Supabase Dashboard -> SQL Editor -> New Query -> Run
-- =========================================================================

-- 1. VIDER TOUTES LES TABLES DE DONNÉES DE L'APPLICATION (AVEC CASCADE)
TRUNCATE TABLE 
  public.payments,
  public.students,
  public.courses,
  public.timetables,
  public.grades,
  public.attendance,
  public.announcements,
  public.invitations,
  public.academic_years,
  public.fee_config,
  public.school_fees,
  public.profiles,
  public.schools
CASCADE;

-- 2. SUPPRIMER TOUS LES UTILISATEURS D'AUTHENTIFICATION SUPABASE (GOOGLE & EMAIL)
DELETE FROM auth.users;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_RESET_SCRIPT);
    setCopySuccess(true);
    toast.success("Script SQL copié dans le presse-papier !");
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const handleExecuteAppWipe = async () => {
    if (resetConfirmInput.trim().toUpperCase() !== "REINITIALISER") {
      toast.error("Veuillez saisir le mot REINITIALISER pour confirmer la suppression.");
      return;
    }

    setIsResetting(true);
    try {
      // Clear all public tables via API
      await Promise.allSettled([
        supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('invitations').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('announcements').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('academic_years').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('fee_config').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('schools').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      ]);

      // Clear all local storage caches
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('school_') || k.startsWith('mock_db_') || k.startsWith('schoolSettings_') || k === 'edubenin_active_school_id')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch (e) {}

      toast.success("Les données de l'application et les mémoires locales ont été vidées avec succès !");
      setShowResetModal(false);
      setResetConfirmInput("");
      fetchData();
    } catch (err: any) {
      toast.error(formatErrorMessage(err), "Erreur de réinitialisation");
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schoolsRes, profilesRes, studentsRes, paymentsRes] = await Promise.all([
        supabase.from('schools').select('*, profiles(id, email, role, full_name)').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*, schools(name)').order('created_at', { ascending: false }),
        supabase.from('students').select('id, school_id', { count: 'exact' }),
        supabase.from('payments').select('amount, school_id')
      ]);
      
      const totalStudents = studentsRes.data?.length || 0;
      const totalPayments = (paymentsRes.data || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
      
      // Calculate revenue per school for chart
      const revenueBySchool: Record<string, number> = {};
      (paymentsRes.data || []).forEach(p => {
         if (p.school_id) {
            revenueBySchool[p.school_id] = (revenueBySchool[p.school_id] || 0) + (p.amount || 0);
         }
      });
      const schoolStats = (schoolsRes.data || []).map(s => ({
         name: s.name,
         Revenue: revenueBySchool[s.id] || 0
      })).sort((a,b) => b.Revenue - a.Revenue).slice(0, 10);
      
      setGlobalStats({ totalStudents, totalPayments, schoolStats });
      
      if (schoolsRes.error) throw schoolsRes.error;
      if (profilesRes.error) throw profilesRes.error;
      
      setSchools(schoolsRes.data || []);
      setProfiles(profilesRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSchool) {
      const { error } = await supabase.from('schools').update(schoolFormData).eq('id', editingSchool.id);
      if (!error) {
        fetchData();
        setShowSchoolModal(false);
      }
    } else {
      const { error } = await supabase.from('schools').insert([schoolFormData]);
      if (!error) {
        fetchData();
        setShowSchoolModal(false);
        setSchoolFormData({ name: "", locality: "", contacts: "" });
      }
    }
  };

  const handleDeleteSchool = async (id: string, schoolName?: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'établissement "${schoolName || 'cet établissement'}" ?\n\nToutes les données associées (élèves, paiements, cours, invitations) seront nettoyées et les directeurs/membres devront reconfigurer leur école.`)) {
      return;
    }
    setLoading(true);
    try {
      // 1. Unlink all profiles associated with this school
      await supabase.from('profiles').update({ school_id: null }).eq('school_id', id);

      // 2. Delete related records
      await Promise.allSettled([
        supabase.from('students').delete().eq('school_id', id),
        supabase.from('courses').delete().eq('school_id', id),
        supabase.from('payments').delete().eq('school_id', id),
        supabase.from('invitations').delete().eq('school_id', id),
        supabase.from('announcements').delete().eq('school_id', id),
        supabase.from('academic_years').delete().eq('school_id', id),
        supabase.from('fee_config').delete().eq('school_id', id)
      ]);

      // 3. Delete the school itself
      const { error } = await supabase.from('schools').delete().eq('id', id);
      if (error) throw error;

      // 4. Clean local caches
      try {
        if (localStorage.getItem('edubenin_active_school_id') === id) {
          localStorage.removeItem('edubenin_active_school_id');
        }
        localStorage.removeItem(`schoolSettings_extra_${id}`);
        localStorage.removeItem(`school_custom_students_${id}`);
        localStorage.removeItem(`school_custom_teachers_${id}`);
        localStorage.removeItem(`school_courses_meta_${id}`);
      } catch (e) {}

      toast.success(`L'établissement "${schoolName || ''}" a été supprimé avec succès. Les directeurs associés pourront désormais reconfigurer leur école.`);
      fetchData();
    } catch (err: any) {
      toast.error(formatErrorMessage(err), "Erreur de suppression");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('invitations').insert([{
        school_id: inviteSchoolId,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole
      }]);
      if (error) throw error;
      toast.success("Invitation enregistrée pour " + inviteEmail);
      setShowInviteModal(false);
      setInviteEmail("");
    } catch (err: any) {
      toast.error(formatErrorMessage(err), "Erreur lors de l'invitation");
    }
  };

  const handleDeleteUser = async (userId: string, schoolId: string) => {
    if (window.confirm("Retirer cet utilisateur de l'établissement ?")) {
      try {
        const { error } = await supabase.from('profiles').update({ school_id: null, role: 'PARENT' }).eq('id', userId);
        if (error) throw error;
        toast.success("Utilisateur retiré de l'établissement avec succès.");
        fetchData();
      } catch (err: any) {
        toast.error(formatErrorMessage(err), "Erreur");
      }
    }
  };

  const handleSaveProfileRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    try {
      const { error } = await supabase.from('profiles').update({
        role: profileRole,
        school_id: profileSchoolId === "" ? null : profileSchoolId
      }).eq('id', editingProfile.id);
      
      if (error) throw error;
      toast.success("Profil mis à jour avec succès.");
      fetchData();
      setShowRoleModal(false);
    } catch (err: any) {
      toast.error(formatErrorMessage(err), "Erreur de mise à jour");
    }
  };

  const completelyDeleteProfile = async (id: string, userEmail?: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir SUPPRIMER DÉFINITIVEMENT le profil de ${userEmail || 'cet utilisateur'} ?`)) {
      try {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) throw error;

        if (userEmail) {
          await supabase.from('invitations').delete().eq('email', userEmail.toLowerCase());
        }

        toast.success("Profil utilisateur supprimé avec succès.");
        fetchData();
      } catch (err: any) {
        toast.error(formatErrorMessage(err), "Erreur lors de la suppression");
      }
    }
  };

  const filteredProfiles = profiles.filter(p => 
    (p.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Espace Super Admin</h1>
          <p className="text-slate-500 mt-1">Gérez tous les établissements et utilisateurs de la plateforme EduBénin.</p>
        </div>
        <button
          onClick={() => setShowResetModal(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-sm"
        >
          <Database size={15} /> Réinitialisation Base de Données
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab("SCHOOLS")}
          className={`px-4 py-2 font-bold text-sm tracking-wider uppercase transition-colors border-b-2 ${activeTab === "SCHOOLS" ? "border-emerald-600 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Établissements
        </button>
        <button 
          onClick={() => setActiveTab("USERS")}
          className={`px-4 py-2 font-bold text-sm tracking-wider uppercase transition-colors border-b-2 ${activeTab === "USERS" ? "border-emerald-600 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Utilisateurs
        </button>
      </div>

      {activeTab === "DASHBOARD" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Écoles</p>
                  <h3 className="text-2xl font-black text-gray-800 mt-1">{schools.length}</h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Building size={24}/></div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Utilisateurs</p>
                  <h3 className="text-2xl font-black text-gray-800 mt-1">{profiles.length}</h3>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Users size={24}/></div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Élèves Inscrits</p>
                  <h3 className="text-2xl font-black text-gray-800 mt-1">{globalStats.totalStudents}</h3>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><GraduationCap size={24}/></div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Volume Transactions</p>
                  <h3 className="text-2xl font-black text-gray-800 mt-1">{globalStats.totalPayments.toLocaleString()} F</h3>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><DollarSign size={24}/></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2"><BarChart className="text-emerald-600" /> Top Revenus par École</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={globalStats.schoolStats} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `${val / 1000}k`} />
                  <Tooltip 
                     cursor={{ fill: '#f8fafc' }} 
                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                     formatter={(value) => [`${Number(value).toLocaleString()} FCFA`, 'Revenus']}
                  />
                  <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === "SCHOOLS" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-gray-700 flex items-center gap-2"><Building size={18}/> Liste des Établissements</h3>
            <button 
              onClick={() => { setEditingSchool(null); setSchoolFormData({name: "", locality: "", contacts: ""}); setShowSchoolModal(true); }}
              className="flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 transition"
            >
              <Plus size={14} /> Ajouter un établissement
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Établissement</th>
                  <th className="px-6 py-3">Personnel & Admins</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">Chargement...</td></tr>
                ) : schools.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500 italic">Aucun établissement enregistré.</td></tr>
                ) : (
                  schools.map((school) => {
                    const staff = school.profiles || [];
                    return (
                      <tr key={school.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 align-top">
                          <div className="font-bold text-gray-800">{school.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-1 select-all">ID: {school.id}</div>
                          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1"><Mail size={12}/> {school.contacts || "Aucun contact"}</div>
                          {staff.find((p: any) => p.role === 'SCHOOL_ADMIN') && (
                            <div className="text-xs text-emerald-600 mt-1 font-semibold flex items-center gap-1">
                               <User size={12}/> Dir: {staff.find((p: any) => p.role === 'SCHOOL_ADMIN').full_name || "Non défini"}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-gray-600">{staff.length} membre(s)</span>
                            <button 
                              onClick={() => { setInviteSchoolId(school.id); setShowInviteModal(true); }}
                              className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold hover:bg-blue-100 flex items-center gap-1"
                            >
                              <Plus size={12}/> Inviter
                            </button>
                          </div>
                          {staff.length > 0 && (
                            <div className="flex flex-col gap-1.5 mt-2">
                              {staff.map((a: any) => (
                                <div key={a.id} className="flex justify-between items-center bg-white border border-slate-100 p-2 rounded text-xs">
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-gray-700">{a.full_name || "Sans nom"}</span>
                                    <span className="text-slate-500 text-[10px]">{a.email}</span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0 ml-2">
                                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                      a.role === 'SCHOOL_ADMIN' ? 'bg-purple-100 text-purple-700' :
                                      a.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' :
                                      'bg-slate-100 text-slate-600'
                                    }`}>{a.role.replace('_', ' ')}</span>
                                    <button onClick={() => handleDeleteUser(a.id, school.id)} className="text-slate-400 hover:text-red-600" title="Retirer">
                                      <X size={14}/>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 align-top text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => { setEditingSchool(school); setSchoolFormData({ name: school.name, locality: school.locality || "", contacts: school.contacts || "" }); setShowSchoolModal(true); }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded shadow-sm hover:border-blue-200"
                              title="Modifier l'établissement"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteSchool(school.id, school.name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 bg-white border border-slate-200 rounded shadow-sm hover:border-red-200"
                              title="Supprimer l'établissement"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "USERS" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50">
            <h3 className="font-bold text-gray-700 flex items-center gap-2"><Users size={18}/> Tous les Utilisateurs</h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Rechercher (nom, email)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Utilisateur</th>
                  <th className="px-6 py-3">Rôle</th>
                  <th className="px-6 py-3">Établissement</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Chargement...</td></tr>
                ) : filteredProfiles.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">Aucun utilisateur trouvé.</td></tr>
                ) : (
                  filteredProfiles.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 align-top">
                        <div className="font-bold text-gray-800">{p.full_name || "Sans nom"}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{p.email}</div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                          p.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-700' :
                          p.role === 'SCHOOL_ADMIN' ? 'bg-purple-100 text-purple-700' :
                          p.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' :
                          p.role === 'CASHIER' ? 'bg-emerald-100 text-emerald-700' :
                          p.role === 'SECRETARY' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>{p.role.replace('_', ' ')}</span>
                      </td>
                      <td className="px-6 py-4 align-top text-sm font-medium text-gray-700">
                        {p.schools?.name || <span className="text-slate-400 italic">Aucun</span>}
                      </td>
                      <td className="px-6 py-4 align-top text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setEditingProfile(p); setProfileRole(p.role); setProfileSchoolId(p.school_id || ""); setShowRoleModal(true); }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded shadow-sm hover:border-blue-200"
                            title="Modifier le rôle/établissement"
                          >
                            <Shield size={14} />
                          </button>
                          {p.role !== 'SUPER_ADMIN' && (
                            <button 
                              onClick={() => completelyDeleteProfile(p.id, p.email || p.full_name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 bg-white border border-slate-200 rounded shadow-sm hover:border-red-200"
                              title="Supprimer définitivement l'utilisateur"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
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

      {/* Modal Etablissement */}
      {showSchoolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 fade-in">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <Building size={18} className="text-emerald-600" />
                {editingSchool ? "Modifier l'établissement" : "Nouvel Établissement"}
              </h3>
              <button onClick={() => setShowSchoolModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveSchool} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Nom de l'établissement</label>
                <input required type="text" value={schoolFormData.name} onChange={e => setSchoolFormData({...schoolFormData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Localité / Ville</label>
                <input type="text" value={schoolFormData.locality} onChange={e => setSchoolFormData({...schoolFormData, locality: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Contacts (Tél / Email)</label>
                <input type="text" value={schoolFormData.contacts} onChange={e => setSchoolFormData({...schoolFormData, contacts: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowSchoolModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-gray-700 rounded font-semibold hover:bg-slate-50 transition-colors">Annuler</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded font-semibold hover:bg-emerald-700 transition-colors">
                  {editingSchool ? "Enregistrer" : "Créer l'établissement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Invitation */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 fade-in">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <Mail size={18} className="text-emerald-600" />
                Inviter un membre
              </h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleInviteUser} className="p-6 space-y-4">
              <div className="bg-blue-50 text-blue-800 p-3 rounded text-xs leading-relaxed">
                L'utilisateur devra se connecter avec cette adresse email pour être automatiquement rattaché à cet établissement.
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Adresse Email</label>
                <input required type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="exemple@gmail.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Rôle Attribué</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                  <option value="SCHOOL_ADMIN">Directeur (Administrateur)</option>
                  <option value="SECRETARY">Secrétaire</option>
                  <option value="CASHIER">Caissier(ère)</option>
                  <option value="TEACHER">Professeur</option>
                  <option value="PARENT">Parent</option>
                  <option value="DIRECTOR_OF_STUDIES">Directeur des Études</option>
                  <option value="SUPERVISOR">Surveillant</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-gray-700 rounded font-semibold hover:bg-slate-50 transition-colors">Annuler</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                  Inviter <CheckCircle size={16}/>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edition Role */}
      {showRoleModal && editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 fade-in">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <Shield size={18} className="text-emerald-600" />
                Modifier Utilisateur
              </h3>
              <button onClick={() => setShowRoleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProfileRole} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Utilisateur</label>
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="font-bold text-gray-800">{editingProfile.full_name}</div>
                  <div className="text-xs text-slate-500">{editingProfile.email}</div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Rôle</label>
                <select value={profileRole} onChange={e => setProfileRole(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                  <option value="PARENT">Parent</option>
                  <option value="TEACHER">Professeur</option>
                  <option value="SECRETARY">Secrétaire</option>
                  <option value="CASHIER">Caissier(ère)</option>
                  <option value="SCHOOL_ADMIN">Directeur (Admin École)</option>
                  <option value="SUPER_ADMIN">Super Admin (Accès total)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Établissement</label>
                <select value={profileSchoolId || ""} onChange={e => setProfileSchoolId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                  <option value="">Aucun établissement</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowRoleModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-gray-700 rounded font-semibold hover:bg-slate-50 transition-colors">Annuler</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Réinitialisation Complète de la Base de Données */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 max-h-[92vh] flex flex-col border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-red-100 bg-red-50 flex justify-between items-center text-red-900">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                  <Database size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-red-950">Réinitialisation de la Base de Données</h3>
                  <p className="text-xs text-red-700 mt-0.5">Procédure de remise à zéro totale pour Supabase et l'application</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowResetModal(false); setResetConfirmInput(""); }}
                className="text-red-400 hover:text-red-700 p-1 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Info banner */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong>Attention :</strong> Lorsque vous supprimez une école ou des membres dans l'application, les comptes d'authentification Google sont enregistrés dans la table interne sécurisée <code>auth.users</code> de Supabase. Pour que la connexion Google et le formulaire de configuration d'école soient entièrement redemandés, vous devez exécuter le script SQL ci-dessous dans votre console Supabase.
                </div>
              </div>

              {/* Step 1: SQL Script for Supabase (Primary Solution) */}
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                      Script SQL Officiel Supabase (Remise à Zéro Totale)
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Exécutez ce script dans votre tableau de bord Supabase pour vider toutes les tables et effacer les sessions Google.
                    </p>
                  </div>
                  <button
                    onClick={handleCopySql}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                  >
                    {copySuccess ? <Check size={14} /> : <Copy size={14} />}
                    {copySuccess ? "Copié !" : "Copier le script SQL"}
                  </button>
                </div>

                <div className="mt-3 relative">
                  <pre className="bg-slate-900 text-slate-200 p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-48 leading-relaxed border border-slate-800">
                    {SQL_RESET_SCRIPT}
                  </pre>
                </div>

                <div className="mt-3 text-xs text-slate-600 space-y-1 bg-white p-3 rounded-lg border border-slate-200">
                  <p className="font-semibold text-gray-700">Guide rapide d'exécution :</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600">
                    <li>Allez sur votre tableau de bord Supabase (<a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-600 underline font-medium inline-flex items-center gap-0.5">supabase.com/dashboard <ExternalLink size={10} /></a>).</li>
                    <li>Cliquez sur <strong>SQL Editor</strong> dans le menu de gauche.</li>
                    <li>Cliquez sur <strong>New query</strong>, collez le script ci-dessus et cliquez sur <strong>Run</strong>.</li>
                    <li>Tous les comptes Google, profils et données scolaires seront effacés. Le directeur qui se connectera sera invité à choisir son compte Google et à configurer son école de zéro !</li>
                  </ol>
                </div>
              </div>

              {/* Step 2: Instant App Data Wipe */}
              <div className="border border-red-200 rounded-xl p-5 bg-red-50/50">
                <h4 className="font-bold text-red-900 text-sm flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                  Vider les Données Applicatives & le Stockage Local
                </h4>
                <p className="text-xs text-red-700 mb-4">
                  Cette action supprime toutes les données des écoles, élèves, cours, paiements accessibles via l'application et vide le cache local du navigateur.
                </p>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-700">
                    Pour confirmer cette action irréversible, tapez <span className="font-mono bg-red-100 text-red-800 px-1 py-0.5 rounded">REINITIALISER</span> ci-dessous :
                  </label>
                  <input
                    type="text"
                    placeholder="Tapez REINITIALISER"
                    value={resetConfirmInput}
                    onChange={e => setResetConfirmInput(e.target.value)}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-red-500 outline-none uppercase"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowResetModal(false); setResetConfirmInput(""); }}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Fermer
                    </button>
                    <button
                      type="button"
                      disabled={resetConfirmInput.trim().toUpperCase() !== "REINITIALISER" || isResetting}
                      onClick={handleExecuteAppWipe}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center gap-2"
                    >
                      <Trash2 size={14} />
                      {isResetting ? "Suppression en cours..." : "Vider les Données Applicatives"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
