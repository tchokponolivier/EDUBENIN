import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { EduBeninLogo } from '../components/Logo';
import { 
  Building, 
  MapPin, 
  Phone, 
  Coins, 
  User, 
  CheckCircle2, 
  Sparkles, 
  GraduationCap, 
  ShieldCheck, 
  ArrowRight,
  School
} from 'lucide-react';

const COUNTRY_DIAL_CODES = [
  { code: 'BJ', dial: '+229', name: 'Bénin (BJ)' },
  { code: 'TG', dial: '+228', name: 'Togo (TG)' },
  { code: 'CI', dial: '+225', name: "Côte d'Ivoire (CI)" },
  { code: 'SN', dial: '+221', name: 'Sénégal (SN)' },
  { code: 'BF', dial: '+226', name: 'Burkina Faso (BF)' },
  { code: 'NE', dial: '+227', name: 'Niger (NE)' },
  { code: 'ML', dial: '+223', name: 'Mali (ML)' },
  { code: 'GN', dial: '+224', name: 'Guinée (GN)' },
  { code: 'CM', dial: '+237', name: 'Cameroun (CM)' },
  { code: 'GA', dial: '+241', name: 'Gabon (GA)' },
  { code: 'CD', dial: '+243', name: 'RDC (CD)' },
  { code: 'CG', dial: '+242', name: 'Congo (CG)' },
  { code: 'FR', dial: '+33', name: 'France (FR)' },
  { code: 'US', dial: '+1', name: 'États-Unis (US)' },
];

