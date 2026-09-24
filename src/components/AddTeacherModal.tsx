import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { X, UserPlus } from "lucide-react";
import { LEVELS, SUBJECTS } from "../types";

export function AddTeacherModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  currentAcademicYear,
  schoolSubjects
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void; 
  currentAcademicYear?: string;
  schoolSubjects?: string[];
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    teacherType: "Permanent", // "Permanent" | "Vacataire"
    subject: "",
    classes: [] as string[]
  });
  const [classCoefs, setClassCoefs] = useState<Record<string, number>>({});
  
  const subjectsToDisplay = schoolSubjects && schoolSubjects.length > 0 ? schoolSubjects : SUBJECTS;
  
  const handleToggleClass = (cls: string) => {
    setFormData(prev => {
        if (prev.classes.includes(cls)) {
            const newClasses = prev.classes.filter(c => c !== cls);
            return { ...prev, classes: newClasses };
        } else {
            return { ...prev, classes: [...prev.classes, cls] };
        }
    });
    setClassCoefs(prev => {
        if (prev[cls] !== undefined) {
            const next = { ...prev };
            delete next[cls];
            return next;
        } else {
            return { ...prev, [cls]: 1 };
        }
    });
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dummyId = crypto.randomUUID();
      const generatedEmail = `prof_${Date.now()}_${Math.floor(Math.random() * 1000)}@ecole.local`;
      const { error } = await supabase.from('profiles').insert({
        id: dummyId,
        full_name: formData.fullName,
        email: generatedEmail,
        phone: formData.phone,
        role: 'TEACHER',
        school_id: user?.schoolId,
        title: formData.teacherType // Storing teacher type (Permanent / Vacataire) in title or metadata
      });
      if (error) throw error;
      
      if (formData.subject && formData.classes.length > 0 && user?.schoolId) {
        let currentMeta: Record<string, any> = {};
        try {
          const raw = localStorage.getItem(`school_courses_meta_${user.schoolId}`);
          if (raw) currentMeta = JSON.parse(raw);
        } catch (e) {}

        for (const cls of formData.classes) {
          const coef = classCoefs[cls] || 1;
          const { data: existing } = await supabase.from('courses')
            .select('id')
            .eq('school_id', user.schoolId)
            .ilike('name', formData.subject.trim())
            .eq('level', cls)
            .maybeSingle();

          if (existing) {
            await supabase.from('courses').update({
              teacher_id: dummyId
            }).eq('id', existing.id);

            currentMeta[existing.id] = { coefficient: coef, academic_year: currentAcademicYear || null };
            currentMeta[`${formData.subject.trim().toLowerCase()}_${cls}`] = { coefficient: coef, academic_year: currentAcademicYear || null };
          } else {
            const { data: newCourse } = await supabase.from('courses').insert([{
              school_id: user.schoolId,
              name: formData.subject.trim(),
              level: cls,
              teacher_id: dummyId
            }]).select().maybeSingle();

            if (newCourse?.id) {
              currentMeta[newCourse.id] = { coefficient: coef, academic_year: currentAcademicYear || null };
            }
            currentMeta[`${formData.subject.trim().toLowerCase()}_${cls}`] = { coefficient: coef, academic_year: currentAcademicYear || null };
          }
        }

        try {
          localStorage.setItem(`school_courses_meta_${user.schoolId}`, JSON.stringify(currentMeta));
        } catch (e) {}
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      alert("Erreur lors de l'inscription: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <UserPlus size={18} className="text-emerald-600" /> Inscrire un Professeur
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Nom Complet</label>
            <input 
              type="text" 
              required 
              placeholder="Ex: M. KOFFI Jean"
              value={formData.fullName} 
              onChange={e => setFormData({...formData, fullName: e.target.value})} 
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 outline-none text-sm" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Type de Professeur</label>
            <select 
              value={formData.teacherType} 
              onChange={e => setFormData({...formData, teacherType: e.target.value})} 
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 outline-none bg-white text-sm font-medium"
            >
              <option value="Permanent">Permanent</option>
              <option value="Vacataire">Vacataire</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Téléphone</label>
            <input 
              type="text" 
              placeholder="Ex: +229 97 00 00 00"
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 outline-none text-sm" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Matière enseignée</label>
            <select required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 outline-none bg-white text-sm font-medium">
              <option value="" disabled>Sélectionnez une matière</option>
              {subjectsToDisplay.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Classes (Cochez une ou plusieurs)</label>
            <div className="max-h-48 overflow-y-auto border border-slate-300 rounded p-2 flex flex-col gap-2 bg-slate-50">
               {LEVELS.map(l => (
                   <div key={l} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-1 border-b border-slate-200 last:border-0">
                       <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer flex-1">
                           <input type="checkbox" checked={formData.classes.includes(l)} onChange={() => handleToggleClass(l)} className="rounded text-emerald-600 focus:ring-emerald-500" />
                           <span className="font-medium">{l}</span>
                       </label>
                       {formData.classes.includes(l) && (
                           <div className="flex items-center gap-2">
                             <span className="text-xs text-slate-500">Coef.</span>
                             <input type="number" min="1" value={classCoefs[l] || 1} onChange={e => setClassCoefs(prev => ({...prev, [l]: Number(e.target.value)}))} className="w-16 px-2 py-1 text-xs border border-slate-300 rounded outline-none" required />
                           </div>
                       )}
                   </div>
               ))}
            </div>
          </div>
          <div className="pt-4 flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 py-2 bg-white border border-slate-200 text-gray-700 rounded font-semibold hover:bg-slate-50 transition-colors text-sm">Annuler</button>
             <button type="submit" disabled={loading} className="flex-1 py-2 bg-emerald-600 text-white rounded font-semibold hover:bg-emerald-700 transition-colors text-sm">{loading ? "..." : "Enregistrer"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
