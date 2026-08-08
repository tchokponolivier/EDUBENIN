import fs from 'fs';
let content = fs.readFileSync('src/pages/ParentProspectus.tsx', 'utf-8');

const replacement = `import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { FileText, Download, Edit2, Check, Upload } from "lucide-react";

export function ParentProspectus() {
  const { user } = useAuth();
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=2400");
  const [isEditing, setIsEditing] = useState(false);
  const [newUrl, setNewUrl] = useState("");

  const canEdit = user?.role === 'SCHOOL_ADMIN' || user?.role === 'CASHIER';

  useEffect(() => {
    const saved = localStorage.getItem('prospectus_image');
    if (saved) setImageUrl(saved);
  }, []);

  const handleSave = () => {
    setImageUrl(newUrl);
    localStorage.setItem('prospectus_image', newUrl);
    setIsEditing(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        localStorage.setItem('prospectus_image', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  return (
    <div className="p-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-700 mb-2">Prospectus de l'école</h1>
          <p className="text-slate-500">Découvrez la vision, les activités et les conditions de notre établissement.</p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded font-bold uppercase tracking-wider text-xs hover:bg-blue-700 transition cursor-pointer shadow-sm">
              <Upload size={16} />
              Modifier l'image
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            </label>
          )}
          <a href={imageUrl} download="Prospectus_EduBenin.jpg" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded font-bold uppercase tracking-wider text-xs hover:bg-emerald-700 transition shadow-sm">
            <Download size={16} />
            Télécharger
          </a>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-4xl mx-auto">
        <div className="aspect-[21/9] w-full bg-slate-100 flex flex-col items-center justify-center relative overflow-hidden group">
           <img src={imageUrl} alt="Prospectus" className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end p-8">
             <div className="text-white">
               <h2 className="text-3xl font-black uppercase tracking-wider mb-2">Construisons l'Avenir</h2>
               <p className="text-slate-200 max-w-xl leading-relaxed">Une éducation de qualité, un encadrement rigoureux et des infrastructures modernes pour garantir la réussite de vos enfants.</p>
             </div>
           </div>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
             <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><FileText size={18} className="text-emerald-600" /> Nos Valeurs</h3>
             <ul className="space-y-2 text-sm text-slate-600">
               <li>• Excellence académique</li>
               <li>• Rigueur et discipline</li>
               <li>• Épanouissement personnel</li>
               <li>• Citoyenneté et leadership</li>
             </ul>
          </div>
          <div>
             <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><FileText size={18} className="text-emerald-600" /> Informations Pratiques</h3>
             <ul className="space-y-2 text-sm text-slate-600">
               <li><strong>Horaires :</strong> 08h00 - 17h00</li>
               <li><strong>Cantine :</strong> Disponible (sur inscription)</li>
               <li><strong>Activités :</strong> Sport, Arts, Clubs scientiques</li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}`;

fs.writeFileSync('src/pages/ParentProspectus.tsx', replacement);
