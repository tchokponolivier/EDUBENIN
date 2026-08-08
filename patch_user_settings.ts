import fs from 'fs';
let content = fs.readFileSync('src/components/UserSettingsModal.tsx', 'utf-8');

if (!content.includes('const [email,')) {
  content = content.replace(
    `const [name, setName] = useState(user?.name || "");`,
    `const [name, setName] = useState(user?.name || "");\n  const [email, setEmail] = useState("");`
  );

  content = content.replace(
    `if (data?.avatar_url) setAvatar(data.avatar_url);`,
    `if (data?.avatar_url) setAvatar(data.avatar_url);\n            if (data?.email) setEmail(data.email);`
  );

  content = content.replace(
    `full_name: name,\n      phone: phone,`,
    `full_name: name,\n      phone: phone,\n      email: email,`
  );

  content = content.replace(
    `<div>
             <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Nom Complet</label>`,
    `<div>
             <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Adresse Email</label>
             <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none mb-4" />
          </div>
          <div>
             <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Nom Complet</label>`
  );
  
  content = content.replace(`Paramètres du Profil`, `Mon Profil`);

  fs.writeFileSync('src/components/UserSettingsModal.tsx', content);
}
