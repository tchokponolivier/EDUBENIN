import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { X, Camera, Save, User as UserIcon } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function UserSettingsModal({ isOpen, onClose }: Props) {
  const { user, login } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  
  React.useEffect(() => {
    if (user?.id) {
       supabase.from('profiles').select('avatar_url, email, address').eq('id', user.id).single()
         .then(({data}) => {
            if (data?.avatar_url) setAvatar(data.avatar_url);
            if (data?.email) setEmail(data.email);
            if (data?.address) setAddress(data.address);
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
  };

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // We don't have avatar_url in the profiles table yet based on the schema, but we can add it or just stick to name/phone.
    // The user asked to update "photos de profils et informations". We should add an avatar column if needed, or just let them pick but maybe not save if table lacks it. Wait, the schema in supabase_schema.sql for profiles is:
    
    const { error } = await supabase.from("profiles").update({
      full_name: name,
      phone: phone,
      address: address,
      avatar_url: avatar
    }).eq("id", user.id);

    if (error) {
      alert("Erreur lors de la mise à jour");
    } else {
      // update local user state
      // update local user state (refreshing page to reflect auth context is better or just let the session handle it)
      if (typeof window !== 'undefined') window.location.reload();
      alert("Profil mis à jour");
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 fade-in">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <UserIcon size={18} className="text-emerald-600" /> Mon Profil
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="flex justify-center mb-6">
            <label className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-emerald-200 relative group cursor-pointer overflow-hidden">
              {avatar ? <img src={avatar} alt="Profile" className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <Camera className="text-white w-6 h-6" />
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
             <div>
               <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Rôle</label>
               <input type="text" value={user.role} disabled readOnly className="w-full px-3 py-2 border border-slate-300 bg-slate-100 rounded text-slate-500 outline-none cursor-not-allowed" />
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Adresse Email</label>
               <input type="email" value={email} disabled readOnly className="w-full px-3 py-2 border border-slate-300 bg-slate-100 rounded text-slate-500 outline-none cursor-not-allowed" />
             </div>
          </div>
          <div className="mb-4">
             <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Adresse (Domicile)</label>
             <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Quartier, Ville..." className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
          </div>
          <div>
             <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Nom Complet</label>
             <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
          </div>
          <div>
             <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Téléphone</label>
             <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
          </div>
          
          <div className="pt-4 flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-white border border-slate-200 text-gray-700 rounded font-semibold hover:bg-slate-50 transition-colors">
               Annuler
             </button>
             <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded font-semibold hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2">
               {loading ? "Enregistrement..." : <><Save size={16} /> Enregistrer</>}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
