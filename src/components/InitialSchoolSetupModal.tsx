import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { formatErrorMessage } from "../lib/errorHandler";
import { School, Building, Phone, Coins, MapPin, CheckCircle2, AlertCircle } from "lucide-react";

interface InitialSchoolSetupModalProps {
  isOpen: boolean;
  onSuccess?: (schoolData: any) => void;
  onClose?: () => void;
}

const CURRENCIES = [
  { code: "FCFA", label: "Franc CFA (FCFA / XOF / XAF)", symbol: "FCFA" },
  { code: "GNF", label: "Franc Guinéen (GNF)", symbol: "GNF" },
  { code: "EUR", label: "Euro (€)", symbol: "€" },
  { code: "USD", label: "Dollar US ($)", symbol: "$" }
];

const QUICK_COUNTRIES = [
  { code: "bj", dial: "+229", name: "Bénin" },
  { code: "tg", dial: "+228", name: "Togo" },
  { code: "ci", dial: "+225", name: "Côte d'Ivoire" },
  { code: "sn", dial: "+221", name: "Sénégal" },
  { code: "ne", dial: "+227", name: "Niger" },
  { code: "bf", dial: "+226", name: "Burkina Faso" },
  { code: "ml", dial: "+223", name: "Mali" },
  { code: "gn", dial: "+224", name: "Guinée" },
  { code: "cm", dial: "+237", name: "Cameroun" },
  { code: "ga", dial: "+241", name: "Gabon" },
  { code: "cd", dial: "+243", name: "RDC" },
  { code: "fr", dial: "+33", name: "France" }
];

export function InitialSchoolSetupModal({ isOpen, onSuccess, onClose }: InitialSchoolSetupModalProps) {
  const { user, updateUserSchool } = useAuth();
  const toast = useToast();

  const [schoolName, setSchoolName] = useState("");
  const [phoneDial, setPhoneDial] = useState("+229");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [currency, setCurrency] = useState("FCFA");
  const [locality, setLocality] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim()) {
      setError("Le nom de l'établissement est requis.");
      return;
    }
    if (!phoneNumber.trim()) {
      setError("Le numéro de téléphone est requis.");
      return;
    }

    setLoading(true);
    setError(null);

    const fullPhone = `${phoneDial} ${phoneNumber.trim()}`;

    try {
      // 1. Create the school record in Supabase
      const { data: newSchool, error: schoolErr } = await supabase
        .from("schools")
        .insert([{
          name: schoolName.trim(),
          contacts: fullPhone,
          locality: locality.trim() || "Bénin",
          motto: currency, // stored as financial currency
          mobile_money_numbers: {}
        }])
        .select()
        .single();

      if (schoolErr) throw schoolErr;
      if (!newSchool?.id) throw new Error("Échec de création de l'établissement.");

      // 2. Link the current director profile to this new school
      if (user?.id) {
        const { error: profileErr } = await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            email: user.email,
            full_name: user.name || "Directeur",
            school_id: newSchool.id,
            role: "SCHOOL_ADMIN"
          });

        if (profileErr) {
          console.warn("Could not upsert profile, attempting update:", profileErr);
          await supabase.from("profiles").update({
            school_id: newSchool.id,
            role: "SCHOOL_ADMIN"
          }).eq("id", user.id);
        }
      }

      // 3. Save local active caches
      localStorage.setItem("edubenin_active_school_id", newSchool.id);
      localStorage.setItem(`school_currency_${newSchool.id}`, currency);
      
      const extraSettings = {
        currency: currency,
        academicYear: "2024-2025"
      };
      localStorage.setItem(`schoolSettings_extra_${newSchool.id}`, JSON.stringify(extraSettings));

      // 4. Update AuthContext directly
      if (updateUserSchool) {
        updateUserSchool(newSchool.id, newSchool.name);
      }

      toast.success(`Établissement "${newSchool.name}" configuré avec succès !`);

      if (onSuccess) {
        onSuccess(newSchool);
      }
    } catch (err: any) {
      console.error("Initial school setup error:", err);
      const friendlyMsg = formatErrorMessage(err);
      setError(friendlyMsg);
      toast.error(friendlyMsg, "Erreur de configuration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 p-6 text-white text-center relative shrink-0">
          <div className="w-14 h-14 bg-white/10 rounded-2xl mx-auto flex items-center justify-center border border-white/20 shadow-inner mb-3">
            <School className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">Bienvenue sur EduBénin</h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
            Première connexion Directeur : configurez votre établissement pour démarrer la gestion scolaire.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. School Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              1. Nom de l'établissement <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Building className="h-4 w-4" />
              </div>
              <input
                type="text"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Ex: Complexe Scolaire Notre-Dame"
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-gray-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* 2. Phone Number */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              2. Numéro de téléphone de contact <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={phoneDial}
                onChange={(e) => setPhoneDial(e.target.value)}
                className="w-32 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {QUICK_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.dial}>
                    {c.dial} ({c.name})
                  </option>
                ))}
              </select>
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Ex: 97 00 00 00"
                  className="block w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-gray-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Utilisé pour les reçus de paiement et le support parents.</p>
          </div>

          {/* 3. Financial Currency */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              3. Monnaie utilisée pour les données financières <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Coins className="h-4 w-4" />
              </div>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition appearance-none cursor-pointer"
              >
                {CURRENCIES.map((cur) => (
                  <option key={cur.code} value={cur.code}>
                    {cur.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Cette monnaie s'appliquera à tous les frais de scolarité, paiements et rapports.</p>
          </div>

          {/* 4. Locality / City (Optional) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Ville / Localité <span className="text-slate-400 font-normal">(Optionnel)</span>
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <MapPin className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="Ex: Cotonou, Akpakpa"
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-gray-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black uppercase tracking-wider shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Enregistrement en cours...</span>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Créer et démarrer mon établissement</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
