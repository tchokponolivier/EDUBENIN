import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFCFA(amount: number | string | null | undefined): string {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  return new Intl.NumberFormat('fr-FR').format(Math.max(0, Math.round(num))) + ' FCFA';
}

export function getNormalizedName(obj: any): string {
  if (!obj) return '';
  if (obj.first_name || obj.last_name) {
    return `${obj.first_name || ''} ${obj.last_name || ''}`.trim();
  }
  if (obj.firstName || obj.lastName) {
    return `${obj.firstName || ''} ${obj.lastName || ''}`.trim();
  }
  return obj.full_name || obj.name || obj.email?.split('@')[0] || '';
}

export function getNormalizedAcademicYear(item: any, fallback = '2024-2025'): string {
  if (!item) return fallback;
  return item.academic_year || item.academicYear || fallback;
}
