const fs = require('fs');
let content = fs.readFileSync('src/components/UserSettingsModal.tsx', 'utf-8');

const targetState = `  const [phone, setPhone] = useState(user?.phone || "");`;
const newState = `  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState("");`;
content = content.replace(targetState, newState);

const targetEffect = `         .then(({data}) => {
            if (data?.avatar_url) setAvatar(data.avatar_url);
            if (data?.email) setEmail(data.email);
         });`;
const newEffect = `         .then(({data}) => {
            if (data?.avatar_url) setAvatar(data.avatar_url);
            if (data?.email) setEmail(data.email);
            if (data?.address) setAddress(data.address);
         });`;
// Wait, the select needs to include address!
content = content.replace(`supabase.from('profiles').select('avatar_url, email')`, `supabase.from('profiles').select('avatar_url, email, address')`);
content = content.replace(targetEffect, newEffect);

const targetUpdate = `      phone: phone,
      email: email,
      avatar_url: avatar
    }).eq("id", user.id);`;
const newUpdate = `      phone: phone,
      address: address,
      avatar_url: avatar
    }).eq("id", user.id);`;
content = content.replace(targetUpdate, newUpdate);

const targetForm = `          <div>
             <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Adresse Email</label>
             <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none mb-4" />
          </div>`;
          
const newForm = `          <div className="grid grid-cols-2 gap-4 mb-4">
             <div>
               <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Rôle</label>
               <input type="text" value={user.role} readOnly className="w-full px-3 py-2 border border-slate-300 bg-slate-100 rounded text-slate-500 outline-none cursor-not-allowed" />
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Adresse Email</label>
               <input type="email" value={email} readOnly className="w-full px-3 py-2 border border-slate-300 bg-slate-100 rounded text-slate-500 outline-none cursor-not-allowed" />
             </div>
          </div>
          <div className="mb-4">
             <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Adresse (Domicile)</label>
             <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Quartier, Ville..." className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
          </div>`;

content = content.replace(targetForm, newForm);

fs.writeFileSync('src/components/UserSettingsModal.tsx', content);
console.log("Patched UserSettingsModal");
