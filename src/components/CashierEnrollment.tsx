import React, { useState } from "react";
import { Plus, UserPlus, FileText, CheckCircle2 } from "lucide-react";
import { LEVELS } from "../types";


export function CashierEnrollment() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [level, setLevel] = useState(LEVELS[0]);
  const [gender, setGender] = useState("MALE");
  const [studentType, setStudentType] = useState("NEW");
  
  const [fatherName, setFatherName] = useState("");
  const [fatherProfession, setFatherProfession] = useState("");
  const [fatherContact, setFatherContact] = useState("");
  
  const [motherName, setMotherName] = useState("");
  const [motherProfession, setMotherProfession] = useState("");
  const [motherContact, setMotherContact] = useState("");
  
  const [guardianName, setGuardianName] = useState("");
  const [guardianContact, setGuardianContact] = useState("");
  
  const [canteenOptions, setCanteenOptions] = useState<string[]>([]);
  const [disciplinaryCommitment, setDisciplinaryCommitment] = useState(false);
  const [disciplinarySignature, setDisciplinarySignature] = useState("");

  const isPrimarySchool = (lv: string) => {
    return lv.startsWith("Maternelle") || lv.startsWith("CI") || lv.startsWith("CP") || lv.startsWith("CE") || lv.startsWith("CM");
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setDateOfBirth("");
    setLevel(LEVELS[0]);
    setGender("MALE");
    setStudentType("NEW");
    setFatherName("");
    setFatherProfession("");
    setFatherContact("");
    setMotherName("");
    setMotherProfession("");
    setMotherContact("");
    setGuardianName("");
    setGuardianContact("");
    setCanteenOptions([]);
    setDisciplinaryCommitment(false);
    setDisciplinarySignature("");
    setEditingChildId(null);
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setShowAddForm(false);
      resetForm();
      alert("Inscription validée avec succès !");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {!showAddForm ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Gestion des Inscriptions</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Enregistrez un nouvel élève, collectez les informations parentales et validez son inscription dans le système.
          </p>
          <button 
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-sm transition-colors"
          >
            <Plus size={20} /> Nouvelle Inscription
          </button>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full">
          <form onSubmit={handleEnroll} className="space-y-8">
            <h3 className="font-bold text-gray-700 mb-6 pb-2 border-b border-slate-100 text-lg">Nouvelle Inscription (Caisse)</h3>

            {/* Section 1: Identité de l'élève */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-widest border-l-4 border-emerald-500 pl-2">1. Identité de l'élève</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Nom de l'enfant</label>
                  <input required value={lastName} onChange={e => setLastName(e.target.value)} type="text" className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Prénoms</label>
                  <input required value={firstName} onChange={e => setFirstName(e.target.value)} type="text" className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Date de Naissance</label>
                  <input required value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} type="date" className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Sexe</label>
                  <select required value={gender} onChange={e => setGender(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                    <option value="MALE">Masculin</option>
                    <option value="FEMALE">Féminin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Classe d'inscription</label>
                  <select required value={level} onChange={e => setLevel(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Statut</label>
                  <select required value={studentType} onChange={e => setStudentType(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                    <option value="NEW">Nouvel élève</option>
                    <option value="OLD">Ancien élève (Réinscription)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Filiation */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-widest border-l-4 border-emerald-500 pl-2">2. Filiation et Contacts</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h5 className="font-bold text-xs text-slate-500 uppercase">Informations du Père</h5>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Nom & Prénoms</label>
                    <input required value={fatherName} onChange={e => setFatherName(e.target.value)} type="text" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Profession</label>
                    <input required value={fatherProfession} onChange={e => setFatherProfession(e.target.value)} type="text" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">WhatsApp / Contact</label>
                    <input required value={fatherContact} onChange={e => setFatherContact(e.target.value)} type="tel" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h5 className="font-bold text-xs text-slate-500 uppercase">Informations de la Mère</h5>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Nom & Prénoms</label>
                    <input required value={motherName} onChange={e => setMotherName(e.target.value)} type="text" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Profession</label>
                    <input required value={motherProfession} onChange={e => setMotherProfession(e.target.value)} type="text" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">WhatsApp / Contact</label>
                    <input required value={motherContact} onChange={e => setMotherContact(e.target.value)} type="tel" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 lg:col-span-2">
                  <h5 className="font-bold text-xs text-slate-500 uppercase">Tuteur (Optionnel)</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Nom & Prénom du tuteur</label>
                      <input value={guardianName} onChange={e => setGuardianName(e.target.value)} type="text" placeholder="Si différent des parents" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-slate-300" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">WhatsApp / Contact du tuteur</label>
                      <input value={guardianContact} onChange={e => setGuardianContact(e.target.value)} type="tel" placeholder="Si différent des parents" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-slate-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Options */}
            {isPrimarySchool(level) && (
              <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100">
                <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-widest border-l-4 border-emerald-500 pl-2">Services optionnels (Cantine)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    "Garde surveillée (200F / jour)",
                    "Repas cantine (200F / jour)",
                    "Repas cantine (500F / jour)",
                    "Repas cantine (1000F / jour)",
                    "Non intéressé"
                  ].map(opt => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer bg-white p-3 rounded-lg border border-emerald-100 hover:border-emerald-300 transition-colors shadow-sm">
                      <input 
                        type="checkbox" 
                        checked={canteenOptions.includes(opt)}
                        onChange={(e) => {
                          if (e.target.checked) setCanteenOptions([...canteenOptions, opt])
                          else setCanteenOptions(canteenOptions.filter(o => o !== opt))
                        }}
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm font-bold text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {/* Section 4: Engagement Disciplinaire */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-widest border-l-4 border-emerald-500 pl-2">Engagement Disciplinaire</h4>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    required
                    checked={disciplinaryCommitment}
                    onChange={e => setDisciplinaryCommitment(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm font-bold text-gray-700">
                    Le parent reconnaît avoir lu et accepte sans réserve les termes de l'engagement disciplinaire.
                  </span>
                </label>
                
                
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => { setShowAddForm(false); resetForm(); }} className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded uppercase tracking-wider transition-colors">Annuler</button>
              <button type="submit" disabled={isVerifying} className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 disabled:cursor-wait rounded shadow-sm uppercase tracking-wider transition-colors">
                {isVerifying ? "Enregistrement..." : "Valider l'inscription"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
