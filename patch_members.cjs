const fs = require('fs');
let content = fs.readFileSync('src/pages/SchoolAdmin.tsx', 'utf-8');

const stateTarget = `const [isInviting, setIsInviting] = useState(false);`;
const stateInsert = `const [isInviting, setIsInviting] = useState(false);
  const [schoolMembers, setSchoolMembers] = useState<any[]>([]);
  const [memberFilter, setMemberFilter] = useState("ALL");`;
content = content.replace(stateTarget, stateInsert);

const fetchTarget = `fetchInvitations();
  }, []);`;
const fetchInsert = `fetchInvitations();
    fetchSchoolMembers();
  }, []);

  const fetchSchoolMembers = async () => {
    if (!user?.schoolId) return;
    const { data } = await supabase.from('profiles').select('*').eq('school_id', user.schoolId);
    if (data) setSchoolMembers(data.filter(p => p.id !== user.id)); // Exclude self
  };`;
content = content.replace(fetchTarget, fetchInsert);

const uiTarget = `<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
          </div>`;

const uiInsert = `<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-gray-700">Membres Actifs</h3>
              <select value={memberFilter} onChange={e => setMemberFilter(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded text-xs focus:ring-emerald-500 outline-none">
                 <option value="ALL">Tous les rôles</option>
                 <option value="TEACHER">Professeurs</option>
                 <option value="SECRETARY">Secrétaires</option>
                 <option value="CASHIER">Caissiers</option>
                 <option value="DIRECTOR_OF_STUDIES">Directeurs des Études</option>
                 <option value="SUPERVISOR">Surveillants</option>
              </select>
            </div>
            {schoolMembers.filter(m => memberFilter === "ALL" || m.role === memberFilter).length === 0 ? (
              <div className="p-8 text-center text-slate-500">Aucun membre dans cette catégorie.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {schoolMembers.filter(m => memberFilter === "ALL" || m.role === memberFilter).map(m => (
                  <li key={m.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-medium text-gray-800">{m.full_name || m.email}</p>
                      <p className="text-xs text-slate-500 mt-1">Rôle: <span className="font-semibold text-emerald-600">{m.role}</span></p>
                    </div>
                    <button onClick={async () => {
                       if(window.confirm("Retirer ce membre de l'école ?")) {
                          await supabase.from('profiles').update({school_id: null, role: 'PARENT'}).eq('id', m.id);
                          fetchSchoolMembers();
                       }
                    }} className="text-red-500 hover:text-red-700 text-xs font-bold uppercase p-2">Retirer</button>
                  </li>
                ))}
              </ul>
            )}
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
                    <button onClick={async () => {
                       if(window.confirm("Supprimer cette invitation ?")) {
                          await supabase.from('invitations').delete().eq('id', inv.id);
                          fetchInvitations();
                       }
                    }} className="text-red-500 hover:text-red-700 text-xs font-bold uppercase p-2">Supprimer</button>
                  </li>
                ))}
              </ul>
            )}
          </div>`;
content = content.replace(uiTarget, uiInsert);

fs.writeFileSync('src/pages/SchoolAdmin.tsx', content);
console.log("Patched members");
