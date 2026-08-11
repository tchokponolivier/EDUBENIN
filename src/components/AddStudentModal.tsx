import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { X, Save, UserPlus } from "lucide-react";
import { LEVELS } from "../types";

export function AddStudentModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    level: LEVELS[0],
    gender: "MALE",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('students').insert({
        first_name: formData.firstName,
        last_name: formData.lastName,
        level: formData.level,
        gender: formData.gender,
        
        school_id: user?.schoolId,
        parent_id: user?.id // using whoever is creating it as a placeholder parent for now if needed, or null
      });
      if (error) throw error;
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <UserPlus size={18} className="text-emerald-600" /> Inscrire un élève
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Nom</label>
              <input type="text" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Prénoms</label>
              <input type="text" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Classe</label>
              <select required value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 outline-none">
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Sexe</label>
              <select required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 outline-none">
                <option value="MALE">Masculin</option>
                <option value="FEMALE">Féminin</option>
              </select>
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
