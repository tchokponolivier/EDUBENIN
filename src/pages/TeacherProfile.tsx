import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../lib/auth";
import { User, Mail, Phone, BookOpen, GraduationCap, MapPin, Save, ShieldCheck, FileText, Camera } from "lucide-react";

export function TeacherProfile() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    diploma: "",
    specialty: "",
    bio: "",
    availability: "Temps plein",
    photo: "",
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || "",
        firstName: user.name?.split(' ')[0] || "",
        lastName: user.name?.split(' ').slice(1).join(' ') || "",
        photo: user.photoURL || "",
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, photo: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Vos informations ont été enregistrées avec succès pour l'administration.");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 animate-in fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-700">Mon Profil Professeur</h1>
        <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" /> Vos informations sont sécurisées et destinées à l'administration de l'établissement.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center sm:items-start gap-4">
           <div 
             className="w-24 h-24 bg-emerald-100 rounded-full flex flex-col items-center justify-center text-emerald-600 border-4 border-white shadow-sm shrink-0 overflow-hidden relative cursor-pointer group"
             onClick={() => fileInputRef.current?.click()}
           >
              {formData.photo ? (
                <img src={formData.photo} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <User size={36} />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                 <Camera size={24} />
              </div>
           </div>
           <div className="text-center sm:text-left mt-2 sm:mt-0 flex-1">
              <h2 className="text-lg font-bold text-gray-700 uppercase tracking-wide">Informations Personnelles</h2>
              <p className="text-xs text-slate-500 mb-2">Cliquez sur l'image pour mettre à jour votre photo de profil.</p>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
           </div>
        </div>

        <form onSubmit={handleSave} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="col-span-1 md:col-span-2">
               <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Identité & Contact</h3>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-2"><User size={14}/> Nom(s)</label>
              <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm" placeholder="Votre nom de famille" />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-2"><User size={14}/> Prénom(s)</label>
              <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm" placeholder="Vos prénoms" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-2"><Mail size={14}/> Email (Professionnel)</label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm bg-slate-50" readOnly />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-2"><Phone size={14}/> Téléphone</label>
              <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm" placeholder="+229 XX XX XX XX" />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-2"><MapPin size={14}/> Quartier / Adresse de résidence</label>
              <input required type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm" placeholder="Ex: Cotonou, Akpakpa" />
            </div>

            <div className="col-span-1 md:col-span-2 mt-4">
               <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Parcours & Spécialisation</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-2"><BookOpen size={14}/> Matière Principale enseignée</label>
              <select name="specialty" value={formData.specialty} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm">
                 <option value="">Sélectionner une matière...</option>
                 <option value="mathématiques">Mathématiques</option>
                 <option value="physique_chimie">Physique-Chimie</option>
                 <option value="svt">S.V.T</option>
                 <option value="français">Français</option>
                 <option value="anglais">Anglais</option>
                 <option value="histoire_geo">Histoire-Géographie</option>
                 <option value="philosophie">Philosophie</option>
                 <option value="eps">E.P.S</option>
                 <option value="espagnol">Espagnol</option>
                 <option value="allemand">Allemand</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-2"><GraduationCap size={14}/> Diplôme ou Qualification le plus élevé</label>
              <input type="text" name="diploma" value={formData.diploma} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm" placeholder="Ex: Licence BAPES, Maîtrise, CAPES..." />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-2"><User size={14}/> Disponibilité horaire</label>
              <select name="availability" value={formData.availability} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm">
                 <option value="Temps plein">Temps Plein</option>
                 <option value="Temps partiel (Matinées)">Temps Partiel (Matinées)</option>
                 <option value="Temps partiel (Après-midis)">Temps Partiel (Après-midis)</option>
                 <option value="Vacataire">Vacataire (Sur heures spécifiques)</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-2"><FileText size={14}/> Brève Biographie / Expérience (Optionnel)</label>
              <textarea name="bio" value={formData.bio} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm min-h-[80px]" placeholder="Résumez votre parcours académique et professionnel en quelques lignes..." />
            </div>

          </div>

          <div className="flex justify-end pt-6 border-t border-slate-200">
             <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded font-bold uppercase tracking-wider text-sm shadow hover:bg-emerald-700 transition">
               <Save size={18} /> Enregistrer le Profil
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
