import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { FileText, Download, Edit2, Check, Upload, Save, X, Plus, Trash2, Eye, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { loadProspectus, saveProspectus } from "../lib/prospectusStorage";

export function ParentProspectus() {
  const { user } = useAuth();
  const toast = useToast();
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=2400");
  const [bottomImageUrl, setBottomImageUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [sections, setSections] = useState<any[]>([
     { type: "TEXT", title: "Nos Valeurs", content: "• Excellence académique\n• Rigueur" },
     { type: "TEXT", title: "Informations Pratiques", content: "**Horaires :** 08h00 - 17h00\n**Cantine :** Disponible" }
  ]);

  const canEdit = user?.role === 'SCHOOL_ADMIN' || user?.role === 'CASHIER' || user?.role === 'DIRECTOR_OF_STUDIES' || user?.role === 'SUPER_ADMIN';

  const effectiveSchoolId = user?.schoolId || localStorage.getItem('edubenin_active_school_id') || "11111111-1111-4111-8111-111111111111";

  useEffect(() => {
    async function loadData() {
      const persisted = await loadProspectus(effectiveSchoolId);
      if (persisted) {
        if (persisted.imageUrl) setImageUrl(persisted.imageUrl);
        if (persisted.bottomImageUrl !== undefined) setBottomImageUrl(persisted.bottomImageUrl || "");
        if (Array.isArray(persisted.sections) && persisted.sections.length > 0) setSections(persisted.sections);
      }
    }
    loadData();
  }, [effectiveSchoolId]);

  const handleSave = async () => {
    try {
      await saveProspectus(effectiveSchoolId, {
        imageUrl,
        bottomImageUrl,
        sections
      });
      setSaveSuccess(true);
      toast.success("Prospectus et images enregistrés avec succès !");
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error("Erreur lors de l'enregistrement du prospectus.");
    }
    setIsEditing(false);
    setPreviewMode(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isBottom: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (isBottom) setBottomImageUrl(result);
        else setImageUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addSection = (type: "TEXT" | "TABLE") => {
     if (type === "TEXT") {
        setSections([...sections, { type: "TEXT", title: "Nouveau Titre", content: "Contenu..." }]);
     } else {
        setSections([...sections, { type: "TABLE", title: "Nouveau Tableau", headers: ["Colonne 1", "Colonne 2"], rows: [["Valeur 1", "Valeur 2"]] }]);
     }
  };

  const updateSection = (index: number, key: string, value: any) => {
     const newSections = [...sections];
     newSections[index][key] = value;
     setSections(newSections);
  };

  const deleteSection = (index: number) => {
     setSections(sections.filter((_, i) => i !== index));
  };

  const updateTable = (secIndex: number, rowIndex: number, colIndex: number, value: string) => {
     const newSections = [...sections];
     newSections[secIndex].rows[rowIndex][colIndex] = value;
     setSections(newSections);
  };
  const updateHeader = (secIndex: number, colIndex: number, value: string) => {
     const newSections = [...sections];
     newSections[secIndex].headers[colIndex] = value;
     setSections(newSections);
  };
  const addRow = (secIndex: number) => {
     const newSections = [...sections];
     newSections[secIndex].rows.push(new Array(newSections[secIndex].headers.length).fill(""));
     setSections(newSections);
  };
  const addCol = (secIndex: number) => {
     const newSections = [...sections];
     newSections[secIndex].headers.push("Nouvelle Col");
     newSections[secIndex].rows.forEach((r: any) => r.push(""));
     setSections(newSections);
  };

  if (!user) return null;

  return (
    <div className="p-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-700 mb-2">Prospectus de l'école</h1>
          <p className="text-slate-500">Découvrez la vision, les activités et les conditions de notre établissement.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && isEditing && (
            <button onClick={() => setPreviewMode(!previewMode)} className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded font-bold uppercase tracking-wider text-xs hover:bg-slate-300 transition shadow-sm">
               <Eye size={16} /> {previewMode ? "Retour Édition" : "Aperçu"}
            </button>
          )}
          {canEdit && (
            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`flex items-center gap-2 px-4 py-2 ${isEditing ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded font-bold uppercase tracking-wider text-xs transition shadow-sm`}
            >
              {isEditing ? <><Save size={16} /> Enregistrer</> : <><Edit2 size={16} /> Éditer Prospectus</>}
            </button>
          )}
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded font-bold uppercase tracking-wider text-xs hover:bg-slate-700 transition shadow-sm">
            <Download size={16} /> Imprimer / PDF
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 animate-in fade-in shadow-xs font-semibold text-sm max-w-4xl mx-auto">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Le prospectus, les images et les sections ont été sauvegardés avec succès ! Ils restent conservés lors des prochaines visites et actualisations de la page.</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-4xl mx-auto print:shadow-none print:border-none">
        
        {/* Top Image */}
        <div className="aspect-[21/9] w-full bg-slate-100 flex flex-col items-center justify-center relative overflow-hidden group">
           <img src={imageUrl} alt="Prospectus" className="w-full h-full object-cover" />
           {isEditing && !previewMode && (
             <>
             <button onClick={() => document.getElementById("main-img-upload")?.click()} className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 text-gray-800 rounded font-bold uppercase tracking-wider text-xs hover:bg-white transition cursor-pointer shadow-sm z-10">
                <Upload size={16} /> Changer l'image
             </button>
             <input id="main-img-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, false)} />
             </>
           )}
        </div>

        {/* Dynamic Sections */}
        <div className="p-8 space-y-8">
           {sections.map((sec, i) => (
              <div key={i} className={`relative ${isEditing && !previewMode ? 'p-4 border border-dashed border-slate-300 rounded-lg' : ''}`}>
                 {isEditing && !previewMode && (
                    <button onClick={() => deleteSection(i)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 bg-white rounded shadow-sm"><Trash2 size={16}/></button>
                 )}
                 {isEditing && !previewMode ? (
                    <input value={sec.title} onChange={e => updateSection(i, 'title', e.target.value)} className="text-xl font-bold text-gray-700 mb-4 w-full border p-2 rounded" placeholder="Titre de la section..." />
                 ) : (
                    sec.title && <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2"><FileText size={20} className="text-emerald-600" /> {sec.title}</h3>
                 )}

                 {sec.type === "TEXT" && (
                    isEditing && !previewMode ? (
                       <textarea value={sec.content} onChange={e => updateSection(i, 'content', e.target.value)} className="w-full h-32 border p-2 rounded text-sm text-slate-600" placeholder="Contenu (le markdown gras est supporté avec **texte**)..." />
                    ) : (
                       <div className="space-y-2 text-sm text-slate-600 whitespace-pre-line">
                         {sec.content.split('\n').map((line: string, idx: number) => (
                           <p key={idx} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                         ))}
                       </div>
                    )
                 )}

                 {sec.type === "TABLE" && (
                    <div className="overflow-x-auto">
                       <table className="w-full text-left border-collapse">
                          <thead>
                             <tr className="bg-slate-50 border-y border-slate-200">
                                {sec.headers.map((h: string, colIdx: number) => (
                                   <th key={colIdx} className="p-3 text-xs font-bold text-slate-500 uppercase">
                                      {isEditing && !previewMode ? <input value={h} onChange={e => updateHeader(i, colIdx, e.target.value)} className="w-full bg-transparent border-b outline-none" /> : h}
                                   </th>
                                ))}
                             </tr>
                          </thead>
                          <tbody>
                             {sec.rows.map((row: string[], rowIdx: number) => (
                                <tr key={rowIdx} className="border-b border-slate-100">
                                   {row.map((cell: string, colIdx: number) => (
                                      <td key={colIdx} className="p-3 text-sm font-medium text-gray-700">
                                         {isEditing && !previewMode ? <input value={cell} onChange={e => updateTable(i, rowIdx, colIdx, e.target.value)} className="w-full border p-1 rounded" /> : cell}
                                      </td>
                                   ))}
                                </tr>
                             ))}
                          </tbody>
                       </table>
                       {isEditing && !previewMode && (
                          <div className="flex gap-2 mt-2">
                             <button onClick={() => addRow(i)} className="px-3 py-1 bg-slate-100 text-xs font-bold rounded hover:bg-slate-200">Ajouter Ligne</button>
                             <button onClick={() => addCol(i)} className="px-3 py-1 bg-slate-100 text-xs font-bold rounded hover:bg-slate-200">Ajouter Colonne</button>
                          </div>
                       )}
                    </div>
                 )}
              </div>
           ))}

           {isEditing && !previewMode && (
              <div className="flex gap-4 pt-4 border-t border-slate-200 justify-center">
                 <button onClick={() => addSection('TEXT')} className="px-4 py-2 bg-slate-100 text-slate-700 rounded font-bold uppercase text-xs flex items-center gap-2 hover:bg-slate-200"><Plus size={16}/> Texte</button>
                 <button onClick={() => addSection('TABLE')} className="px-4 py-2 bg-slate-100 text-slate-700 rounded font-bold uppercase text-xs flex items-center gap-2 hover:bg-slate-200"><Plus size={16}/> Tableau</button>
              </div>
           )}
        </div>

        {/* Bottom Image */}
        <div className="p-8 border-t border-slate-100 bg-slate-50 relative min-h-[200px] flex flex-col items-center justify-center">
           {isEditing && !previewMode && (
             <>
             <label htmlFor="bottom-img-upload" className="absolute top-4 right-4 z-10 flex items-center gap-2 px-4 py-2 bg-white text-gray-800 rounded font-bold uppercase tracking-wider text-xs border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-sm">
                <Upload size={16} /> {bottomImageUrl ? "Changer" : "Ajouter"} image bas
             </label>
             <input id="bottom-img-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, true)} />
             </>
           )}
           {bottomImageUrl ? (
             <img src={bottomImageUrl} alt="Bottom Prospectus" className="w-full max-h-96 object-contain rounded-lg shadow-sm" />
           ) : (
             isEditing && !previewMode && <p className="text-slate-400 text-sm">Aucune image en bas</p>
           )}
           {isEditing && !previewMode && bottomImageUrl && (
             <button onClick={() => setBottomImageUrl("")} className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-600 rounded text-xs font-bold uppercase hover:bg-red-200 transition">
               <X size={14} /> Supprimer
             </button>
           )}
        </div>
      </div>
    </div>
  );
}
