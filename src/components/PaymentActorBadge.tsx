import React from "react";
import { UserCheck, ShieldCheck, Banknote, User } from "lucide-react";

export type ActorRole = "PARENT" | "CASHIER" | "SCHOOL_ADMIN" | "DIRECTOR_OF_STUDIES" | "SECRETARY" | string;

export interface ActorInfo {
  role: "PARENT" | "CASHIER" | "DIRECTEUR" | "ADMIN" | "SECRETARY";
  label: string;
  name?: string;
  badgeClass: string;
  icon: React.ReactNode;
}

export function resolvePaymentActor(payment: any, students?: any[], profiles?: any[]): ActorInfo {
  // 1. If explicit recorded_by_role / recordedByRole
  const rawRole = (payment.recorded_by_role || payment.recordedByRole || "").toUpperCase();
  const rawName = payment.recorded_by_name || payment.recordedByName;

  if (rawRole === "PARENT") {
    return {
      role: "PARENT",
      label: "Parent d'élève",
      name: rawName || "Parent",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <User className="w-3 h-3 text-blue-600" />
    };
  }

  if (rawRole === "CASHIER") {
    return {
      role: "CASHIER",
      label: "Caisse",
      name: rawName || "Caisse de l'école",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <Banknote className="w-3 h-3 text-emerald-600" />
    };
  }

  if (rawRole === "SCHOOL_ADMIN" || rawRole === "DIRECTEUR" || rawRole === "DIRECTOR") {
    return {
      role: "DIRECTEUR",
      label: "Direction / Directeur",
      name: rawName || "Direction",
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
      icon: <ShieldCheck className="w-3 h-3 text-purple-600" />
    };
  }

  if (rawRole === "SECRETARY" || rawRole === "SECRETAIRE") {
    return {
      role: "SECRETARY",
      label: "Secrétariat",
      name: rawName || "Secrétariat",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <UserCheck className="w-3 h-3 text-amber-600" />
    };
  }

  // 2. Check if payment recorded_by_id corresponds to a known profile
  const recordedById = payment.recorded_by_id || payment.recordedById;
  if (recordedById && profiles && profiles.length > 0) {
    const prof = profiles.find((p: any) => p.id === recordedById);
    if (prof) {
      const pRole = (prof.role || "").toUpperCase();
      if (pRole === "SCHOOL_ADMIN" || pRole === "DIRECTOR_OF_STUDIES") {
        return {
          role: "DIRECTEUR",
          label: "Direction / Directeur",
          name: prof.full_name || rawName || "Directeur",
          badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
          icon: <ShieldCheck className="w-3 h-3 text-purple-600" />
        };
      }
      if (pRole === "CASHIER") {
        return {
          role: "CASHIER",
          label: "Caisse",
          name: prof.full_name || rawName || "Caisse de l'école",
          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: <Banknote className="w-3 h-3 text-emerald-600" />
        };
      }
      if (pRole === "PARENT") {
        return {
          role: "PARENT",
          label: "Parent d'élève",
          name: prof.full_name || rawName || "Parent",
          badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
          icon: <User className="w-3 h-3 text-blue-600" />
        };
      }
    }
  }

  // 3. Heuristics based on payment characteristics:
  // - Cash / Espèces is physically paid and registered at the cash register (Caisse)
  const network = (payment.network || payment.paymentMethod || "").toUpperCase();
  if (network === "ESPÈCES" || network === "CASH" || network.includes("ESPÈCE")) {
    return {
      role: "CASHIER",
      label: "Caisse",
      name: rawName || "Caisse (Espèces)",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <Banknote className="w-3 h-3 text-emerald-600" />
    };
  }

  // - Mobile money with parent_id or without school user explicit recording is typically initiated by Parent
  if (payment.parent_id || payment.parentId) {
    return {
      role: "PARENT",
      label: "Parent d'élève",
      name: rawName || "Parent (Mobile Money)",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <User className="w-3 h-3 text-blue-600" />
    };
  }

  // Default fallback: Caisse
  return {
    role: "CASHIER",
    label: "Caisse",
    name: rawName || "Caisse",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <Banknote className="w-3 h-3 text-emerald-600" />
  };
}

export function PaymentActorBadge({ 
  payment, 
  students, 
  profiles,
  size = "md",
  showName = true
}: { 
  payment: any; 
  students?: any[]; 
  profiles?: any[];
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}) {
  const actor = resolvePaymentActor(payment, students, profiles);

  return (
    <div className="inline-flex items-center gap-1.5" title={`Effectué par : ${actor.name || actor.label}`}>
      <span className={`inline-flex items-center gap-1 ${size === 'sm' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'} rounded-full font-bold border ${actor.badgeClass} shadow-2xs whitespace-nowrap`}>
        {actor.icon}
        <span>{actor.label}</span>
      </span>
      {showName && actor.name && actor.name !== actor.label && (
        <span className="text-[10px] text-slate-500 hidden lg:inline max-w-[110px] truncate" title={actor.name}>
          ({actor.name})
        </span>
      )}
    </div>
  );
}
