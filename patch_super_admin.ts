import fs from 'fs';
const content = `
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { School, Building, Users, AlertCircle, Plus, Edit2, Trash2, Mail, X, CheckCircle, Search, Shield } from "lucide-react";

export function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<"SCHOOLS" | "USERS">("SCHOOLS");
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schoolsRes, profilesRes] = await Promise.all([
        supabase.from('schools').select('*, profiles(id, email, role, full_name)').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*, schools(name)').order('created_at', { ascending: false })
      ]);
      
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

  const handleDeleteSchool = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet établissement ? Cette action est irréversible et supprimera toutes les données associées.")) {
      const { error } = await supabase.from('schools').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('invitations').insert([{
      school_id: inviteSchoolId,
      email: inviteEmail,
      role: inviteRole
    }]);
    if (!error) {
      alert("Invitation préparée pour " + inviteEmail);
      setShowInviteModal(false);
      setInviteEmail("");
    } else {
      alert("Erreur lors de l'invitation (peut-être existe-t-elle déjà ?)");
    }
  };

  const handleDeleteUser = async (userId: string, schoolId: string) => {
    if (window.confirm("Retirer cet utilisateur de l'établissement ?")) {
      const { error } = await supabase.from('profiles').update({ school_id: null, role: 'PARENT' }).eq('id', userId);
      if (!error) fetchData();
    }
  };

  const handleSaveProfileRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    const { error } = await supabase.from('profiles').update({
      role: profileRole,
      school_id: profileSchoolId === "" ? null : profileSchoolId
    }).eq('id', editingProfile.id);
    
    if (!error) {
      fetchData();
      setShowRoleModal(false);
    } else {
      alert("Erreur lors de la mise à jour");
    }
  };

  const completelyDeleteProfile = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir SUPPRIMER DÉFINITIVEMENT ce compte utilisateur ?")) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  const filteredProfiles = profiles.filter(p => 
    (p.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Espace Super Admin</h1>
          <p className="text-slate-500 mt-1">Gérez tous les établissements et utilisateurs de la plateforme EduBénin.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab("SCHOOLS")}
          className={\`px-4 py-2 font-bold text-sm tracking-wider uppercase transition-colors border-b-2 \${activeTab === "SCHOOLS" ? "border-emerald-600 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"}\`}
        >
          Établissements
        </button>
        <button 
          onClick={() => setActiveTab("USERS")}
          className={\`px-4 py-2 font-bold text-sm tracking-wider uppercase transition-colors border-b-2 \${activeTab === "USERS" ? "border-emerald-600 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"}\`}
        >
          Utilisateurs
        </button>
      </div>

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
                                    <span className={\`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded \${
                                      a.role === 'SCHOOL_ADMIN' ? 'bg-purple-100 text-purple-700' :
                                      a.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' :
                                      'bg-slate-100 text-slate-600'
                                    }\`}>{a.role.replace('_', ' ')}</span>
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
                              onClick={() => handleDeleteSchool(school.id)}
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
                        <span className={\`text-[10px] font-bold uppercase px-2 py-1 rounded \${
                          p.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-700' :
                          p.role === 'SCHOOL_ADMIN' ? 'bg-purple-100 text-purple-700' :
                          p.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' :
                          p.role === 'CASHIER' ? 'bg-emerald-100 text-emerald-700' :
                          p.role === 'SECRETARY' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }\`}>{p.role.replace('_', ' ')}</span>
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
                              onClick={() => completelyDeleteProfile(p.id)}
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
    </div>
  );
}
`
fs.writeFileSync('src/pages/SuperAdmin.tsx', content);
