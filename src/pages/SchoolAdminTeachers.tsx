import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { getDirectorAcademicYears } from "../lib/academicYears";
import { 
  User, 
  Calculator, 
  BookOpen, 
  Clock, 
  Banknote, 
  Calendar, 
  Plus, 
  Edit2, 
  Trash2, 
  Mail, 
  Layers, 
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
  Search,
  Filter,
  GraduationCap,
  FileSpreadsheet,
  Save,
  Check,
  History
} from "lucide-react";
import { LEVELS, SUBJECTS } from "../types";

export function SchoolAdminTeachers() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"TEACHERS" | "MEMBERS" | "SUBJECTS" | "HOURS">("TEACHERS");
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [customSubjectInput, setCustomSubjectInput] = useState("");

  // Deletion History State (Director of Studies deletions visible to Director)
  const [deletionLogs, setDeletionLogs] = useState<any[]>([]);
  const [showDeletionHistoryModal, setShowDeletionHistoryModal] = useState(false);

  // Invitations & Membres Tab State
  const [allInvitations, setAllInvitations] = useState<any[]>([]);
  const [schoolMembers, setSchoolMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("TEACHER");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);
  
  // Attribution Modal State
  const [assigningTeacher, setAssigningTeacher] = useState<any | null>(null);
  const [assignSubject, setAssignSubject] = useState(SUBJECTS[0]);
  const [assignClasses, setAssignClasses] = useState<string[]>([]);
  const [assignCoefs, setAssignCoefs] = useState<Record<string, number>>({});
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [assignmentFeedback, setAssignmentFeedback] = useState<string | null>(null);

  // Filters Tab Professeurs
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");
  const [filterSubject, setFilterSubject] = useState("ALL");
  const [teacherSearchTerm, setTeacherSearchTerm] = useState("");
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [currentConfiguredYear, setCurrentConfiguredYear] = useState<string>("");

  // Filters Tab Matières par classe
  const [subjectFilterClass, setSubjectFilterClass] = useState<string>("ALL");
  const [subjectFilterYear, setSubjectFilterYear] = useState<string>("ALL");
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourseName, setNewCourseName] = useState(SUBJECTS[0]);
  const [newCourseLevel, setNewCourseLevel] = useState(LEVELS[0]);
  const [newCourseCoef, setNewCourseCoef] = useState(2);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  // Filters Tab Heures par classe
  const [hoursFilterYear, setHoursFilterYear] = useState<string>("ALL");
  const [hoursFilterClass, setHoursFilterClass] = useState<string>("ALL");
  const [hoursFilterTeacher, setHoursFilterTeacher] = useState<string>("ALL");
  const [hoursSearchTerm, setHoursSearchTerm] = useState<string>("");
  const [savingCourseId, setSavingCourseId] = useState<string | null>(null);
  const [hoursDrafts, setHoursDrafts] = useState<Record<string, { teacher_id?: string | null; hoursPerWeek?: number; hourlyRate?: number; academic_year?: string }>>({});
  const [savedRowsFeedback, setSavedRowsFeedback] = useState<Record<string, boolean>>({});

  const getCourseDraft = (c: any) => {
    const d = hoursDrafts[c.id];
    return {
      teacher_id: d?.teacher_id !== undefined ? d.teacher_id : (c.teacher_id || ""),
      hoursPerWeek: d?.hoursPerWeek !== undefined ? d.hoursPerWeek : (c.hoursPerWeek ?? 4),
      hourlyRate: d?.hourlyRate !== undefined ? d.hourlyRate : (c.hourlyRate ?? 3500),
      academic_year: d?.academic_year !== undefined ? d.academic_year : (c.academic_year || currentConfiguredYear || (academicYears[0]?.name || "2024-2025"))
    };
  };

  const updateCourseDraft = (courseId: string, updates: Partial<{ teacher_id: string | null; hoursPerWeek: number; hourlyRate: number; academic_year: string }>) => {
    setHoursDrafts(prev => ({
      ...prev,
      [courseId]: { ...prev[courseId], ...updates }
    }));
  };

  const handleSaveSingleCourseHours = async (course: any) => {
    const draft = getCourseDraft(course);
    setSavingCourseId(course.id);
    await handleSaveCourseHours(course.id, draft.teacher_id || null, draft.hoursPerWeek, draft.hourlyRate, draft.academic_year);
    setSavedRowsFeedback(prev => ({ ...prev, [course.id]: true }));
    setTimeout(() => {
      setSavedRowsFeedback(prev => ({ ...prev, [course.id]: false }));
    }, 2500);
  };

  // Bulk Edit Table Modal State
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkRows, setBulkRows] = useState<any[]>([]);
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

  // Edit Teacher State with Subjects (checkboxes) & Classes
  const [editingTeacherSubjects, setEditingTeacherSubjects] = useState<string[]>([]);
  const [editingTeacherClasses, setEditingTeacherClasses] = useState<string[]>([]);
  const [editingTeacherCoefs, setEditingTeacherCoefs] = useState<Record<string, number>>({});

  // List of distinct subjects already configured in school for convenient selection
  const existingSchoolSubjects = Array.from(new Set([
    ...SUBJECTS,
    ...courses.map(c => c.name)
  ])).filter(Boolean).sort();

  // Helper to manage persistent course metadata (coefficient, academic_year, hoursPerWeek, hourlyRate)
  const getCoursesMeta = (schoolId: string): Record<string, { coefficient?: number; academic_year?: string; hoursPerWeek?: number; hourlyRate?: number }> => {
    try {
      const raw = localStorage.getItem(`school_courses_meta_${schoolId}`);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  };

  const setCourseMeta = (schoolId: string, courseIdOrKey: string, meta: { coefficient?: number; academic_year?: string; hoursPerWeek?: number; hourlyRate?: number }) => {
    try {
      const current = getCoursesMeta(schoolId);
      current[courseIdOrKey] = { ...current[courseIdOrKey], ...meta };
      localStorage.setItem(`school_courses_meta_${schoolId}`, JSON.stringify(current));
    } catch (e) {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Resolve active school ID for establishment
      let targetSchoolId = localStorage.getItem('edubenin_active_school_id') || user?.schoolId;
      const { data: sc } = await supabase.from('schools').select('id, academic_year').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (sc?.id) {
        if (!targetSchoolId || targetSchoolId === "11111111-1111-4111-8111-111111111111") {
          targetSchoolId = sc.id;
        }
        localStorage.setItem('edubenin_active_school_id', sc.id);
      }
      if (!targetSchoolId) targetSchoolId = "11111111-1111-4111-8111-111111111111";

      const validSchoolIds = new Set<string>();
      if (targetSchoolId) validSchoolIds.add(targetSchoolId);
      if (user?.schoolId) validSchoolIds.add(user.schoolId);
      if (sc?.id) validSchoolIds.add(sc.id);
      validSchoolIds.add("11111111-1111-4111-8111-111111111111");
      const activeStored = localStorage.getItem('edubenin_active_school_id');
      if (activeStored) validSchoolIds.add(activeStored);

      const [allProfilesRes, invitationsRes, coursesRes, directorYears, schoolRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('invitations').select('*').order('created_at', { ascending: false }),
        supabase.from('courses').select('*, profiles(id, full_name, email, role)'),
        getDirectorAcademicYears(targetSchoolId),
        supabase.from('schools').select('*').eq('id', targetSchoolId).maybeSingle()
      ]);
      
      const isTeacher = (p: any) => {
        if (!p || p.role === 'DELETED') return false;
        const r = (p.role || '').toUpperCase();
        const title = (p.title || '').toLowerCase();
        const email = (p.email || '').toLowerCase();
        const name = (p.full_name || '').toLowerCase();
        return r === 'TEACHER' || r.includes('PROF') || r.includes('ENSEIGNANT') || 
               title.includes('prof') || title === 'permanent' || title === 'vacataire' || title === 'invité' ||
               email.includes('prof') || name.startsWith('prof') || name.startsWith('m.') || name.startsWith('mme.');
      };

      const isDummyTeacher = (p: any) => {
        if (!p) return false;
        const id = String(p.id || '');
        const email = String(p.email || '').toLowerCase().trim();
        const name = String(p.full_name || '').toLowerCase().trim();
        return (id.startsWith("77777777-7777") && !p.isReal) ||
               id === "inv_dummy_1" ||
               email === "prof@school.com" ||
               name === "professeur test";
      };

      // Load deletion history logs
      try {
        const logsKey = `teacher_deletion_logs_${targetSchoolId}`;
        const savedLogs = localStorage.getItem(logsKey);
        if (savedLogs) {
          setDeletionLogs(JSON.parse(savedLogs));
        } else {
          setDeletionLogs([]);
        }
      } catch(e) {
        setDeletionLogs([]);
      }

      // Ensure we harvest from all real sources (DB + local mock DB + custom teachers created by caisse or director)
      let rawProfiles: any[] = allProfilesRes.data && Array.isArray(allProfilesRes.data) ? [...allProfilesRes.data] : [];
      try {
        const local = localStorage.getItem('mock_db_profiles');
        const parsed = local ? JSON.parse(local) : [];
        parsed.forEach((lp: any) => {
          if (!isDummyTeacher(lp) && !rawProfiles.some(rp => rp.id === lp.id || (rp.email && lp.email && rp.email.toLowerCase() === lp.email.toLowerCase()))) {
            rawProfiles.push(lp);
          }
        });
      } catch(e) {}

      let customTeachers: any[] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('school_custom_teachers_')) {
            const parsedCustom = JSON.parse(localStorage.getItem(k) || '[]');
            parsedCustom.forEach((ct: any) => {
              if (!isDummyTeacher(ct) && !rawProfiles.some(rp => rp.id === ct.id || (rp.email && ct.email && rp.email.toLowerCase() === ct.email.toLowerCase()))) {
                rawProfiles.push(ct);
                customTeachers.push(ct);
              }
            });
          } else if (k && k.startsWith('secretary_staff_meta_')) {
            const staffMap = JSON.parse(localStorage.getItem(k) || '{}');
            Object.values(staffMap).forEach((st: any) => {
              const roleUp = (st.role || '').toUpperCase();
              const labelLow = (st.roleLabel || '').toLowerCase();
              const isStaffTeacher = roleUp === 'TEACHER' || labelLow.includes('prof') || labelLow.includes('enseign');
              if (isStaffTeacher && !isDummyTeacher(st) && !rawProfiles.some(rp => rp.id === st.id || (rp.email && st.email && rp.email.toLowerCase() === st.email.toLowerCase()))) {
                const teacherObj = {
                  id: st.id || 'staff_' + Math.random().toString(36).substring(2, 8),
                  full_name: st.name || st.full_name || 'Professeur',
                  email: st.email || '',
                  phone: st.phone || '',
                  role: 'TEACHER',
                  title: st.roleLabel || 'Permanent',
                  school_id: targetSchoolId
                };
                rawProfiles.push(teacherObj);
                customTeachers.push(teacherObj);
              }
            });
          }
        }
      } catch(e) {}

      // Cross-reference any real courses
      let allCoursesList: any[] = coursesRes.data && Array.isArray(coursesRes.data) ? [...coursesRes.data] : [];
      try {
        const localCourses = localStorage.getItem('mock_db_courses');
        const parsedC = localCourses ? JSON.parse(localCourses) : [];
        parsedC.forEach((lc: any) => {
          if (!allCoursesList.some(rc => rc.id === lc.id)) {
            allCoursesList.push(lc);
          }
        });
      } catch(e) {}

      const DEFAULT_COURSES = [
        { id: "c1", school_id: targetSchoolId, name: "Mathématiques", level: "6ème", teacher_id: null, coefficient: 3, hoursPerWeek: 4, hourlyRate: 3500 },
        { id: "c2", school_id: targetSchoolId, name: "Français", level: "6ème", teacher_id: null, coefficient: 3, hoursPerWeek: 5, hourlyRate: 3500 },
        { id: "c3", school_id: targetSchoolId, name: "SVT", level: "6ème", teacher_id: null, coefficient: 2, hoursPerWeek: 2, hourlyRate: 3500 },
        { id: "c4", school_id: targetSchoolId, name: "Histoire-Géographie", level: "3ème", teacher_id: null, coefficient: 2, hoursPerWeek: 3, hourlyRate: 3500 },
        { id: "c5", school_id: targetSchoolId, name: "Anglais", level: "6ème", teacher_id: null, coefficient: 2, hoursPerWeek: 3, hourlyRate: 3500 },
        { id: "c6", school_id: targetSchoolId, name: "Mathématiques", level: "3ème", teacher_id: null, coefficient: 3, hoursPerWeek: 4, hourlyRate: 3500 },
        { id: "c7", school_id: targetSchoolId, name: "Français", level: "3ème", teacher_id: null, coefficient: 3, hoursPerWeek: 5, hourlyRate: 3500 }
      ];
      DEFAULT_COURSES.forEach(dc => {
        if (!allCoursesList.some(rc => rc.id === dc.id)) {
          allCoursesList.push(dc);
        }
      });

      // Load inviter metadata across all school keys
      let invMeta: Record<string, any> = {};
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('school_invitations_meta_')) {
            const parsed = JSON.parse(localStorage.getItem(k) || '{}');
            invMeta = { ...invMeta, ...parsed };
          }
        }
      } catch (e) {}

      // Collect all invitations from Supabase + mock_db_invitations + school_invitations_meta_*
      let allInvs: any[] = invitationsRes.data && Array.isArray(invitationsRes.data) ? [...invitationsRes.data] : [];
      try {
        const localInvs = localStorage.getItem('mock_db_invitations');
        const parsedInvs = localInvs ? JSON.parse(localInvs) : [];
        parsedInvs.forEach((li: any) => {
          if (!isDummyTeacher(li) && !allInvs.some(ri => ri.id === li.id || (ri.email && li.email && ri.email.toLowerCase() === li.email.toLowerCase()))) {
            allInvs.push(li);
          }
        });
      } catch(e) {}

      // Harvest from all school_invitations_meta_* in localStorage so invitations created by Director are always captured
      try {
        Object.entries(invMeta).forEach(([em, m]: [string, any]) => {
          const cleanEm = em.toLowerCase().trim();
          if (cleanEm && !allInvs.some(ri => ri.email && ri.email.toLowerCase().trim() === cleanEm)) {
            allInvs.push({
              id: `meta_inv_${cleanEm}`,
              email: cleanEm,
              role: m.role || 'TEACHER',
              school_id: targetSchoolId,
              invited_by_role: m.invited_by_role || 'SCHOOL_ADMIN',
              invited_by_name: m.invited_by_name || 'Directeur',
              created_at: m.invited_at || new Date().toISOString()
            });
          }
        });
      } catch (e) {}

      // Do NOT filter out invitations by school_id so Director of Studies can see ALL teachers invited by the Director
      allInvs = allInvs.filter((inv: any) => !isDummyTeacher(inv));
      setAllInvitations(allInvs);

      let allMembersData = rawProfiles.filter(m => m.role !== 'DELETED' && !isDummyTeacher(m));
      // Also add pending invited members to schoolMembers so they show up under Membres & Invitations
      allInvs.forEach((inv: any) => {
        const em = (inv.email || '').toLowerCase().trim();
        if (em && !allMembersData.some((m: any) => m.email && m.email.toLowerCase().trim() === em)) {
          const meta = invMeta[em] || {};
          const whoRole = meta.invited_by_role || inv.invited_by_role || 'SCHOOL_ADMIN';
          const whoName = meta.invited_by_name || inv.invited_by_name || (whoRole === 'DIRECTOR_OF_STUDIES' ? 'Directeur des Études' : 'Directeur');
          allMembersData.push({
            id: inv.id || `inv_${em}`,
            email: inv.email,
            full_name: inv.full_name || (inv.email ? inv.email.split('@')[0].toUpperCase() : 'Membre Invité'),
            role: inv.role || 'TEACHER',
            isInvitation: true,
            status: 'INVITED',
            school_id: targetSchoolId,
            invited_by_role: whoRole,
            invited_by_name: whoName,
            created_at: inv.created_at || meta.invited_at || new Date().toISOString()
          });
        }
      });
      setSchoolMembers(allMembersData.length > 0 ? allMembersData : []);

      // Filtrer les invitations d'enseignants créées par le Directeur ou Directeur des Études
      const isTeacherRole = (r?: string) => {
        if (!r) return true; // Default invitation in teacher view
        const up = String(r).toUpperCase().trim();
        return up === 'TEACHER' || up.includes('PROF') || up.includes('ENSEIGN');
      };

      const teacherInvs = allInvs.filter((inv: any) => 
        !isDummyTeacher(inv) && isTeacherRole(inv.role)
      );

      const invitedEmailsMap = new Map<string, any>();
      teacherInvs.forEach((inv: any) => {
        const em = (inv.email || '').toLowerCase().trim();
        if (em) {
          const meta = invMeta[em] || {};
          const whoRole = meta.invited_by_role || inv.invited_by_role || 'SCHOOL_ADMIN';
          const whoName = meta.invited_by_name || inv.invited_by_name || (whoRole === 'DIRECTOR_OF_STUDIES' ? 'Directeur des Études' : 'Directeur');
          invitedEmailsMap.set(em, {
            ...inv,
            invited_by_role: whoRole,
            invited_by_name: whoName
          });
        }
      });

      // Profils existants qui sont des professeurs de l'établissement (visible to Director of Studies)
      const matchedProfiles = rawProfiles.filter(p => {
        if (!isTeacher(p) || isDummyTeacher(p)) return false;
        return true;
      }).map(p => {
        const pEmail = (p.email || '').toLowerCase().trim();
        const invInfo = invitedEmailsMap.get(pEmail);
        const invRole = invInfo?.invited_by_role || p.invited_by_role || 'SCHOOL_ADMIN';
        const invName = invInfo?.invited_by_name || p.invited_by_name || (invRole === 'DIRECTOR_OF_STUDIES' ? 'Directeur des Études' : 'Directeur');
        return {
          ...p,
          invited_by_role: invRole,
          invited_by_name: invName
        };
      });

      // Invitations d'enseignants qui ne se sont pas encore connectés (en attente)
      const matchedEmails = new Set(matchedProfiles.map(p => (p.email || '').toLowerCase().trim()));
      const pendingInvitedTeachers: any[] = [];
      teacherInvs.forEach((inv: any) => {
        const em = (inv.email || '').toLowerCase().trim();
        if (em && !matchedEmails.has(em)) {
          const invInfo = invitedEmailsMap.get(em) || inv;
          const whoRole = invInfo.invited_by_role || inv.invited_by_role || 'SCHOOL_ADMIN';
          const whoName = invInfo.invited_by_name || inv.invited_by_name || (whoRole === 'DIRECTOR_OF_STUDIES' ? 'Directeur des Études' : 'Directeur');
          const cleanName = inv.full_name || invInfo.full_name || inv.name || invInfo.name || (inv.email ? inv.email.split('@')[0].toUpperCase() : "Professeur Invité");
          pendingInvitedTeachers.push({
            id: `inv_${inv.id}`,
            full_name: cleanName,
            email: inv.email,
            phone: inv.phone || "",
            role: "TEACHER",
            title: "Invité",
            isInvitation: true,
            invitationId: inv.id,
            school_id: targetSchoolId,
            invited_by_role: whoRole,
            invited_by_name: whoName
          });
        }
      });

      const combinedTeachers = [...matchedProfiles, ...pendingInvitedTeachers];
      customTeachers.forEach(ct => {
        if (!isDummyTeacher(ct) && !combinedTeachers.some(t => t.id === ct.id || (t.email && ct.email && t.email.toLowerCase() === ct.email.toLowerCase()))) {
          combinedTeachers.push(ct);
        }
      });

      let configuredYear = "";
      try {
        const savedExtra = localStorage.getItem('schoolSettings_extra_' + targetSchoolId);
        if (savedExtra) {
          const parsed = JSON.parse(savedExtra);
          if (parsed.academicYear) configuredYear = parsed.academicYear;
        }
      } catch (e) {}
      if (!configuredYear && schoolRes.data?.academic_year) {
        configuredYear = schoolRes.data.academic_year;
      }
      setCurrentConfiguredYear(configuredYear);

      // Enrich courses with coefficients, hoursPerWeek, and hourlyRate from metadata
      const meta = getCoursesMeta(targetSchoolId);
      const enrichedCourses = allCoursesList.map((c: any) => {
        const m = meta[c.id] || meta[`${c.name?.trim().toLowerCase()}_${c.level}`] || {};
        return {
          ...c,
          coefficient: m.coefficient || c.coefficient || 2,
          academic_year: m.academic_year || c.academic_year || configuredYear || null,
          hoursPerWeek: m.hoursPerWeek !== undefined ? m.hoursPerWeek : (c.hoursPerWeek || 4),
          hourlyRate: m.hourlyRate !== undefined ? m.hourlyRate : (c.hourlyRate || 3500)
        };
      });

      setTeachers(combinedTeachers);
      setCourses(enrichedCourses);
      setAcademicYears(directorYears || []);
    } catch (err) {
      console.error("Error fetching teachers data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleInviteTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    setInviteFeedback(null);
    try {
      let targetSchoolId = localStorage.getItem('edubenin_active_school_id') || user?.schoolId;
      const { data: sc } = await supabase.from('schools').select('id').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (sc?.id) {
        if (!targetSchoolId || targetSchoolId === "11111111-1111-4111-8111-111111111111") {
          targetSchoolId = sc.id;
        }
      }
      if (!targetSchoolId) targetSchoolId = "11111111-1111-4111-8111-111111111111";

      const cleanEmail = inviteEmail.trim().toLowerCase();
      const effectiveRole = inviteRole || 'TEACHER';

      // Check if invitation already exists
      try {
        const { data: existing } = await supabase.from('invitations')
          .select('id').eq('email', cleanEmail).eq('school_id', targetSchoolId).maybeSingle();
        if (existing) {
          await supabase.from('invitations').delete().eq('id', existing.id);
        }
      } catch(e) {}

      const inviterRole = user?.role === 'DIRECTOR_OF_STUDIES' ? 'DIRECTOR_OF_STUDIES' : 'SCHOOL_ADMIN';
      const inviterName = user?.name || (user?.role === 'DIRECTOR_OF_STUDIES' ? "Directeur des Études" : "Directeur");

      // Save invitation metadata
      try {
        const metaKey = `school_invitations_meta_${targetSchoolId}`;
        const metaData = JSON.parse(localStorage.getItem(metaKey) || '{}');
        metaData[cleanEmail] = {
          role: effectiveRole,
          invited_by_role: inviterRole,
          invited_by_name: inviterName,
          invited_at: new Date().toISOString()
        };
        localStorage.setItem(metaKey, JSON.stringify(metaData));
      } catch(e) {}

      try {
        const { error } = await supabase.from('invitations').insert([{
          school_id: targetSchoolId,
          email: cleanEmail,
          role: effectiveRole
        }]);
        if (error) throw error;
      } catch (insertErr) {
        // Fallback to local storage for invitations
        const localInvs = JSON.parse(localStorage.getItem('mock_db_invitations') || '[]');
        localInvs.unshift({
          id: 'inv_' + Date.now(),
          school_id: targetSchoolId,
          email: cleanEmail,
          role: effectiveRole,
          invited_by_role: inviterRole,
          invited_by_name: inviterName,
          created_at: new Date().toISOString()
        });
        localStorage.setItem('mock_db_invitations', JSON.stringify(localInvs));
      }

      setInviteFeedback("Invitation envoyée avec succès ! L'enseignant sera automatiquement associé dès sa connexion avec Google.");
      setInviteEmail("");
      fetchData();
      setTimeout(() => setInviteFeedback(null), 4000);
    } catch (err: any) {
      console.error("Error inviting teacher:", err);
      alert(`Erreur lors de l'invitation: ${err.message}`);
    } finally {
      setIsInviting(false);
    }
  };

  const handleDeleteInvitation = async (id: string) => {
    const invToDelete = allInvitations.find(i => i.id === id);
    if (user?.role === 'DIRECTOR_OF_STUDIES' && invToDelete?.role && (invToDelete.role === 'SCHOOL_ADMIN' || invToDelete.role === 'SUPER_ADMIN')) {
      alert("En tant que Directeur des Études, vous ne pouvez pas annuler l'invitation du Directeur Général.");
      return;
    }
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer / annuler cette invitation ?")) return;
    try {
      if (id && !id.startsWith('meta_inv_')) {
        await supabase.from('invitations').delete().eq('id', id);
      }
    } catch (e) {}

    try {
      const localInvs = JSON.parse(localStorage.getItem('mock_db_invitations') || '[]');
      const filtered = localInvs.filter((i: any) => i.id !== id && (!invToDelete?.email || !i.email || i.email.toLowerCase() !== invToDelete.email.toLowerCase()));
      localStorage.setItem('mock_db_invitations', JSON.stringify(filtered));
    } catch (e) {}

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('school_invitations_meta_')) {
          const meta = JSON.parse(localStorage.getItem(k) || '{}');
          const cleanEm = (invToDelete?.email || '').toLowerCase().trim();
          if (meta[cleanEm]) {
            delete meta[cleanEm];
            localStorage.setItem(k, JSON.stringify(meta));
          }
        }
      }
    } catch (e) {}

    setAllInvitations(prev => prev.filter(i => i.id !== id));
    fetchData();
  };

  // Robust matching helper to find all courses assigned to a teacher
  const getTeacherCourses = (t: any) => {
    if (!t) return [];
    const tid = t.id ? String(t.id).toLowerCase() : "";
    const temail = t.email ? String(t.email).toLowerCase() : "";
    const invId = t.invitationId ? String(t.invitationId).toLowerCase() : "";
    const cleanInvId = t.id && String(t.id).startsWith('inv_') ? String(t.id).replace('inv_', '').toLowerCase() : "";
    
    return courses.filter((c: any) => {
      if (!c.teacher_id) return false;
      const cTid = String(c.teacher_id).toLowerCase();
      return (
        (tid && cTid === tid) ||
        (temail && cTid === temail) ||
        (invId && cTid === invId) ||
        (cleanInvId && cTid === cleanInvId) ||
        (c.teacher_email && temail && String(c.teacher_email).toLowerCase() === temail)
      );
    });
  };

  const getTeacherStats = (t: any) => {
    let teacherCourses = getTeacherCourses(t);
    if (filterYear !== "ALL") {
      teacherCourses = teacherCourses.filter(c => !c.academic_year || c.academic_year === filterYear);
    }

    let totalHours = 0;
    let totalMonthlyPay = 0;

    teacherCourses.forEach(c => {
      const h = Number(c.hoursPerWeek) > 0 ? Number(c.hoursPerWeek) : 4;
      const rate = Number(c.hourlyRate) > 0 ? Number(c.hourlyRate) : 3500;
      totalHours += h;
      totalMonthlyPay += (h * 4 * rate);
    });

    const avgHourlyRate = totalHours > 0 ? Math.round(totalMonthlyPay / (totalHours * 4)) : 3500;

    return {
      courses: teacherCourses,
      hoursPerWeek: totalHours,
      avgHourlyRate,
      monthlySalary: totalMonthlyPay
    };
  };

  // Handler to update hours, hourly rate, and teacher for a course in tab HOURS
  const handleSaveCourseHours = async (courseId: string, updatedTeacherId: string | null, hours: number, rate: number, year?: string) => {
    const effectiveSchoolId = user?.schoolId || localStorage.getItem('edubenin_active_school_id') || "11111111-1111-4111-8111-111111111111";
    setSavingCourseId(courseId);
    try {
      const course = courses.find(c => c.id === courseId);
      const targetYear = year || course?.academic_year || currentConfiguredYear || filterYear;

      // 1. Update teacher_id in Supabase if changed
      if (course && course.teacher_id !== updatedTeacherId) {
        try {
          await supabase.from('courses').update({
            teacher_id: updatedTeacherId || null
          }).eq('id', courseId);
        } catch(e) {}
      }

      // 2. Persist hours & hourly rate & academic_year in course metadata
      setCourseMeta(effectiveSchoolId, courseId, {
        hoursPerWeek: Number(hours) || 4,
        hourlyRate: Number(rate) || 3500,
        academic_year: targetYear !== "ALL" ? targetYear : undefined
      });

      if (course) {
        setCourseMeta(effectiveSchoolId, `${course.name?.trim().toLowerCase()}_${course.level}`, {
          hoursPerWeek: Number(hours) || 4,
          hourlyRate: Number(rate) || 3500,
          academic_year: targetYear !== "ALL" ? targetYear : undefined
        });
      }

      // Also persist to local courses mock
      try {
        const localCourses = JSON.parse(localStorage.getItem('mock_db_courses') || '[]');
        const idx = localCourses.findIndex((lc: any) => lc.id === courseId);
        if (idx >= 0) {
          localCourses[idx] = { ...localCourses[idx], teacher_id: updatedTeacherId || null, hoursPerWeek: Number(hours) || 4, hourlyRate: Number(rate) || 3500, academic_year: targetYear !== "ALL" ? targetYear : undefined };
        } else {
          localCourses.push({ id: courseId, school_id: effectiveSchoolId, teacher_id: updatedTeacherId || null, hoursPerWeek: Number(hours) || 4, hourlyRate: Number(rate) || 3500, academic_year: targetYear !== "ALL" ? targetYear : undefined });
        }
        localStorage.setItem('mock_db_courses', JSON.stringify(localCourses));
      } catch(e) {}

      await fetchData();
    } catch (err: any) {
      alert("Erreur lors de l'enregistrement des heures: " + err.message);
    } finally {
      setSavingCourseId(null);
    }
  };

  // Bulk Edit Table Open & Save
  const openBulkEditModal = () => {
    const rows = courses.map(c => ({
      id: c.id,
      name: c.name,
      level: c.level,
      teacher_id: c.teacher_id || "",
      academic_year: c.academic_year || currentConfiguredYear || (academicYears[0]?.name || "2024-2025"),
      hoursPerWeek: c.hoursPerWeek !== undefined ? c.hoursPerWeek : 4,
      hourlyRate: c.hourlyRate !== undefined ? c.hourlyRate : 3500,
      coefficient: c.coefficient !== undefined ? c.coefficient : 2,
      isNew: false
    }));
    setBulkRows(rows);
    setBulkFeedback(null);
    setShowBulkEditModal(true);
  };

  const handleAddBulkRow = () => {
    setBulkRows(prev => [
      ...prev,
      {
        id: `temp_${Date.now()}`,
        name: SUBJECTS[0],
        level: LEVELS[0],
        teacher_id: teachers[0]?.id || "",
        academic_year: currentConfiguredYear || (academicYears[0]?.name || "2024-2025"),
        hoursPerWeek: 4,
        hourlyRate: 3500,
        coefficient: 2,
        isNew: true
      }
    ]);
  };

  const handleRemoveBulkRow = (index: number) => {
    setBulkRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveBulkEdit = async () => {
    const effectiveSchoolId = user?.schoolId || localStorage.getItem('edubenin_active_school_id') || "11111111-1111-4111-8111-111111111111";
    setIsSavingBulk(true);
    try {
      for (const row of bulkRows) {
        let actualId = row.id;
        const teacherVal = row.teacher_id ? row.teacher_id : null;

        try {
          if (row.isNew || String(row.id).startsWith("temp_")) {
            // Insert new course in Supabase
            const { data: inserted } = await supabase.from('courses').insert([{
              school_id: effectiveSchoolId,
              name: row.name.trim(),
              level: row.level,
              teacher_id: teacherVal
            }]).select().maybeSingle();

            if (inserted?.id) {
              actualId = inserted.id;
            }
          } else {
            // Update existing course in Supabase
            await supabase.from('courses').update({
              name: row.name.trim(),
              level: row.level,
              teacher_id: teacherVal
            }).eq('id', row.id);
          }
        } catch(e) {}

        // Save metadata (coefficient, hoursPerWeek, hourlyRate, academic_year)
        setCourseMeta(effectiveSchoolId, actualId, {
          coefficient: Number(row.coefficient) || 2,
          academic_year: row.academic_year,
          hoursPerWeek: Number(row.hoursPerWeek) || 4,
          hourlyRate: Number(row.hourlyRate) || 3500
        });
        setCourseMeta(effectiveSchoolId, `${row.name.trim().toLowerCase()}_${row.level}`, {
          coefficient: Number(row.coefficient) || 2,
          academic_year: row.academic_year,
          hoursPerWeek: Number(row.hoursPerWeek) || 4,
          hourlyRate: Number(row.hourlyRate) || 3500
        });
      }

      setBulkFeedback("Toutes les informations ont été enregistrées avec succès dans la base !");
      await fetchData();
      setTimeout(() => {
        setShowBulkEditModal(false);
      }, 1200);
    } catch (err: any) {
      alert("Erreur lors de l'enregistrement en tableau: " + err.message);
    } finally {
      setIsSavingBulk(false);
    }
  };

  const handleDeleteTeacher = async (t: any) => {
    if (user?.role === 'DIRECTOR_OF_STUDIES' && (t.role === 'SCHOOL_ADMIN' || t.role === 'SUPER_ADMIN')) {
      alert("En tant que Directeur des Études, vous ne pouvez pas supprimer le profil du Directeur.");
      return;
    }
    const teacherName = t.full_name || t.email?.split('@')[0] || "ce professeur";
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${teacherName} ? Cette action sera consignée dans l'historique.`)) return;
    try {
      if (t.isInvitation && t.invitationId) {
        await supabase.from('invitations').delete().eq('id', t.invitationId);
      } else {
        await supabase.from('profiles').delete().eq('id', t.id);
      }
      // Unlink courses
      await supabase.from('courses').update({ teacher_id: null }).eq('teacher_id', t.id);
      if (t.invitationId) {
        await supabase.from('courses').update({ teacher_id: null }).eq('teacher_id', t.invitationId);
      }
      if (t.email) {
        await supabase.from('courses').update({ teacher_id: null }).eq('teacher_id', t.email);
      }

      let targetSchoolId = user?.schoolId || localStorage.getItem('edubenin_active_school_id') || "11111111-1111-4111-8111-111111111111";
      try {
        const customT = localStorage.getItem(`school_custom_teachers_${targetSchoolId}`);
        if (customT) {
          const parsed = JSON.parse(customT).filter((ct: any) => ct.id !== t.id && (!t.email || ct.email?.toLowerCase() !== t.email.toLowerCase()));
          localStorage.setItem(`school_custom_teachers_${targetSchoolId}`, JSON.stringify(parsed));
        }
      } catch (e) {}

      try {
        const localInvs = localStorage.getItem('mock_db_invitations');
        if (localInvs) {
          const parsedInvs = JSON.parse(localInvs).filter((inv: any) => inv.id !== t.invitationId && inv.id !== t.id && (!t.email || inv.email?.toLowerCase() !== t.email.toLowerCase()));
          localStorage.setItem('mock_db_invitations', JSON.stringify(parsedInvs));
        }
      } catch (e) {}

      // Enregistrer dans l'historique de suppression (Directeur des Études / Directeur)
      const currentTeacherCourses = getTeacherCourses(t);
      const logEntry = {
        id: `del_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        teacher_id: t.id,
        teacher_name: t.full_name || t.email?.split('@')[0] || "Professeur",
        teacher_email: t.email || "",
        teacher_phone: t.phone || "",
        teacher_subjects: currentTeacherCourses.map(c => c.name).filter(Boolean),
        deleted_by_role: user?.role === 'DIRECTOR_OF_STUDIES' ? 'DIRECTOR_OF_STUDIES' : (user?.role || 'SCHOOL_ADMIN'),
        deleted_by_name: user?.name || (user?.role === 'DIRECTOR_OF_STUDIES' ? "Directeur des Études" : "Directeur"),
        deleted_by_email: user?.email || "",
        deleted_at: new Date().toISOString(),
        school_id: targetSchoolId
      };

      const logsKey = `teacher_deletion_logs_${targetSchoolId}`;
      const existingLogs = JSON.parse(localStorage.getItem(logsKey) || '[]');
      const updatedLogs = [logEntry, ...existingLogs];
      localStorage.setItem(logsKey, JSON.stringify(updatedLogs));
      setDeletionLogs(updatedLogs);

      if (user?.role === 'DIRECTOR_OF_STUDIES') {
        alert(`Le professeur ${teacherName} a été supprimé. L'historique de cette suppression a été transmis au Directeur d'établissement.`);
      } else {
        alert(`Le professeur ${teacherName} a été supprimé avec succès.`);
      }

      await fetchData();
    } catch (err: any) {
      alert("Erreur lors de la suppression: " + err.message);
    }
  };

  // Open Edit Teacher Modal with Pre-populated Subjects & Classes
  const openEditTeacherModal = (t: any) => {
    setEditingTeacher(t);
    setEditingTeacherId(t.id);
    const currentCourses = getTeacherCourses(t);
    const currentSubjectNames = Array.from(new Set(currentCourses.map(c => c.name))).filter(Boolean);
    const storedSubjects = Array.isArray(t.subjects) ? t.subjects : [];
    const initialSubjects = currentSubjectNames.length > 0 
      ? currentSubjectNames 
      : (storedSubjects.length > 0 ? storedSubjects : [existingSchoolSubjects[0] || SUBJECTS[0]]);
    setEditingTeacherSubjects(initialSubjects);
    const classList = Array.from(new Set(currentCourses.map(c => c.level))).filter(Boolean);
    setEditingTeacherClasses(classList);
    const coefMap: Record<string, number> = {};
    currentCourses.forEach(c => {
      coefMap[c.level] = c.coefficient || 2;
    });
    setEditingTeacherCoefs(coefMap);
  };

  const handleToggleEditTeacherClass = (cls: string) => {
    setEditingTeacherClasses(prev => {
      if (prev.includes(cls)) {
        return prev.filter(c => c !== cls);
      } else {
        return [...prev, cls];
      }
    });

    setEditingTeacherCoefs(prev => {
      if (prev[cls] !== undefined) {
        const next = { ...prev };
        delete next[cls];
        return next;
      } else {
        const existing = courses.find(c => editingTeacherSubjects.some(s => s.toLowerCase() === c.name.toLowerCase()) && c.level === cls);
        return { ...prev, [cls]: existing?.coefficient || 2 };
      }
    });
  };

  const handleToggleEditTeacherSubject = (subj: string) => {
    setEditingTeacherSubjects(prev => {
      if (prev.includes(subj)) {
        return prev.filter(s => s !== subj);
      } else {
        return [...prev, subj];
      }
    });
  };

  // Profile Edit Save - updates profile AND assigns the chosen subjects & classes
  const handleSaveTeacherProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    const effectiveSchoolId = user?.schoolId || localStorage.getItem('edubenin_active_school_id') || "11111111-1111-4111-8111-111111111111";
    try {
      let teacherUuid = editingTeacher.id;

      // 1. Update teacher profile in profiles
      if (!editingTeacher.isInvitation && !String(editingTeacher.id).startsWith('inv_')) {
        try {
          await supabase.from('profiles').update({
            full_name: editingTeacher.full_name,
            phone: editingTeacher.phone,
            title: editingTeacher.title || "Permanent"
          }).eq('id', editingTeacher.id);
        } catch(e) {}
      } else {
        // If it was an invited teacher, ensure a real profile row exists in profiles
        const emailToCheck = editingTeacher.email?.toLowerCase();
        if (emailToCheck) {
          let existingProf: any = null;
          try {
            const { data: res } = await supabase.from('profiles')
              .select('id')
              .eq('school_id', effectiveSchoolId)
              .ilike('email', emailToCheck)
              .maybeSingle();
            existingProf = res;
          } catch(e) {}

          if (existingProf?.id) {
            teacherUuid = existingProf.id;
            try {
              await supabase.from('profiles').update({
                full_name: editingTeacher.full_name,
                phone: editingTeacher.phone,
                title: editingTeacher.title || "Invité"
              }).eq('id', existingProf.id);
            } catch(e) {}
          } else {
            const newUuid = (editingTeacher.invitationId && !String(editingTeacher.invitationId).includes('_')) 
              ? editingTeacher.invitationId 
              : crypto.randomUUID();

            try {
              await supabase.from('profiles').insert([{
                id: newUuid,
                full_name: editingTeacher.full_name || emailToCheck.split('@')[0].toUpperCase(),
                email: emailToCheck,
                phone: editingTeacher.phone,
                role: 'TEACHER',
                school_id: effectiveSchoolId,
                title: editingTeacher.title || 'Invité'
              }]);
            } catch(e) {}
            teacherUuid = newUuid;
          }
        }
      }

      // Also persist to custom teachers in local storage with subjects
      try {
        const customKey = `school_custom_teachers_${effectiveSchoolId}`;
        const customList = JSON.parse(localStorage.getItem(customKey) || '[]');
        const existingIdx = customList.findIndex((ct: any) => ct.id === teacherUuid || (ct.email && ct.email.toLowerCase() === editingTeacher.email?.toLowerCase()));
        const teacherObj = {
          id: teacherUuid,
          full_name: editingTeacher.full_name,
          email: editingTeacher.email,
          phone: editingTeacher.phone,
          role: 'TEACHER',
          school_id: effectiveSchoolId,
          title: editingTeacher.title || 'Permanent',
          subjects: editingTeacherSubjects
        };
        if (existingIdx >= 0) customList[existingIdx] = teacherObj;
        else customList.push(teacherObj);
        localStorage.setItem(customKey, JSON.stringify(customList));
      } catch(e) {}

      // 2. Update subjects & classes attributions for this teacher
      const previousCourses = getTeacherCourses(editingTeacher);
      for (const oldC of previousCourses) {
        if (!editingTeacherSubjects.includes(oldC.name) || !editingTeacherClasses.includes(oldC.level)) {
          try {
            await supabase.from('courses').update({ teacher_id: null }).eq('id', oldC.id);
          } catch(e) {}
        }
      }

      const yearToUse = filterYear !== "ALL" ? filterYear : (currentConfiguredYear || null);
      for (const subj of editingTeacherSubjects) {
        for (const cls of editingTeacherClasses) {
          const coef = editingTeacherCoefs[cls] || 2;
          const existingCourse = courses.find(
            c => (c.school_id === effectiveSchoolId || !c.school_id) && 
                 c.name.trim().toLowerCase() === subj.trim().toLowerCase() && 
                 c.level === cls
          );

          if (existingCourse) {
            try {
              await supabase.from('courses').update({
                teacher_id: teacherUuid
              }).eq('id', existingCourse.id);
            } catch(e) {}

            setCourseMeta(effectiveSchoolId, existingCourse.id, { coefficient: coef, academic_year: yearToUse });
            setCourseMeta(effectiveSchoolId, `${subj.trim().toLowerCase()}_${cls}`, { coefficient: coef, academic_year: yearToUse });
          } else {
            let newCourseId = `c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            try {
              const { data: newRow } = await supabase.from('courses').insert([{
                school_id: effectiveSchoolId,
                name: subj.trim(),
                level: cls,
                teacher_id: teacherUuid
              }]).select().maybeSingle();

              if (newRow?.id) {
                newCourseId = newRow.id;
              }
            } catch(e) {}

            setCourseMeta(effectiveSchoolId, newCourseId, { coefficient: coef, academic_year: yearToUse });
            setCourseMeta(effectiveSchoolId, `${subj.trim().toLowerCase()}_${cls}`, { coefficient: coef, academic_year: yearToUse });
          }
        }
      }

      setEditingTeacherId(null);
      setEditingTeacher(null);
      await fetchData();
    } catch (err: any) {
      alert("Erreur lors de la mise à jour: " + err.message);
    }
  };

  // Open Attribution Modal
  const openAssignModal = (t: any) => {
    setAssigningTeacher(t);
    setAssignSubject(SUBJECTS[0]);
    setAssignClasses([]);
    setAssignCoefs({});
    setAssignmentFeedback(null);
  };

  const handleToggleAssignClass = (cls: string) => {
    setAssignClasses(prev => {
      if (prev.includes(cls)) {
        return prev.filter(c => c !== cls);
      } else {
        return [...prev, cls];
      }
    });

    setAssignCoefs(prev => {
      if (prev[cls] !== undefined) {
        const next = { ...prev };
        delete next[cls];
        return next;
      } else {
        // Check if there is an existing course with this subject and class to suggest default coef
        const existing = courses.find(c => c.name.toLowerCase() === assignSubject.toLowerCase() && c.level === cls);
        return { ...prev, [cls]: existing?.coefficient || 2 };
      }
    });
  };

  // Save new assignments in attribution modal
  const handleSaveAssignments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTeacher) return;
    const effectiveSchoolId = user?.schoolId || localStorage.getItem('edubenin_active_school_id') || "11111111-1111-4111-8111-111111111111";
    if (assignClasses.length === 0) {
      alert("Veuillez sélectionner au moins une classe pour cette matière.");
      return;
    }

    setIsSavingAssignment(true);
    try {
      const yearToUse = filterYear !== "ALL" ? filterYear : (currentConfiguredYear || null);
      
      // Ensure a valid UUID in profiles exists for this teacher
      let teacherUuid = assigningTeacher.id;
      if (assigningTeacher.isInvitation || String(teacherUuid).startsWith('inv_')) {
        const emailToCheck = assigningTeacher.email?.toLowerCase();
        if (emailToCheck) {
          let existingProf: any = null;
          try {
            const { data: res } = await supabase.from('profiles')
              .select('id')
              .eq('school_id', effectiveSchoolId)
              .ilike('email', emailToCheck)
              .maybeSingle();
            existingProf = res;
          } catch(e) {}

          if (existingProf?.id) {
            teacherUuid = existingProf.id;
          } else {
            // Create a teacher profile with valid UUID so teacher_id foreign key constraint is satisfied
            const newUuid = (assigningTeacher.invitationId && !String(assigningTeacher.invitationId).includes('_')) 
              ? assigningTeacher.invitationId 
              : crypto.randomUUID();
            
            try {
              const { error: profErr } = await supabase.from('profiles').insert([{
                id: newUuid,
                full_name: assigningTeacher.full_name || emailToCheck.split('@')[0].toUpperCase(),
                email: emailToCheck,
                role: 'TEACHER',
                school_id: effectiveSchoolId,
                title: assigningTeacher.title || 'Invité'
              }]);

              if (!profErr) {
                teacherUuid = newUuid;
              }
            } catch(e) {}
          }
        }
      }

      for (const cls of assignClasses) {
        const coef = assignCoefs[cls] || 2;
        
        // Check if a course already exists in this school for this subject and class
        const existingCourse = courses.find(
          c => (c.school_id === effectiveSchoolId || !c.school_id) && 
               c.name.trim().toLowerCase() === assignSubject.trim().toLowerCase() && 
               c.level === cls
        );

        if (existingCourse) {
          // Update the existing course in Supabase using only valid columns
          try {
            await supabase.from('courses').update({
              teacher_id: teacherUuid
            }).eq('id', existingCourse.id);
          } catch(e) {}

          setCourseMeta(effectiveSchoolId, existingCourse.id, { coefficient: coef, academic_year: yearToUse });
          setCourseMeta(effectiveSchoolId, `${assignSubject.trim().toLowerCase()}_${cls}`, { coefficient: coef, academic_year: yearToUse });
        } else {
          // Create a new course entry in Supabase using only valid columns
          let insertedCourseId = `c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          try {
            const { data: insertedCourse } = await supabase.from('courses').insert([{
              school_id: effectiveSchoolId,
              name: assignSubject.trim(),
              level: cls,
              teacher_id: teacherUuid
            }]).select().maybeSingle();

            if (insertedCourse?.id) {
              insertedCourseId = insertedCourse.id;
            }
          } catch(e) {}

          setCourseMeta(effectiveSchoolId, insertedCourseId, { coefficient: coef, academic_year: yearToUse });
          setCourseMeta(effectiveSchoolId, `${assignSubject.trim().toLowerCase()}_${cls}`, { coefficient: coef, academic_year: yearToUse });
        }
      }

      setAssignmentFeedback(`Matière "${assignSubject}" assignée avec succès à ${assignClasses.length} classe(s) !`);
      setAssignClasses([]);
      setAssignCoefs({});
      await fetchData();
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de l'assignation: " + err.message);
    } finally {
      setIsSavingAssignment(false);
    }
  };

  // Remove single assignment
  const handleUnassignCourse = async (courseId: string) => {
    try {
      await supabase.from('courses').update({ teacher_id: null }).eq('id', courseId);
      await fetchData();
      setAssignmentFeedback("Attribution retirée avec succès.");
    } catch (err: any) {
      alert("Erreur lors du retrait de l'attribution: " + err.message);
    }
  };

  // Tab Matières: Save Course (sans professeur assigné)
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveSchoolId = user?.schoolId || localStorage.getItem('edubenin_active_school_id') || "11111111-1111-4111-8111-111111111111";
    try {
      const yearToUse = filterYear !== "ALL" ? filterYear : (currentConfiguredYear || null);
      if (editingCourse) {
        try {
          await supabase.from('courses').update({
            name: editingCourse.name.trim(),
            level: editingCourse.level
          }).eq('id', editingCourse.id);
        } catch(e) {}
        
        const coef = Number(editingCourse.coefficient) || 1;
        setCourseMeta(effectiveSchoolId, editingCourse.id, { coefficient: coef, academic_year: yearToUse });
        setCourseMeta(effectiveSchoolId, `${editingCourse.name.trim().toLowerCase()}_${editingCourse.level}`, { coefficient: coef, academic_year: yearToUse });
        setEditingCourse(null);
      } else {
        let insertedId = `c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        try {
          const { data: newRow } = await supabase.from('courses').insert([{
            school_id: effectiveSchoolId,
            name: newCourseName.trim(),
            level: newCourseLevel,
            teacher_id: null
          }]).select().maybeSingle();

          if (newRow?.id) {
            insertedId = newRow.id;
          }
        } catch(e) {}

        const coef = Number(newCourseCoef) || 1;
        setCourseMeta(effectiveSchoolId, insertedId, { coefficient: coef, academic_year: yearToUse });
        setCourseMeta(effectiveSchoolId, `${newCourseName.trim().toLowerCase()}_${newCourseLevel}`, { coefficient: coef, academic_year: yearToUse });
        setShowAddCourseModal(false);
      }
      fetchData();
    } catch (err: any) {
      alert("Erreur lors de l'enregistrement de la matière: " + err.message);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette matière ?")) {
      await supabase.from('courses').delete().eq('id', courseId);
      fetchData();
    }
  };

  const dosDeletions = deletionLogs.filter(l => l.deleted_by_role === 'DIRECTOR_OF_STUDIES');

  return (
    <div className="flex flex-col gap-5 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <User className="text-emerald-600" />
            Gestion des Professeurs, Heures & Matières
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Gérez vos enseignants, attribuez les heures par classe, paramétrez les taux horaires et les matières officielles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user?.role === 'SCHOOL_ADMIN' && dosDeletions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDeletionHistoryModal(true)}
              className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-900 px-3.5 py-2.5 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-amber-100 transition shadow-xs cursor-pointer"
              title="Voir l'historique des professeurs supprimés par le Directeur des Études"
            >
              <History size={15} className="text-amber-700" />
              <span>Suppressions Dir. Études</span>
              <span className="px-1.5 py-0.5 bg-amber-600 text-white rounded-full text-[10px] font-black leading-none">
                {dosDeletions.length}
              </span>
            </button>
          )}

          <button
            onClick={openBulkEditModal}
            className="flex items-center gap-2 bg-indigo-600 text-white px-3.5 py-2.5 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-indigo-700 transition shadow-sm"
            title="Modifier toutes les informations dans un tableau interactif"
          >
            <FileSpreadsheet size={15} /> Modifier tout dans un tableau
          </button>

          {activeTab === "TEACHERS" && (
            <button 
              onClick={() => setActiveTab("MEMBERS")} 
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-blue-700 transition shadow-sm cursor-pointer"
            >
              <Mail size={16} /> Inviter un professeur
            </button>
          )}

          {activeTab === "MEMBERS" && (
            <button 
              onClick={() => {
                const el = document.getElementById("invite-teacher-email");
                if (el) el.focus();
              }} 
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-emerald-700 transition shadow-sm"
            >
              <Mail size={16} /> Nouvelle Invitation
            </button>
          )}

          {activeTab === "SUBJECTS" && (
            <button 
              onClick={() => {
                setEditingCourse(null);
                setShowAddCourseModal(true);
              }} 
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-emerald-700 transition shadow-sm"
            >
              <Plus size={16} /> Ajouter une matière par classe
            </button>
          )}

          {activeTab === "HOURS" && (
            <button 
              onClick={openBulkEditModal} 
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-emerald-700 transition shadow-sm"
            >
              <Plus size={16} /> Ajouter attribution / cours
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation - Directement sous le titre */}
      <div className="flex border border-slate-200 overflow-x-auto whitespace-nowrap hide-scrollbar bg-slate-100/80 p-1.5 rounded-xl shadow-inner gap-1 max-w-full">
        <button
          onClick={() => setActiveTab("TEACHERS")}
          className={`py-2 px-5 font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeTab === "TEACHERS"
              ? "bg-white text-emerald-800 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-gray-900 hover:bg-white/60"
          }`}
        >
          <User size={15} />
          Professeurs ({teachers.length})
        </button>
        <button
          onClick={() => setActiveTab("MEMBERS")}
          className={`py-2 px-5 font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeTab === "MEMBERS"
              ? "bg-white text-emerald-800 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-gray-900 hover:bg-white/60"
          }`}
        >
          <Mail size={15} />
          Membres & Invitations ({allInvitations.length})
        </button>
        <button
          onClick={() => setActiveTab("SUBJECTS")}
          className={`py-2 px-5 font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeTab === "SUBJECTS"
              ? "bg-white text-emerald-800 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-gray-900 hover:bg-white/60"
          }`}
        >
          <Layers size={15} />
          Matières par Classe ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab("HOURS")}
          className={`py-2 px-5 font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeTab === "HOURS"
              ? "bg-white text-emerald-800 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-gray-900 hover:bg-white/60"
          }`}
        >
          <Clock size={15} />
          Heures par Classe
        </button>
      </div>

      {/* Tab Professeurs */}
      {activeTab === "TEACHERS" && (
        <div className="flex flex-col gap-4">
          {/* Historique des suppressions effectuées par le Directeur des Études (visible par le Directeur) */}
          {user?.role === 'SCHOOL_ADMIN' && dosDeletions.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 text-amber-800 rounded-lg flex items-center justify-center shrink-0 border border-amber-300">
                  <History size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-2">
                    Historique des suppressions effectuées par le Directeur des Études
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[10px] font-bold">
                      {dosDeletions.length} suppression{dosDeletions.length > 1 ? 's' : ''}
                    </span>
                  </h4>
                  <p className="text-xs text-amber-900/80 mt-0.5">
                    Dernier professeur supprimé : <strong>{dosDeletions[0].teacher_name}</strong> ({dosDeletions[0].teacher_email || 'Sans email'}) le {new Date(dosDeletions[0].deleted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} par <em>{dosDeletions[0].deleted_by_name}</em>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeletionHistoryModal(true)}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shrink-0 shadow-xs cursor-pointer"
              >
                Consulter tout l'historique
              </button>
            </div>
          )}

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Rechercher par nom, email ou téléphone..."
                value={teacherSearchTerm}
                onChange={e => setTeacherSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
              <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Filtre Année Scolaire */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Année :</span>
                <select 
                  value={filterYear} 
                  onChange={e => setFilterYear(e.target.value)} 
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-gray-700 bg-white"
                >
                  <option value="ALL">Toutes les années</option>
                  {academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Classe :</span>
                <select 
                  value={filterClass} 
                  onChange={e => setFilterClass(e.target.value)} 
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-gray-700 bg-white"
                >
                  <option value="ALL">Toutes les classes</option>
                  <optgroup label="Cycles">
                    <option value="Primaire">Primaire (CI - CM2)</option>
                    <option value="Collège">Collège (6ème - 3ème)</option>
                    <option value="Lycée">Lycée (2nde - Tle)</option>
                  </optgroup>
                  <optgroup label="Classes individuelles">
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </optgroup>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Matière :</span>
                <select 
                  value={filterSubject} 
                  onChange={e => setFilterSubject(e.target.value)} 
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-gray-700 bg-white"
                >
                  <option value="ALL">Toutes les matières</option>
                  {existingSchoolSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Teacher Cards Grid */}
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Chargement des professeurs...
            </div>
          ) : teachers.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <User size={48} className="mx-auto text-slate-300 mb-3" />
              <h3 className="font-bold text-gray-700 text-lg mb-1">Aucun professeur invité pour le moment</h3>
              <p className="text-slate-500 text-sm mb-4 max-w-md mx-auto">
                Cette liste affiche exclusivement les professeurs invités par le Directeur ou le Directeur des Études. Invitez un professeur pour lui assigner des matières et des classes.
              </p>
              <button 
                type="button"
                onClick={() => setActiveTab("MEMBERS")} 
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition shadow-sm cursor-pointer"
              >
                <Mail size={16} /> Inviter un premier professeur
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {teachers
                .filter(t => {
                  if (teacherSearchTerm) {
                    const q = teacherSearchTerm.toLowerCase();
                    const matchName = t.full_name?.toLowerCase().includes(q);
                    const matchEmail = t.email?.toLowerCase().includes(q);
                    const matchPhone = t.phone?.toLowerCase().includes(q);
                    if (!matchName && !matchEmail && !matchPhone) return false;
                  }
                  const tc = getTeacherCourses(t);
                  if (filterClass !== "ALL") {
                    if (filterClass === "Primaire" && !tc.some(c => ['CI','CP','CE1','CE2','CM1','CM2'].includes(c.level))) return false;
                    else if (filterClass === "Collège" && !tc.some(c => ['6ème','5ème','4ème','3ème'].includes(c.level))) return false;
                    else if (filterClass === "Lycée" && !tc.some(c => c.level.includes('2nde') || c.level.includes('1ère') || c.level.includes('Terminale'))) return false;
                    else if (!["Primaire","Collège","Lycée"].includes(filterClass) && !tc.some(c => c.level === filterClass)) return false;
                  }
                  if (filterSubject !== "ALL") {
                    if (!tc.some(c => c.name.toLowerCase() === filterSubject.toLowerCase())) return false;
                  }
                  return true;
                })
                .map(t => {
                  const stats = getTeacherStats(t);
                  const teacherType = t.title || (t.isInvitation ? "Invité" : "Permanent");
                  const teacherCourses = stats.courses;

                  return (
                    <div 
                      key={t.id} 
                      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-slate-300 hover:shadow-md transition"
                    >
                      {/* Teacher Header */}
                      <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/60">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-lg font-bold border-2 border-emerald-200 shrink-0">
                          {t.avatar_url ? (
                            <img src={t.avatar_url} alt={t.full_name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            t.full_name ? t.full_name.charAt(0).toUpperCase() : 'P'
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate text-base">{t.full_name || "Enseignant"}</h3>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              teacherType === "Vacataire" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                              teacherType === "Invité" ? "bg-blue-100 text-blue-800 border border-blue-200" : 
                              "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}>
                              {teacherType}
                            </span>
                            {t.invited_by_name && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-semibold">
                                Invité par {t.invited_by_name}
                              </span>
                            )}
                            {t.phone && <span className="text-xs text-slate-500 font-medium">{t.phone}</span>}
                          </div>
                          {t.email && !t.email.endsWith('@ecole.local') && (
                            <p className="text-xs text-slate-400 truncate mt-0.5" title={t.email}>{t.email}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => openEditTeacherModal(t)} 
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                            title="Modifier le professeur & matières enseignées"
                          >
                            <Edit2 size={16} />
                          </button>
                          {!(user?.role === 'DIRECTOR_OF_STUDIES' && (t.role === 'SCHOOL_ADMIN' || t.role === 'SUPER_ADMIN' || t.email?.toLowerCase().includes('director') || t.full_name?.toLowerCase().includes('directeur'))) && (
                            <button 
                              onClick={() => handleDeleteTeacher(t)} 
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Classes & Matières Section */}
                      <div className="p-4 flex-1 flex flex-col gap-4">
                        <div>
                          {/* Badges de toutes les matières enseignées */}
                          {(() => {
                            const distinctSubjects = Array.from(new Set([
                              ...teacherCourses.map(c => c.name),
                              ...(Array.isArray(t.subjects) ? t.subjects : [])
                            ])).filter(Boolean);
                            if (distinctSubjects.length === 0) return null;
                            return (
                              <div className="mb-2.5 p-2 bg-emerald-50/90 rounded-lg border border-emerald-200/80 flex flex-wrap items-center gap-1.5 text-xs">
                                <span className="font-bold text-emerald-900 text-[10px] uppercase tracking-wider mr-1">
                                  {distinctSubjects.length > 1 ? "Matières :" : "Matière :"}
                                </span>
                                {distinctSubjects.map(sub => (
                                  <span key={sub} className="px-2 py-0.5 bg-white border border-emerald-300 text-emerald-800 rounded font-bold text-xs shadow-2xs">
                                    {sub}
                                  </span>
                                ))}
                              </div>
                            );
                          })()}

                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                              <BookOpen size={14} className="text-emerald-600" />
                              Classes & Matières ({teacherCourses.length})
                            </h4>
                            <button
                              onClick={() => openAssignModal(t)}
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                            >
                              <Plus size={13} /> Gérer
                            </button>
                          </div>

                          {teacherCourses.length === 0 ? (
                            <div className="bg-amber-50/80 border border-amber-200/70 rounded-lg p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5 text-amber-700 text-xs font-semibold mb-2">
                                <AlertCircle size={14} />
                                <span>Aucune matière assignée</span>
                              </div>
                              <button
                                onClick={() => openEditTeacherModal(t)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-sm transition"
                              >
                                <Plus size={13} /> Choisir matière & classes
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                              {teacherCourses.map(c => (
                                <span 
                                  key={c.id} 
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-md text-xs font-medium"
                                >
                                  <strong className="font-bold text-emerald-950">{c.name}</strong>
                                  <span className="bg-emerald-200/60 text-emerald-800 px-1.5 py-0.2 rounded text-[10px] font-bold">
                                    {c.level}
                                  </span>
                                  <span className="text-[10px] text-emerald-600 font-semibold">
                                    c.{c.coefficient || 1}
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Professional Attribution CTA Button */}
                        <div className="pt-2">
                          <button
                            onClick={() => openAssignModal(t)}
                            className="w-full py-2 px-3 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                          >
                            <BookOpen size={14} className="text-emerald-600" />
                            Attribuer des matières & classes
                          </button>
                        </div>
                        
                        {/* Weekly Workload & Estimated Salary */}
                        <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-slate-100">
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 mb-0.5">
                              <Clock size={12} /> Heures / Sem.
                            </div>
                            <div className="font-bold text-gray-800 text-base">{stats.hoursPerWeek}h</div>
                          </div>
                          <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                            <div className="text-[10px] uppercase font-bold text-emerald-700 flex items-center gap-1 mb-0.5">
                              <Calculator size={12} /> Salaire Est.
                            </div>
                            <div className="font-bold text-emerald-700 text-base">{stats.monthlySalary.toLocaleString()} F</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Footer Actions */}
                      <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                        <button 
                          onClick={() => window.location.href = '/school-admin/students?tab=TIMETABLES'} 
                          className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded shadow-xs hover:bg-slate-100 transition-colors flex items-center justify-center gap-1"
                        >
                          <Calendar size={13} /> Emploi du temps
                        </button>
                        <button 
                          onClick={() => window.location.href = '/school-admin/payments?tab=SALARIES'} 
                          className="flex-1 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded shadow-xs hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <Banknote size={13} /> Payer
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Tab Membres & Invitations */}
      {activeTab === "MEMBERS" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Formulaire d'invitation d'un professeur */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Mail className="text-emerald-600" size={18} />
              Inviter un Enseignant ou Membre du Personnel
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              L'enseignant sera automatiquement rattaché à l'établissement dès sa première connexion avec son compte Google.
            </p>

            {inviteFeedback && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                <span>{inviteFeedback}</span>
              </div>
            )}

            <form onSubmit={handleInviteTeacher} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Google du Professeur *</label>
                <input 
                  id="invite-teacher-email"
                  type="email" 
                  required 
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="professeur@gmail.com"
                />
              </div>

              <div className="w-full sm:w-60">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Rôle Attribué</label>
                <select 
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-semibold"
                >
                  <option value="TEACHER">Professeur (Teacher)</option>
                  <option value="DIRECTOR_OF_STUDIES">Directeur des Études</option>
                  <option value="SECRETARY">Secrétaire</option>
                  <option value="CASHIER">Caissier(e)</option>
                  <option value="SUPERVISOR">Surveillant</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={isInviting}
                className="w-full sm:w-auto px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition shadow-sm"
              >
                {isInviting ? "Envoi..." : <><Plus size={16} /> Envoyer l'invitation</>}
              </button>
            </form>
          </div>

          {/* Liste des invitations en attente */}
          {(() => {
            const displayedInvs = allInvitations;
            return (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <Clock size={16} className="text-amber-600" />
                    Invitations en attente ({displayedInvs.length})
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Professeurs et membres invités par l'administration ou la direction des études
                  </span>
                </div>

                {displayedInvs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Aucune invitation en attente. Utilisez le formulaire ci-dessus pour inviter des professeurs.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 text-[10px] uppercase font-bold text-slate-600 tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3">Email Invité</th>
                          <th className="px-4 py-3">Rôle Assigné</th>
                          <th className="px-4 py-3">Invité par</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Statut</th>
                          <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {displayedInvs.map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-3.5 font-bold text-gray-800">
                              {inv.email}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                                {inv.role === 'TEACHER' ? 'Professeur' : (inv.role || 'Professeur')}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-slate-600 font-medium">
                              {inv.invited_by_name || (inv.invited_by_role === 'DIRECTOR_OF_STUDIES' ? 'Directeur des Études' : 'Directeur')}
                            </td>
                            <td className="px-4 py-3.5 text-slate-500">
                              {inv.created_at ? new Date(inv.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : "Récemment"}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-semibold">
                                En attente de connexion
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              {user?.role === 'DIRECTOR_OF_STUDIES' && (inv.role === 'SCHOOL_ADMIN' || inv.role === 'SUPER_ADMIN') ? (
                                <span className="text-[11px] font-bold text-slate-400 px-2 py-1 bg-slate-100 rounded">Protégé</span>
                              ) : (
                                <button
                                  onClick={() => handleDeleteInvitation(inv.id)}
                                  className="px-2.5 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded text-xs font-bold transition flex items-center gap-1 ml-auto"
                                  title="Annuler cette invitation"
                                >
                                  <Trash2 size={13} /> Annuler
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Liste des professeurs & membres actifs */}
          {(() => {
            const displayedMembers = schoolMembers;
            return (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <User size={16} className="text-emerald-600" />
                    Membres & Professeurs (Actifs & Invités) ({displayedMembers.length})
                  </h3>
                  <span className="text-xs text-slate-500">Visible par la direction et la direction des études</span>
                </div>
                {displayedMembers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Aucun membre enregistré ou invité pour le moment.
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 text-xs">
                    {displayedMembers.map(m => (
                      <li key={m.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-800">{m.full_name || m.email}</p>
                            {m.isInvitation ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                Invité par {m.invited_by_name || (m.invited_by_role === 'DIRECTOR_OF_STUDIES' ? 'le Dir. des Études' : 'le Directeur')} (En attente)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Actif
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Email : {m.email || "-"} • Rôle : <span className="font-semibold text-emerald-600">{m.role === 'TEACHER' ? 'Professeur' : m.role}</span>
                            {m.created_at && <span className="ml-2 text-slate-400">• Date : {new Date(m.created_at).toLocaleDateString()}</span>}
                          </p>
                        </div>
                        {m.isInvitation ? (
                          user?.role === 'DIRECTOR_OF_STUDIES' && (m.role === 'SCHOOL_ADMIN' || m.role === 'SUPER_ADMIN') ? (
                            <span className="text-[11px] font-bold text-slate-400 px-2 py-1 bg-slate-100 rounded">Protégé</span>
                          ) : (
                            <button
                              onClick={() => handleDeleteInvitation(m.id)}
                              className="px-2.5 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded text-xs font-bold transition"
                            >
                              Annuler
                            </button>
                          )
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })()}
        </div>
      )}
      {activeTab === "SUBJECTS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              {/* Filtre Année Scolaire */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Année :</span>
                <select 
                  value={subjectFilterYear} 
                  onChange={e => setSubjectFilterYear(e.target.value)} 
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-bold text-gray-800 bg-white focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="ALL">Toutes les années</option>
                  {academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
                </select>
              </div>

              {/* Filtre Classe */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Filtrer par classe :</span>
                <select 
                  value={subjectFilterClass} 
                  onChange={e => setSubjectFilterClass(e.target.value)} 
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-bold text-gray-800 bg-white focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="ALL">Toutes les classes</option>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">
                Total : {courses.filter(c => (subjectFilterClass === "ALL" || c.level === subjectFilterClass) && (subjectFilterYear === "ALL" || !c.academic_year || c.academic_year === subjectFilterYear)).length} matière(s) configurée(s)
              </span>
              <button
                onClick={openBulkEditModal}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition"
              >
                <FileSpreadsheet size={14} /> Modifier en tableau
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Matière</th>
                    <th className="px-6 py-3.5">Classe</th>
                    <th className="px-6 py-3.5">Année Scolaire</th>
                    <th className="px-6 py-3.5 text-center">Coefficient Officiel</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {courses
                    .filter(c => (subjectFilterClass === "ALL" || c.level === subjectFilterClass) && (subjectFilterYear === "ALL" || !c.academic_year || c.academic_year === subjectFilterYear))
                    .map(course => (
                      <tr key={course.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-2">
                          <BookOpen size={16} className="text-emerald-600" />
                          <span>{course.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md text-xs font-bold border border-slate-200">
                            {course.level}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">
                            {course.academic_year || currentConfiguredYear || "En cours"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                            Coef. {course.coefficient || 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                setEditingCourse(course);
                                setShowAddCourseModal(true);
                              }} 
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                              title="Modifier la matière ou le coefficient"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button 
                              onClick={() => handleDeleteCourse(course.id)} 
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                              title="Supprimer la matière"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {courses.filter(c => (subjectFilterClass === "ALL" || c.level === subjectFilterClass) && (subjectFilterYear === "ALL" || !c.academic_year || c.academic_year === subjectFilterYear)).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                        Aucune matière configurée pour ce filtre. Cliquez sur "Ajouter une matière par classe" pour commencer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Heures par classe & Attribution des Taux Horaires */}
      {activeTab === "HOURS" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Rechercher matière, classe ou professeur..."
                value={hoursSearchTerm}
                onChange={e => setHoursSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
              <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Filtre Année Scolaire */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Année :</span>
                <select 
                  value={hoursFilterYear} 
                  onChange={e => setHoursFilterYear(e.target.value)} 
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-gray-700 bg-white focus:ring-emerald-500 outline-none"
                >
                  <option value="ALL">Toutes les années</option>
                  {academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
                </select>
              </div>

              {/* Filtre Classe */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Classe :</span>
                <select 
                  value={hoursFilterClass} 
                  onChange={e => setHoursFilterClass(e.target.value)} 
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-gray-700 bg-white focus:ring-emerald-500 outline-none"
                >
                  <option value="ALL">Toutes les classes</option>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Filtre Professeur */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Professeur :</span>
                <select 
                  value={hoursFilterTeacher} 
                  onChange={e => setHoursFilterTeacher(e.target.value)} 
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-gray-700 bg-white focus:ring-emerald-500 outline-none"
                >
                  <option value="ALL">Tous les professeurs</option>
                  <option value="UNASSIGNED">⚠️ Non assigné</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name || t.email}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={openBulkEditModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                <FileSpreadsheet size={14} /> Modifier tout en tableau
              </button>
            </div>
          </div>

          {/* KPI Summary Cards for Tab Heures par classe */}
          {(() => {
            const filtered = courses.filter(c => {
              if (hoursFilterYear !== "ALL" && c.academic_year && c.academic_year !== hoursFilterYear) return false;
              if (hoursFilterClass !== "ALL" && c.level !== hoursFilterClass) return false;
              if (hoursFilterTeacher === "UNASSIGNED" && c.teacher_id) return false;
              if (hoursFilterTeacher !== "ALL" && hoursFilterTeacher !== "UNASSIGNED") {
                const assignedT = teachers.find(t => t.id === hoursFilterTeacher);
                const isAssigned = c.teacher_id === hoursFilterTeacher || (assignedT?.email && c.teacher_email === assignedT.email);
                if (!isAssigned) return false;
              }
              if (hoursSearchTerm) {
                const q = hoursSearchTerm.toLowerCase();
                const matchCourse = c.name?.toLowerCase().includes(q) || c.level?.toLowerCase().includes(q);
                const assignedT = teachers.find(t => t.id === c.teacher_id || (c.teacher_email && t.email === c.teacher_email));
                const matchTeacher = assignedT?.full_name?.toLowerCase().includes(q) || assignedT?.email?.toLowerCase().includes(q);
                if (!matchCourse && !matchTeacher) return false;
              }
              return true;
            });

            let totalH = 0;
            let totalSalaryMonthly = 0;
            let assignedCount = 0;

            filtered.forEach(c => {
              const draft = getCourseDraft(c);
              const h = Number(draft.hoursPerWeek) || 0;
              const rate = Number(draft.hourlyRate) || 0;
              totalH += h;
              totalSalaryMonthly += (h * 4 * rate);
              if (draft.teacher_id) assignedCount++;
            });

            const avgRate = totalH > 0 ? Math.round(totalSalaryMonthly / (totalH * 4)) : 3500;

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="w-11 h-11 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold">
                    <Clock size={22} />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-bold text-slate-400">Total Heures / Semaine</div>
                    <div className="text-xl font-black text-gray-800">{totalH} h</div>
                    <div className="text-[11px] text-slate-500 font-medium">{totalH * 4} h / mois</div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="w-11 h-11 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
                    <Banknote size={22} />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-bold text-slate-400">Masse Salariale / Mois</div>
                    <div className="text-xl font-black text-emerald-700">{totalSalaryMonthly.toLocaleString()} F</div>
                    <div className="text-[11px] text-slate-500 font-medium">Estimée (4 sem/m)</div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="w-11 h-11 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center font-bold">
                    <Calculator size={22} />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-bold text-slate-400">Taux Horaire Moyen</div>
                    <div className="text-xl font-black text-gray-800">{avgRate.toLocaleString()} F</div>
                    <div className="text-[11px] text-slate-500 font-medium">Par heure de cours</div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="w-11 h-11 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center font-bold">
                    <GraduationCap size={22} />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-bold text-slate-400">Attributions Cours</div>
                    <div className="text-xl font-black text-gray-800">{assignedCount} / {filtered.length}</div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {filtered.length - assignedCount} non assigné(s)
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Table: Cours, Heures, Taux & Professeurs Assignés */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/70">
              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                  <Clock size={16} className="text-emerald-600" />
                  Tableau d'attribution des heures et taux horaires par matière & classe
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chaque modification met instantanément à jour la fiche du professeur dans le tab Professeurs.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingCourse(null);
                    setShowAddCourseModal(true);
                  }}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus size={14} /> Nouveau cours
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Matière</th>
                    <th className="px-4 py-3.5">Classe</th>
                    <th className="px-4 py-3.5">Année</th>
                    <th className="px-5 py-3.5">Professeur Assigné</th>
                    <th className="px-4 py-3.5 text-center">Heures / Sem.</th>
                    <th className="px-5 py-3.5 text-center">Prix / Heure (FCFA)</th>
                    <th className="px-5 py-3.5 text-right">Salaire Mensuel Est.</th>
                    <th className="px-5 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {courses
                    .filter(c => {
                      if (hoursFilterYear !== "ALL" && c.academic_year && c.academic_year !== hoursFilterYear) return false;
                      if (hoursFilterClass !== "ALL" && c.level !== hoursFilterClass) return false;
                      if (hoursFilterTeacher === "UNASSIGNED" && c.teacher_id) return false;
                      if (hoursFilterTeacher !== "ALL" && hoursFilterTeacher !== "UNASSIGNED") {
                        const assignedT = teachers.find(t => t.id === hoursFilterTeacher);
                        const isAssigned = c.teacher_id === hoursFilterTeacher || (assignedT?.email && c.teacher_email === assignedT.email);
                        if (!isAssigned) return false;
                      }
                      if (hoursSearchTerm) {
                        const q = hoursSearchTerm.toLowerCase();
                        const matchCourse = c.name?.toLowerCase().includes(q) || c.level?.toLowerCase().includes(q);
                        const assignedT = teachers.find(t => t.id === c.teacher_id || (c.teacher_email && t.email === c.teacher_email));
                        const matchTeacher = assignedT?.full_name?.toLowerCase().includes(q) || assignedT?.email?.toLowerCase().includes(q);
                        if (!matchCourse && !matchTeacher) return false;
                      }
                      return true;
                    })
                    .map(course => {
                      const draft = getCourseDraft(course);
                      const isSaving = savingCourseId === course.id;
                      const isSaved = savedRowsFeedback[course.id];
                      const monthlyEst = (Number(draft.hoursPerWeek) || 0) * 4 * (Number(draft.hourlyRate) || 0);

                      return (
                        <tr key={course.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Matière */}
                          <td className="px-5 py-3.5 font-bold text-gray-800">
                            <div className="flex items-center gap-2">
                              <BookOpen size={15} className="text-emerald-600 shrink-0" />
                              <span className="font-bold">{course.name}</span>
                              <span className="text-[10px] text-slate-400 font-semibold">(c.{course.coefficient || 2})</span>
                            </div>
                          </td>

                          {/* Classe */}
                          <td className="px-4 py-3.5">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md text-xs font-bold border border-slate-200">
                              {course.level}
                            </span>
                          </td>

                          {/* Année */}
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-semibold border border-blue-100">
                              {draft.academic_year || "En cours"}
                            </span>
                          </td>

                          {/* Professeur Assigné (Interactif) */}
                          <td className="px-5 py-3.5">
                            <select
                              value={draft.teacher_id || ""}
                              onChange={e => updateCourseDraft(course.id, { teacher_id: e.target.value })}
                              className={`w-full min-w-[170px] px-2.5 py-1.5 border rounded-lg text-xs font-medium outline-none transition ${
                                draft.teacher_id
                                  ? "border-emerald-300 bg-emerald-50/50 text-emerald-950 font-bold"
                                  : "border-amber-300 bg-amber-50/60 text-amber-900"
                              }`}
                            >
                              <option value="">⚠️ Non assigné</option>
                              {teachers.map(t => (
                                <option key={t.id} value={t.id}>
                                  {t.full_name || t.email} ({t.title || (t.isInvitation ? "Invité" : "Permanent")})
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Heures / Semaine */}
                          <td className="px-4 py-3.5 text-center">
                            <div className="inline-flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min="1"
                                max="40"
                                value={draft.hoursPerWeek}
                                onChange={e => updateCourseDraft(course.id, { hoursPerWeek: Number(e.target.value) })}
                                className="w-16 px-2 py-1 text-center font-bold text-gray-800 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs"
                              />
                              <span className="text-slate-400 font-semibold">h</span>
                            </div>
                          </td>

                          {/* Prix de l'heure */}
                          <td className="px-5 py-3.5 text-center">
                            <div className="inline-flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min="500"
                                step="250"
                                value={draft.hourlyRate}
                                onChange={e => updateCourseDraft(course.id, { hourlyRate: Number(e.target.value) })}
                                className="w-24 px-2 py-1 text-right font-bold text-emerald-900 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs"
                              />
                              <span className="text-slate-400 font-semibold text-[11px]">F/h</span>
                            </div>
                          </td>

                          {/* Salaire Mensuel Estimé */}
                          <td className="px-5 py-3.5 text-right font-black text-emerald-700">
                            <div>{monthlyEst.toLocaleString()} F</div>
                            <div className="text-[10px] text-slate-400 font-normal">{(draft.hoursPerWeek || 0) * 4} h/mois</div>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleSaveSingleCourseHours(course)}
                              disabled={isSaving}
                              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1 mx-auto shadow-xs ${
                                isSaved
                                  ? "bg-emerald-600 text-white"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-600 hover:text-white"
                              }`}
                            >
                              {isSaving ? (
                                <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : isSaved ? (
                                <>
                                  <Check size={13} /> Enregistré
                                </>
                              ) : (
                                <>
                                  <Save size={13} /> Enregistrer
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  {courses.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                        Aucune matière ou cours configuré. Cliquez sur "Ajouter une matière par classe" pour commencer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Historique des suppressions par le Directeur des Études */}
      {showDeletionHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col border border-slate-200">
            <div className="p-5 border-b border-slate-100 bg-amber-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-800 flex items-center justify-center border border-amber-600">
                  <History size={18} className="text-amber-200" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Historique des suppressions d'enseignants</h3>
                  <p className="text-amber-200 text-xs">
                    Suppressions effectuées par le Directeur des Études
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeletionHistoryModal(false)}
                className="text-amber-200 hover:text-white p-1 rounded-lg hover:bg-amber-800 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              {dosDeletions.length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                  <History size={36} className="mx-auto mb-2 text-slate-300 opacity-60" />
                  <p className="text-sm font-semibold text-slate-600">Aucune suppression enregistrée</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Les suppressions de professeurs effectuées par le Directeur des Études apparaîtront ici.
                  </p>
                </div>
              ) : (
                dosDeletions.map(log => (
                  <div key={log.id} className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-amber-950">{log.teacher_name}</strong>
                        <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-bold rounded-full">
                          Supprimé
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                        {log.teacher_email && <span>{log.teacher_email}</span>}
                        {log.teacher_phone && <span>• Tél: {log.teacher_phone}</span>}
                      </div>
                      {Array.isArray(log.teacher_subjects) && log.teacher_subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {log.teacher_subjects.map((sub: string) => (
                            <span key={sub} className="px-1.5 py-0.5 bg-white border border-amber-300 text-amber-900 text-[10px] font-bold rounded">
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="text-[11px] text-amber-800/80 pt-1">
                        Supprimé le {new Date(log.deleted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} par <strong>{log.deleted_by_name}</strong> ({log.deleted_by_email || 'Directeur des Études'})
                      </div>
                    </div>
                    {log.teacher_email && (
                      <button
                        type="button"
                        onClick={() => {
                          setInviteEmail(log.teacher_email);
                          setActiveTab("MEMBERS");
                          setShowDeletionHistoryModal(false);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                      >
                        <Mail size={13} />
                        <span>Réinviter</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-medium">
                Total : {dosDeletions.length} enseignant{dosDeletions.length > 1 ? 's' : ''} supprimé{dosDeletions.length > 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={() => setShowDeletionHistoryModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Attribution Pédagogique Professionnelle (Classes & Matières) */}
      {assigningTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 max-h-[92vh] flex flex-col border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-emerald-900 text-white flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="text-emerald-400" size={20} />
                  <h3 className="font-bold text-lg text-white">Attribution des Matières & Classes</h3>
                </div>
                <p className="text-emerald-200 text-xs mt-0.5">
                  Enseignant : <strong className="text-white">{assigningTeacher.full_name || assigningTeacher.email}</strong> 
                  {" • "}{assigningTeacher.title || (assigningTeacher.isInvitation ? "Invité" : "Permanent")}
                </p>
              </div>
              <button 
                onClick={() => setAssigningTeacher(null)} 
                className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {assignmentFeedback && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                  <span>{assignmentFeedback}</span>
                </div>
              )}

              {/* Section 1: Attributions actuelles */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center justify-between">
                  <span>Attributions Pédagogiques Actuelles</span>
                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px] font-bold">
                    {getTeacherCourses(assigningTeacher).length} affectation(s)
                  </span>
                </h4>

                {getTeacherCourses(assigningTeacher).length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-slate-500 text-xs">
                    Cet enseignant n'a actuellement aucune classe ou matière attribuée.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                    {getTeacherCourses(assigningTeacher).map(c => (
                      <div 
                        key={c.id} 
                        className="flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs"
                      >
                        <div>
                          <div className="font-bold text-emerald-950">{c.name}</div>
                          <div className="text-[11px] text-emerald-700 flex items-center gap-2 mt-0.5">
                            <span className="font-semibold">Classe : {c.level}</span>
                            <span>•</span>
                            <span>Coef. {c.coefficient || 1}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUnassignCourse(c.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Désassigner cette classe"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Formulaire de nouvelle attribution */}
              <form onSubmit={handleSaveAssignments} className="pt-4 border-t border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-600" />
                  Nouvelle attribution de classe & matière
                </h4>

                {/* Choix Matière */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    1. Sélectionner la matière
                  </label>
                  <select
                    value={assignSubject}
                    onChange={e => setAssignSubject(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                  >
                    {existingSchoolSubjects.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                {/* Choix Classes & Coefficients */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    2. Cocher les classes à attribuer ({assignClasses.length} sélectionnée(s))
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Cochez une ou plusieurs classes. Vous pouvez personnaliser le coefficient pour chacune.
                  </p>

                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-56 overflow-y-auto space-y-1.5">
                    {LEVELS.map(lvl => {
                      const isChecked = assignClasses.includes(lvl);
                      return (
                        <div 
                          key={lvl}
                          className={`flex items-center justify-between p-2 rounded-lg border transition ${
                            isChecked ? "bg-emerald-50/80 border-emerald-300" : "bg-white border-slate-200 hover:bg-slate-100/60"
                          }`}
                        >
                          <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => handleToggleAssignClass(lvl)} 
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" 
                            />
                            <span className={`text-xs font-bold ${isChecked ? "text-emerald-900" : "text-gray-700"}`}>
                              {lvl}
                            </span>
                          </label>

                          {isChecked && (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-emerald-700">Coef :</span>
                              <input 
                                type="number" 
                                min="1" 
                                max="10"
                                value={assignCoefs[lvl] || 2} 
                                onChange={e => {
                                  const val = Number(e.target.value);
                                  setAssignCoefs(prev => ({ ...prev, [lvl]: val }));
                                }} 
                                className="w-16 px-2 py-1 text-xs border border-emerald-300 rounded font-bold text-emerald-900 bg-white outline-none" 
                                required 
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bouton de soumission */}
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setAssigningTeacher(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                  >
                    Fermer
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingAssignment || assignClasses.length === 0}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center gap-1.5"
                  >
                    {isSavingAssignment ? (
                      "Enregistrement..."
                    ) : (
                      <>
                        <CheckCircle size={15} /> Valider les attributions
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Modifier le Profil du Professeur */}
      {editingTeacherId && editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Edit2 size={16} className="text-emerald-600" />
                Modifier le professeur
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingTeacherId(null)} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveTeacherProfile} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nom complet</label>
                <input 
                  type="text" 
                  value={editingTeacher.full_name || ""} 
                  onChange={e => setEditingTeacher({...editingTeacher, full_name: e.target.value})} 
                  required 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-emerald-500 text-sm font-medium" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Statut Enseignant</label>
                <select 
                  value={editingTeacher.title || "Permanent"} 
                  onChange={e => setEditingTeacher({...editingTeacher, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-emerald-500 text-sm bg-white font-medium"
                >
                  <option value="Permanent">Permanent</option>
                  <option value="Vacataire">Vacataire</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Téléphone</label>
                <input 
                  type="text" 
                  value={editingTeacher.phone || ""} 
                  onChange={e => setEditingTeacher({...editingTeacher, phone: e.target.value})} 
                  placeholder="Ex: +229 97 00 00 00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-emerald-500 text-sm font-medium" 
                />
              </div>

              {/* Matières d'enseignement sous forme de Checkboxes */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-800 uppercase">
                    Matières d'enseignement ({editingTeacherSubjects.length} sélectionnée{editingTeacherSubjects.length > 1 ? 's' : ''})
                  </label>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    Cochez une ou plusieurs matières
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Sélectionnez les matières enseignées par ce professeur :
                </p>

                <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200 max-h-44 overflow-y-auto">
                  {existingSchoolSubjects.map(sub => {
                    const isChecked = editingTeacherSubjects.includes(sub);
                    return (
                      <label 
                        key={sub}
                        className={`flex items-center gap-2 p-1.5 px-2 rounded-lg border text-xs font-semibold cursor-pointer transition select-none ${
                          isChecked 
                            ? "bg-emerald-50 border-emerald-400 text-emerald-900 shadow-2xs font-bold" 
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleEditTeacherSubject(sub)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 shrink-0"
                        />
                        <span className="truncate">{sub}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Option d'ajouter une matière personnalisée */}
                <div className="mt-2 flex gap-1.5">
                  <input
                    type="text"
                    value={customSubjectInput}
                    onChange={e => setCustomSubjectInput(e.target.value)}
                    placeholder="Autre matière (ex: Philosophie...)"
                    className="flex-1 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = customSubjectInput.trim();
                      if (trimmed && !editingTeacherSubjects.includes(trimmed)) {
                        setEditingTeacherSubjects(prev => [...prev, trimmed]);
                        setCustomSubjectInput("");
                      }
                    }}
                    disabled={!customSubjectInput.trim()}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0"
                  >
                    <Plus size={12} /> Ajouter
                  </button>
                </div>
              </div>

              {/* Classes attribuées pour ces matières */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-800 uppercase">
                    Classes & Coefficients ({editingTeacherClasses.length} classe(s) cochée(s))
                  </label>
                  <span className="text-[10px] text-emerald-600 font-bold truncate max-w-[200px]" title={editingTeacherSubjects.join(", ")}>
                    {editingTeacherSubjects.length > 0 ? editingTeacherSubjects.join(", ") : "Sélectionnez au moins une matière"}
                  </span>
                </div>
                <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 max-h-48 overflow-y-auto space-y-1.5">
                  {LEVELS.map(lvl => {
                    const isChecked = editingTeacherClasses.includes(lvl);
                    return (
                      <div 
                        key={lvl} 
                        className={`flex items-center justify-between p-1.5 px-2.5 rounded-lg border transition ${
                          isChecked ? "bg-emerald-50/80 border-emerald-300 shadow-xs" : "bg-white border-slate-200 hover:bg-slate-100/60"
                        }`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <input 
                            type="checkbox" 
                            checked={isChecked} 
                            onChange={() => handleToggleEditTeacherClass(lvl)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" 
                          />
                          <span className={`text-xs font-bold ${isChecked ? "text-emerald-900" : "text-gray-700"}`}>
                            {lvl}
                          </span>
                        </label>
                        {isChecked && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-emerald-700">Coef :</span>
                            <input 
                              type="number" 
                              min="1" 
                              max="10"
                              value={editingTeacherCoefs[lvl] || 2} 
                              onChange={e => setEditingTeacherCoefs(prev => ({ ...prev, [lvl]: Number(e.target.value) }))}
                              className="w-14 px-2 py-0.5 text-xs border border-emerald-300 rounded font-bold text-emerald-900 bg-white outline-none"
                              required
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setEditingTeacherId(null)} 
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 uppercase tracking-wider"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Ajouter / Modifier une matière par classe (SANS professeur) */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">
                {editingCourse ? "Modifier la matière" : "Ajouter une matière par classe"}
              </h3>
              <button onClick={() => setShowAddCourseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveCourse} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Matière</label>
                {editingCourse ? (
                  <input 
                    type="text" 
                    value={editingCourse.name} 
                    onChange={e => setEditingCourse({...editingCourse, name: e.target.value})} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-emerald-500 font-medium" 
                    required 
                  />
                ) : (
                  <select 
                    value={newCourseName} 
                    onChange={e => setNewCourseName(e.target.value)} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-emerald-500 bg-white font-medium"
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Classe</label>
                {editingCourse ? (
                  <select 
                    value={editingCourse.level} 
                    onChange={e => setEditingCourse({...editingCourse, level: e.target.value})} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-emerald-500 bg-white font-medium"
                  >
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                ) : (
                  <select 
                    value={newCourseLevel} 
                    onChange={e => setNewCourseLevel(e.target.value)} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-emerald-500 bg-white font-medium"
                  >
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Coefficient Officiel</label>
                <input 
                  type="number" 
                  min="1" 
                  max="10" 
                  value={editingCourse ? editingCourse.coefficient : newCourseCoef} 
                  onChange={e => {
                    const val = Number(e.target.value);
                    if (editingCourse) setEditingCourse({...editingCourse, coefficient: val});
                    else setNewCourseCoef(val);
                  }} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-emerald-500 font-medium" 
                  required 
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowAddCourseModal(false)} 
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Modifier Toutes les Informations dans un Tableau Interactif */}
      {showBulkEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden animate-in zoom-in-95 max-h-[94vh] flex flex-col border border-slate-200">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600/80 rounded-xl flex items-center justify-center text-white shrink-0">
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                    Tableau de Modification Globale (Professeurs, Heures & Matières)
                  </h3>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Modifiez directement dans ce tableau toutes les attributions de classes, matières, heures et prix de l'heure.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowBulkEditModal(false)} 
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Feedback message */}
            {bulkFeedback && (
              <div className="p-3 mx-4 mt-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0">
                <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                <span>{bulkFeedback}</span>
              </div>
            )}

            {/* Toolbar */}
            <div className="p-3 px-4 border-b border-slate-200 bg-slate-50 flex flex-wrap justify-between items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <span className="font-bold text-gray-800">{bulkRows.length} ligne(s)</span> configurée(s) dans l'établissement
              </div>
              <button
                type="button"
                onClick={handleAddBulkRow}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Plus size={14} /> Ajouter une nouvelle ligne
              </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto p-4">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2.5 text-center w-10">#</th>
                    <th className="px-3 py-2.5 min-w-[160px]">Matière</th>
                    <th className="px-3 py-2.5 min-w-[120px]">Classe</th>
                    <th className="px-3 py-2.5 min-w-[130px]">Année Scolaire</th>
                    <th className="px-3 py-2.5 min-w-[200px]">Professeur Assigné</th>
                    <th className="px-3 py-2.5 text-center min-w-[90px]">Heures/Sem.</th>
                    <th className="px-3 py-2.5 text-center min-w-[110px]">Taux/H (FCFA)</th>
                    <th className="px-3 py-2.5 text-center min-w-[70px]">Coef.</th>
                    <th className="px-3 py-2.5 text-right min-w-[110px]">Salaire/Mois</th>
                    <th className="px-3 py-2.5 text-center w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {bulkRows.map((row, idx) => {
                    const rowMonthly = (Number(row.hoursPerWeek) || 0) * 4 * (Number(row.hourlyRate) || 0);

                    return (
                      <tr key={row.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-2 text-center text-slate-400 font-bold">{idx + 1}</td>

                        {/* Matière */}
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            list="bulkSubjectsList"
                            value={row.name}
                            onChange={e => {
                              const val = e.target.value;
                              setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, name: val } : r));
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-gray-800 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Matière..."
                            required
                          />
                        </td>

                        {/* Classe */}
                        <td className="px-3 py-2">
                          <select
                            value={row.level}
                            onChange={e => {
                              const val = e.target.value;
                              setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, level: val } : r));
                            }}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-gray-800 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            {LEVELS.map(l => (
                              <option key={l} value={l}>{l}</option>
                            ))}
                          </select>
                        </td>

                        {/* Année Scolaire */}
                        <td className="px-3 py-2">
                          <select
                            value={row.academic_year || currentConfiguredYear || "2024-2025"}
                            onChange={e => {
                              const val = e.target.value;
                              setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, academic_year: val } : r));
                            }}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-gray-800 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            {academicYears.map(y => (
                              <option key={y.id} value={y.name}>{y.name}</option>
                            ))}
                            {academicYears.length === 0 && (
                              <option value="2024-2025">2024-2025</option>
                            )}
                          </select>
                        </td>

                        {/* Professeur Assigné */}
                        <td className="px-3 py-2">
                          <select
                            value={row.teacher_id || ""}
                            onChange={e => {
                              const val = e.target.value;
                              setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, teacher_id: val } : r));
                            }}
                            className={`w-full px-2.5 py-1.5 border rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500 ${
                              row.teacher_id
                                ? "border-emerald-300 bg-emerald-50/60 text-emerald-950 font-bold"
                                : "border-amber-300 bg-amber-50/60 text-amber-900"
                            }`}
                          >
                            <option value="">⚠️ Non assigné</option>
                            {teachers.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.full_name || t.email} ({t.title || (t.isInvitation ? "Invité" : "Permanent")})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Heures / Sem. */}
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            min="1"
                            max="40"
                            value={row.hoursPerWeek}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, hoursPerWeek: val } : r));
                            }}
                            className="w-16 px-1.5 py-1 text-center font-bold text-gray-800 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                          />
                        </td>

                        {/* Taux horaire */}
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            min="500"
                            step="250"
                            value={row.hourlyRate}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, hourlyRate: val } : r));
                            }}
                            className="w-20 px-1.5 py-1 text-right font-bold text-emerald-900 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                          />
                        </td>

                        {/* Coef */}
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={row.coefficient}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, coefficient: val } : r));
                            }}
                            className="w-12 px-1 py-1 text-center font-bold text-gray-800 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                          />
                        </td>

                        {/* Salaire Mensuel */}
                        <td className="px-3 py-2 text-right font-black text-emerald-700">
                          {rowMonthly.toLocaleString()} F
                        </td>

                        {/* Action Supprimer */}
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveBulkRow(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Retirer cette ligne"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {bulkRows.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400 italic">
                        Aucune ligne dans le tableau. Cliquez sur "Ajouter une nouvelle ligne" pour débuter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <datalist id="bulkSubjectsList">
                {existingSchoolSubjects.map(s => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            {/* Footer Summary & Action Buttons */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
              <div className="flex items-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Total Heures :</span>
                  <span className="font-bold text-gray-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {bulkRows.reduce((acc, r) => acc + (Number(r.hoursPerWeek) || 0), 0)} h / sem.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Masse Salariale Mensuelle :</span>
                  <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {bulkRows.reduce((acc, r) => acc + ((Number(r.hoursPerWeek) || 0) * 4 * (Number(r.hourlyRate) || 0)), 0).toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowBulkEditModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={handleSaveBulkEdit}
                  disabled={isSavingBulk || bulkRows.length === 0}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center gap-2"
                >
                  {isSavingBulk ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      <span>Enregistrer toutes les modifications</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
