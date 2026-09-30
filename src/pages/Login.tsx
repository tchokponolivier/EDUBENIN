import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import { EduBeninLogo } from "../components/Logo";
import { formatErrorMessage } from "../lib/errorHandler";
import imgMorningWalk from "../assets/images/students_morning_walk_1790762616576.jpg";
import imgClassroomStudy from "../assets/images/students_classroom_study_1790762632580.jpg";
import imgCampusOutdoor from "../assets/images/students_campus_outdoor_1790762644820.jpg";
import {
  X,
  Building,
  GraduationCap,
  FileText,
  Shield,
  Wallet,
  Users,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Clock
} from "lucide-react";

const CAROUSEL_SLIDES = [
  {
    image: imgMorningWalk,
    fallback: "/images/students_morning_walk_1790762616576.jpg",
    title: "L'excellence éducative au Bénin & en Afrique",
    subtitle: "Une plateforme unifiée au service des élèves, de la direction et des enseignants.",
    tag: "Avenir & Réussite"
  },
  {
    image: imgClassroomStudy,
    fallback: "/images/students_classroom_study_1790762632580.jpg",
    title: "Rigueur pédagogique & suivi en temps réel",
    subtitle: "Notes, présences, emplois du temps et bulletins centralisés avec clarté.",
    tag: "Pédagogie Moderne"
  },
  {
    image: imgCampusOutdoor,
    fallback: "/images/students_campus_outdoor_1790762644820.jpg",
    title: "Collaboration école, équipe & familles",
    subtitle: "La solution de référence reliant la direction, les professeurs, la caisse et les parents.",
    tag: "Vie Scolaire"
  }
];

