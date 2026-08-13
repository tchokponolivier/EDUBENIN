import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { X, Save, UserPlus, Camera, FileText, Calendar } from "lucide-react";
import { LEVELS } from "../types";

export function AddStudentModal({ isOpen, onClose, onSuccess, initialData = null }: { isOpen: boolean, onClose: () => void, onSuccess: () => void, initialData?: any }) {
  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  
  const [isVerifying, setIsVerifying] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [level, setLevel] = useState(LEVELS[0]);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [photo, setPhoto] = useState<string>("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [studentType, setStudentType] = useState<"NEW" | "OLD">("NEW");
  const [previousClass, setPreviousClass] = useState("");
  const [previousSchool, setPreviousSchool] = useState("");
  const [lastYearAttended, setLastYearAttended] = useState("");
  const [status, setStatus] = useState<"PASSING" | "REPEATING" | "EXCLUDED">("PASSING");
  const [educmasterNumber, setEducmasterNumber] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [nationality, setNationality] = useState("Béninoise");
  const [religion, setReligion] = useState("Christianisme");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [fatherProfession, setFatherProfession] = useState("");
  const [motherProfession, setMotherProfession] = useState("");
  const [fatherContact, setFatherContact] = useState("");
  const [fatherAddress, setFatherAddress] = useState("");
  const [motherContact, setMotherContact] = useState("");
  const [motherAddress, setMotherAddress] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianContact, setGuardianContact] = useState("");
  const [guardianAddress, setGuardianAddress] = useState("");
  const [canteenOptions, setCanteenOptions] = useState<string[]>([]);
  const [disciplinaryCommitment, setDisciplinaryCommitment] = useState(false);
  const [disciplinarySignature, setDisciplinarySignature] = useState("");
  const [settings, setSettings] = useState<any>(null);
  const editingChildId = initialData?.id;

  useEffect(() => {
    if (isOpen) {
      supabase.from('schools').select('*').limit(1).then(({ data }) => {
        if (data && data.length > 0) setSettings(data[0]);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFirstName(initialData.first_name || "");
      setLastName(initialData.last_name || "");
      setLevel(initialData.level || LEVELS[0]);
      setDateOfBirth(initialData.date_of_birth || "");
      setPlaceOfBirth(initialData.place_of_birth || "");
      setGender(initialData.gender || "MALE");
      setStudentType(initialData.student_type || "NEW");
      setPreviousClass(initialData.previous_class || "");
      setPreviousSchool(initialData.previous_school || "");
      setLastYearAttended(initialData.last_year_attended || "");
      setEducmasterNumber(initialData.educmaster_number || "");
      setNationality(initialData.nationality || "Béninoise");
      setReligion(initialData.religion || "Christianisme");
      setFatherName(initialData.father_name || "");
      setFatherProfession(initialData.father_profession || "");
      setFatherContact(initialData.father_contact || "");
      setFatherAddress(initialData.father_address || "");
      setMotherName(initialData.mother_name || "");
      setMotherProfession(initialData.mother_profession || "");
      setMotherContact(initialData.mother_contact || "");
      setMotherAddress(initialData.mother_address || "");
      setGuardianName(initialData.guardian_name || "");
      setGuardianContact(initialData.guardian_contact || "");
      setGuardianAddress(initialData.guardian_address || "");
      setCanteenOptions(initialData.canteen_options ? initialData.canteen_options.split(", ") : []);
      setDisciplinaryCommitment(initialData.disciplinary_commitment || false);
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let finalStudentType = studentType;
    let finalLastYear = lastYearAttended;

    const studentData = {
      firstName, lastName, level, dateOfBirth, placeOfBirth,
      studentType: finalStudentType, previousClass, previousSchool,
      lastYearAttended: finalLastYear, educmasterNumber, gender,
      nationality, religion, fatherName, motherName, fatherProfession,
      motherProfession, fatherContact, fatherAddress, motherContact,
      motherAddress, guardianName, guardianContact, guardianAddress,
      canteenOptions, disciplinaryCommitment, disciplinarySignature
    };

    if (initialData?.id) {
      await supabase.from('students').update({
        first_name: studentData.firstName,
        last_name: studentData.lastName,
        level: studentData.level,
        date_of_birth: studentData.dateOfBirth || null,
        gender: studentData.gender,
        place_of_birth: studentData.placeOfBirth || null,
        student_type: studentData.studentType,
        previous_class: studentData.previousClass,
        previous_school: studentData.previousSchool,
        last_year_attended: studentData.lastYearAttended,
        educmaster_number: studentData.educmasterNumber,
        nationality: studentData.nationality,
        religion: studentData.religion,
        father_name: studentData.fatherName,
        mother_name: studentData.motherName,
        father_profession: studentData.fatherProfession,
        mother_profession: studentData.motherProfession,
        father_contact: studentData.fatherContact,
        father_address: studentData.fatherAddress,
        mother_contact: studentData.motherContact,
        mother_address: studentData.motherAddress,
        guardian_name: studentData.guardianName,
        guardian_contact: studentData.guardianContact,
        guardian_address: studentData.guardianAddress,
        disciplinary_commitment: studentData.disciplinaryCommitment,
        disciplinary_signature: studentData.disciplinarySignature,
        canteen_options: studentData.canteenOptions.join(", ")
      }).eq('id', initialData.id);
    } else {
      const { data: schools } = await supabase.from('schools').select('id').limit(1);
      const insertSchoolId = user?.schoolId || (schools && schools.length > 0 ? schools[0].id : null);
      
      const { error } = await supabase.from('students').insert({
        parent_id: user?.role === 'PARENT' ? user.id : null,
        first_name: studentData.firstName,
        last_name: studentData.lastName,
        level: studentData.level,
        date_of_birth: studentData.dateOfBirth || null,
        place_of_birth: studentData.placeOfBirth || null,
        gender: studentData.gender,
        student_type: studentData.studentType,
        previous_class: studentData.previousClass,
        previous_school: studentData.previousSchool,
        last_year_attended: studentData.lastYearAttended,
        educmaster_number: studentData.educmasterNumber,
        nationality: studentData.nationality,
        religion: studentData.religion,
        father_name: studentData.fatherName,
        mother_name: studentData.motherName,
        father_profession: studentData.fatherProfession,
        mother_profession: studentData.motherProfession,
        father_contact: studentData.fatherContact,
        father_address: studentData.fatherAddress,
        mother_contact: studentData.motherContact,
        mother_address: studentData.motherAddress,
        guardian_name: studentData.guardianName,
        guardian_contact: studentData.guardianContact,
        guardian_address: studentData.guardianAddress,
        disciplinary_commitment: studentData.disciplinaryCommitment,
        disciplinary_signature: studentData.disciplinarySignature,
        school_id: insertSchoolId,
        canteen_options: studentData.canteenOptions.join(", ")
      });
      if (error) {
         alert("Erreur lors de l'inscription: " + error.message);
         return;
      }
    }
    
    alert("Opération effectuée avec succès !");
    onSuccess();
    onClose();
  };

  const isPrimarySchool = (lv: string) => {
    return lv.startsWith("Maternelle") || lv.startsWith("CI") || lv.startsWith("CP") || lv.startsWith("CE") || lv.startsWith("CM");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <UserPlus size={18} className="text-emerald-600" /> {initialData ? "Modifier l'élève" : "Inscrire un élève"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white shadow-sm p-1.5 rounded-full border border-slate-200">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto grow">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 1: Informations de l'enfant */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-widest border-l-4 border-emerald-500 pl-2">Informations de l'élève</h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-3 flex items-center gap-4">
                   <div 
                     className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 cursor-pointer hover:bg-slate-100 shrink-0"
                     onClick={() => fileInputRef.current?.click()}
                   >
                     {photo ? <img src={photo} className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-slate-400" />}
                   </div>
                   <div>
                      <p className="text-xs font-bold text-gray-700">Photo de l'enfant</p>
                      <p className="text-[10px] text-slate-500">Cliquez pour ajouter</p>
                      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
                   </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Statut Élève</label>
                  <select value={studentType} onChange={e => setStudentType(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                    <option value="NEW">Nouvel élève</option>
                    <option value="OLD">Ancien élève (Réinscription)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Prénom</label>
                  <input required value={firstName} onChange={e => setFirstName(e.target.value)} type="text" className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Nom</label>
                  <input required value={lastName} onChange={e => setLastName(e.target.value)} type="text" className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Sexe</label>
                  <select value={gender} onChange={e => setGender(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                    <option value="MALE">Masculin</option>
                    <option value="FEMALE">Féminin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Date de naissance</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input required value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} type="date" className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Lieu de naissance</label>
                  <input required value={placeOfBirth} onChange={e => setPlaceOfBirth(e.target.value)} type="text" className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Nationalité</label>
                  <select required value={nationality} onChange={e => setNationality(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                    <option value="Béninoise">Béninoise</option>
                    <option value="Togolaise">Togolaise</option>
                    <option value="Ivoirienne">Ivoirienne</option>
                    <option value="Nigériane">Nigériane</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Religion</label>
                  <select required value={religion} onChange={e => setReligion(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                    <option value="Christianisme">Christianisme</option>
                    <option value="Islam">Islam</option>
                    <option value="Animisme">Animisme</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Parcours scolaire */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-widest border-l-4 border-emerald-500 pl-2">Parcours scolaire</h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Classe demandée</label>
                  <select value={level} onChange={e => setLevel(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Statut</label>
                  <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                    <option value="PASSING">Passant</option>
                    <option value="REPEATING">Redoublant</option>
                    <option value="EXCLUDED">Exclu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">N° EducMaster</label>
                  <input value={educmasterNumber} onChange={e => setEducmasterNumber(e.target.value)} type="text" placeholder="Optionnel" className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-slate-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Dernière année fréquentée</label>
                  <input required placeholder="Ex: 2023 ou 2023-2024" value={lastYearAttended} onChange={e => setLastYearAttended(e.target.value)} type="text" className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Etablissement antérieur</label>
                  <input required={studentType === 'NEW'} value={previousSchool} onChange={e => setPreviousSchool(e.target.value)} type="text" placeholder="Obligatoire si nouvel élève" className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-slate-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Classe antérieure</label>
                  <select value={previousClass} onChange={e => setPreviousClass(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-700">
                    <option value="">Sélectionner ou Aucun</option>
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Parents & Tuteurs */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-widest border-l-4 border-emerald-500 pl-2">Parents / Tuteur</h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Père */}
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
                  <div className="col-span-1 md:col-span-3">
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Adresse (Père)</label>
                    <input value={fatherAddress} onChange={e => setFatherAddress(e.target.value)} type="text" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                  </div>
                </div>

                {/* Mère */}
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
                  <div className="col-span-1 md:col-span-3">
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Adresse (Mère)</label>
                    <input value={motherAddress} onChange={e => setMotherAddress(e.target.value)} type="text" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                  </div>
                </div>

                {/* Tuteur */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h5 className="font-bold text-xs text-slate-500 uppercase">Tuteur (Optionnel)</h5>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Nom & Prénom du tuteur</label>
                    <input value={guardianName} onChange={e => setGuardianName(e.target.value)} type="text" placeholder="Si différent des parents" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-slate-300" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">WhatsApp / Contact du tuteur</label>
                    <input value={guardianContact} onChange={e => setGuardianContact(e.target.value)} type="tel" placeholder="Si différent des parents" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-slate-300" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Adresse (Tuteur)</label>
                    <input value={guardianAddress} onChange={e => setGuardianAddress(e.target.value)} type="text" placeholder="Si différent des parents" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-slate-300" />
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
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <p className="text-sm text-slate-600 mb-4">
                  En inscrivant votre enfant, vous vous engagez à ce qu'il/elle respecte le règlement intérieur de l'établissement.
                </p>
                <div className="flex gap-4 mb-4">
                  <button 
                    type="button" 
                    onClick={() => alert("Ce document est disponible dans l'espace Parent.")}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded text-xs font-bold text-gray-700 hover:bg-slate-50 transition-colors"
                  >
                    <FileText size={16} />
                    Lire & Télécharger la Fiche d'Engagement
                  </button>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      required
                      checked={disciplinaryCommitment}
                      onChange={e => setDisciplinaryCommitment(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm font-bold text-gray-700">
                      Je reconnais avoir lu et j'accepte sans réserve les termes de l'engagement disciplinaire.
                    </span>
                  </label>
                  
                  {disciplinaryCommitment && (
                    <div className="mt-4">
                      <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Signature (Écrivez votre nom complet précédé de "Lu et approuvé")</label>
                      <input 
                        required 
                        value={disciplinarySignature} 
                        onChange={e => setDisciplinarySignature(e.target.value)} 
                        type="text" 
                        placeholder="Lu et approuvé, [Votre Nom]"
                        className="w-full md:w-1/2 px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" 
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => onClose()} className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded uppercase tracking-wider transition-colors">Annuler</button>
              <button type="submit" disabled={isVerifying} className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 disabled:cursor-wait rounded shadow-sm uppercase tracking-wider transition-colors">
                 {isVerifying ? "Vérification en cours..." : (editingChildId ? "Enregistrer les modifications" : "Valider l'inscription")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
