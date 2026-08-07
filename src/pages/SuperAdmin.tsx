import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { School, Building, Users, AlertCircle, Plus, Edit2, Trash2, Mail, X, CheckCircle } from "lucide-react";

export function SuperAdminDashboard() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [schoolFormData, setSchoolFormData] = useState({ name: "", locality: "", contacts: "" });

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSchoolId, setInviteSchoolId] = useState<string>("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("SCHOOL_ADMIN");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select(`
          *,
          profiles(id, email, role, full_name)
        `)
        .order('created_at', { ascending: false });
        
      if (schoolsError) throw schoolsError;
      setSchools(schoolsData || []);
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
         setSchools(schools.map(s => s.id === editingSchool.id ? { ...s, ...schoolFormData } : s));
         setShowSchoolModal(false);
      } else {
         alert("Erreur lors de la modification");
      }
    } else {
      const { data, error } = await supabase.from('schools').insert(schoolFormData).select().single();
      if (!error && data) {
         setSchools([{ ...data, profiles: [] }, ...schools]);
         setShowSchoolModal(false);
      } else {
         alert("Erreur lors de la création");
      }
    }
  };

  const handleDeleteSchool = async (id: string) => {
    if (window.confirm("Attention : Supprimer cet établissement supprimera toutes les données associées (élèves, paiements, profils). Confirmer ?")) {
       const { error } = await supabase.from('schools').delete().eq('id', id);
       if (!error) {
          setSchools(schools.filter(s => s.id !== id));
       } else {
          alert("Erreur lors de la suppression");
       }
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('invitations').insert({
       school_id: inviteSchoolId,
       email: inviteEmail.toLowerCase(),
       role: inviteRole
    });
    if (!error) {
       alert("Invitation envoyée avec succès (enregistrée en base).");
       setShowInviteModal(false);
       setInviteEmail("");
    } else {
       alert("Erreur lors de l'invitation (l'utilisateur est peut-être déjà invité).");
    }
  };

  const handleDeleteUser = async (userId: string, schoolId: string) => {
    if (window.confirm("Retirer cet utilisateur de l'établissement ? (Son compte deviendra un profil Parent sans école)")) {
       const { error } = await supabase.from('profiles').update({ school_id: null, role: 'PARENT' }).eq('id', userId);
       if (!error) {
          fetchData(); // Reload to refresh profiles list
       }
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Chargement des établissements...</div>;
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Espace Super Admin</h1>
          <p className="text-slate-500 mt-1">Gérez tous les établissements inscrits sur la plateforme EduBénin.</p>
        </div>
        <button 
          onClick={() => { setEditingSchool(null); setSchoolFormData({ name: "", locality: "", contacts: "" }); setShowSchoolModal(true); }}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800"
        >
          <Plus size={16} /> Ajouter un Établissement
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Building size={24} />
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{schools.length}</div>
            <div className="text-xs text-slate-500 uppercase font-semibold">Établissements</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">
              {schools.reduce((acc, s) => acc + (s.profiles?.length || 0), 0)}
            </div>
            <div className="text-xs text-slate-500 uppercase font-semibold">Total Utilisateurs</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-gray-800">Liste des Établissements</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
              <tr className="border-b border-slate-200">
                <th className="px-6 py-3">Établissement</th>
                <th className="px-6 py-3">Localité</th>
                <th className="px-6 py-3">Membres (Admins / Staff)</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schools.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Building className="w-12 h-12 text-slate-300 mb-3" />
                      <p>Aucun établissement enregistré.</p>
                      <button onClick={() => { setEditingSchool(null); setSchoolFormData({ name: "", locality: "", contacts: "" }); setShowSchoolModal(true); }} className="mt-4 text-emerald-600 font-bold hover:underline">Créer le premier établissement</button>
                    </div>
                  </td>
                </tr>
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
                      <td className="px-6 py-4 align-top text-sm text-slate-600">{school.locality || "-"}</td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center justify-between mb-2">
                           <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                             <Users size={10} /> {staff.length} membres
                           </span>
                           <button 
                             onClick={() => { setInviteSchoolId(school.id); setShowInviteModal(true); }}
                             className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1"
                           >
                             <Plus size={12}/> Inviter
                           </button>
                        </div>
                        {staff.length === 0 ? (
                          <div className="text-xs text-red-500 flex items-center gap-1 mt-2 bg-red-50 p-1.5 rounded"><AlertCircle size={12} /> Aucun compte rattaché</div>
                        ) : (
                          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                            {staff.map((a: any) => (
                              <div key={a.id} className="text-xs flex items-center justify-between bg-white border border-slate-100 p-1.5 rounded">
                                <div className="truncate">
                                  <span className="font-semibold text-slate-700 block truncate">{a.full_name || 'Sans nom'}</span>
                                  <span className="text-[10px] text-slate-500 block truncate">{a.email}</span>
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
                <input required type="text" value={schoolFormData.name} onChange={e => setSchoolFormData({...schoolFormData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Localité / Ville</label>
                <input type="text" value={schoolFormData.locality} onChange={e => setSchoolFormData({...schoolFormData, locality: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Contacts (Tél / Email)</label>
                <input type="text" value={schoolFormData.contacts} onChange={e => setSchoolFormData({...schoolFormData, contacts: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
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
                Inviter un membre du personnel
              </h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleInviteUser} className="p-6 space-y-4">
              <div className="bg-blue-50 text-blue-800 p-3 rounded text-xs leading-relaxed">
                L'utilisateur devra se connecter avec cette adresse email (via Google) pour que son compte soit automatiquement rattaché à cet établissement avec le rôle choisi.
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Adresse Email</label>
                <input required type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" placeholder="exemple@gmail.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Rôle Attribué</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white">
                  <option value="SCHOOL_ADMIN">Directeur (Administrateur)</option>
                  <option value="SECRETARY">Secrétaire</option>
                  <option value="CASHIER">Caissier(ère)</option>
                  <option value="TEACHER">Professeur</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-gray-700 rounded font-semibold hover:bg-slate-50 transition-colors">Annuler</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                  Générer l'invitation <CheckCircle size={16}/>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
