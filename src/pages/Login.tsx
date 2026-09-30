import React, { useState } from "react";
import { useAuth } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import { EduBeninLogo } from "../components/Logo";
import { formatErrorMessage } from "../lib/errorHandler";
import { Facebook, Globe, Smartphone, X, Building, GraduationCap, FileText, Shield, Wallet, Users, BookOpen, ChevronRight, Sparkles } from "lucide-react";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const { user, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const [loginMethod, setLoginMethod] = useState<'email' | 'google' | null>(null);

  React.useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // Instead of logging in directly, show the role selection modal
    setLoginMethod('email');
    setShowRoleModal(true);
  };

  const handleGoogleClick = () => {
    setLoginMethod('google');
    setShowRoleModal(true);
  };

  const handleRoleSelection = async (role: string) => {
    setShowRoleModal(false);
    if (loginMethod === 'email') {
      login(email, fullName, password, role);
      navigate("/dashboard");
    } else if (loginMethod === 'google') {
      localStorage.setItem('pending_google_role', role);
      try {
        setError("");
        await loginWithGoogle();
      } catch (err: any) {
        setError(formatErrorMessage(err));
      }
    }
  };

  const sampleUsers = [
    { email: "admin@school.com", title: "Directeur", desc: "Gestion globale" },
    { email: "director@school.com", title: "Directeur des Études", desc: "Pédagogie & Notes" },
    { email: "secretary@school.com", title: "Secrétaire", desc: "Saisie d'élèves" },
    { email: "surveillant@school.com", title: "Surveillant", desc: "Absences et Matériel" },
    { email: "caisse@school.com", title: "Caisse", desc: "Encaissements" },
    { email: "parent@mail.com", title: "Parent d'élève", desc: "Inscriptions et suivi" },
    { email: "prof@school.com", title: "Professeur", desc: "Notes et classes" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans">
      {/* Visual Side (Hidden on mobile/tablet, visible on desktop) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 bg-white flex-col items-center justify-center p-12 relative overflow-hidden border-r border-slate-200">
         <div className="relative z-10 flex flex-col items-center max-w-lg">
            <EduBeninLogo className="w-64 h-64 mb-10" />
            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-gray-700 mb-3 text-center">EDU-BENIN</h1>
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px w-10 bg-emerald-600"></span>
              <p className="text-gray-700 font-bold tracking-widest text-sm lg:text-base uppercase text-center">Gestion Scolaire</p>
              <span className="h-px w-10 bg-emerald-600"></span>
            </div>
            
            <div className="flex flex-row justify-center flex-wrap gap-4 mt-8 w-full">
              <a href="#" className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl text-gray-700 hover:text-gray-700 transition-all shadow-sm group">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 group-hover:bg-emerald-200 transition-colors border border-[#05843a]">
                  <Smartphone className="w-4 h-4 text-gray-700 group-hover:text-gray-700" />
                </div>
                <span className="text-sm font-bold tracking-wide">EDU-BENIN</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl text-gray-700 hover:text-gray-700 transition-all shadow-sm group">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 group-hover:bg-emerald-200 transition-colors border border-[#05843a]">
                  <Facebook className="w-4 h-4 text-gray-700 group-hover:text-gray-700" />
                </div>
                <span className="text-sm font-bold tracking-wide">EDU-BENIN</span>
              </a>
              <a href="https://edubenin.coursmooc.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl text-gray-700 hover:text-gray-700 transition-all shadow-sm group">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 group-hover:bg-emerald-200 transition-colors border border-[#05843a]">
                  <Globe className="w-4 h-4 text-gray-700 group-hover:text-gray-700" />
                </div>
                <span className="text-sm font-bold tracking-wide">edubenin.coursmooc.com</span>
              </a>
            </div>

         </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-16 xl:px-20 bg-slate-50/50">
        <div className="mx-auto w-full max-w-sm md:max-w-3xl flex flex-col items-center">
          
          {/* Logo on mobile and tablet (logo left of text) */}
          <div className="lg:hidden flex flex-row items-center justify-center gap-4 mb-10 w-full">
            <EduBeninLogo className="w-24 h-24 sm:w-28 sm:h-28 shrink-0" />
            <div className="flex flex-col items-start">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-700 tracking-tight">
                EDU-BENIN
              </h2>
              <p className="text-xs sm:text-sm uppercase tracking-widest text-gray-700 font-bold mt-1">
                Gestion Scolaire
              </p>

            </div>
          </div>

          <div className="w-full bg-white py-8 px-6 md:p-10 shadow-sm border border-slate-200 rounded-2xl">
            <h3 className="hidden lg:block text-3xl font-bold text-gray-700 mb-10 w-full text-center tracking-tight">
              Connexion
            </h3>
            
            <div className="flex flex-col md:flex-row md:gap-12">
              
              {/* Primary Login Section */}
              <div className="flex-1">
                <button
                  onClick={handleGoogleClick}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 mb-6 rounded-lg text-sm font-bold text-gray-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors shadow-sm"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continuer avec Google
                </button>
                
                {error && <p className="text-xs text-red-500 mb-4 text-center">{error}</p>}

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white text-slate-400 uppercase tracking-wide text-[11px] font-bold">Ou avec un email</span>
                  </div>
                </div>

                <form className="space-y-4" onSubmit={handleLogin}>
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                      Nom complet
                    </label>
                    <div className="mt-2">
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 transition-shadow"
                        placeholder="Jean Dupont"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                      Adresse email
                    </label>
                    <div className="mt-2">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 transition-shadow"
                        placeholder="votre@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                      Mot de passe
                    </label>
                    <div className="mt-2">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 transition-shadow"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all shadow-sm"
                    >
                      Se connecter
                    </button>
                  </div>
                </form>
              </div>

              {/* Desktop Divider */}
              <div className="hidden md:block w-px bg-slate-200" />
              
              {/* Mobile Divider */}
              <div className="md:hidden mt-10 mb-8 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-slate-400 uppercase tracking-wide text-[11px] font-bold">Comptes de test</span>
                </div>
              </div>

              {/* Test Accounts Section */}
              <div className="flex-1 md:mt-0 flex flex-col">
                <div className="hidden md:block mb-6 relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white text-slate-400 uppercase tracking-wide text-[11px] font-bold">Comptes de test</span>
                  </div>
                </div>

                <div className="gap-3 flex flex-col flex-1 justify-center">
                  {sampleUsers.map((u) => (
                    <button
                      key={u.email}
                      onClick={() => { login(u.email); navigate("/dashboard"); }}
                      className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-emerald-200 transition-colors text-left group"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-700 group-hover:text-gray-700 transition-colors">{u.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{u.desc}</p>
                      </div>
                      <span className="text-[10px] text-gray-700 bg-emerald-100 px-2 py-1 rounded-full font-bold uppercase tracking-wider border border-[#05843a]">TEST</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl lg:max-w-3xl overflow-hidden relative animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="relative px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40">
              <button 
                onClick={() => setShowRoleModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Sparkles size={11} /> Profil d'accès
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {loginMethod === 'google' ? 'Connexion avec Google' : 'Connexion par Email'}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">Choisissez votre profil</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Sélectionnez le rôle correspondant à vos fonctions pour accéder à votre espace.</p>
            </div>

            {/* Roles Grid: 1 column on mobile portrait, 2 columns on desktop landscape */}
            <div className="p-4 sm:p-6 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                {[
                  {
                    id: "SCHOOL_ADMIN",
                    title: "Directeur",
                    desc: "Gestion globale, décisions & paramétrage école",
                    icon: Building,
                    badge: "DIRECTION",
                    color: "bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:border-emerald-500 group-hover:bg-emerald-600 group-hover:text-white"
                  },
                  {
                    id: "DIRECTOR_OF_STUDIES",
                    title: "Directeur des Études",
                    desc: "Pédagogie, planification, cours & bulletins",
                    icon: GraduationCap,
                    badge: "PÉDAGOGIE",
                    color: "bg-indigo-50 text-indigo-700 border-indigo-200 group-hover:border-indigo-500 group-hover:bg-indigo-600 group-hover:text-white"
                  },
                  {
                    id: "SECRETARY",
                    title: "Secrétaire",
                    desc: "Inscriptions d'élèves, absences & certificats",
                    icon: FileText,
                    badge: "ADMINISTRATION",
                    color: "bg-blue-50 text-blue-700 border-blue-200 group-hover:border-blue-500 group-hover:bg-blue-600 group-hover:text-white"
                  },
                  {
                    id: "SUPERVISOR",
                    title: "Surveillant Général",
                    desc: "Discipline, retards, absences & matériel",
                    icon: Shield,
                    badge: "VIE SCOLAIRE",
                    color: "bg-amber-50 text-amber-700 border-amber-200 group-hover:border-amber-500 group-hover:bg-amber-600 group-hover:text-white"
                  },
                  {
                    id: "CASHIER",
                    title: "Caisse & Comptabilité",
                    desc: "Encaissements, reçus de scolarité & dépenses",
                    icon: Wallet,
                    badge: "FINANCES",
                    color: "bg-teal-50 text-teal-700 border-teal-200 group-hover:border-teal-500 group-hover:bg-teal-600 group-hover:text-white"
                  },
                  {
                    id: "PARENT",
                    title: "Parent d'élève",
                    desc: "Inscriptions, paiements & suivi des enfants",
                    icon: Users,
                    badge: "FAMILLE",
                    color: "bg-rose-50 text-rose-700 border-rose-200 group-hover:border-rose-500 group-hover:bg-rose-600 group-hover:text-white"
                  },
                  {
                    id: "TEACHER",
                    title: "Professeur",
                    desc: "Saisie des notes, évaluations & cours",
                    icon: BookOpen,
                    badge: "ENSEIGNANT",
                    color: "bg-purple-50 text-purple-700 border-purple-200 group-hover:border-purple-500 group-hover:bg-purple-600 group-hover:text-white"
                  },
                ].map((role) => {
                  const Icon = role.icon;
                  return (
                    <button
                      key={role.id}
                      onClick={() => handleRoleSelection(role.id)}
                      className="group flex items-start gap-3.5 p-3.5 sm:p-4 border border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/30 hover:shadow-md transition-all text-left bg-white relative cursor-pointer"
                    >
                      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 border transition-all ${role.color}`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-800 group-hover:text-emerald-900 transition-colors truncate">{role.title}</h4>
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-800 transition-colors shrink-0">
                            {role.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{role.desc}</p>
                      </div>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-400 flex items-center justify-center transition-all shadow-sm">
                        <ChevronRight size={14} className="stroke-[2.5]" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Notice */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500 shrink-0">
              Vous pourrez changer de compte ou vous déconnecter à tout moment depuis votre tableau de bord.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