export function SchoolOnboarding() {
  const { user, updateUserSchool } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [phoneDial, setPhoneDial] = useState('+229');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    locality: '',
    currency: 'FCFA',
    directorName: user?.name || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Le nom de l'établissement est requis.");
      return;
    }
    if (!phoneNumber.trim()) {
      setError("Le numéro de téléphone est requis.");
      return;
    }

    setLoading(true);
    setError('');

    const fullPhone = `${phoneDial} ${phoneNumber.trim()}`;

    try {
      // 1. Create the school record
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .insert([{
          name: formData.name.trim(),
          locality: formData.locality.trim() || 'Bénin',
          contacts: fullPhone,
          motto: formData.currency, // Financial currency stored in motto
          mobile_money_numbers: {}
        }])
        .select()
        .single();

      if (schoolError) throw schoolError;
      if (!school?.id) throw new Error("Échec de création de l'établissement.");

      // 2. Link profile to the new school in Supabase (with resilient fallback for RLS)
      const directorFullName = formData.directorName.trim() || user?.name || 'Directeur';
      
      let effectiveUserId = user?.id;
      let effectiveEmail = user?.email;

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          effectiveUserId = sessionData.session.user.id;
          effectiveEmail = sessionData.session.user.email || effectiveEmail;
        }
      } catch (sessionErr) {
        console.warn("Could not retrieve current Supabase session:", sessionErr);
      }

      if (effectiveUserId) {
        try {
          // Attempt upsert first
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: effectiveUserId,
              email: effectiveEmail,
              school_id: school.id,
              role: 'SCHOOL_ADMIN',
              full_name: directorFullName
            });

          if (profileError) {
            console.warn("Profile upsert encountered RLS or error, attempting update:", profileError.message);
            // Attempt update in case profile already existed
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                school_id: school.id,
                role: 'SCHOOL_ADMIN',
                full_name: directorFullName
              })
              .eq('id', effectiveUserId);

            if (updateError) {
              console.warn("Profile update also returned error:", updateError.message);
            }
          }
        } catch (profileErr: any) {
          // Do NOT block school creation if profiles table has strict RLS
          console.warn("Ignored profile RLS error during school onboarding:", profileErr);
        }
      }

      // 3. Update local caches and Auth Context
      localStorage.setItem('edubenin_active_school_id', school.id);
      localStorage.setItem(`school_currency_${school.id}`, formData.currency);
      localStorage.setItem(`schoolSettings_extra_${school.id}`, JSON.stringify({
        currency: formData.currency,
        academicYear: "2024-2025"
      }));

      // Update mock/auth user in localStorage if present
      const savedUserStr = localStorage.getItem("edubenin_auth");
      if (savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr);
          parsed.schoolId = school.id;
          parsed.role = 'SCHOOL_ADMIN';
          parsed.schoolName = school.name;
          localStorage.setItem("edubenin_auth", JSON.stringify(parsed));
        } catch (e) {}
      }

      localStorage.removeItem("pending_google_role");

      if (updateUserSchool) {
        updateUserSchool(school.id, school.name);
      }

      // 4. Redirect smoothly to the director dashboard
      navigate("/school-admin", { replace: true });
      
    } catch (err: any) {
      console.error("Onboarding error:", err);
      setError(err.message || 'Une erreur est survenue lors de la création de votre établissement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans">
      {/* Landscape Container on Desktop (lg & xl), Portrait on Mobile */}
      <div className="w-full max-w-xl lg:max-w-5xl xl:max-w-6xl bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-200 overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left Side: Branded Visual Landscape Panel (Hidden on mobile or stacked top, visible on desktop) */}
        <div className="lg:w-[42%] xl:w-[40%] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden select-none">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Logo & Platform Badge */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-1.5 shadow-lg">
                <EduBeninLogo className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white">EDU-BENIN</h1>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  Plateforme Officielle
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-4">
              <Sparkles size={12} /> Espace Direction Générale
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              Bienvenue sur votre portail de gestion
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed font-normal">
              Initialisez les informations fondamentales de votre établissement pour configurer votre tableau de bord, vos registres scolaires et vos bilans financiers.
            </p>
          </div>

          {/* Key Advantages Checklist */}
          <div className="relative z-10 my-8 space-y-3.5">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <GraduationCap size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Gestion Pédagogique & Bulletins</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Calcul automatique des moyennes et formats officiels conformes aux directives MENAP Bénin.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Coins size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Comptabilité & Trésorerie</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Suivi des scolarités, reçus imprimables, salaires du personnel et gestion des dépenses.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Sécurité & Continuité Cloud</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Vos données d'élèves sont sauvegardées en temps réel et accessibles 24h/24.</p>
              </div>
            </div>
          </div>

          {/* Footer Badge */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>EduBénin Pro &copy; {new Date().getFullYear()}</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 size={13} /> Prêt pour l'Afrique de l'Ouest
            </span>
          </div>
        </div>

        {/* Right Side: Setup Form (Landscape Grid on Desktop, Single Column on Mobile) */}
        <div className="flex-1 p-6 sm:p-10 lg:p-12 bg-white flex flex-col justify-center">
          <div className="max-w-xl mx-auto w-full">
            <div className="mb-6 lg:mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                <School size={13} /> Première Connexion
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Configurez votre établissement
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                Renseignez ces informations qui serviront à personnaliser vos documents officiels, reçus et bulletins scolaires.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-red-600 mt-1.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Nom de l'établissement */}
              <div>
                <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Nom de l'établissement <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building size={16} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-gray-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    placeholder="Ex: Complexe Scolaire Saint Olivier"
                  />
                </div>
              </div>

              {/* Landscape 2-Columns Grid: Localité & Monnaie */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Localité / Ville */}
                <div>
                  <label htmlFor="locality" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Localité / Ville <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <MapPin size={16} />
                    </div>
                    <input
                      type="text"
                      name="locality"
                      id="locality"
                      required
                      value={formData.locality}
                      onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-gray-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                      placeholder="Ex: Cotonou, Akpakpa"
                    />
                  </div>
                </div>

                {/* Monnaie utilisée pour les données financières */}
                <div>
                  <label htmlFor="currency" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Monnaie financière <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Coins size={16} />
                    </div>
                    <select
                      name="currency"
                      id="currency"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition cursor-pointer"
                    >
                      <option value="FCFA">Franc CFA (FCFA / XOF / XAF)</option>
                      <option value="GNF">Franc Guinéen (GNF)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="USD">Dollar US ($)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Numéro de téléphone avec choix de l'indicatif */}
              <div>
                <label htmlFor="phoneNumber" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Numéro de téléphone <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2.5">
                  {/* Choix de l'indicatif */}
                  <div className="w-36 sm:w-44 shrink-0">
                    <select
                      id="phoneDial"
                      value={phoneDial}
                      onChange={(e) => setPhoneDial(e.target.value)}
                      className="block w-full py-3 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition cursor-pointer"
                      title="Choisir l'indicatif du pays"
                    >
                      {COUNTRY_DIAL_CODES.map((c) => (
                        <option key={c.code} value={c.dial}>
                          {c.dial} ({c.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Saisie du numéro */}
                  <div className="relative flex-1 rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone size={16} />
                    </div>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-gray-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                      placeholder="97 00 00 00"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Ce numéro servira de contact principal pour les parents et sur les reçus de scolarité.
                </p>
              </div>

              {/* Nom et Prénom du Directeur */}
              <div>
                <label htmlFor="directorName" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Nom et Prénom du Directeur <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    name="directorName"
                    id="directorName"
                    required
                    value={formData.directorName}
                    onChange={(e) => setFormData({ ...formData, directorName: e.target.value })}
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-gray-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    placeholder="Ex: Marcellin HOUENOU"
                  />
                </div>
              </div>

              {/* Submit Button (NO Quitter button as requested!) */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl text-sm font-black uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? "Création de l'établissement..." : "Créer mon établissement"}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Vos paramètres d'établissement pourront être ajustés à tout moment.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