const ROLES = [
  {
    id: "SCHOOL_ADMIN",
    title: "Directeur",
    desc: "Gestion globale, décisions & paramétrage école",
    icon: Building,
    badge: "DIRECTION",
    cardBase: "bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-sm",
    cardHover: "hover:bg-emerald-100 hover:border-emerald-600 hover:shadow-lg hover:ring-2 hover:ring-emerald-500/30 hover:-translate-y-0.5",
    iconBox: "bg-emerald-600 text-white border-emerald-600 group-hover:bg-emerald-700",
    badgeColor: "bg-emerald-200/80 text-emerald-900 border border-emerald-300/80 group-hover:bg-emerald-300",
    arrowColor: "bg-emerald-200 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white"
  },
  {
    id: "DIRECTOR_OF_STUDIES",
    title: "Directeur des Études",
    desc: "Pédagogie, planification, cours & bulletins",
    icon: GraduationCap,
    badge: "PÉDAGOGIE",
    cardBase: "bg-indigo-50/90 border-indigo-300 text-indigo-950 shadow-sm",
    cardHover: "hover:bg-indigo-100 hover:border-indigo-600 hover:shadow-lg hover:ring-2 hover:ring-indigo-500/30 hover:-translate-y-0.5",
    iconBox: "bg-indigo-600 text-white border-indigo-600 group-hover:bg-indigo-700",
    badgeColor: "bg-indigo-200/80 text-indigo-900 border border-indigo-300/80 group-hover:bg-indigo-300",
    arrowColor: "bg-indigo-200 text-indigo-800 group-hover:bg-indigo-600 group-hover:text-white"
  },
  {
    id: "SECRETARY",
    title: "Secrétaire",
    desc: "Inscriptions d'élèves, absences & certificats",
    icon: FileText,
    badge: "ADMINISTRATION",
    cardBase: "bg-blue-50/90 border-blue-300 text-blue-950 shadow-sm",
    cardHover: "hover:bg-blue-100 hover:border-blue-600 hover:shadow-lg hover:ring-2 hover:ring-blue-500/30 hover:-translate-y-0.5",
    iconBox: "bg-blue-600 text-white border-blue-600 group-hover:bg-blue-700",
    badgeColor: "bg-blue-200/80 text-blue-900 border border-blue-300/80 group-hover:bg-blue-300",
    arrowColor: "bg-blue-200 text-blue-800 group-hover:bg-blue-600 group-hover:text-white"
  },
  {
    id: "SUPERVISOR",
    title: "Surveillant Général",
    desc: "Discipline, retards, absences & matériel",
    icon: Shield,
    badge: "VIE SCOLAIRE",
    cardBase: "bg-amber-50/90 border-amber-300 text-amber-950 shadow-sm",
    cardHover: "hover:bg-amber-100 hover:border-amber-600 hover:shadow-lg hover:ring-2 hover:ring-amber-500/30 hover:-translate-y-0.5",
    iconBox: "bg-amber-600 text-white border-amber-600 group-hover:bg-amber-700",
    badgeColor: "bg-amber-200/80 text-amber-900 border border-amber-300/80 group-hover:bg-amber-300",
    arrowColor: "bg-amber-200 text-amber-800 group-hover:bg-amber-600 group-hover:text-white"
  },
  {
    id: "CASHIER",
    title: "Caisse & Comptabilité",
    desc: "Encaissements, reçus de scolarité & dépenses",
    icon: Wallet,
    badge: "FINANCES",
    cardBase: "bg-teal-50/90 border-teal-300 text-teal-950 shadow-sm",
    cardHover: "hover:bg-teal-100 hover:border-teal-600 hover:shadow-lg hover:ring-2 hover:ring-teal-500/30 hover:-translate-y-0.5",
    iconBox: "bg-teal-600 text-white border-teal-600 group-hover:bg-teal-700",
    badgeColor: "bg-teal-200/80 text-teal-900 border border-teal-300/80 group-hover:bg-teal-300",
    arrowColor: "bg-teal-200 text-teal-800 group-hover:bg-teal-600 group-hover:text-white"
  },
  {
    id: "PARENT",
    title: "Parent d'élève",
    desc: "Inscriptions, paiements & suivi des enfants",
    icon: Users,
    badge: "FAMILLE",
    cardBase: "bg-rose-50/90 border-rose-300 text-rose-950 shadow-sm",
    cardHover: "hover:bg-rose-100 hover:border-rose-600 hover:shadow-lg hover:ring-2 hover:ring-rose-500/30 hover:-translate-y-0.5",
    iconBox: "bg-rose-600 text-white border-rose-600 group-hover:bg-rose-700",
    badgeColor: "bg-rose-200/80 text-rose-900 border border-rose-300/80 group-hover:bg-rose-300",
    arrowColor: "bg-rose-200 text-rose-800 group-hover:bg-rose-600 group-hover:text-white"
  },
  {
    id: "TEACHER",
    title: "Professeur",
    desc: "Saisie des notes, évaluations & cours",
    icon: BookOpen,
    badge: "ENSEIGNANT",
    cardBase: "bg-purple-50/90 border-purple-300 text-purple-950 shadow-sm",
    cardHover: "hover:bg-purple-100 hover:border-purple-600 hover:shadow-lg hover:ring-2 hover:ring-purple-500/30 hover:-translate-y-0.5",
    iconBox: "bg-purple-600 text-white border-purple-600 group-hover:bg-purple-700",
    badgeColor: "bg-purple-200/80 text-purple-900 border border-purple-300/80 group-hover:bg-purple-300",
    arrowColor: "bg-purple-200 text-purple-800 group-hover:bg-purple-600 group-hover:text-white"
  },
];

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedNoticeRole, setSelectedNoticeRole] = useState<any | null>(null);
  const { user, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loginMethod, setLoginMethod] = useState<'email' | 'google' | null>(null);

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Auto-play carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoginMethod('email');
    setShowRoleModal(true);
  };

  const handleGoogleClick = () => {
    setLoginMethod('google');
    setShowRoleModal(true);
  };

  const handleRoleCardClick = (role: typeof ROLES[0]) => {
    // If Director, proceed directly
    if (role.id === "SCHOOL_ADMIN") {
      executeRoleSelection("SCHOOL_ADMIN");
    } else {
      // For all other roles, inform that invitation by school director is required
      setSelectedNoticeRole(role);
    }
  };

  const executeRoleSelection = async (roleId: string) => {
    setShowRoleModal(false);
    setSelectedNoticeRole(null);
    setIsSubmitting(true);

    if (loginMethod === 'email') {
      try {
        login(email, undefined, password, roleId);
        navigate("/dashboard");
      } catch (err: any) {
        setError(formatErrorMessage(err));
      } finally {
        setIsSubmitting(false);
      }
    } else if (loginMethod === 'google') {
      localStorage.setItem('pending_google_role', roleId);
      try {
        setError("");
        await loginWithGoogle();
      } catch (err: any) {
        setError(formatErrorMessage(err));
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row font-sans">
      {/* Visual Carousel Side (Desktop & Landscape) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[52%] bg-slate-950 flex-col justify-between p-8 xl:p-12 relative overflow-hidden select-none">
        {/* Background glow effects */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-1.5 shadow-lg">
              <EduBeninLogo className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">EDU-BENIN</h1>
              <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Plateforme de Gestion Scolaire</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-slate-300 border border-white/15 backdrop-blur-md">
            Version Officielle
          </span>
        </div>

        {/* Carousel Showcase */}
        <div className="relative z-10 my-8 flex-1 flex flex-col justify-center max-w-xl mx-auto w-full">
          <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-slate-900 aspect-[16/10] group">
            {CAROUSEL_SLIDES.map((slide, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  idx === currentSlide ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 pointer-events-none scale-105"
                } transition-transform duration-1000`}
              >
                <img
                  src={slide.image}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = slide.fallback;
                  }}
                  alt={slide.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                {/* Content Overlay */}
                <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 text-white">
                  <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 mb-2.5 shadow-sm">
                    {slide.tag}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-snug text-white">
                    {slide.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                    {slide.subtitle}
                  </p>
                </div>
              </div>
            ))}

            {/* Navigation Arrows */}
            <button
              type="button"
              onClick={handlePrevSlide}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 transition opacity-0 group-hover:opacity-100"
              title="Image précédente"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleNextSlide}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 transition opacity-0 group-hover:opacity-100"
              title="Image suivante"
            >
              <ChevronRight size={18} />
            </button>

            {/* Dot Indicators */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
              {CAROUSEL_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentSlide ? "w-6 bg-emerald-400" : "w-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                  title={`Aller à la photo ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Highlights */}
        <div className="relative z-10 grid grid-cols-3 gap-4 pt-4 border-t border-white/10 text-slate-300 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span className="font-medium">100% Conforme MENAP Bénin</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-emerald-400 shrink-0" />
            <span className="font-medium">Données Sécurisées Supabase</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-emerald-400 shrink-0" />
            <span className="font-medium">Bulletins & Notes en temps réel</span>
          </div>
        </div>
      </div>

      {/* Login Form Side */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-16 xl:px-24 bg-slate-50">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Header Logo */}
          <div className="lg:hidden flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 bg-white rounded-3xl p-3 shadow-sm border border-slate-200 mb-3 flex items-center justify-center">
              <EduBeninLogo className="w-full h-full object-contain" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">EDU-BENIN</h2>
            <p className="text-xs uppercase font-bold text-emerald-700 tracking-widest mt-0.5">Gestion Scolaire</p>
          </div>

          {/* Login Card */}
          <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Connexion</h2>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                Accédez à votre espace sécurisé pour gérer votre établissement ou suivre vos enfants.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Google Authentication Button */}
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl text-sm font-bold text-gray-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Continuer avec Google</span>
            </button>

            {/* Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  ou par email
                </span>
              </div>
            </div>

            {/* Email Form */}
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Adresse email
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={16} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-gray-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    placeholder="directeur@ecole.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Mot de passe
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-gray-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-black uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all shadow-lg shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
                >
                  <span>Se connecter</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>

            <p className="mt-8 text-center text-xs text-slate-400">
              Plateforme EduBénin &copy; {new Date().getFullYear()} • Tous droits réservés.
            </p>
          </div>
        </div>
      </div>

      {/* Role Selection Modal (Desktop Landscape 3 Columns, Mobile 1 Column) */}
      {showRoleModal && !selectedNoticeRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl md:max-w-3xl lg:max-w-5xl overflow-hidden relative animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="relative px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40 shrink-0">
              <button 
                onClick={() => setShowRoleModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
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
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Sélectionnez le rôle correspondant à vos fonctions pour continuer.
              </p>
            </div>

            {/* Roles Grid: 3 columns on desktop landscape, 2 on tablet, 1 on mobile */}
            <div className="p-4 sm:p-6 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  return (
                    <button
                      key={role.id}
                      onClick={() => handleRoleCardClick(role)}
                      className={`group flex items-start gap-3.5 p-4 border rounded-2xl transition-all duration-200 text-left relative cursor-pointer ${role.cardBase} ${role.cardHover}`}
                    >
                      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-200 shadow-sm ${role.iconBox}`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black tracking-tight truncate">
                            {role.title}
                          </h4>
                        </div>
                        <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mt-1 transition-colors ${role.badgeColor}`}>
                          {role.badge}
                        </span>
                        <p className="text-xs text-slate-600 font-medium mt-1.5 line-clamp-2 leading-relaxed">
                          {role.desc}
                        </p>
                      </div>
                      <div className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${role.arrowColor}`}>
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

      {/* Staff Invitation Notice Modal (For non-director roles) */}
      {selectedNoticeRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-in zoom-in-95 duration-200 border border-slate-200">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white text-center relative">
              <div className="w-14 h-14 bg-white/15 rounded-2xl mx-auto flex items-center justify-center border border-white/20 shadow-inner mb-3">
                <Mail className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-black tracking-tight">Invitation Requise</h3>
              <p className="text-amber-100 text-xs mt-1">
                Espace réservé : <span className="font-bold underline">{selectedNoticeRole.title}</span>
              </p>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-amber-950">
                  <AlertCircle size={15} className="text-amber-600 shrink-0" />
                  Vous devez être invité par le Directeur de votre école :
                </p>
                <p>
                  Pour accéder à cet espace en tant que <strong>{selectedNoticeRole.title}</strong>, vous devez avoir reçu une invitation par email de la part de la direction de votre établissement.
                </p>
                <p>
                  Si vous êtes nouveau dans l'école, <strong>veuillez contacter le Directeur de votre établissement</strong> afin qu'il vous envoie une invitation officielle depuis son tableau de bord.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedNoticeRole(null)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition shadow-sm cursor-pointer"
                >
                  <ChevronLeft size={15} />
                  <span>Retour au choix des profils</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
