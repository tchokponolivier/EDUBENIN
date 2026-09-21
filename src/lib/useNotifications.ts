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

      // 2. Fetch Support & DB Notifications for Admin, Cashier, Secretary, Supervisor
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

        // Direct check for pending payments awaiting cashier/admin verification
        let { data: pendingPayments, error: pendingErr } = await supabase
          .from('payments')
          .select('*, students(first_name, last_name, level)')
          .eq('school_id', user.schoolId)
          .eq('status', 'PENDING')
          .order('created_at', { ascending: false });

        if (pendingErr) {
          const { data: fallbackPays } = await supabase
            .from('payments')
            .select('*')
            .eq('school_id', user.schoolId)
            .eq('status', 'PENDING')
            .order('created_at', { ascending: false });
          pendingPayments = fallbackPays;
        }

        if (pendingPayments && pendingPayments.length > 0) {
          const missingStudents = pendingPayments.some((p: any) => !p.students && p.student_id);
          let studentMap = new Map();
          if (missingStudents) {
            const { data: studentsData } = await supabase.from('students').select('id, first_name, last_name, level').eq('school_id', user.schoolId);
            studentMap = new Map((studentsData || []).map((s: any) => [s.id, s]));
          }

          pendingPayments.forEach((p: any) => {
            const student = p.students || studentMap.get(p.student_id);
            const studentName = student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : "Élève";
            const notifId = `pending-pay-${p.id}`;
            const payDateObj = p.payment_date ? new Date(p.payment_date) : (p.created_at ? new Date(p.created_at) : new Date());
            const timeStr = !isNaN(payDateObj.getTime()) ? payDateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
            
            notifs.push({
              id: notifId,
              type: 'PAYMENT',
              title: `Nouvelle transaction à vérifier : ${studentName}`,
              message: `Encaissement de ${Number(p.amount).toLocaleString()} FCFA (${p.network || 'Caisse'}, Réf: ${p.reference})${timeStr ? ` à ${timeStr}` : ''} en attente de vérification.`,
              date: payDateObj.getTime(),
              read: readIds.includes(notifId),
              link: '/school-admin/payments?tab=VERIFICATION'
            });
          });
        }
      }

      if (user.role === 'PARENT') {
        // Fetch DB notifications targeted to parent or school
        const { data: dbParentNotifs } = await supabase
          .from('notifications')
          .select('*')
          .or(`user_id.eq.${user.id},school_id.eq.${user.schoolId}`)
          .order('created_at', { ascending: false })
          .limit(20);

        if (dbParentNotifs) {
          dbParentNotifs.forEach((n: any) => {
            if (n.user_id && n.user_id !== user.id) return;
            const notifId = `dbnotif-${n.id}`;
            if (!notifs.some(existing => existing.id === notifId)) {
              notifs.push({
                id: notifId,
                type: (n.type as any) || 'PAYMENT',
                title: n.title,
                message: n.message,
                date: new Date(n.created_at).getTime(),
                read: readIds.includes(notifId),
                link: n.link || '/parent/payments'
              });
            }
          });
        }

        const { data: students } = await supabase.from('students').select('*').eq('parent_id', user.id);
        const { data: feeConfigs } = await supabase.from('fee_config').select('*').eq('school_id', user.schoolId);
        
        if (students && students.length > 0) {
          const studentIds = students.map(s => s.id);

          // Notifications for VALIDATED payments for parent's children (by student_id or parent_id)
          const { data: validatedPayments } = await supabase
            .from('payments')
            .select('*')
            .or(`student_id.in.(${studentIds.join(',')}),parent_id.eq.${user.id}`)
            .eq('status', 'COMPLETED')
            .order('created_at', { ascending: false })
            .limit(15);

          if (validatedPayments) {
            validatedPayments.forEach((p: any) => {
              const child = students.find(s => s.id === p.student_id);
              const childName = child ? `${child.first_name || ''} ${child.last_name || ''}`.trim() : "Votre enfant";
              const notifId = `val-pay-${p.id}`;
              const payDateObj = p.payment_date ? new Date(p.payment_date) : (p.created_at ? new Date(p.created_at) : new Date());
              const timeStr = !isNaN(payDateObj.getTime()) ? payDateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
              
              notifs.push({
                id: notifId,
                type: 'PAYMENT',
                title: `Paiement validé : ${childName}`,
                message: `Votre paiement de ${Number(p.amount).toLocaleString()} FCFA (Réf: ${p.reference}) a été validé avec succès par la caisse${timeStr ? ` à ${timeStr}` : ''}.`,
                date: payDateObj.getTime(),
                read: readIds.includes(notifId),
                link: '/parent/payments'
              });
            });
          }

          if (feeConfigs) {
            for (const student of students) {
              const studentFees = feeConfigs.filter(f => f.level === student.level || f.level === 'ALL');
              for (const fee of studentFees) {
                const { data: payments } = await supabase
                  .from('payments')
                  .select('amount')
                  .eq('student_id', student.id)
                  .eq('status', 'COMPLETED')
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
                    date: new Date().getTime(),
                    read: readIds.includes(notifId),
                    link: '/parent/payments'
                  });
                }
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
    // Poll every 30 seconds for quick reactive updates
    const interval = setInterval(fetchNotifications, 30 * 1000);
    
    // Listen for cross-component notification triggers
    const handleRefresh = () => {
      fetchNotifications();
    };
    window.addEventListener('refresh_notifications', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('refresh_notifications', handleRefresh);
    };
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
