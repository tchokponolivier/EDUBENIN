import React, { useState } from "react";
import { useAuth } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import { School, User, BookOpen } from "lucide-react";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const { user, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    login(email);
    navigate("/dashboard");
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      await loginWithGoogle();
      // the redirect is handled by supabase
    } catch (err: any) {
      setError("Erreur de connexion via Google. Avez-vous configuré Supabase ?");
    }
  };

  const sampleUsers = [
    { email: "super@edubenin.com", title: "Super Admin", desc: "Configuration des établissements" },
    { email: "admin@school.com", title: "Administration", desc: "Gestion des élèves et paiements" },
    { email: "secretary@school.com", title: "Secrétaire", desc: "Saisie et encaissements" },
    { email: "parent@mail.com", title: "Parent d'élève", desc: "Inscriptions et suivi" },
    { email: "prof@school.com", title: "Professeur", desc: "Notes et classes" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-xs">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-emerald-500 rounded flex items-center justify-center shadow-sm">
            <span className="font-bold text-white text-2xl">E</span>
          </div>
        </div>
        <h2 className="text-center text-xl font-bold text-slate-900">
          EDU-BENIN
        </h2>
        <p className="text-center text-[10px] uppercase tracking-widest text-slate-500 mt-1">
          Portail National Scolaire
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="bg-white py-6 px-4 shadow-sm border border-slate-200 rounded-xl sm:px-8">
          
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mb-6 rounded text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors shadow-sm"
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
              <span className="px-2 bg-white text-slate-400 uppercase tracking-wide text-[10px] font-bold">Ou utiliser un compte</span>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Adresse email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 rounded text-xs font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors shadow-sm"
              >
                Se connecter
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-slate-400 uppercase tracking-wide text-[10px] font-bold">Comptes de test</span>
              </div>
            </div>

            <div className="mt-4 gap-2 flex flex-col">
              {sampleUsers.map((u) => (
                <button
                  key={u.email}
                  onClick={() => { login(u.email); navigate("/dashboard"); }}
                  className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded hover:bg-slate-50 transition-colors text-left"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800">{u.title}</p>
                    <p className="text-[10px] text-slate-500">{u.desc}</p>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Auto</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
