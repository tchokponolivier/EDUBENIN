import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';

export interface AppNotification {
  id: string;
  type: 'PAYMENT' | 'ANNOUNCEMENT' | 'SUPPORT';
  title: string;
  message: string;
  date: number;
  read: boolean;
  link: string;
}

const FEE_LABELS: Record<string, string> = {
  MONTHLY: "Frais de scolarité",
  INSCRIPTION: "Frais d'inscription",
  INSCRIPTION_NEW: "Frais d'inscription (Nouvel élève)",
  INSCRIPTION_OLD: "Frais de réinscription (Ancien élève)",
  RE_REGISTRATION: "Frais de réinscription",
  CANTEEN: "Cantine scolaire",
  SUPERVISED_CARE: "Garde surveillée",
  BOOKS: "Livres et manuels",
  TD: "Travaux dirigés (TD)",
  ID_CARD: "Carte scolaire",
  UNIFORM: "Uniforme scolaire",
  UNIFORMS: "Uniforme scolaire",
  SPORTS_WEAR: "Tenue de sport",
  EVALUATION: "Frais d'évaluation",
  EXAM: "Frais d'examen",
  VACATION_CLASSES: "Cours de vacances",
  REINFORCEMENT_CLASSES: "Cours de renforcement",
  TRANSPORT: "Transport scolaire",
  OTHER: "Frais scolaires"
};

export function getFeeLabel(feeType?: string): string {
  if (!feeType) return "Frais scolaires";
  const key = feeType.toUpperCase();
  return FEE_LABELS[key] || FEE_LABELS[feeType] || feeType;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user?.schoolId) {
      setLoading(false);
      return;
    }

    try {
      const readIds = JSON.parse(localStorage.getItem(`read_notifications_${user.id}`) || '[]');
      const notifs: AppNotification[] = [];

      // 1. Fetch Announcements

      let audienceFilter = 'Parents';
      if (user.role === 'TEACHER') audienceFilter = 'Professeurs';
      else if (['SECRETARY', 'CASHIER', 'SUPERVISOR', 'DIRECTOR_OF_STUDIES'].includes(user.role)) audienceFilter = 'Administration';
      
      const { data: announcements } = await supabase
        .from('announcements')
        .select('*')
        .eq('school_id', user.schoolId)
        .in('target_audience', [audienceFilter, 'ALL'])
        .order('created_at', { ascending: false })
        .limit(10);


      if (announcements) {
        announcements.forEach((a: any) => {
          notifs.push({
            id: `ann-${a.id}`,
            type: 'ANNOUNCEMENT',
            title: 'Nouvelle Annonce : ' + a.title,
            message: a.content.substring(0, 100) + (a.content.length > 100 ? '...' : ''),
            date: new Date(a.created_at).getTime(),
            read: readIds.includes(`ann-${a.id}`),
            link: user.role === 'PARENT' ? '/parent' : '/school-admin'
          });
        });
      }

      // 2. Fetch Payment Reminders (only for PARENT)
      // 3. Fetch Support Notifications for Admin, Cashier, Secretary
      if (['SCHOOL_ADMIN', 'CASHIER', 'SECRETARY', 'SUPERVISOR'].includes(user.role)) {
        const { data: dbNotifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('school_id', user.schoolId)
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (dbNotifs) {
          dbNotifs.forEach((n: any) => {
            notifs.push({
              id: `dbnotif-${n.id}`,
              type: n.type as any,
              title: n.title,
              message: n.message,
              date: new Date(n.created_at).getTime(),
              read: readIds.includes(`dbnotif-${n.id}`),
              link: user.role === 'SECRETARY' ? '/school-admin/students' : '/school-admin'
            });
          });
        }
      }

      if (user.role === 'PARENT') {
        const { data: students } = await supabase.from('students').select('*').eq('parent_id', user.id);
        const { data: feeConfigs } = await supabase.from('fee_config').select('*').eq('school_id', user.schoolId);
        
        if (students && feeConfigs) {
          for (const student of students) {
            // Get fees for this student
            const studentFees = feeConfigs.filter(f => f.level === student.level || f.level === 'ALL');
            
            for (const fee of studentFees) {
              // We simulate a missing payment alert. In a real app, we would sum payments for this specific fee_type.
              // For simplicity, we create a reminder if no payment covers the full amount.
              const { data: payments } = await supabase
                .from('payments')
                .select('amount')
                .eq('student_id', student.id)
                .eq('fee_type', fee.fee_type);
                
              const paidAmount = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
              
              if (paidAmount < fee.amount) {
                const notifId = `fee-${student.id}-${fee.id}`;
                const feeLabel = getFeeLabel(fee.fee_type);
                notifs.push({
                  id: notifId,
                  type: 'PAYMENT',
                  title: `Rappel de paiement : ${student.first_name} ${student.last_name || ''}`,
                  message: `Reste à payer : ${(fee.amount - paidAmount).toLocaleString()} FCFA pour : ${feeLabel}.`,
                  date: new Date().getTime(), // Currently active
                  read: readIds.includes(notifId),
                  link: '/parent/payments'
                });
              }
            }
          }
        }
      }

      setNotifications(notifs.sort((a, b) => b.date - a.date));
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = (id: string) => {
    const readIds = JSON.parse(localStorage.getItem(`read_notifications_${user?.id}`) || '[]');
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem(`read_notifications_${user?.id}`, JSON.stringify(readIds));
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  const markAllAsRead = () => {
    const readIds = JSON.parse(localStorage.getItem(`read_notifications_${user?.id}`) || '[]');
    const newReadIds = Array.from(new Set([...readIds, ...notifications.map(n => n.id)]));
    localStorage.setItem(`read_notifications_${user?.id}`, JSON.stringify(newReadIds));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return { notifications, loading, markAsRead, markAllAsRead, refresh: fetchNotifications };
}
