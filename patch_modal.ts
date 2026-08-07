import fs from 'fs';

let content = fs.readFileSync('src/components/UserSettingsModal.tsx', 'utf-8');

content = content.replace(
`const [phone, setPhone] = useState(user?.phone || "");
  const [loading, setLoading] = useState(false);`,
`const [phone, setPhone] = useState(user?.phone || "");
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  
  React.useEffect(() => {
    if (user?.id) {
       supabase.from('profiles').select('avatar_url').eq('id', user.id).single()
         .then(({data}) => {
            if (data?.avatar_url) setAvatar(data.avatar_url);
         });
    }
  }, [user]);
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };`
);

content = content.replace(
`const { error } = await supabase.from("profiles").update({
      full_name: name,
      phone: phone
    }).eq("id", user.id);`,
`const { error } = await supabase.from("profiles").update({
      full_name: name,
      phone: phone,
      avatar_url: avatar
    }).eq("id", user.id);`
);

content = content.replace(
`<div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-emerald-200 relative group cursor-pointer">
              {name.charAt(0).toUpperCase()}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <Camera className="text-white w-6 h-6" />
              </div>
            </div>`,
`<label className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-emerald-200 relative group cursor-pointer overflow-hidden">
              {avatar ? <img src={avatar} alt="Profile" className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <Camera className="text-white w-6 h-6" />
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            </label>`
);

fs.writeFileSync('src/components/UserSettingsModal.tsx', content);
