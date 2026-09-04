import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { X, UserPlus } from "lucide-react";
import { LEVELS } from "../types";

export function AddTeacherModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    subject: "",
    classes: [] as string[]
  });
  
  const handleToggleClass = (cls: string) => {
    setFormData(prev => ({
        ...prev,
        classes: prev.classes.includes(cls) ? prev.classes.filter(c => c !== cls) : [...prev.classes, cls]
    }));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // In a real app, we might need an auth user for the teacher, but for now we just create a profile or a 'teachers' table entry.
      // Wait, teachers are in 'profiles' table with role='TEACHER'
      // But creating a profile without an auth user might fail if there's a foreign key on id.
      // We will create a dummy id, or just insert into profiles if it allows it.
      // Let's check if we can insert into profiles.
      const dummyId = crypto.randomUUID();
      const { error } = await supabase.from('profiles').insert({
        id: dummyId,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        role: 'TEACHER',
        school_id: user?.schoolId
      });
      if (error) throw error;
      
      if (formData.subject && formData.classes.length > 0) {
          const coursesToInsert = formData.classes.map(cls => ({
              school_id: user?.schoolId,
              name: formData.subject,
              level: cls,
              teacher_id: dummyId
          }));
          await supabase.from('courses').insert(coursesToInsert);
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
            <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Email</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Téléphone</label>
            <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Matière enseignée</label>
            <input type="text" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Mathématiques, Français..." className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Classes (Cochez une ou plusieurs)</label>
            <div className="max-h-32 overflow-y-auto border border-slate-300 rounded p-2 grid grid-cols-2 gap-2 bg-slate-50">
               {LEVELS.map(l => (
                   <label key={l} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                       <input type="checkbox" checked={formData.classes.includes(l)} onChange={() => handleToggleClass(l)} className="rounded text-emerald-600 focus:ring-emerald-500" />
                       {l}
                   </label>
               ))}
            </div>
          </div>
          <div className="pt-4 flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 py-2 bg-white border border-slate-200 text-gray-700 rounded font-semibold hover:bg-slate-50 transition-colors">Annuler</button>
             <button type="submit" disabled={loading} className="flex-1 py-2 bg-emerald-600 text-white rounded font-semibold hover:bg-emerald-700 transition-colors">{loading ? "..." : "Enregistrer"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
