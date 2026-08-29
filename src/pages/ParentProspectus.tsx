import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { FileText, Download, Edit2, Check, Upload, Save, X } from "lucide-react";
import { supabase } from "../lib/supabase";

export function ParentProspectus() {
  const { user } = useAuth();
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=2400");
  const [bottomImageUrl, setBottomImageUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  const [texts, setTexts] = useState({
    title: "Construisons l'Avenir",
    subtitle: "Une éducation de qualité, un encadrement rigoureux et des infrastructures modernes pour garantir la réussite de vos enfants.",
    valuesTitle: "Nos Valeurs",
    values: "• Excellence académique\n• Rigueur et discipline\n• Épanouissement personnel\n• Citoyenneté et leadership",
    infoTitle: "Informations Pratiques",
    info: "**Horaires :** 08h00 - 17h00\n**Cantine :** Disponible (sur inscription)\n**Activités :** Sport, Arts, Clubs scientiques"
  });

  const [fees, setFees] = useState<any[]>([]);

  const canEdit = user?.role === 'SCHOOL_ADMIN' || user?.role === 'CASHIER';

  useEffect(() => {
    if (!user?.schoolId) return;
    supabase.from('fee_config').select('description').eq('school_id', user.schoolId).eq('level', 'PROSPECTUS_DATA').single().then(({data}) => {
      if (data && data.description) {
        try {
          const parsed = JSON.parse(data.description);
          setImageUrl(parsed.imageUrl || imageUrl);
          setBottomImageUrl(parsed.bottomImageUrl || "");
          setTexts(parsed.texts || texts);
        } catch(e) {}
      }
    });

    // Fetch fees
    supabase.from('fee_config').select('*').eq('school_id', user.schoolId).then(({ data }) => {
      if (data) {
        // Group by level
        const grouped = data.reduce((acc, curr) => {
          if (!acc[curr.level]) acc[curr.level] = { level: curr.level, total: 0 };
          acc[curr.level].total += curr.amount;
          return acc;
        }, {} as Record<string, any>);
        setFees(Object.values(grouped));
      }
    });

  }, [user?.schoolId]);

  const handleSave = () => {
    if (user?.schoolId) {
      const payload = JSON.stringify({ imageUrl, bottomImageUrl, texts });
      supabase.from('fee_config').select('id').eq('school_id', user.schoolId).eq('level', 'PROSPECTUS_DATA').single().then(({data}) => {
        if (data) {
          supabase.from('fee_config').update({ description: payload }).eq('id', data.id).then(() => {});
        } else {
          supabase.from('fee_config').insert({ school_id: user.schoolId, level: 'PROSPECTUS_DATA', type: 'DATA', amount: 0, description: payload }).then(() => {});
        }
      });
    }
    setIsEditing(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isBottom: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height = height * (MAX_WIDTH / width);
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width = width * (MAX_HEIGHT / height);
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if(ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                const resized = canvas.toDataURL('image/jpeg', 0.7);
                if (isBottom) setBottomImageUrl(resized);
                else setImageUrl(resized);
            }
        };
        img.src = reader.result as string;
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
            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`flex items-center gap-2 px-4 py-2 ${isEditing ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded font-bold uppercase tracking-wider text-xs transition shadow-sm`}
            >
              {isEditing ? <><Save size={16} /> Enregistrer</> : <><Edit2 size={16} /> Éditer Prospectus</>}
            </button>
          )}
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded font-bold uppercase tracking-wider text-xs hover:bg-slate-700 transition shadow-sm">
            <Download size={16} />
            Imprimer / PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-4xl mx-auto print:shadow-none print:border-none">
        
        {/* Top Image */}
        <div className="aspect-[21/9] w-full bg-slate-100 flex flex-col items-center justify-center relative overflow-hidden group">
           <img src={imageUrl} alt="Prospectus" className="w-full h-full object-cover" />
           {isEditing && (
             <>
             <button onClick={() => document.getElementById("main-img-upload")?.click()} className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 text-gray-800 rounded font-bold uppercase tracking-wider text-xs hover:bg-white transition cursor-pointer shadow-sm z-10">
                <Upload size={16} /> Changer l'image principale
             </button>
             <input id="main-img-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, false)} />
             </>
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end p-8">
             <div className="text-white w-full">
               {isEditing ? (
                 <>
                   <input 
                     value={texts.title} 
                     onChange={e => setTexts({...texts, title: e.target.value})} 
                     className="bg-black/50 text-3xl font-black uppercase tracking-wider mb-2 w-full p-2 rounded" 
                   />
                   <textarea 
                     value={texts.subtitle} 
                     onChange={e => setTexts({...texts, subtitle: e.target.value})} 
                     className="bg-black/50 text-slate-200 max-w-xl leading-relaxed w-full p-2 rounded resize-none" 
                   />
                 </>
               ) : (
                 <>
                   <h2 className="text-3xl font-black uppercase tracking-wider mb-2">{texts.title}</h2>
                   <p className="text-slate-200 max-w-xl leading-relaxed">{texts.subtitle}</p>
                 </>
               )}
             </div>
           </div>
        </div>

        {/* Texts */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
             {isEditing ? (
               <input value={texts.valuesTitle} onChange={e => setTexts({...texts, valuesTitle: e.target.value})} className="text-lg font-bold text-gray-700 mb-4 w-full border p-2 rounded" />
             ) : (
               <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><FileText size={18} className="text-emerald-600" /> {texts.valuesTitle}</h3>
             )}
             
             {isEditing ? (
               <textarea value={texts.values} onChange={e => setTexts({...texts, values: e.target.value})} className="w-full h-40 border p-2 rounded text-sm text-slate-600" />
             ) : (
               <ul className="space-y-2 text-sm text-slate-600 whitespace-pre-line">
                 {texts.values}
               </ul>
             )}
          </div>
          <div>
             {isEditing ? (
               <input value={texts.infoTitle} onChange={e => setTexts({...texts, infoTitle: e.target.value})} className="text-lg font-bold text-gray-700 mb-4 w-full border p-2 rounded" />
             ) : (
               <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><FileText size={18} className="text-emerald-600" /> {texts.infoTitle}</h3>
             )}
             
             {isEditing ? (
               <textarea value={texts.info} onChange={e => setTexts({...texts, info: e.target.value})} className="w-full h-40 border p-2 rounded text-sm text-slate-600" />
             ) : (
               <div className="space-y-2 text-sm text-slate-600 whitespace-pre-line">
                 {texts.info.split('\n').map((line, i) => (
                   <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                 ))}
               </div>
             )}
          </div>
        </div>

        {/* Fees Table */}
        <div className="p-8 border-t border-slate-100">
           <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">Frais de Scolarité (Total Annuel)</h3>
           {fees.length > 0 ? (
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-50 border-y border-slate-200">
                     <th className="p-3 text-xs font-bold text-slate-500 uppercase">Niveau / Classe</th>
                     <th className="p-3 text-xs font-bold text-slate-500 uppercase text-right">Montant Total (FCFA)</th>
                   </tr>
                 </thead>
                 <tbody>
                   {fees.map((f, i) => (
                     <tr key={i} className="border-b border-slate-100">
                       <td className="p-3 text-sm font-medium text-gray-700">{f.level}</td>
                       <td className="p-3 text-sm font-bold text-emerald-600 text-right">{f.total.toLocaleString()} FCFA</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           ) : (
             <p className="text-sm text-slate-500 italic">Aucun frais configuré pour le moment.</p>
           )}
        </div>

        {/* Bottom Image */}
        <div className="p-8 border-t border-slate-100 bg-slate-50 relative min-h-[200px] flex flex-col items-center justify-center">
           {isEditing && (
             <>
             <label htmlFor="bottom-img-upload" className="absolute top-4 right-4 z-10 flex items-center gap-2 px-4 py-2 bg-white text-gray-800 rounded font-bold uppercase tracking-wider text-xs border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-sm">
                <Upload size={16} /> Ajouter/Changer image du bas
             </label>
             <input id="bottom-img-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, true)} />
             </>
           )}
           {bottomImageUrl ? (
             <img src={bottomImageUrl} alt="Bottom Prospectus" className="w-full max-h-96 object-contain rounded-lg shadow-sm" />
           ) : (
             isEditing && <p className="text-slate-400 text-sm">Aucune image en bas</p>
           )}
           {isEditing && bottomImageUrl && (
             <button onClick={() => setBottomImageUrl("")} className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-600 rounded text-xs font-bold uppercase hover:bg-red-200 transition">
               <X size={14} /> Supprimer
             </button>
           )}
        </div>

      </div>
    </div>
  );
}
