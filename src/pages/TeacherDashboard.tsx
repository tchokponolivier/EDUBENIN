import React, { useState, useEffect, useMemo } from "react";
import { Student, LEVELS } from "../types";
import { useAuth } from "../lib/auth";
import { 
  Users, Save, LayoutGrid, ArrowLeft, Plus, 
  CheckSquare, Edit2, X, CheckCircle2, AlertCircle, 
  Printer, Trash2, BookOpen, Calendar, Award, Sparkles,
  Download, Eye
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { TeacherAttendance } from "../components/TeacherAttendance";
import { TeacherTimetable } from "../components/TeacherTimetable";
import { SharedCalendar } from "../components/SharedCalendar";

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() { 
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 border border-red-200 rounded-xl m-6">
          <h2 className="text-lg font-bold text-red-700 mb-2">Une erreur est survenue dans l'espace professeur</h2>
          <p className="text-sm text-red-600 mb-4">{this.state.error?.message || "Erreur d'affichage"}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition"
          >
            Recharger la page
          </button>
        </div>
      );
    }
    return this.props.children; 
  }
}

export function TeacherDashboard() {
  return <ErrorBoundary><TeacherDashboardInner /></ErrorBoundary>;
}

// Table officielle des appréciations demandée pour les moyennes générales
export function getGradeAppreciation(avgGen: number | null): string {
  if (avgGen === null || isNaN(avgGen)) return '';
  const rounded = Math.min(20, Math.max(0, Math.round(avgGen)));
  switch (rounded) {
    case 0:
      return "Nul";
    case 1:
    case 2:
    case 3:
      return "Très insuffisant";
    case 4:
    case 5:
    case 6:
      return "Insuffisant";
    case 7:
    case 8:
      return "Faible";
    case 9:
      return "Insuffisant";
    case 10:
    case 11:
      return "Moyen";
    case 12:
      return "Assez bien";
    case 13:
    case 14:
      return "Bien";
    case 15:
    case 16:
      return "Très bien";
    case 17:
    case 18:
    case 19:
      return "Excellent";
    case 20:
      return "Exceptionnel";
    default:
      return rounded >= 10 ? "Moyen" : "Insuffisant";
  }
}

// Structure des notes pour un élève et un cours :
// interros: string[] (ex: ['14', '16']), devoirs: string[] (ex: ['12', '15']),
// avgInterro: string, avgDevoir: string, avgGeneral: string, app: string
interface CourseGradeState {
  interros: string[];
  devoirs: string[];
  avgInterro: string;
  avgDevoir: string;
  avgGeneral: string;
  app: string;
}

