import re

with open('src/pages/SchoolAdmin.tsx', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    'import { Users, GraduationCap, ArrowUpRight, Search, Settings, Megaphone, Trash2, Edit } from "lucide-react";',
    'import { Users, GraduationCap, ArrowUpRight, Search, Settings, Megaphone, Trash2, Edit, Mail, Plus } from "lucide-react";\nimport { supabase } from "../lib/supabase";'
)

# 2. activeTab
content = content.replace(
    'const [activeTab, setActiveTab] = useState<"DASHBOARD" | "ANNOUNCEMENTS" | "SETTINGS">("DASHBOARD");',
    '''const [activeTab, setActiveTab] = useState<"DASHBOARD" | "MEMBERS" | "ANNOUNCEMENTS" | "SETTINGS">("DASHBOARD");

  // Invitations state
  const [invitations, setInvitations] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("TEACHER");
  const [isInviting, setIsInviting] = useState(false);'''
)

# 3. useEffect
content = content.replace(
    'setAnnouncements(db.getAnnouncements());\n  }, []);',
    '''setAnnouncements(db.getAnnouncements());
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    if (!user?.schoolId) return;
    const { data } = await supabase.from('invitations').select('*').eq('school_id', user.schoolId).order('created_at', { ascending: false });
    if (data) setInvitations(data);
  };'''
)

# 4. handleInvite function before handleSettingsSave
content = content.replace(
    '  const handleSettingsSave = (e: React.FormEvent<HTMLFormElement>) => {',
    '''  const handleInvite = async (e: React.FormEvent) => {
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

  const handleSettingsSave = (e: React.FormEvent<HTMLFormElement>) => {'''
)

# 5. Buttons
content = content.replace(
    '''<button 
            onClick={() => setActiveTab("DASHBOARD")} 
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "DASHBOARD" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Vue d'ensemble
          </button>''',
    '''<button 
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
          </button>'''
)

# 6. Tab Content
content = content.replace(
    '{activeTab === "SETTINGS" && settings && (',
    '''{activeTab === "MEMBERS" && (
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

      {activeTab === "SETTINGS" && settings && ('''
)

with open('src/pages/SchoolAdmin.tsx', 'w') as f:
    f.write(content)
