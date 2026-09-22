import React, { useState, useEffect, useMemo } from "react";
import { Student, LEVELS } from "../types";
import { useAuth } from "../lib/auth";
import { 
  Users, Save, LayoutGrid, ArrowLeft, Plus, 
  CheckSquare, Edit2, X, CheckCircle2, AlertCircle, 
  Printer, Trash2, BookOpen
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

  // Chargement des cours assignés et données
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.schoolId || !user?.id) return;
      try {
        const [stRes, allCoursesRes, schoolRes] = await Promise.all([
          supabase.from('students').select('*').eq('school_id', user.schoolId),
          supabase.from('courses').select('*').eq('school_id', user.schoolId),
          supabase.from('schools').select('*').eq('id', user.schoolId).maybeSingle()
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

        if (allCoursesRes.data) {
          // Filtrer rigoureusement les cours attribués au professeur connecté :
          // Par teacher_id === user.id OU email === user.email
          const userIdentifier = user.id;
          const userEmail = user.email?.toLowerCase();
          const assignedCourses = allCoursesRes.data.filter((c: any) => {
            return (
              c.teacher_id === userIdentifier ||
              (userEmail && c.teacher_id === userEmail) ||
              (c.teacher_email && c.teacher_email.toLowerCase() === userEmail)
            );
          });
          setMyCourses(assignedCourses);
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

  // Fonction de calcul de notes selon la règle exacte spécifiée par l'utilisateur :
  // - Moyenne Interro = somme des interros / nombre d'interros saisies
  // - Moyenne Devoir = somme des devoirs / nombre de devoirs saisis
  // - Moyenne Générale = (Moyenne Interro + Moyenne Devoir) / 2
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

    let appreciation = '';
    if (avgGen !== null) {
      if (avgGen >= 18) appreciation = 'Excellent';
      else if (avgGen >= 16) appreciation = 'Très Bien';
      else if (avgGen >= 14) appreciation = 'Bien';
      else if (avgGen >= 12) appreciation = 'Assez Bien';
      else if (avgGen >= 10) appreciation = 'Passable';
      else if (avgGen >= 8) appreciation = 'Insuffisant';
      else appreciation = 'Faible';
    }

    return {
      avgInterro: avgInt !== null ? avgInt.toFixed(2) : '',
      avgDevoir: avgDev !== null ? avgDev.toFixed(2) : '',
      avgGeneral: avgGen !== null ? avgGen.toFixed(2) : '',
      appreciation
    };
  };

  // Chargement des notes de la classe depuis la base de données
  useEffect(() => {
    const fetchClassGrades = async () => {
      if (!user?.schoolId || !selectedClass) return;
      try {
        const { data: dbGrades } = await supabase
          .from('grades')
          .select('*')
          .eq('school_id', user.schoolId);

        const loaded: Record<string, Record<string, CourseGradeState>> = {};
        let maxIntFound = 2;
        let maxDevFound = 2;

        if (dbGrades && dbGrades.length > 0) {
          dbGrades.forEach((g: any) => {
            const evalType = g.evaluation_type || '';
            const parts = evalType.split('_');
            const evalKey = parts[0]?.toUpperCase(); // INT1, INT2, DEV1, DEV2...
            const evalPeriod = parts.length > 1 ? parts.slice(1).join('_') : '';

            if (!evalPeriod || evalPeriod === period) {
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

          // Recalculer les moyennes
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
        }

        setNumInterros(Math.max(2, maxIntFound));
        setNumDevoirs(Math.max(2, maxDevFound));
        setGrades(loaded);
        setOriginalGrades(JSON.parse(JSON.stringify(loaded)));
      } catch (err) {
        console.error("Error loading grades:", err);
      }
    };

    fetchClassGrades();
  }, [user, selectedClass, period]);

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
            app: courseGrades.app || calculated.appreciation
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
            app: courseGrades.app || calculated.appreciation
          }
        }
      };
    });
  };

  // Modification de l'observation / appréciation
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

  // Sauvegarde des notes dans Supabase
  const handleSaveGrades = async () => {
    if (!user?.schoolId) return;
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
                  evaluation_type: `INT${idx + 1}_${period}`,
                  score: score,
                  max_score: 20,
                  appreciation: data.app || '',
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
                  evaluation_type: `DEV${idx + 1}_${period}`,
                  score: score,
                  max_score: 20,
                  appreciation: data.app || '',
                  grade_date: now
                });
              }
            }
          });
        });
      });

      // Supprimer les évaluations existantes correspondantes pour cette période et ce cours
      const { data: existingGrades } = await supabase
        .from('grades')
        .select('*')
        .eq('school_id', user.schoolId);

      if (existingGrades) {
        const keysToReplace = new Set(gradesToInsert.map(g => `${g.student_id}_${g.course_id}_${g.evaluation_type}`));
        for (const eg of existingGrades) {
          if (keysToReplace.has(`${eg.student_id}_${eg.course_id}_${eg.evaluation_type}`)) {
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

              {/* Barre de contrôle : Période, Gestion des colonnes et Actions */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Période :</span>
                    <select 
                      value={period} 
                      onChange={e => setPeriod(e.target.value)} 
                      disabled={isEditingGrades}
                      className="px-3 py-1.5 border border-slate-300 rounded text-xs font-bold text-gray-800 focus:ring-emerald-500 outline-none bg-white shadow-sm"
                    >
                      <option value="1er Trimestre">1er Trimestre</option>
                      <option value="2ème Trimestre">2ème Trimestre</option>
                      <option value="3ème Trimestre">3ème Trimestre</option>
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
                    onClick={() => window.print()} 
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition shadow-sm"
                    title="Imprimer la grille récapitulative"
                  >
                    <Printer size={16} /> Imprimer
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
                                <input 
                                  type="text" 
                                  disabled={!isIncluded || !isEditingGrades} 
                                  placeholder="Observation..." 
                                  className="w-full text-xs p-1.5 outline-none focus:ring-1 ring-emerald-500 rounded bg-white border border-slate-200 disabled:bg-transparent disabled:border-transparent disabled:cursor-not-allowed" 
                                  value={sCourseGrades.app || ''} 
                                  onChange={e => handleAppreciationChange(student.id, currentCourse.id, e.target.value)} 
                                />
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

      {/* Autres onglets */}
      {activeTab === "ATTENDANCE" && <TeacherAttendance />}
      {activeTab === "TIMETABLE" && <TeacherTimetable />}
      {activeTab === "CALENDAR" && <SharedCalendar userRole={user?.role || "TEACHER"} />}
    </div>
  );
}
