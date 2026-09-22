import React from "react";
import { ShieldCheck, Banknote, User } from "lucide-react";

export type ActorRole = "PARENT" | "CASHIER" | "SCHOOL_ADMIN" | "DIRECTOR_OF_STUDIES" | "SECRETARY" | string;

export interface ActorInfo {
  role: "PARENT" | "CASHIER" | "DIRECTEUR" | "SECRETARY";
  label: "Parent d'élève" | "Caisse" | "Directeur" | "Secrétariat";
  name?: string;
  badgeClass: string;
  icon: React.ReactNode;
}

export function resolvePaymentActor(payment: any, _students?: any[], profiles?: any[]): ActorInfo {
  if (!payment) {
    return {
      role: "CAISSE" as any,
      label: "Caisse",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <Banknote className="w-3.5 h-3.5 text-emerald-600" />
    };
  }

  // 1. Check persistent localStorage map first
  try {
    const raw = localStorage.getItem('payment_initiators_map');
    if (raw) {
      const map = JSON.parse(raw);
      const storedRole = (payment.reference && map[payment.reference]) || (payment.id && map[payment.id]);
      if (storedRole) {
        const u = String(storedRole).toUpperCase();
        if (u === "SCHOOL_ADMIN" || u === "DIRECTEUR" || u === "DIRECTOR") {
          return {
            role: "DIRECTEUR",
            label: "Directeur",
            name: "Directeur",
            badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
            icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
          };
        }
        if (u === "CASHIER" || u === "CAISSE" || u === "CAISSIER") {
          return {
            role: "CASHIER",
            label: "Caisse",
            name: "Caisse",
            badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
            icon: <Banknote className="w-3.5 h-3.5 text-emerald-600" />
          };
        }
        if (u === "PARENT") {
          return {
            role: "PARENT",
            label: "Parent d'élève",
            name: "Parent d'élève",
            badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
            icon: <User className="w-3.5 h-3.5 text-blue-600" />
          };
        }
      }
    }
  } catch (e) {}

  // 2. Check reference prefix/content
  const ref = String(payment.reference || "").toUpperCase();
  if (ref.includes("-DIR-") || ref.startsWith("PAY-DIR") || ref.includes("DIRECTEUR")) {
    return {
      role: "DIRECTEUR",
      label: "Directeur",
      name: "Directeur",
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
      icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
    };
  }
  if (ref.includes("-CSH-") || ref.startsWith("PAY-CSH") || ref.includes("CAISSE")) {
    return {
      role: "CASHIER",
      label: "Caisse",
      name: "Caisse",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <Banknote className="w-3.5 h-3.5 text-emerald-600" />
    };
  }
  if (ref.includes("-PAR-") || ref.startsWith("PAY-PAR") || ref.includes("PARENT")) {
    return {
      role: "PARENT",
      label: "Parent d'élève",
      name: "Parent d'élève",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <User className="w-3.5 h-3.5 text-blue-600" />
    };
  }

  // 3. Check items array if metadata was preserved inside items
  if (Array.isArray(payment.items) && payment.items.length > 0) {
    const itemWithRole = payment.items.find((it: any) => it && (it.recorded_by_role || it.recordedByRole));
    if (itemWithRole) {
      const itemRole = String(itemWithRole.recorded_by_role || itemWithRole.recordedByRole).toUpperCase();
      if (itemRole === "SCHOOL_ADMIN" || itemRole === "DIRECTEUR" || itemRole === "DIRECTOR") {
        return {
          role: "DIRECTEUR",
          label: "Directeur",
          name: "Directeur",
          badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
          icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
        };
      }
      if (itemRole === "CASHIER" || itemRole === "CAISSE") {
        return {
          role: "CASHIER",
          label: "Caisse",
          name: "Caisse",
          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: <Banknote className="w-3.5 h-3.5 text-emerald-600" />
        };
      }
      if (itemRole === "PARENT") {
        return {
          role: "PARENT",
          label: "Parent d'élève",
          name: "Parent d'élève",
          badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
          icon: <User className="w-3.5 h-3.5 text-blue-600" />
        };
      }
    }
  }

  // 4. Explicit recorded_by_role / recordedByRole
  const rawRole = (payment.recorded_by_role || payment.recordedByRole || "").toUpperCase();
  const rawName = payment.recorded_by_name || payment.recordedByName;

  if (rawRole === "PARENT") {
    return {
      role: "PARENT",
      label: "Parent d'élève",
      name: rawName || "Parent d'élève",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <User className="w-3.5 h-3.5 text-blue-600" />
    };
  }

  if (rawRole === "CASHIER" || rawRole === "CAISSE" || rawRole === "CAISSIER") {
    return {
      role: "CASHIER",
      label: "Caisse",
      name: rawName || "Caisse",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <Banknote className="w-3.5 h-3.5 text-emerald-600" />
    };
  }

  if (rawRole === "SCHOOL_ADMIN" || rawRole === "DIRECTEUR" || rawRole === "DIRECTOR" || rawRole === "DIRECTOR_OF_STUDIES") {
    return {
      role: "DIRECTEUR",
      label: "Directeur",
      name: rawName || "Directeur",
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
      icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
    };
  }

  // 5. Check if recorded_by_name indicates role
  if (rawName) {
    const lowerName = String(rawName).toLowerCase();
    if (lowerName.includes("directeur") || lowerName.includes("admin")) {
      return {
        role: "DIRECTEUR",
        label: "Directeur",
        name: rawName,
        badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
        icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
      };
    }
    if (lowerName.includes("caisse") || lowerName.includes("caissier")) {
      return {
        role: "CASHIER",
        label: "Caisse",
        name: rawName,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: <Banknote className="w-3.5 h-3.5 text-emerald-600" />
      };
    }
    if (lowerName.includes("parent")) {
      return {
        role: "PARENT",
        label: "Parent d'élève",
        name: rawName,
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        icon: <User className="w-3.5 h-3.5 text-blue-600" />
      };
    }
  }

  // 6. Check recorded_by_id in profiles
  const recordedById = payment.recorded_by_id || payment.recordedById || payment.user_id || payment.created_by;
  if (recordedById && profiles && profiles.length > 0) {
    const prof = profiles.find((p: any) => p.id === recordedById);
    if (prof) {
      const pRole = (prof.role || "").toUpperCase();
      if (pRole === "SCHOOL_ADMIN" || pRole === "DIRECTOR_OF_STUDIES") {
        return {
          role: "DIRECTEUR",
          label: "Directeur",
          name: prof.full_name || "Directeur",
          badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
          icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
        };
      }
      if (pRole === "CASHIER") {
        return {
          role: "CASHIER",
          label: "Caisse",
          name: prof.full_name || "Caisse",
          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: <Banknote className="w-3.5 h-3.5 text-emerald-600" />
        };
      }
      if (pRole === "PARENT") {
        return {
          role: "PARENT",
          label: "Parent d'élève",
          name: prof.full_name || "Parent",
          badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
          icon: <User className="w-3.5 h-3.5 text-blue-600" />
        };
      }
    }
  }

  // 7. Check validated_by_role if payment was validated
  const valRole = (payment.validated_by_role || "").toUpperCase();
  if (valRole === "DIRECTEUR" || valRole === "SCHOOL_ADMIN") {
    return {
      role: "DIRECTEUR",
      label: "Directeur",
      name: payment.validated_by_name || "Directeur",
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
      icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
    };
  }
  if (valRole === "CAISSE" || valRole === "CASHIER") {
    return {
      role: "CASHIER",
      label: "Caisse",
      name: payment.validated_by_name || "Caisse",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <Banknote className="w-3.5 h-3.5 text-emerald-600" />
    };
  }

  // 8. Mobile money payments with parent_id are initiated by Parents
  const network = (payment.network || payment.paymentMethod || "").toUpperCase();
  const hasParentId = Boolean(payment.parent_id || payment.parentId);
  const isMobileMoney = network.includes("MTN") || network.includes("MOOV") || network.includes("CELTIIS") || network.includes("MOBILE");

  if (hasParentId && isMobileMoney) {
    return {
      role: "PARENT",
      label: "Parent d'élève",
      name: "Parent d'élève",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <User className="w-3.5 h-3.5 text-blue-600" />
    };
  }

  // 9. Contextual fallback based on logged-in user / account
  // If payment was recorded at school (e.g. ESPÈCES or in SchoolAdmin interface)
  try {
    const authUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    if (authUser?.role === "SCHOOL_ADMIN" || authUser?.role === "DIRECTOR_OF_STUDIES") {
      return {
        role: "DIRECTEUR",
        label: "Directeur",
        name: "Directeur",
        badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
        icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
      };
    }
    if (authUser?.role === "CASHIER") {
      return {
        role: "CASHIER",
        label: "Caisse",
        name: "Caisse",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: <Banknote className="w-3.5 h-3.5 text-emerald-600" />
      };
    }
  } catch (e) {}

  // 10. Default fallback
  if (hasParentId) {
    return {
      role: "PARENT",
      label: "Parent d'élève",
      name: "Parent d'élève",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <User className="w-3.5 h-3.5 text-blue-600" />
    };
  }

  return {
    role: "DIRECTEUR",
    label: "Directeur",
    name: "Directeur",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
  };
}

export function PaymentActorBadge({ 
  payment, 
  students, 
  profiles,
  size = "md"
}: { 
  payment: any; 
  students?: any[]; 
  profiles?: any[];
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}) {
  const actor = resolvePaymentActor(payment, students, profiles);

  return (
    <div className="inline-flex items-center" title={`Initié par : ${actor.label}`}>
      <span className={`inline-flex items-center gap-1.5 ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'} rounded-full font-bold border ${actor.badgeClass} shadow-2xs whitespace-nowrap`}>
        {actor.icon}
        <span>{actor.label}</span>
      </span>
    </div>
  );
}