function TeacherDashboardInner() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"GRADES" | "ATTENDANCE" | "TIMETABLE" | "CALENDAR">("GRADES");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<any>(null);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("2024-2025");
  
  // Nombre d'interrogations et devoirs configurés pour la matière/classe en cours
  const [numInterros, setNumInterros] = useState<number>(2);
  const [numDevoirs, setNumDevoirs] = useState<number>(2);

  // Saisie des notes : grades[studentId][courseId]
  const [grades, setGrades] = useState<Record<string, Record<string, CourseGradeState>>>({});
  const [originalGrades, setOriginalGrades] = useState<any>({});
  const [isEditingGrades, setIsEditingGrades] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  
  // Élèves inclus pour la grille
  const [includedStudents, setIncludedStudents] = useState<string[]>([]);
  const [period, setPeriod] = useState<string>("1er Trimestre");
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Chargement des cours assignés et données
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        let activeSchoolId = user.schoolId;
        if (!activeSchoolId && user.email) {
          try {
            const { data: prof } = await supabase.from('profiles').select('school_id').ilike('email', user.email).maybeSingle();
            if (prof?.school_id) activeSchoolId = prof.school_id;
          } catch (e) {}
        }
        if (!activeSchoolId) {
          try {
            const { data: firstSchool } = await supabase.from('schools').select('id').limit(1).maybeSingle();
            if (firstSchool?.id) activeSchoolId = firstSchool.id;
          } catch (e) {}
        }

        const [stRes, allCoursesRes, schoolRes, yearsRes] = await Promise.all([
          activeSchoolId ? supabase.from('students').select('*').eq('school_id', activeSchoolId) : supabase.from('students').select('*'),
          activeSchoolId ? supabase.from('courses').select('*').eq('school_id', activeSchoolId) : supabase.from('courses').select('*'),
          activeSchoolId ? supabase.from('schools').select('*').eq('id', activeSchoolId).maybeSingle() : Promise.resolve({ data: null }),
          activeSchoolId ? supabase.from('academic_years').select('id, name').eq('school_id', activeSchoolId) : Promise.resolve({ data: [] })
        ]);

        if (stRes.data) {
          setStudents(stRes.data.map((d: any) => ({
            ...d, 
            createdAt: d.created_at, 
            firstName: d.first_name, 
            lastName: d.last_name, 
            parentId: d.parent_id, 
            schoolId: d.school_id, 
            studentType: d.studentType, 
            educmasterNumber: d.educmasterNumber, 
            gender: d.gender
          })) as any);
        }

        if (yearsRes.data && yearsRes.data.length > 0) {
          setAcademicYears(yearsRes.data);
        }

        let configuredYear = "";
        if (activeSchoolId) {
          try {
            const savedExtra = localStorage.getItem('schoolSettings_extra_' + activeSchoolId);
            if (savedExtra) {
              const parsed = JSON.parse(savedExtra);
              if (parsed.academicYear) configuredYear = parsed.academicYear;
            }
          } catch (e) {}
        }
        if (!configuredYear && schoolRes.data?.academic_year) {
          configuredYear = schoolRes.data.academic_year;
        }
        if (configuredYear) {
          setSelectedAcademicYear(configuredYear);
        } else if (yearsRes.data && yearsRes.data[0]?.name) {
          setSelectedAcademicYear(yearsRes.data[0].name);
        }

        let inviteId: string | null = null;
        if (user?.email && activeSchoolId) {
          try {
            const { data: inv } = await supabase.from('invitations')
              .select('id')
              .eq('email', user.email.toLowerCase())
              .eq('school_id', activeSchoolId)
              .maybeSingle();
            if (inv?.id) {
              inviteId = `inv_${inv.id}`;
            }
          } catch (e) {}
        }

        // Collect all IDs that identify this teacher across profiles, invitations and auth
        const uid = user.id ? String(user.id).toLowerCase() : "";
        const uemail = user.email ? String(user.email).toLowerCase() : "";
        const uname = user.name ? user.name.trim().toLowerCase() : "";
        const matchedTeacherIds = new Set<string>();
        if (uid) matchedTeacherIds.add(uid);

        if (uemail) {
          try {
            const { data: profs } = await supabase.from('profiles')
              .select('id, email, full_name')
              .ilike('email', uemail);
            (profs || []).forEach((p: any) => {
              if (p.id) matchedTeacherIds.add(String(p.id).toLowerCase());
              if (p.email) matchedTeacherIds.add(String(p.email).toLowerCase());
            });
          } catch (e) {}
        }

        if (user.name && activeSchoolId) {
          try {
            const { data: nameProfs } = await supabase.from('profiles')
              .select('id, full_name, email')
              .eq('school_id', activeSchoolId)
              .ilike('full_name', user.name.trim());
            (nameProfs || []).forEach((p: any) => {
              if (p.id) matchedTeacherIds.add(String(p.id).toLowerCase());
              if (p.email) matchedTeacherIds.add(String(p.email).toLowerCase());
            });
          } catch (e) {}
        }

        if (inviteId) {
          matchedTeacherIds.add(inviteId.toLowerCase());
          matchedTeacherIds.add(inviteId.replace('inv_', '').toLowerCase());
        }

        if (allCoursesRes.data) {
          // Read course metadata for coefficients, hours and direct teacher assignments
          let courseMeta: Record<string, any> = {};
          if (activeSchoolId) {
            try {
              const raw = localStorage.getItem(`school_courses_meta_${activeSchoolId}`);
              if (raw) courseMeta = JSON.parse(raw);
            } catch (e) {}
          }

          const assignedCourses = (allCoursesRes.data || [])
            .filter((c: any) => {
              const cTid = c.teacher_id ? String(c.teacher_id).toLowerCase() : "";
              const cEmail = c.teacher_email ? String(c.teacher_email).toLowerCase() : "";
              const m = courseMeta[c.id] || courseMeta[`${c.name?.trim().toLowerCase()}_${c.level}`] || {};
              const mTid = m.teacher_id ? String(m.teacher_id).toLowerCase() : "";
              const mEmail = m.teacher_email ? String(m.teacher_email).toLowerCase() : "";

              return (
                (cTid && matchedTeacherIds.has(cTid)) ||
                (cTid && uemail && cTid === uemail) ||
                (cEmail && uemail && cEmail === uemail) ||
                (mTid && matchedTeacherIds.has(mTid)) ||
                (mTid && uemail && mTid === uemail) ||
                (mEmail && uemail && mEmail === uemail)
              );
            })
            .map((c: any) => {
              const m = courseMeta[c.id] || courseMeta[`${c.name?.trim().toLowerCase()}_${c.level}`] || {};
              return {
                ...c,
                coefficient: m.coefficient || c.coefficient || 2,
                academic_year: m.academic_year || c.academic_year || configuredYear || "2024-2025"
              };
            });

          setMyCourses(assignedCourses);

          // Synchronisation d'identifiant si assigné via email ou invitation
          if (user.id) {
            for (const c of assignedCourses) {
              if (c.teacher_id !== user.id) {
                supabase.from('courses').update({ teacher_id: user.id }).eq('id', c.id).then();
              }
            }
          }
        }

        if (schoolRes.data) {
          setSchoolSettings(schoolRes.data);
        }
      } catch (err) {
        console.error("Error fetching teacher data:", err);
      }
    };
    fetchData();
  }, [user]);

  // Classes accessibles uniquement si le professeur y a au moins une matière assignée
  const assignedClasses = useMemo(() => {
    const uniqueClasses = Array.from(new Set(myCourses.map(c => c.level))).filter(Boolean);
    return uniqueClasses.sort();
  }, [myCourses]);

  // Matières assignées au professeur dans la classe sélectionnée
  const activeCoursesInClass = useMemo(() => {
    if (!selectedClass) return [];
    return myCourses.filter(c => c.level === selectedClass);
  }, [selectedClass, myCourses]);

  // Sélection automatique de la matière courante si une seule existe
  useEffect(() => {
    if (activeCoursesInClass.length > 0) {
      if (!selectedCourseId || !activeCoursesInClass.some(c => c.id === selectedCourseId)) {
        setSelectedCourseId(activeCoursesInClass[0].id);
      }
    } else {
      setSelectedCourseId(null);
    }
  }, [activeCoursesInClass, selectedCourseId]);

  // Élèves uniquement de la classe sélectionnée
  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(s => s.level === selectedClass);
  }, [students, selectedClass]);

  // Cocher tous les élèves par défaut quand la classe change
  useEffect(() => {
    if (classStudents.length > 0) {
      setIncludedStudents(classStudents.map(s => s.id));
    } else {
      setIncludedStudents([]);
    }
  }, [selectedClass, classStudents]);

  // Fonction de calcul de notes selon la règle exacte :
  // - Moyenne Interro = somme des interros / nombre d'interros saisies
  // - Moyenne Devoir = somme des devoirs / nombre de devoirs saisis
  // - Moyenne Générale = (Moyenne Interro + Moyenne Devoir) / 2
  // - Observation / Appréciation : table officielle stricte 0/20 à 20/20
  const calculateCourseAverages = (interros: string[], devoirs: string[]) => {
    let sumInt = 0;
    let countInt = 0;
    interros.forEach(val => {
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        const num = parseFloat(String(val).replace(',', '.'));
        if (!isNaN(num)) {
          sumInt += num;
          countInt++;
        }
      }
    });

    let sumDev = 0;
    let countDev = 0;
    devoirs.forEach(val => {
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        const num = parseFloat(String(val).replace(',', '.'));
        if (!isNaN(num)) {
          sumDev += num;
          countDev++;
        }
      }
    });

    const avgInt = countInt > 0 ? (sumInt / countInt) : null;
    const avgDev = countDev > 0 ? (sumDev / countDev) : null;

    let avgGen: number | null = null;
    if (avgInt !== null && avgDev !== null) {
      avgGen = (avgInt + avgDev) / 2;
    } else if (avgInt !== null) {
      avgGen = avgInt;
    } else if (avgDev !== null) {
      avgGen = avgDev;
    }

    const appreciation = getGradeAppreciation(avgGen);

    return {
      avgInterro: avgInt !== null ? avgInt.toFixed(2) : '',
      avgDevoir: avgDev !== null ? avgDev.toFixed(2) : '',
      avgGeneral: avgGen !== null ? avgGen.toFixed(2) : '',
      appreciation
    };
  };

  // Clé unique pour persister localement les notes de façon strictement isolée par période et année
  const getPeriodStorageKey = (schoolId: string, cls: string, year: string, prd: string) => {
    return `school_teacher_grades_${schoolId}_${cls}_${year}_${prd}`;
  };

  // Chargement des notes de la classe depuis la base de données & stockage local
  useEffect(() => {
    const fetchClassGrades = async () => {
      if (!user?.schoolId || !selectedClass) return;
      try {
        const storageKey = getPeriodStorageKey(user.schoolId, selectedClass, selectedAcademicYear, period);
        let cachedGrades: Record<string, Record<string, CourseGradeState>> = {};
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) cachedGrades = JSON.parse(raw);
        } catch (e) {}

        const { data: dbGrades } = await supabase
          .from('grades')
          .select('*')
          .eq('school_id', user.schoolId);

        const loaded: Record<string, Record<string, CourseGradeState>> = JSON.parse(JSON.stringify(cachedGrades));
        let maxIntFound = 2;
        let maxDevFound = 2;

        if (dbGrades && dbGrades.length > 0) {
          dbGrades.forEach((g: any) => {
            const evalType = g.evaluation_type || '';
            
            // Format 1: INT1#1er Trimestre#2024-2025
            // Format 2: INT1_1er Trimestre (rétrocompatible)
            let isCurrentPeriod = false;
            let evalKey = '';

            if (evalType.includes('#')) {
              const parts = evalType.split('#');
              evalKey = parts[0]?.toUpperCase() || '';
              const gPeriod = parts[1] || '';
              const gYear = parts[2] || '';
              if (gPeriod === period && (!gYear || gYear === selectedAcademicYear)) {
                isCurrentPeriod = true;
              }
            } else if (evalType.includes('_')) {
              const parts = evalType.split('_');
              evalKey = parts[0]?.toUpperCase() || '';
              const gPeriod = parts.slice(1).join('_');
              if (gPeriod === period) {
                isCurrentPeriod = true;
              }
            }

            if (isCurrentPeriod) {
              if (!loaded[g.student_id]) loaded[g.student_id] = {};
              if (!loaded[g.student_id][g.course_id]) {
                loaded[g.student_id][g.course_id] = {
                  interros: [],
                  devoirs: [],
                  avgInterro: '',
                  avgDevoir: '',
                  avgGeneral: '',
                  app: ''
                };
              }

              const cState = loaded[g.student_id][g.course_id];
              if (evalKey.startsWith('INT')) {
                const index = parseInt(evalKey.replace('INT', ''), 10) - 1;
                if (!isNaN(index) && index >= 0) {
                  while (cState.interros.length <= index) cState.interros.push('');
                  cState.interros[index] = String(g.score ?? '');
                  if (index + 1 > maxIntFound) maxIntFound = index + 1;
                }
              } else if (evalKey.startsWith('DEV')) {
                const index = parseInt(evalKey.replace('DEV', ''), 10) - 1;
                if (!isNaN(index) && index >= 0) {
                  while (cState.devoirs.length <= index) cState.devoirs.push('');
                  cState.devoirs[index] = String(g.score ?? '');
                  if (index + 1 > maxDevFound) maxDevFound = index + 1;
                }
              }

              if (g.appreciation) {
                cState.app = g.appreciation;
              }
            }
          });
        }

        // Recalculer les moyennes et appliquer les appréciations officielles
        Object.keys(loaded).forEach(stId => {
          Object.keys(loaded[stId]).forEach(cId => {
            const item = loaded[stId][cId];
            const calculated = calculateCourseAverages(item.interros, item.devoirs);
            item.avgInterro = calculated.avgInterro;
            item.avgDevoir = calculated.avgDevoir;
            item.avgGeneral = calculated.avgGeneral;
            if (!item.app && calculated.appreciation) {
              item.app = calculated.appreciation;
            }
          });
        });

        // Calculer les colonnes max pour ce trimestre
        Object.values(loaded).forEach(stMap => {
          Object.values(stMap).forEach(cState => {
            if (cState.interros.length > maxIntFound) maxIntFound = cState.interros.length;
            if (cState.devoirs.length > maxDevFound) maxDevFound = cState.devoirs.length;
          });
        });

        setNumInterros(Math.max(2, maxIntFound));
        setNumDevoirs(Math.max(2, maxDevFound));
        setGrades(loaded);
        setOriginalGrades(JSON.parse(JSON.stringify(loaded)));
      } catch (err) {
        console.error("Error loading grades:", err);
      }
    };

    fetchClassGrades();
  }, [user?.schoolId, selectedClass, period, selectedAcademicYear]);

  // Modification d'une note d'interrogation
  const handleInterroChange = (studentId: string, courseId: string, index: number, value: string) => {
    setGrades(prev => {
      const studentGrades = prev[studentId] || {};
      const courseGrades = studentGrades[courseId] || {
        interros: [],
        devoirs: [],
        avgInterro: '',
        avgDevoir: '',
        avgGeneral: '',
        app: ''
      };

      const newInterros = [...courseGrades.interros];
      while (newInterros.length <= index) newInterros.push('');
      newInterros[index] = value;

      const calculated = calculateCourseAverages(newInterros, courseGrades.devoirs);

      return {
        ...prev,
        [studentId]: {
          ...studentGrades,
          [courseId]: {
            ...courseGrades,
            interros: newInterros,
            avgInterro: calculated.avgInterro,
            avgDevoir: calculated.avgDevoir,
            avgGeneral: calculated.avgGeneral,
            app: calculated.appreciation || courseGrades.app
          }
        }
      };
    });
  };

  // Modification d'une note de devoir
  const handleDevoirChange = (studentId: string, courseId: string, index: number, value: string) => {
    setGrades(prev => {
      const studentGrades = prev[studentId] || {};
      const courseGrades = studentGrades[courseId] || {
        interros: [],
        devoirs: [],
        avgInterro: '',
        avgDevoir: '',
        avgGeneral: '',
        app: ''
      };

      const newDevoirs = [...courseGrades.devoirs];
      while (newDevoirs.length <= index) newDevoirs.push('');
      newDevoirs[index] = value;

      const calculated = calculateCourseAverages(courseGrades.interros, newDevoirs);

      return {
        ...prev,
        [studentId]: {
          ...studentGrades,
          [courseId]: {
            ...courseGrades,
            devoirs: newDevoirs,
            avgInterro: calculated.avgInterro,
            avgDevoir: calculated.avgDevoir,
            avgGeneral: calculated.avgGeneral,
            app: calculated.appreciation || courseGrades.app
          }
        }
      };
    });
  };

  // Modification manuelle de l'observation / appréciation
  const handleAppreciationChange = (studentId: string, courseId: string, value: string) => {
    setGrades(prev => {
      const studentGrades = prev[studentId] || {};
      const courseGrades = studentGrades[courseId] || {
        interros: [],
        devoirs: [],
        avgInterro: '',
        avgDevoir: '',
        avgGeneral: '',
        app: ''
      };
      return {
        ...prev,
        [studentId]: {
          ...studentGrades,
          [courseId]: {
            ...courseGrades,
            app: value
          }
        }
      };
    });
  };

  // Sauvegarde des notes strictement isolée par trimestre et année scolaire
  const handleSaveGrades = async () => {
    if (!user?.schoolId || !selectedClass) return;
    setIsSaving(true);
    try {
      const gradesToInsert: any[] = [];
      const now = new Date().toISOString();

      Object.entries(grades).forEach(([studentId, subjectsData]) => {
        if (!includedStudents.includes(studentId)) return;
        
        Object.entries(subjectsData).forEach(([courseId, data]) => {
          // Interrogations
          data.interros.forEach((val, idx) => {
            if (val !== undefined && val !== null && String(val).trim() !== '') {
              const score = parseFloat(String(val).replace(',', '.'));
              if (!isNaN(score)) {
                gradesToInsert.push({
                  school_id: user.schoolId,
                  student_id: studentId,
                  course_id: courseId,
                  evaluation_type: `INT${idx + 1}#${period}#${selectedAcademicYear}`,
                  score: score,
                  max_score: 20,
                  appreciation: data.app || getGradeAppreciation(data.avgGeneral ? parseFloat(data.avgGeneral) : null),
                  grade_date: now
                });
              }
            }
          });

          // Devoirs
          data.devoirs.forEach((val, idx) => {
            if (val !== undefined && val !== null && String(val).trim() !== '') {
              const score = parseFloat(String(val).replace(',', '.'));
              if (!isNaN(score)) {
                gradesToInsert.push({
                  school_id: user.schoolId,
                  student_id: studentId,
                  course_id: courseId,
                  evaluation_type: `DEV${idx + 1}#${period}#${selectedAcademicYear}`,
                  score: score,
                  max_score: 20,
                  appreciation: data.app || getGradeAppreciation(data.avgGeneral ? parseFloat(data.avgGeneral) : null),
                  grade_date: now
                });
              }
            }
          });
        });
      });

      // 1. Sauvegarde dans localStorage pour garantir que changer de trimestre ne perde jamais rien
      const storageKey = getPeriodStorageKey(user.schoolId, selectedClass, selectedAcademicYear, period);
      localStorage.setItem(storageKey, JSON.stringify(grades));

      // 2. Supprimer les évaluations existantes UNIQUEMENT pour ce trimestre et cette année scolaire
      const { data: existingGrades } = await supabase
        .from('grades')
        .select('*')
        .eq('school_id', user.schoolId);

      if (existingGrades) {
        for (const eg of existingGrades) {
          const evalType = eg.evaluation_type || '';
          const matchesThisPeriodAndYear = 
            (evalType.includes('#') && evalType.includes(`#${period}#${selectedAcademicYear}`)) ||
            (!evalType.includes('#') && evalType.endsWith(`_${period}`));

          if (matchesThisPeriodAndYear && grades[eg.student_id]?.[eg.course_id]) {
            await supabase.from('grades').delete().eq('id', eg.id);
          }
        }
      }

      if (gradesToInsert.length > 0) {
        await supabase.from('grades').insert(gradesToInsert);
      }

      setOriginalGrades(JSON.parse(JSON.stringify(grades)));
      setIsEditingGrades(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de la sauvegarde: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStudentIncluded = (studentId: string) => {
    setIncludedStudents(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  // Liste des classes assignées à ce professeur
  const classCards = useMemo(() => {
    return assignedClasses.map(level => {
      const cStudents = students.filter(s => s.level === level);
      const cCourses = myCourses.filter(c => c.level === level);
      return {
        level,
        studentsCount: cStudents.length,
        courses: cCourses
      };
    });
  }, [assignedClasses, students, myCourses]);

  const currentCourse = activeCoursesInClass.find(c => c.id === selectedCourseId) || activeCoursesInClass[0];

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in">
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Espace Professeur</h1>
          <p className="text-xs text-slate-500 mt-1">Saisie rigoureuse des évaluations, interrogations, devoirs et suivi des présences.</p>
        </div>

        {/* Barre d'onglets */}
        <div className="flex p-1 bg-slate-100 rounded-lg shrink-0 overflow-x-auto max-w-full">
          <button 
            onClick={() => setActiveTab("GRADES")} 
            className={`px-4 py-2 rounded text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-colors ${activeTab === "GRADES" ? "bg-white shadow-sm text-gray-800" : "text-slate-500 hover:text-gray-800"}`}
          >
            Mes classes & Notes
          </button>
          <button 
            onClick={() => setActiveTab("ATTENDANCE")} 
            className={`px-4 py-2 rounded text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-colors ${activeTab === "ATTENDANCE" ? "bg-white shadow-sm text-gray-800" : "text-slate-500 hover:text-gray-800"}`}
          >
            Appel
          </button>
          <button 
            onClick={() => setActiveTab("TIMETABLE")} 
            className={`px-4 py-2 rounded text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-colors ${activeTab === "TIMETABLE" ? "bg-white shadow-sm text-gray-800" : "text-slate-500 hover:text-gray-800"}`}
          >
            Mon Planning
          </button>
          <button 
            onClick={() => setActiveTab("CALENDAR")} 
            className={`px-4 py-2 rounded text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-colors ${activeTab === "CALENDAR" ? "bg-white shadow-sm text-gray-800" : "text-slate-500 hover:text-gray-800"}`}
          >
            Calendrier
          </button>
        </div>
      </div>

      {/* Onglet NOTES */}
      {activeTab === "GRADES" && (
        <>
          {saveSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-top-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              Toutes les notes et moyennes calculées ont été enregistrées avec succès.
            </div>
          )}

          {!selectedClass ? (
            <div>
              <div className="mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Mes classes attribuées ({classCards.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Seules les classes et matières qui vous ont été formellement attribuées par l'administration sont accessibles.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {classCards.map((c) => (
                  <div 
                    key={c.level} 
                    onClick={() => setSelectedClass(c.level)} 
                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center gap-3 hover:border-emerald-500 group relative"
                  >
                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                      <LayoutGrid size={24} />
                    </div>
                    <span className="font-bold text-gray-800 text-lg text-center">{c.level}</span>
                    <div className="flex flex-col items-center gap-1.5 w-full">
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                        {c.studentsCount} élève{c.studentsCount > 1 ? 's' : ''}
                      </span>
                      <div className="flex flex-wrap justify-center gap-1">
                        {c.courses.map(crs => (
                          <span key={crs.id} className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                            {crs.name} (c.{crs.coefficient || 1})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {classCards.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                    <BookOpen size={36} className="mx-auto text-slate-300 mb-3" />
                    <p className="font-bold text-gray-700">Aucune classe ne vous a encore été attribuée.</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Veuillez contacter le Directeur des Études ou le Directeur de l'école pour vous assigner vos classes et matières officielles.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              {/* Entête classe sélectionnée */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      if (isEditingGrades && !window.confirm("Vous avez des modifications non enregistrées. Quitter quand même ?")) {
                        return;
                      }
                      setSelectedClass(null);
                      setIsEditingGrades(false);
                    }} 
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-gray-800 transition-colors" 
                    title="Retour aux classes"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                      <Users size={18} className="text-emerald-600" />
                      Classe : {selectedClass}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {classStudents.length} élève{classStudents.length > 1 ? 's' : ''} attribué{classStudents.length > 1 ? 's' : ''} • {activeCoursesInClass.length} matière{activeCoursesInClass.length > 1 ? 's' : ''} assignée{activeCoursesInClass.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Sélecteur de matière si le prof a plusieurs matières dans cette classe */}
                {activeCoursesInClass.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 uppercase">Matière :</span>
                    <select 
                      value={selectedCourseId || ''} 
                      onChange={e => setSelectedCourseId(e.target.value)}
                      className="px-3 py-1.5 border border-slate-300 rounded text-xs font-bold text-gray-800 focus:ring-emerald-500 bg-white"
                    >
                      {activeCoursesInClass.map(crs => (
                        <option key={crs.id} value={crs.id}>{crs.name} (Coeff {crs.coefficient || 1})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Barre de contrôle : Année Scolaire, Période, Gestion des colonnes et Actions */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Sélecteur Année Scolaire (avant saisie) */}
                  <div className="flex items-center gap-2">
                    <Calendar size={15} className="text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Année :</span>
                    <select 
                      value={selectedAcademicYear} 
                      onChange={e => {
                        if (isEditingGrades && !window.confirm("Vous avez des modifications en cours pour cette année. Changer quand même d'année ?")) return;
                        setSelectedAcademicYear(e.target.value);
                        setIsEditingGrades(false);
                      }} 
                      disabled={isEditingGrades}
                      className="px-3 py-1.5 border border-slate-300 rounded text-xs font-bold text-gray-800 focus:ring-emerald-500 outline-none bg-white shadow-sm"
                    >
                      {academicYears.map(y => (
                        <option key={y.id} value={y.name}>{y.name}</option>
                      ))}
                      {academicYears.length === 0 && (
                        <option value="2024-2025">2024-2025</option>
                      )}
                    </select>
                  </div>

                  {/* Sélecteur Trimestre / Période (avant saisie) */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Trimestre :</span>
                    <select 
                      value={period} 
                      onChange={e => {
                        if (isEditingGrades && !window.confirm("Vous avez des modifications en cours pour ce trimestre. Changer quand même de période ?")) return;
                        setPeriod(e.target.value);
                        setIsEditingGrades(false);
                      }} 
                      disabled={isEditingGrades}
                      className="px-3 py-1.5 border border-slate-300 rounded text-xs font-bold text-gray-800 focus:ring-emerald-500 outline-none bg-white shadow-sm"
                    >
                      <option value="1er Trimestre">1er Trimestre</option>
                      <option value="2ème Trimestre">2ème Trimestre</option>
                      <option value="3ème Trimestre">3ème Trimestre</option>
                      <option value="1er Semestre">1er Semestre</option>
                      <option value="2ème Semestre">2ème Semestre</option>
                    </select>
                  </div>

                  {/* Boutons d'ajout dynamique d'interrogations et devoirs */}
                  <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                    <button
                      type="button"
                      onClick={() => setNumInterros(prev => prev + 1)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-xs font-bold transition shadow-sm"
                      title="Ajouter une colonne Interrogation"
                    >
                      <Plus size={13} className="text-emerald-600" /> + Interrogation ({numInterros})
                    </button>
                    {numInterros > 1 && (
                      <button
                        type="button"
                        onClick={() => setNumInterros(prev => Math.max(1, prev - 1))}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-white"
                        title="Diminuer colonnes interrogation"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setNumDevoirs(prev => prev + 1)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-xs font-bold transition shadow-sm ml-2"
                      title="Ajouter une colonne Devoir"
                    >
                      <Plus size={13} className="text-blue-600" /> + Devoir ({numDevoirs})
                    </button>
                    {numDevoirs > 1 && (
                      <button
                        type="button"
                        onClick={() => setNumDevoirs(prev => Math.max(1, prev - 1))}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-white"
                        title="Diminuer colonnes devoir"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isEditingGrades ? (
                    <>
                      <button 
                        onClick={handleSaveGrades} 
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
                      >
                        <Save size={16} /> {isSaving ? "Enregistrement..." : "Enregistrer les notes"}
                      </button>
                      <button 
                        onClick={() => {
                          setGrades(originalGrades);
                          setIsEditingGrades(false);
                        }} 
                        disabled={isSaving}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-200 text-slate-700 rounded text-xs font-bold uppercase tracking-wider hover:bg-slate-300 transition shadow-sm"
                      >
                        <X size={16} /> Annuler
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => {
                        setOriginalGrades(JSON.parse(JSON.stringify(grades)));
                        setIsEditingGrades(true);
                      }} 
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition shadow-sm"
                    >
                      <Edit2 size={16} /> Saisir / Modifier les notes
                    </button>
                  )}

                  <button 
                    onClick={() => setShowPrintModal(true)} 
                    className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition shadow-sm"
                    title="Aperçu avant impression et export PDF"
                  >
                    <Printer size={16} /> Imprimer / PDF
                  </button>
                </div>
              </div>

              {/* Rappel du cours actuel */}
              {currentCourse && (
                <div className="mb-4 flex items-center justify-between bg-emerald-50/70 border border-emerald-200 px-4 py-2.5 rounded-lg text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-950 uppercase tracking-wide">Matière évaluée :</span>
                    <span className="font-extrabold text-emerald-700">{currentCourse.name}</span>
                    <span className="text-slate-500 font-semibold">• Coeff : {currentCourse.coefficient || 1}</span>
                  </div>
                  <span className="text-[11px] text-emerald-800 font-medium italic">
                    Formule officielle : Moyenne Interros = Somme / n • Moyenne Devoirs = Somme / n • Moyenne Générale = (Moy. Interros + Moy. Devoirs) / 2
                  </span>
                </div>
              )}

              {/* Table des notes pour le cours actif */}
              {currentCourse && (
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                    <thead className="bg-slate-800 text-[10px] uppercase text-white font-bold tracking-wider">
                      <tr>
                        <th className="px-2 py-2.5 border border-slate-700 text-center w-8" title="Sélectionner">
                          <CheckSquare size={14} className="mx-auto" />
                        </th>
                        <th className="px-3 py-2.5 border border-slate-700 min-w-[160px]">Nom et Prénoms</th>
                        
                        {/* Colonnes d'interrogations dynamiques */}
                        {Array.from({ length: numInterros }).map((_, i) => (
                          <th key={`th-int-${i}`} className="px-2 py-2 border border-slate-700 text-center bg-slate-700/60 min-w-[60px]">
                            Interro {i + 1}
                            <span className="block text-[8px] text-slate-300 lowercase">/20</span>
                          </th>
                        ))}
                        <th className="px-2 py-2 border border-slate-700 text-center bg-emerald-900 text-emerald-300 min-w-[70px]">
                          Moy. Interros
                        </th>

                        {/* Colonnes de devoirs dynamiques */}
                        {Array.from({ length: numDevoirs }).map((_, i) => (
                          <th key={`th-dev-${i}`} className="px-2 py-2 border border-slate-700 text-center bg-slate-700/60 min-w-[60px]">
                            Devoir {i + 1}
                            <span className="block text-[8px] text-slate-300 lowercase">/20</span>
                          </th>
                        ))}
                        <th className="px-2 py-2 border border-slate-700 text-center bg-blue-900 text-blue-300 min-w-[70px]">
                          Moy. Devoirs
                        </th>

                        {/* Moyenne générale de la matière */}
                        <th className="px-3 py-2 border border-slate-700 text-center bg-emerald-800 text-white font-black min-w-[85px]">
                          Moyenne Générale
                        </th>
                        <th className="px-3 py-2 border border-slate-700 min-w-[140px]">Observation / Appréciation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {classStudents.length === 0 ? (
                        <tr>
                          <td colSpan={6 + numInterros + numDevoirs} className="p-8 text-center text-slate-500">
                            Aucun élève inscrit dans cette classe.
                          </td>
                        </tr>
                      ) : (
                        classStudents.map((student) => {
                          const isIncluded = includedStudents.includes(student.id);
                          const sCourseGrades = grades[student.id]?.[currentCourse.id] || {
                            interros: [],
                            devoirs: [],
                            avgInterro: '',
                            avgDevoir: '',
                            avgGeneral: '',
                            app: ''
                          };

                          return (
                            <tr key={student.id} className={`transition-colors ${isIncluded ? 'hover:bg-slate-50' : 'bg-slate-50/50 opacity-60'}`}>
                              <td className="px-2 py-2 border border-slate-200 text-center">
                                <input 
                                  type="checkbox" 
                                  checked={isIncluded} 
                                  onChange={() => toggleStudentIncluded(student.id)} 
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                                />
                              </td>
                              <td className="px-3 py-2 font-semibold text-gray-800 border border-slate-200 uppercase text-xs">
                                {student.lastName} {student.firstName}
                              </td>

                              {/* Interrogations */}
                              {Array.from({ length: numInterros }).map((_, i) => (
                                <td key={`td-int-${i}`} className="p-1 border border-slate-200 text-center">
                                  <input 
                                    type="text" 
                                    disabled={!isIncluded || !isEditingGrades} 
                                    className="w-12 text-center text-xs p-1 outline-none focus:ring-2 ring-emerald-500 rounded bg-white border border-slate-200 disabled:bg-transparent disabled:border-transparent disabled:cursor-not-allowed font-medium" 
                                    value={sCourseGrades.interros[i] ?? ''} 
                                    onChange={e => handleInterroChange(student.id, currentCourse.id, i, e.target.value)} 
                                    placeholder="-"
                                  />
                                </td>
                              ))}

                              {/* Moyenne Interros */}
                              <td className="p-2 border border-slate-200 text-center font-bold text-emerald-800 bg-emerald-50/60 font-mono">
                                {sCourseGrades.avgInterro || '-'}
                              </td>

                              {/* Devoirs */}
                              {Array.from({ length: numDevoirs }).map((_, i) => (
                                <td key={`td-dev-${i}`} className="p-1 border border-slate-200 text-center">
                                  <input 
                                    type="text" 
                                    disabled={!isIncluded || !isEditingGrades} 
                                    className="w-12 text-center text-xs p-1 outline-none focus:ring-2 ring-blue-500 rounded bg-white border border-slate-200 disabled:bg-transparent disabled:border-transparent disabled:cursor-not-allowed font-medium" 
                                    value={sCourseGrades.devoirs[i] ?? ''} 
                                    onChange={e => handleDevoirChange(student.id, currentCourse.id, i, e.target.value)} 
                                    placeholder="-"
                                  />
                                </td>
                              ))}

                              {/* Moyenne Devoirs */}
                              <td className="p-2 border border-slate-200 text-center font-bold text-blue-800 bg-blue-50/60 font-mono">
                                {sCourseGrades.avgDevoir || '-'}
                              </td>

                              {/* Moyenne Générale */}
                              <td className="p-2 border border-slate-200 text-center font-black text-gray-900 bg-amber-50/80 font-mono text-xs">
                                {sCourseGrades.avgGeneral ? `${sCourseGrades.avgGeneral} / 20` : '-'}
                              </td>

                              {/* Observation */}
                              <td className="p-1 border border-slate-200">
                                <div className="flex items-center gap-1.5">
                                  <input 
                                    type="text" 
                                    disabled={!isIncluded || !isEditingGrades} 
                                    placeholder="Observation..." 
                                    className="w-full text-xs p-1.5 outline-none focus:ring-1 ring-emerald-500 rounded bg-white border border-slate-200 disabled:bg-transparent disabled:border-transparent disabled:cursor-not-allowed font-medium text-slate-700" 
                                    value={sCourseGrades.app || ''} 
                                    onChange={e => handleAppreciationChange(student.id, currentCourse.id, e.target.value)} 
                                  />
                                  {sCourseGrades.app && (
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shrink-0 ${
                                      sCourseGrades.app === 'Nul' || sCourseGrades.app === 'Très insuffisant' ? 'bg-red-100 text-red-800' :
                                      sCourseGrades.app === 'Insuffisant' || sCourseGrades.app === 'Faible' ? 'bg-amber-100 text-amber-800' :
                                      sCourseGrades.app === 'Moyen' || sCourseGrades.app === 'Assez bien' ? 'bg-blue-100 text-blue-800' :
                                      'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {sCourseGrades.app}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span>
                  Toutes les notes saisies alimentent directement le dossier académique officiel et sont transmises à la Direction des Études pour la synthèse des bulletins trimestriels.
                </span>
                <span className="font-bold text-emerald-700">
                  {includedStudents.length} / {classStudents.length} élève(s) actif(s)
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL : Aperçu Avant Impression & Export PDF */}
      {showPrintModal && currentCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 max-h-[95vh] flex flex-col border border-slate-200">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shrink-0">
                  <Printer size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                    Aperçu de la Grille des Notes & Relevé Officiel
                  </h3>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Classe : {selectedClass} • Matière : {currentCourse.name} • {period} • {selectedAcademicYear}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowPrintModal(false)} 
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Document Preview */}
            <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-100 flex justify-center">
              <div className="w-full max-w-4xl bg-white shadow-lg p-6 sm:p-10 border border-slate-200 rounded-lg text-slate-800 font-sans space-y-6">
                {/* En-tête officiel */}
                <div className="border-b-2 border-slate-800 pb-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-black text-lg text-slate-900 uppercase tracking-tight">
                        {schoolSettings?.name || "Établissement Scolaire"}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">Direction des Études & Suivi Pédagogique</p>
                      {schoolSettings?.address && (
                        <p className="text-[11px] text-slate-400">{schoolSettings.address}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold uppercase text-slate-700">Année Scolaire : {selectedAcademicYear}</div>
                      <div className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded inline-block mt-1 border border-emerald-200">
                        {period}
                      </div>
                    </div>
                  </div>

                  <div className="text-center mt-4">
                    <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 underline underline-offset-4">
                      Relevé de Notes & Fiche Récapitulative d'Évaluation
                    </h2>
                    <div className="flex flex-wrap justify-center items-center gap-4 text-xs font-semibold text-slate-700 mt-2">
                      <span>Classe : <strong>{selectedClass}</strong></span>
                      <span>•</span>
                      <span>Matière : <strong>{currentCourse.name}</strong> (Coeff : {currentCourse.coefficient || 1})</span>
                      <span>•</span>
                      <span>Professeur : <strong>{user?.name || "Enseignant"}</strong></span>
                      <span>•</span>
                      <span>Date : <strong>{new Date().toLocaleDateString('fr-FR')}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Tableau */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-slate-400 text-xs">
                    <thead className="bg-slate-800 text-[10px] uppercase text-white font-bold tracking-wider">
                      <tr>
                        <th className="px-2 py-2 border border-slate-700 text-center w-8">N°</th>
                        <th className="px-3 py-2 border border-slate-700">Nom et Prénoms</th>
                        {Array.from({ length: numInterros }).map((_, i) => (
                          <th key={`prev-int-${i}`} className="px-2 py-2 border border-slate-700 text-center">
                            Int {i + 1}
                          </th>
                        ))}
                        <th className="px-2 py-2 border border-slate-700 text-center bg-emerald-900 text-white font-bold">
                          Moy. Int
                        </th>
                        {Array.from({ length: numDevoirs }).map((_, i) => (
                          <th key={`prev-dev-${i}`} className="px-2 py-2 border border-slate-700 text-center">
                            Dev {i + 1}
                          </th>
                        ))}
                        <th className="px-2 py-2 border border-slate-700 text-center bg-blue-900 text-white font-bold">
                          Moy. Dev
                        </th>
                        <th className="px-3 py-2 border border-slate-700 text-center bg-slate-900 text-amber-300 font-black">
                          Moy. Générale
                        </th>
                        <th className="px-3 py-2 border border-slate-700 text-left">Observation / Appréciation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 text-xs">
                      {classStudents
                        .filter(s => includedStudents.includes(s.id))
                        .map((student, idx) => {
                          const sGrades = grades[student.id]?.[currentCourse.id] || {
                            interros: [],
                            devoirs: [],
                            avgInterro: '',
                            avgDevoir: '',
                            avgGeneral: '',
                            app: ''
                          };
                          return (
                            <tr key={student.id} className="hover:bg-slate-50">
                              <td className="px-2 py-1.5 border border-slate-300 text-center font-bold text-slate-500">{idx + 1}</td>
                              <td className="px-3 py-1.5 border border-slate-300 font-bold uppercase text-slate-900">
                                {student.lastName} {student.firstName}
                              </td>
                              {Array.from({ length: numInterros }).map((_, i) => (
                                <td key={`prev-td-int-${i}`} className="px-2 py-1.5 border border-slate-300 text-center">
                                  {sGrades.interros[i] || '-'}
                                </td>
                              ))}
                              <td className="px-2 py-1.5 border border-slate-300 text-center font-bold text-emerald-800 bg-emerald-50/50">
                                {sGrades.avgInterro || '-'}
                              </td>
                              {Array.from({ length: numDevoirs }).map((_, i) => (
                                <td key={`prev-td-dev-${i}`} className="px-2 py-1.5 border border-slate-300 text-center">
                                  {sGrades.devoirs[i] || '-'}
                                </td>
                              ))}
                              <td className="px-2 py-1.5 border border-slate-300 text-center font-bold text-blue-800 bg-blue-50/50">
                                {sGrades.avgDevoir || '-'}
                              </td>
                              <td className="px-3 py-1.5 border border-slate-300 text-center font-black text-slate-900 bg-amber-50/60">
                                {sGrades.avgGeneral ? `${sGrades.avgGeneral} / 20` : '-'}
                              </td>
                              <td className="px-3 py-1.5 border border-slate-300 font-semibold text-slate-800">
                                {sGrades.app || '-'}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* Synthèse statistique */}
                {(() => {
                  const evStudents = classStudents.filter(s => includedStudents.includes(s.id));
                  const validAvgs = evStudents
                    .map(s => {
                      const g = grades[s.id]?.[currentCourse.id];
                      const val = g?.avgGeneral ? parseFloat(g.avgGeneral) : null;
                      return val !== null && !isNaN(val) ? val : null;
                    })
                    .filter((v): v is number => v !== null);

                  const count = evStudents.length;
                  const sum = validAvgs.reduce((a, b) => a + b, 0);
                  const avg = validAvgs.length > 0 ? (sum / validAvgs.length).toFixed(2) : "0.00";
                  const max = validAvgs.length > 0 ? Math.max(...validAvgs).toFixed(2) : "0.00";
                  const min = validAvgs.length > 0 ? Math.min(...validAvgs).toFixed(2) : "0.00";
                  const pass = validAvgs.filter(v => v >= 10).length;
                  const rate = validAvgs.length > 0 ? Math.round((pass / validAvgs.length) * 100) : 0;

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 bg-slate-50 border border-slate-300 rounded-lg text-center text-xs">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Effectif Évalué</div>
                        <div className="font-extrabold text-slate-800 text-sm">{count} élève(s)</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Moyenne de Classe</div>
                        <div className="font-extrabold text-emerald-700 text-sm">{avg} / 20</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Plus Forte Moyenne</div>
                        <div className="font-extrabold text-blue-700 text-sm">{max} / 20</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Plus Faible Moyenne</div>
                        <div className="font-extrabold text-rose-700 text-sm">{min} / 20</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Taux Réussite (≥ 10)</div>
                        <div className="font-extrabold text-emerald-800 text-sm">{rate}% ({pass}/{count})</div>
                      </div>
                    </div>
                  );
                })()}

                {/* Signatures */}
                <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
                  <div>
                    <p className="font-bold text-slate-800 uppercase">L'Enseignant de la matière :</p>
                    <p className="text-slate-600 font-semibold mt-1">{user?.name || "Nom de l'Enseignant"}</p>
                    <div className="mt-12 text-[10px] text-slate-400 italic">Signature & Date :</div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800 uppercase">Le Directeur des Études / La Direction :</p>
                    <div className="mt-14 text-[10px] text-slate-400 italic">Visa & Cachet officiel :</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-end items-center gap-3 shrink-0">
              <button 
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
              >
                Fermer
              </button>
              <button 
                onClick={() => {
                  window.print();
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center gap-2"
              >
                <Printer size={16} /> Lancer l'impression / Enregistrer en PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DÉDIÉ IMPRESSION (@media print) : Éléments imprimés garantis avec #teacher-grades-print-area */}
      {currentCourse && (
        <div id="teacher-grades-print-area" className="hidden print:block p-8 bg-white text-black font-sans">
          {/* En-tête officiel */}
          <div className="border-b-2 border-black pb-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-black">
                  {schoolSettings?.name || "ÉTABLISSEMENT SCOLAIRE"}
                </h1>
                <p className="text-xs font-semibold text-black uppercase">Direction des Études & Contrôle Pédagogique</p>
                {schoolSettings?.address && <p className="text-[11px] text-black">{schoolSettings.address}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase">Année Scolaire : {selectedAcademicYear}</p>
                <p className="text-xs font-extrabold uppercase mt-1">Période : {period}</p>
              </div>
            </div>

            <div className="text-center mt-3">
              <h2 className="text-base font-black uppercase underline tracking-wider text-black">
                RELEVÉ RÉCAPITULATIF DES NOTES & OBSERVATIONS
              </h2>
              <div className="flex justify-center gap-4 text-xs font-bold text-black mt-1">
                <span>Classe : {selectedClass}</span>
                <span>•</span>
                <span>Matière : {currentCourse.name} (Coeff : {currentCourse.coefficient || 1})</span>
                <span>•</span>
                <span>Professeur : {user?.name || "Enseignant"}</span>
                <span>•</span>
                <span>Date : {new Date().toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>

          {/* Table imprimée */}
          <table className="w-full text-left border-collapse border border-black text-xs mb-4">
            <thead>
              <tr className="bg-gray-200 text-black font-bold uppercase text-[10px]">
                <th className="px-2 py-1.5 border border-black text-center w-8">N°</th>
                <th className="px-3 py-1.5 border border-black">Nom et Prénoms de l'Élève</th>
                {Array.from({ length: numInterros }).map((_, i) => (
                  <th key={`print-int-${i}`} className="px-2 py-1.5 border border-black text-center">
                    Int {i + 1}
                  </th>
                ))}
                <th className="px-2 py-1.5 border border-black text-center font-bold">Moy. Int</th>
                {Array.from({ length: numDevoirs }).map((_, i) => (
                  <th key={`print-dev-${i}`} className="px-2 py-1.5 border border-black text-center">
                    Dev {i + 1}
                  </th>
                ))}
                <th className="px-2 py-1.5 border border-black text-center font-bold">Moy. Dev</th>
                <th className="px-3 py-1.5 border border-black text-center font-black">Moy. Générale / 20</th>
                <th className="px-3 py-1.5 border border-black">Observation / Appréciation</th>
              </tr>
            </thead>
            <tbody>
              {classStudents
                .filter(s => includedStudents.includes(s.id))
                .map((student, idx) => {
                  const sGrades = grades[student.id]?.[currentCourse.id] || {
                    interros: [],
                    devoirs: [],
                    avgInterro: '',
                    avgDevoir: '',
                    avgGeneral: '',
                    app: ''
                  };
                  return (
                    <tr key={student.id}>
                      <td className="px-2 py-1 border border-black text-center font-bold">{idx + 1}</td>
                      <td className="px-3 py-1 border border-black font-bold uppercase">
                        {student.lastName} {student.firstName}
                      </td>
                      {Array.from({ length: numInterros }).map((_, i) => (
                        <td key={`ptd-int-${i}`} className="px-2 py-1 border border-black text-center">
                          {sGrades.interros[i] || '-'}
                        </td>
                      ))}
                      <td className="px-2 py-1 border border-black text-center font-bold">
                        {sGrades.avgInterro || '-'}
                      </td>
                      {Array.from({ length: numDevoirs }).map((_, i) => (
                        <td key={`ptd-dev-${i}`} className="px-2 py-1 border border-black text-center">
                          {sGrades.devoirs[i] || '-'}
                        </td>
                      ))}
                      <td className="px-2 py-1 border border-black text-center font-bold">
                        {sGrades.avgDevoir || '-'}
                      </td>
                      <td className="px-3 py-1 border border-black text-center font-black">
                        {sGrades.avgGeneral ? `${sGrades.avgGeneral} / 20` : '-'}
                      </td>
                      <td className="px-3 py-1 border border-black font-semibold">
                        {sGrades.app || '-'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {/* Synthèse imprimée */}
          {(() => {
            const evStudents = classStudents.filter(s => includedStudents.includes(s.id));
            const validAvgs = evStudents
              .map(s => {
                const g = grades[s.id]?.[currentCourse.id];
                const val = g?.avgGeneral ? parseFloat(g.avgGeneral) : null;
                return val !== null && !isNaN(val) ? val : null;
              })
              .filter((v): v is number => v !== null);

            const count = evStudents.length;
            const sum = validAvgs.reduce((a, b) => a + b, 0);
            const avg = validAvgs.length > 0 ? (sum / validAvgs.length).toFixed(2) : "0.00";
            const max = validAvgs.length > 0 ? Math.max(...validAvgs).toFixed(2) : "0.00";
            const min = validAvgs.length > 0 ? Math.min(...validAvgs).toFixed(2) : "0.00";
            const pass = validAvgs.filter(v => v >= 10).length;
            const rate = validAvgs.length > 0 ? Math.round((pass / validAvgs.length) * 100) : 0;

            return (
              <div className="grid grid-cols-5 gap-2 p-2 border border-black text-center text-xs mb-6">
                <div>Effectif : <strong>{count}</strong></div>
                <div>Moyenne classe : <strong>{avg} / 20</strong></div>
                <div>Plus forte : <strong>{max} / 20</strong></div>
                <div>Plus faible : <strong>{min} / 20</strong></div>
                <div>Réussite : <strong>{rate}% ({pass}/{count})</strong></div>
              </div>
            );
          })()}

          {/* Signatures imprimées */}
          <div className="grid grid-cols-2 gap-12 text-xs pt-4">
            <div>
              <p className="font-bold uppercase">L'Enseignant de la matière :</p>
              <p className="font-semibold">{user?.name || "Enseignant"}</p>
              <div className="mt-14 text-[10px] italic">Signature :</div>
            </div>
            <div className="text-right">
              <p className="font-bold uppercase">Le Directeur des Études / La Direction :</p>
              <div className="mt-16 text-[10px] italic">Cachet & Visa officiel :</div>
            </div>
          </div>
        </div>
      )}

      {/* Autres onglets */}
      {activeTab === "ATTENDANCE" && <TeacherAttendance />}
      {activeTab === "TIMETABLE" && <TeacherTimetable />}
      {activeTab === "CALENDAR" && <SharedCalendar userRole={user?.role || "TEACHER"} />}
    </div>
  );
}
