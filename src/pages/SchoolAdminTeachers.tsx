import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
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
  GraduationCap
} from "lucide-react";
import { AddTeacherModal } from "../components/AddTeacherModal";
import { LEVELS, SUBJECTS } from "../types";

export function SchoolAdminTeachers() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"TEACHERS" | "SUBJECTS">("TEACHERS");
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  
  // Attribution Modal State
  const [assigningTeacher, setAssigningTeacher] = useState<any | null>(null);
  const [assignSubject, setAssignSubject] = useState(SUBJECTS[0]);
  const [assignClasses, setAssignClasses] = useState<string[]>([]);
  const [assignCoefs, setAssignCoefs] = useState<Record<string, number>>({});
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [assignmentFeedback, setAssignmentFeedback] = useState<string | null>(null);

  // Filters
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");
  const [filterSubject, setFilterSubject] = useState("ALL");
  const [teacherSearchTerm, setTeacherSearchTerm] = useState("");
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [currentConfiguredYear, setCurrentConfiguredYear] = useState<string>("");

  // Matières tab state (gestion des matières par classe - sans enseignant)
  const [subjectFilterClass, setSubjectFilterClass] = useState<string>("ALL");
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourseName, setNewCourseName] = useState(SUBJECTS[0]);
  const [newCourseLevel, setNewCourseLevel] = useState(LEVELS[0]);
  const [newCourseCoef, setNewCourseCoef] = useState(2);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  // Helper to manage persistent course metadata (coefficient, academic_year)
  const getCoursesMeta = (schoolId: string): Record<string, { coefficient?: number; academic_year?: string }> => {
    try {
      const raw = localStorage.getItem(`school_courses_meta_${schoolId}`);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  };

  const setCourseMeta = (schoolId: string, courseIdOrKey: string, meta: { coefficient?: number; academic_year?: string }) => {
    try {
      const current = getCoursesMeta(schoolId);
      current[courseIdOrKey] = { ...current[courseIdOrKey], ...meta };
      localStorage.setItem(`school_courses_meta_${schoolId}`, JSON.stringify(current));
    } catch (e) {}
  };

  const fetchData = async () => {
    if (!user?.schoolId) return;
    setLoading(true);
    try {
      const [teachersRes, invitationsRes, coursesRes, yearsRes, schoolRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('school_id', user.schoolId).eq('role', 'TEACHER'),
        supabase.from('invitations').select('*').eq('school_id', user.schoolId).eq('role', 'TEACHER'),
        supabase.from('courses').select('*').eq('school_id', user.schoolId),
        supabase.from('academic_years').select('id, name').eq('school_id', user.schoolId),
        supabase.from('schools').select('*').eq('id', user.schoolId).maybeSingle()
      ]);
      
      const teacherProfiles = teachersRes.data || [];
      const invitedTeachers = (invitationsRes.data || []).map((inv: any) => ({
        id: `inv_${inv.id}`,
        full_name: inv.email ? inv.email.split('@')[0].toUpperCase() : "Professeur Invité",
        email: inv.email,
        phone: "",
        role: "TEACHER",
        title: "Invité",
        isInvitation: true,
        invitationId: inv.id,
        school_id: user.schoolId
      }));

      // Combine real profiles and pending invitations (avoiding duplicate emails)
      const existingEmails = new Set(teacherProfiles.map(t => t.email?.toLowerCase()));
      const combinedTeachers = [
        ...teacherProfiles,
        ...invitedTeachers.filter(inv => !existingEmails.has(inv.email?.toLowerCase()))
      ];

      let configuredYear = "";
      try {
        const savedExtra = localStorage.getItem('schoolSettings_extra_' + user.schoolId);
        if (savedExtra) {
          const parsed = JSON.parse(savedExtra);
          if (parsed.academicYear) configuredYear = parsed.academicYear;
        }
      } catch (e) {}
      if (!configuredYear && schoolRes.data?.academic_year) {
        configuredYear = schoolRes.data.academic_year;
      }
      setCurrentConfiguredYear(configuredYear);

      // Enrich courses with coefficients from metadata
      const meta = getCoursesMeta(user.schoolId);
      const enrichedCourses = (coursesRes.data || []).map((c: any) => {
        const m = meta[c.id] || meta[`${c.name?.trim().toLowerCase()}_${c.level}`] || {};
        return {
          ...c,
          coefficient: m.coefficient || c.coefficient || 2,
          academic_year: m.academic_year || c.academic_year || configuredYear || null
        };
      });

      setTeachers(combinedTeachers);
      setCourses(enrichedCourses);
      setAcademicYears(yearsRes.data || []);
    } catch (err) {
      console.error("Error fetching teachers data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.schoolId]);

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
    const teacherCourses = getTeacherCourses(t);
    const hoursPerWeek = teacherCourses.length * 4;
    const hourlyRate = 3500;
    const monthlySalary = hoursPerWeek * 4 * hourlyRate;
    
    return {
      courses: teacherCourses,
      hoursPerWeek,
      monthlySalary
    };
  };

  const handleDeleteTeacher = async (t: any) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer le professeur ${t.full_name || t.email} ?`)) return;
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
      fetchData();
    } catch (err: any) {
      alert("Erreur lors de la suppression: " + err.message);
    }
  };

  // Profile Edit Save
  const handleSaveTeacherProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    try {
      if (!editingTeacher.isInvitation) {
        await supabase.from('profiles').update({
          full_name: editingTeacher.full_name,
          phone: editingTeacher.phone,
          title: editingTeacher.title || "Permanent"
        }).eq('id', editingTeacher.id);
      }
      setEditingTeacherId(null);
      setEditingTeacher(null);
      fetchData();
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
    if (!assigningTeacher || !user?.schoolId) return;
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
          const { data: existingProf } = await supabase.from('profiles')
            .select('id')
            .eq('school_id', user.schoolId)
            .ilike('email', emailToCheck)
            .maybeSingle();

          if (existingProf?.id) {
            teacherUuid = existingProf.id;
          } else {
            // Create a teacher profile with valid UUID so teacher_id foreign key constraint is satisfied
            const newUuid = (assigningTeacher.invitationId && !String(assigningTeacher.invitationId).includes('_')) 
              ? assigningTeacher.invitationId 
              : crypto.randomUUID();
            
            const { error: profErr } = await supabase.from('profiles').insert([{
              id: newUuid,
              full_name: assigningTeacher.full_name || emailToCheck.split('@')[0].toUpperCase(),
              email: emailToCheck,
              role: 'TEACHER',
              school_id: user.schoolId,
              title: assigningTeacher.title || 'Invité'
            }]);

            if (!profErr) {
              teacherUuid = newUuid;
            }
          }
        }
      }

      for (const cls of assignClasses) {
        const coef = assignCoefs[cls] || 2;
        
        // Check if a course already exists in this school for this subject and class
        const existingCourse = courses.find(
          c => c.school_id === user.schoolId && 
               c.name.trim().toLowerCase() === assignSubject.trim().toLowerCase() && 
               c.level === cls
        );

        if (existingCourse) {
          // Update the existing course in Supabase using only valid columns
          await supabase.from('courses').update({
            teacher_id: teacherUuid
          }).eq('id', existingCourse.id);

          setCourseMeta(user.schoolId, existingCourse.id, { coefficient: coef, academic_year: yearToUse });
          setCourseMeta(user.schoolId, `${assignSubject.trim().toLowerCase()}_${cls}`, { coefficient: coef, academic_year: yearToUse });
        } else {
          // Create a new course entry in Supabase using only valid columns
          const { data: insertedCourse } = await supabase.from('courses').insert([{
            school_id: user.schoolId,
            name: assignSubject.trim(),
            level: cls,
            teacher_id: teacherUuid
          }]).select().maybeSingle();

          if (insertedCourse?.id) {
            setCourseMeta(user.schoolId, insertedCourse.id, { coefficient: coef, academic_year: yearToUse });
          }
          setCourseMeta(user.schoolId, `${assignSubject.trim().toLowerCase()}_${cls}`, { coefficient: coef, academic_year: yearToUse });
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
    if (!user?.schoolId) return;
    try {
      const yearToUse = filterYear !== "ALL" ? filterYear : (currentConfiguredYear || null);
      if (editingCourse) {
        await supabase.from('courses').update({
          name: editingCourse.name.trim(),
          level: editingCourse.level
        }).eq('id', editingCourse.id);
        
        const coef = Number(editingCourse.coefficient) || 1;
        setCourseMeta(user.schoolId, editingCourse.id, { coefficient: coef, academic_year: yearToUse });
        setCourseMeta(user.schoolId, `${editingCourse.name.trim().toLowerCase()}_${editingCourse.level}`, { coefficient: coef, academic_year: yearToUse });
        setEditingCourse(null);
      } else {
        const { data: newRow } = await supabase.from('courses').insert([{
          school_id: user.schoolId,
          name: newCourseName.trim(),
          level: newCourseLevel,
          teacher_id: null
        }]).select().maybeSingle();

        const coef = Number(newCourseCoef) || 1;
        if (newRow?.id) {
          setCourseMeta(user.schoolId, newRow.id, { coefficient: coef, academic_year: yearToUse });
        }
        setCourseMeta(user.schoolId, `${newCourseName.trim().toLowerCase()}_${newCourseLevel}`, { coefficient: coef, academic_year: yearToUse });
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

  // List of distinct subjects already configured in school for convenient selection
  const existingSchoolSubjects = Array.from(new Set([
    ...SUBJECTS,
    ...courses.map(c => c.name)
  ])).filter(Boolean).sort();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <User className="text-emerald-600" />
            Gestion des Professeurs & Matières
          </h1>
          <p className="text-slate-500 mt-1">
            Gérez vos enseignants, attribuez professionnellement les classes et paramétrez les matières officielles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "TEACHERS" ? (
            <button 
              onClick={() => setShowAddModal(true)} 
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-emerald-700 transition shadow-sm"
            >
              <Plus size={16} /> Inscrire un professeur
            </button>
          ) : (
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
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("TEACHERS")}
          className={`py-3 px-6 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "TEACHERS"
              ? "border-emerald-600 text-emerald-600 bg-emerald-50/50"
              : "border-transparent text-slate-500 hover:text-gray-700 hover:bg-slate-50"
          }`}
        >
          <User size={16} />
          Professeurs ({teachers.length})
        </button>
        <button
          onClick={() => setActiveTab("SUBJECTS")}
          className={`py-3 px-6 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "SUBJECTS"
              ? "border-emerald-600 text-emerald-600 bg-emerald-50/50"
              : "border-transparent text-slate-500 hover:text-gray-700 hover:bg-slate-50"
          }`}
        >
          <Layers size={16} />
          Matières par Classe ({courses.length})
        </button>
      </div>

      {/* Tab Professeurs */}
      {activeTab === "TEACHERS" && (
        <>
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
              <h3 className="font-bold text-gray-700 text-lg mb-1">Aucun professeur enregistré</h3>
              <p className="text-slate-500 text-sm mb-4 max-w-md mx-auto">
                Commencez par inscrire vos enseignants pour leur attribuer leurs classes et leurs matières d'enseignement.
              </p>
              <button 
                onClick={() => setShowAddModal(true)} 
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition"
              >
                <Plus size={16} /> Inscrire le premier professeur
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
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              teacherType === "Vacataire" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                              teacherType === "Invité" ? "bg-blue-100 text-blue-800 border border-blue-200" : 
                              "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}>
                              {teacherType}
                            </span>
                            {t.phone && <span className="text-xs text-slate-500">{t.phone}</span>}
                          </div>
                          {t.email && !t.email.endsWith('@ecole.local') && (
                            <p className="text-xs text-slate-400 truncate mt-0.5" title={t.email}>{t.email}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => {
                              setEditingTeacher(t);
                              setEditingTeacherId(t.id);
                            }} 
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                            title="Modifier les coordonnées"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteTeacher(t)} 
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Classes & Matières Section */}
                      <div className="p-4 flex-1 flex flex-col gap-4">
                        <div>
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
                                onClick={() => openAssignModal(t)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-sm transition"
                              >
                                <Plus size={13} /> Attribuer une matière
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
        </>
      )}

      {/* Tab Matières par classe (SANS professeur assigné) */}
      {activeTab === "SUBJECTS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
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
            <div className="text-xs text-slate-500 font-medium">
              Total : {courses.filter(c => subjectFilterClass === "ALL" || c.level === subjectFilterClass).length} matière(s) configurée(s)
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Matière</th>
                    <th className="px-6 py-3.5">Classe</th>
                    <th className="px-6 py-3.5 text-center">Coefficient Officiel</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {courses
                    .filter(c => subjectFilterClass === "ALL" || c.level === subjectFilterClass)
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
                  {courses.filter(c => subjectFilterClass === "ALL" || c.level === subjectFilterClass).length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400 italic">
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

      {/* MODAL 1: Inscription Professeur */}
      <AddTeacherModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSuccess={fetchData} 
        currentAcademicYear={currentConfiguredYear || (filterYear !== "ALL" ? filterYear : undefined)}
      />

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
    </div>
  );
}
