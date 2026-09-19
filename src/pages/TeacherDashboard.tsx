import React, { useState, useEffect, useMemo } from "react";
import { Student, LEVELS } from "../types";
import { useAuth } from "../lib/auth";
import { 
  Users, Save, Download, LayoutGrid, ArrowLeft, Plus, 
  CheckSquare, Edit2, X, FileText, CheckCircle2, AlertCircle, 
  Printer, GraduationCap, Award
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { TeacherAttendance } from "../components/TeacherAttendance";
import { TeacherTimetable } from "../components/TeacherTimetable";
import { SharedCalendar } from "../components/SharedCalendar";

const STANDARD_SUBJECTS = [
  "Français",
  "Mathématiques",
  "Anglais",
  "Histoire-Géographie",
  "Sciences de la Vie et de la Terre (SVT)",
  "Physique-Chimie-Technologie (PCT)",
  "Philosophie",
  "Éducation Physique et Sportive (EPS)",
  "Allemand",
  "Espagnol",
  "Informatique",
  "Éveil Scientifique & Activités",
  "Dessin / Arts Plastiques",
  "Musique"
];

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

function TeacherDashboardInner() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"GRADES" | "ATTENDANCE" | "TIMETABLE" | "CALENDAR">("GRADES");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [allSchoolCourses, setAllSchoolCourses] = useState<any[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<any>(null);
  
  // Saisie des notes
  const [grades, setGrades] = useState<Record<string, Record<string, {int1: string, int2: string, dev1: string, dev2: string, avg: string, app: string}>>>({});
  const [originalGrades, setOriginalGrades] = useState<any>({});
  const [isEditingGrades, setIsEditingGrades] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  
  // Elèves inclus pour le relevé / bulletin
  const [includedStudents, setIncludedStudents] = useState<string[]>([]);
  const [period, setPeriod] = useState<string>("1er Trimestre");
  
  // Modal ajout matière
  const [showAddSubjectModal, setShowAddSubjectModal] = useState<boolean>(false);
  const [newSubjectName, setNewSubjectName] = useState<string>(STANDARD_SUBJECTS[0]);
  const [customSubjectName, setCustomSubjectName] = useState<string>("");
  const [newSubjectCoef, setNewSubjectCoef] = useState<number>(2);

  // Modal aperçu bulletin individuel
  const [selectedStudentForBulletin, setSelectedStudentForBulletin] = useState<Student | null>(null);

  // Chargement des données globales
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.schoolId || !user?.id) return;
      try {
        const [stRes, myCoursesRes, allCoursesRes, schoolRes] = await Promise.all([
          supabase.from('students').select('*').eq('school_id', user.schoolId),
          supabase.from('courses').select('*').eq('teacher_id', user.id),
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

        if (myCoursesRes.data) {
          setMyCourses(myCoursesRes.data);
        }

        if (allCoursesRes.data) {
          setAllSchoolCourses(allCoursesRes.data);
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

  // Elèves de la classe sélectionnée
  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(s => s.level === selectedClass);
  }, [students, selectedClass]);

  // Matières actives pour cette classe
  const activeCourses = useMemo(() => {
    if (!selectedClass) return [];
    // 1. Matières spécifiquement enseignées par ce professeur dans cette classe
    const teacherClassCourses = myCourses.filter(c => c.level === selectedClass);
    if (teacherClassCourses.length > 0) return teacherClassCourses;
    // 2. Matières générales de l'école dans cette classe
    const schoolClassCourses = allSchoolCourses.filter(c => c.level === selectedClass);
    if (schoolClassCourses.length > 0) return schoolClassCourses;
    return [];
  }, [selectedClass, myCourses, allSchoolCourses]);

  // Quand la classe change, sélectionner tous les élèves par défaut
  useEffect(() => {
    if (classStudents.length > 0) {
      setIncludedStudents(classStudents.map(s => s.id));
    } else {
      setIncludedStudents([]);
    }
  }, [selectedClass, classStudents]);

  // Chargement des notes de la classe et du trimestre
  useEffect(() => {
    const fetchClassGrades = async () => {
      if (!user?.schoolId || !selectedClass) return;
      try {
        const { data: dbGrades } = await supabase
          .from('grades')
          .select('*')
          .eq('school_id', user.schoolId);

        const loaded: Record<string, Record<string, {int1: string, int2: string, dev1: string, dev2: string, avg: string, app: string}>> = {};

        if (dbGrades && dbGrades.length > 0) {
          dbGrades.forEach((g: any) => {
            const evalType = g.evaluation_type || '';
            const parts = evalType.split('_');
            const evalKey = parts[0]?.toLowerCase(); // int1, int2, dev1, dev2
            const evalPeriod = parts.length > 1 ? parts.slice(1).join('_') : '';

            // Filtrer par trimestre si spécifié
            if (!evalPeriod || evalPeriod === period) {
              if (!loaded[g.student_id]) loaded[g.student_id] = {};
              if (!loaded[g.student_id][g.course_id]) {
                loaded[g.student_id][g.course_id] = { int1: '', int2: '', dev1: '', dev2: '', avg: '', app: '' };
              }
              if (['int1', 'int2', 'dev1', 'dev2'].includes(evalKey)) {
                loaded[g.student_id][g.course_id][evalKey as 'int1'|'int2'|'dev1'|'dev2'] = String(g.score ?? '');
              }
              if (g.appreciation) {
                loaded[g.student_id][g.course_id].app = g.appreciation;
              }
            }
          });

          // Calculer les moyennes et appréciations automatiques
          Object.keys(loaded).forEach(stId => {
            Object.keys(loaded[stId]).forEach(cId => {
              const item = loaded[stId][cId];
              const n1 = parseFloat(item.int1);
              const n2 = parseFloat(item.int2);
              const n3 = parseFloat(item.dev1);
              const n4 = parseFloat(item.dev2);
              let sum = 0; let count = 0;
              if (!isNaN(n1)) { sum += n1; count++; }
              if (!isNaN(n2)) { sum += n2; count++; }
              if (!isNaN(n3)) { sum += n3; count++; }
              if (!isNaN(n4)) { sum += n4; count++; }
              if (count > 0) {
                item.avg = (sum / count).toFixed(2);
                if (!item.app) {
                  const numAvg = parseFloat(item.avg);
                  if (numAvg >= 18) item.app = 'Excellent';
                  else if (numAvg >= 16) item.app = 'Très Bien';
                  else if (numAvg >= 14) item.app = 'Bien';
                  else if (numAvg >= 12) item.app = 'Assez Bien';
                  else if (numAvg >= 10) item.app = 'Passable';
                  else if (numAvg >= 8) item.app = 'Insuffisant';
                  else item.app = 'Faible';
                }
              }
            });
          });
        }

        setGrades(loaded);
        setOriginalGrades(JSON.parse(JSON.stringify(loaded)));
      } catch (err) {
        console.error("Error loading grades:", err);
      }
    };

    fetchClassGrades();
  }, [user, selectedClass, period]);

  const handleManualAppreciation = (studentId: string, courseId: string, value: string) => {
    setGrades((prev: any) => {
      const studentGrades = prev[studentId] || {};
      const courseGrades = studentGrades[courseId] || { int1: '', int2: '', dev1: '', dev2: '', avg: '', app: '' };
      return {
        ...prev,
        [studentId]: {
          ...studentGrades,
          [courseId]: { ...courseGrades, app: value }
        }
      };
    });
  };

  const handleGradeChange = (studentId: string, courseId: string, type: 'int1'|'int2'|'dev1'|'dev2', value: string) => {
    setGrades((prev: any) => {
      const studentGrades = prev[studentId] || {};
      const courseGrades = studentGrades[courseId] || { int1: '', int2: '', dev1: '', dev2: '', avg: '', app: '' };
      const newCourseGrades = { ...courseGrades, [type]: value };
      
      const n1 = parseFloat(newCourseGrades.int1);
      const n2 = parseFloat(newCourseGrades.int2);
      const n3 = parseFloat(newCourseGrades.dev1);
      const n4 = parseFloat(newCourseGrades.dev2);
      let sum = 0; let count = 0;
      if (!isNaN(n1)) { sum += n1; count++; }
      if (!isNaN(n2)) { sum += n2; count++; }
      if (!isNaN(n3)) { sum += n3; count++; }
      if (!isNaN(n4)) { sum += n4; count++; }
      
      if (count > 0) {
        newCourseGrades.avg = (sum / count).toFixed(2);
        const avg = parseFloat(newCourseGrades.avg);
        if (avg >= 18) newCourseGrades.app = 'Excellent';
        else if (avg >= 16) newCourseGrades.app = 'Très Bien';
        else if (avg >= 14) newCourseGrades.app = 'Bien';
        else if (avg >= 12) newCourseGrades.app = 'Assez Bien';
        else if (avg >= 10) newCourseGrades.app = 'Passable';
        else if (avg >= 8) newCourseGrades.app = 'Insuffisant';
        else newCourseGrades.app = 'Faible';
      } else {
        newCourseGrades.avg = '';
        newCourseGrades.app = '';
      }
      
      return {
        ...prev,
        [studentId]: {
          ...studentGrades,
          [courseId]: newCourseGrades
        }
      };
    });
  };

  const handleSaveGrades = async () => {
    if (!user?.schoolId) return;
    setIsSaving(true);
    try {
      const gradesToInsert: any[] = [];
      const now = new Date().toISOString();

      Object.entries(grades).forEach(([studentId, subjectsData]) => {
        if (!includedStudents.includes(studentId)) return;
        
        Object.entries(subjectsData).forEach(([courseId, data]) => {
          const insertGrade = (val: string, type: string) => {
            if (val && String(val).trim() !== '') {
              const score = parseFloat(String(val).replace(',', '.'));
              if (!isNaN(score)) {
                gradesToInsert.push({
                  school_id: user.schoolId,
                  student_id: studentId,
                  course_id: courseId,
                  evaluation_type: type + '_' + period,
                  score: score,
                  max_score: 20,
                  appreciation: data.app || '',
                  grade_date: now
                });
              }
            }
          };
          insertGrade(data.int1, 'INT1');
          insertGrade(data.int2, 'INT2');
          insertGrade(data.dev1, 'DEV1');
          insertGrade(data.dev2, 'DEV2');
        });
      });

      // Remplacement propre : supprimer les anciennes entrées existantes pour ces évaluations
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

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !user?.schoolId) return;

    const finalName = newSubjectName === "AUTRE" ? customSubjectName.trim() : newSubjectName;
    if (!finalName) {
      alert("Veuillez renseigner le nom de la matière.");
      return;
    }

    try {
      const newCourse = {
        school_id: user.schoolId,
        name: finalName,
        level: selectedClass,
        teacher_id: user.id,
        coefficient: Number(newSubjectCoef) || 1
      };

      const { data, error } = await supabase.from('courses').insert(newCourse);
      if (error) throw error;

      // Recharger les matières
      const { data: updatedCourses } = await supabase.from('courses').select('*').eq('teacher_id', user.id);
      if (updatedCourses) setMyCourses(updatedCourses);

      const { data: allC } = await supabase.from('courses').select('*').eq('school_id', user.schoolId);
      if (allC) setAllSchoolCourses(allC);

      setShowAddSubjectModal(false);
      setCustomSubjectName("");
    } catch (err: any) {
      alert("Erreur lors de l'ajout de la matière: " + err.message);
    }
  };

  const toggleStudentIncluded = (studentId: string) => {
    setIncludedStudents(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const getClassesToDisplay = () => {
    const classGroups = LEVELS.map(level => {
      const cStudents = students.filter(s => s.level === level);
      const cCourses = myCourses.filter(c => c.level === level);
      return { 
        level, 
        count: cStudents.length,
        myCoursesCount: cCourses.length
      };
    }).filter(c => c.count > 0 || c.myCoursesCount > 0);

    // Ajouter les niveaux personnalisés
    students.forEach(s => {
      if (s.level && !LEVELS.includes(s.level) && !classGroups.some(c => c.level === s.level)) {
        classGroups.push({ 
          level: s.level, 
          count: students.filter(x => x.level === s.level).length,
          myCoursesCount: myCourses.filter(c => c.level === s.level).length
        });
      }
    });

    return classGroups;
  };

  // Calcul du bulletin d'un élève pour le modal
  const calculateStudentBulletinData = (student: Student) => {
    const studentGrades = grades[student.id] || {};
    let totalPoints = 0;
    let totalCoefs = 0;

    const courseDetails = activeCourses.map(course => {
      const cData = studentGrades[course.id] || { int1: '', int2: '', dev1: '', dev2: '', avg: '', app: '' };
      const coef = Number(course.coefficient) || 1;
      const numAvg = parseFloat(cData.avg);
      const points = !isNaN(numAvg) ? numAvg * coef : 0;
      
      if (!isNaN(numAvg)) {
        totalPoints += points;
        totalCoefs += coef;
      }

      return {
        id: course.id,
        name: course.name,
        coef: coef,
        int1: cData.int1,
        int2: cData.int2,
        dev1: cData.dev1,
        dev2: cData.dev2,
        avg: cData.avg,
        points: points > 0 ? points.toFixed(2) : '-',
        appreciation: cData.app || (numAvg >= 10 ? 'Admis' : 'Insuffisant')
      };
    });

    const generalAverage = totalCoefs > 0 ? (totalPoints / totalCoefs).toFixed(2) : '-';

    return {
      courseDetails,
      totalPoints: totalPoints.toFixed(2),
      totalCoefs,
      generalAverage
    };
  };

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in">
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Espace Professeur</h1>
          <p className="text-xs text-slate-500 mt-1">Gérez vos matières, notes, absences et relevés d'évaluation.</p>
        </div>

        {/* Barre d'onglets */}
        <div className="flex p-1 bg-slate-100 rounded-lg shrink-0 overflow-x-auto max-w-full">
          <button 
            onClick={() => setActiveTab("GRADES")} 
            className={`px-4 py-2 rounded text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-colors ${activeTab === "GRADES" ? "bg-white shadow-sm text-gray-800" : "text-slate-500 hover:text-gray-800"}`}
          >
            Notes & Bulletins
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

      {/* Onglet NOTES & BULLETINS */}
      {activeTab === "GRADES" && (
        <>
          {saveSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-top-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              Toutes les notes et appréciations ont été enregistrées avec succès dans la base de données.
            </div>
          )}

          {!selectedClass ? (
            <div>
              <div className="mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Sélectionnez une classe à évaluer</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {getClassesToDisplay().map((c) => (
                  <div 
                    key={c.level} 
                    onClick={() => setSelectedClass(c.level)} 
                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center gap-3 hover:border-emerald-500 group relative"
                  >
                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                      <LayoutGrid size={24} />
                    </div>
                    <span className="font-bold text-gray-800 text-lg text-center">{c.level}</span>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                        {c.count} élève{c.count > 1 ? 's' : ''} inscrit{c.count > 1 ? 's' : ''}
                      </span>
                      {c.myCoursesCount > 0 && (
                        <span className="text-[10px] text-emerald-600 font-bold">
                          {c.myCoursesCount} matière{c.myCoursesCount > 1 ? 's' : ''} assignée{c.myCoursesCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {getClassesToDisplay().length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                    Aucune classe avec des élèves enregistrés pour le moment.
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
                      {classStudents.length} élève{classStudents.length > 1 ? 's' : ''} inscrit{classStudents.length > 1 ? 's' : ''} • {activeCourses.length} matière{activeCourses.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowAddSubjectModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold uppercase tracking-wider transition"
                  >
                    <Plus size={16} /> Ajouter une matière
                  </button>
                </div>
              </div>

              {/* Barre de contrôle : Période et Saisie */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Période :</span>
                  <select 
                    value={period} 
                    onChange={e => setPeriod(e.target.value)} 
                    disabled={isEditingGrades}
                    className="px-3 py-1.5 border border-slate-300 rounded text-xs font-bold text-gray-800 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white shadow-sm"
                  >
                    <option value="1er Trimestre">1er Trimestre</option>
                    <option value="2ème Trimestre">2ème Trimestre</option>
                    <option value="3ème Trimestre">3ème Trimestre</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isEditingGrades ? (
                    <>
                      <button 
                        onClick={handleSaveGrades} 
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
                      >
                        <Save size={16} /> {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
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
                    <Printer size={16} /> Imprimer la grille
                  </button>
                </div>
              </div>

              {/* Alerte si aucune matière n'est configurée */}
              {activeCourses.length === 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-amber-800 text-xs">
                    <AlertCircle size={20} className="text-amber-600 shrink-0" />
                    <span>Aucune matière n'est encore configurée pour la classe de <strong>{selectedClass}</strong>. Ajoutez au moins une matière pour débuter la saisie des notes.</span>
                  </div>
                  <button 
                    onClick={() => setShowAddSubjectModal(true)}
                    className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-amber-700 transition shrink-0"
                  >
                    + Ajouter une matière
                  </button>
                </div>
              )}

              {/* Table des notes et élèves */}
              <div className="overflow-x-auto print:overflow-visible">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
                    Élèves & Notes ({includedStudents.length}/{classStudents.length} sélectionnés)
                  </h4>
                  {isEditingGrades && (
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded animate-pulse">
                      Mode saisie actif
                    </span>
                  )}
                </div>

                <table className="w-full text-left border-collapse border border-slate-200">
                  <thead className="bg-slate-800 text-[10px] uppercase text-white font-bold tracking-wider">
                    <tr>
                      <th className="px-2 py-2 border border-slate-700 text-center w-8" title="Sélectionner pour le relevé">
                        <CheckSquare size={14} className="mx-auto" />
                      </th>
                      <th className="px-3 py-2 border border-slate-700 min-w-[160px]">Nom et prénoms</th>
                      {activeCourses.map(course => (
                        <React.Fragment key={course.id}>
                          <th className="px-1.5 py-2 border border-slate-700 text-center bg-slate-700/50 text-[10px]">
                            Int 1<br/><span className="text-[9px] text-slate-400">/20</span>
                          </th>
                          <th className="px-1.5 py-2 border border-slate-700 text-center bg-slate-700/50 text-[10px]">
                            Int 2<br/><span className="text-[9px] text-slate-400">/20</span>
                          </th>
                          <th className="px-1.5 py-2 border border-slate-700 text-center bg-slate-700/50 text-[10px]">
                            Dev 1<br/><span className="text-[9px] text-slate-400">/20</span>
                          </th>
                          <th className="px-1.5 py-2 border border-slate-700 text-center bg-slate-700/50 text-[10px]">
                            Dev 2<br/><span className="text-[9px] text-slate-400">/20</span>
                          </th>
                          <th className="px-2 py-2 border border-slate-700 text-center text-emerald-400 text-[10px]">
                            Moy.<br/>{course.name} (c.{course.coefficient || 1})
                          </th>
                        </React.Fragment>
                      ))}
                      <th className="px-3 py-2 border border-slate-700 min-w-[140px]">Observation</th>
                      <th className="px-2 py-2 border border-slate-700 text-center w-24">Bulletin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {classStudents.length === 0 ? (
                      <tr>
                        <td colSpan={10 + activeCourses.length * 5} className="p-8 text-center text-slate-500">
                          Aucun élève inscrit dans cette classe.
                        </td>
                      </tr>
                    ) : (
                      classStudents.map((student) => {
                        const isIncluded = includedStudents.includes(student.id);
                        const sGrades = grades[student.id] || {};

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

                            {activeCourses.map(course => {
                              const cGrades = sGrades[course.id] || { int1: '', int2: '', dev1: '', dev2: '', avg: '', app: '' };
                              return (
                                <React.Fragment key={course.id}>
                                  <td className="p-1 border border-slate-200 text-center">
                                    <input 
                                      type="text" 
                                      disabled={!isIncluded || !isEditingGrades} 
                                      className="w-10 text-center text-xs p-1 outline-none focus:ring-1 ring-emerald-500 rounded bg-white border border-slate-200 disabled:bg-transparent disabled:border-transparent disabled:cursor-not-allowed" 
                                      value={cGrades.int1} 
                                      onChange={e => handleGradeChange(student.id, course.id, 'int1', e.target.value)} 
                                      placeholder="-"
                                    />
                                  </td>
                                  <td className="p-1 border border-slate-200 text-center">
                                    <input 
                                      type="text" 
                                      disabled={!isIncluded || !isEditingGrades} 
                                      className="w-10 text-center text-xs p-1 outline-none focus:ring-1 ring-emerald-500 rounded bg-white border border-slate-200 disabled:bg-transparent disabled:border-transparent disabled:cursor-not-allowed" 
                                      value={cGrades.int2} 
                                      onChange={e => handleGradeChange(student.id, course.id, 'int2', e.target.value)} 
                                      placeholder="-"
                                    />
                                  </td>
                                  <td className="p-1 border border-slate-200 text-center">
                                    <input 
                                      type="text" 
                                      disabled={!isIncluded || !isEditingGrades} 
                                      className="w-10 text-center text-xs p-1 outline-none focus:ring-1 ring-emerald-500 rounded bg-white border border-slate-200 disabled:bg-transparent disabled:border-transparent disabled:cursor-not-allowed" 
                                      value={cGrades.dev1} 
                                      onChange={e => handleGradeChange(student.id, course.id, 'dev1', e.target.value)} 
                                      placeholder="-"
                                    />
                                  </td>
                                  <td className="p-1 border border-slate-200 text-center">
                                    <input 
                                      type="text" 
                                      disabled={!isIncluded || !isEditingGrades} 
                                      className="w-10 text-center text-xs p-1 outline-none focus:ring-1 ring-emerald-500 rounded bg-white border border-slate-200 disabled:bg-transparent disabled:border-transparent disabled:cursor-not-allowed" 
                                      value={cGrades.dev2} 
                                      onChange={e => handleGradeChange(student.id, course.id, 'dev2', e.target.value)} 
                                      placeholder="-"
                                    />
                                  </td>
                                  <td className="p-1 border border-slate-200 text-center font-bold text-emerald-700 bg-emerald-50/70 text-xs">
                                    {cGrades.avg || '-'}
                                  </td>
                                </React.Fragment>
                              );
                            })}

                            <td className="p-1 border border-slate-200">
                              <input 
                                type="text" 
                                disabled={!isIncluded || !isEditingGrades} 
                                placeholder="Observation..." 
                                className="w-full text-xs p-1.5 outline-none focus:ring-1 ring-emerald-500 rounded bg-white border border-slate-200 disabled:bg-transparent disabled:border-transparent disabled:cursor-not-allowed" 
                                value={Object.values(sGrades)[0]?.app || ''} 
                                onChange={e => {
                                  const courseId = activeCourses[0]?.id;
                                  if (courseId) handleManualAppreciation(student.id, courseId, e.target.value);
                                }} 
                              />
                            </td>

                            <td className="p-1 border border-slate-200 text-center">
                              <button 
                                onClick={() => setSelectedStudentForBulletin(student)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold uppercase tracking-wider transition"
                                title="Voir / Imprimer le bulletin"
                              >
                                <FileText size={13} className="text-emerald-600" /> Bulletin
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span>Le calcul des moyennes par matière se fait automatiquement dès la saisie des interrogations et devoirs. Cliquez sur <strong>Bulletin</strong> pour générer l'imprimé officiel.</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL AJOUTER UNE MATIERE */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <Plus size={16} className="text-emerald-600" />
                Ajouter une matière pour {selectedClass}
              </h3>
              <button onClick={() => setShowAddSubjectModal(false)} className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Matière</label>
                <select 
                  value={newSubjectName} 
                  onChange={e => setNewSubjectName(e.target.value)} 
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm bg-white outline-none focus:ring-1 ring-emerald-500"
                >
                  {STANDARD_SUBJECTS.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                  <option value="AUTRE">Autre (personnalisé)...</option>
                </select>
              </div>

              {newSubjectName === "AUTRE" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nom de la matière</label>
                  <input 
                    type="text" 
                    value={customSubjectName} 
                    onChange={e => setCustomSubjectName(e.target.value)} 
                    placeholder="Ex: Économie, Musique..." 
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:ring-1 ring-emerald-500"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Coefficient</label>
                <input 
                  type="number" 
                  min={1} 
                  max={10} 
                  value={newSubjectCoef} 
                  onChange={e => setNewSubjectCoef(Number(e.target.value))} 
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:ring-1 ring-emerald-500" 
                  required 
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddSubjectModal(false)} 
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-600 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition"
                >
                  Ajouter la matière
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BULLETIN DE NOTES INDIVIDUEL */}
      {selectedStudentForBulletin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Barre de contrôle du modal */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => window.print()} 
                  className="px-4 py-2 bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-700 transition flex items-center gap-2 shadow-sm"
                >
                  <Printer size={16} /> Imprimer le bulletin
                </button>
              </div>
              <button 
                onClick={() => setSelectedStudentForBulletin(null)} 
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Corps imprimable du bulletin */}
            <div className="p-8 overflow-y-auto flex-1 bg-white" id="bulletin-print-area">
              {/* En-tête officiel de l'école */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-800 pb-6 mb-6">
                <div className="flex items-center gap-4">
                  {schoolSettings?.logo && (
                    <img src={schoolSettings?.logo} alt="Logo de l'école" className="w-20 h-20 object-contain rounded" />
                  )}
                  <div>
                    <h2 className="text-xl font-black text-gray-800 uppercase tracking-wide">
                      {schoolSettings?.name || "Établissement Scolaire"}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">{schoolSettings?.locality || "République du Bénin"}</p>
                    <p className="text-xs text-slate-600">{schoolSettings?.contacts || "Ministère des Enseignements Secondaire, Technique et de la Formation Professionnelle"}</p>
                    {schoolSettings?.motto && (
                      <p className="text-[11px] font-semibold text-slate-500 italic mt-1">« {schoolSettings.motto} »</p>
                    )}
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6">
                  <h1 className="text-xl font-black text-gray-800 uppercase tracking-widest mb-1">BULLETIN DE NOTES</h1>
                  <span className="inline-block bg-slate-800 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded">
                    {period}
                  </span>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">Année Scolaire : {schoolSettings?.academicYear || "2024-2025"}</p>
                </div>
              </div>

              {/* Fiche d'identification de l'élève */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg mb-6 flex flex-wrap gap-x-10 gap-y-3">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nom & Prénoms</span>
                  <span className="font-black text-sm text-gray-800 uppercase">
                    {selectedStudentForBulletin.lastName} {selectedStudentForBulletin.firstName}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Classe</span>
                  <span className="font-bold text-sm text-gray-800">{selectedStudentForBulletin.level}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Matricule / ÉducMaster</span>
                  <span className="font-mono text-sm text-gray-800 font-bold">
                    {selectedStudentForBulletin.educmasterNumber || selectedStudentForBulletin.matricule || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sexe</span>
                  <span className="font-bold text-sm text-gray-800">
                    {selectedStudentForBulletin.gender === 'MALE' ? 'Masculin (M)' : 'Féminin (F)'}
                  </span>
                </div>
              </div>

              {/* Grille des notes du bulletin */}
              {(() => {
                const bulletinData = calculateStudentBulletinData(selectedStudentForBulletin);
                return (
                  <>
                    <table className="w-full border-collapse mb-6 text-left border border-slate-300">
                      <thead>
                        <tr className="bg-slate-800 text-white text-[10px] uppercase tracking-wider">
                          <th className="p-2.5 border border-slate-700">Matière</th>
                          <th className="p-2.5 border border-slate-700 text-center w-14">Coef</th>
                          <th className="p-2.5 border border-slate-700 text-center w-14">Int 1</th>
                          <th className="p-2.5 border border-slate-700 text-center w-14">Int 2</th>
                          <th className="p-2.5 border border-slate-700 text-center w-14">Dev 1</th>
                          <th className="p-2.5 border border-slate-700 text-center w-14">Dev 2</th>
                          <th className="p-2.5 border border-slate-700 text-center w-20">Moyenne</th>
                          <th className="p-2.5 border border-slate-700 text-center w-20">Points</th>
                          <th className="p-2.5 border border-slate-700">Appréciation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs">
                        {bulletinData.courseDetails.map(c => (
                          <tr key={c.id}>
                            <td className="p-2.5 border border-slate-300 font-bold text-gray-800">{c.name}</td>
                            <td className="p-2.5 border border-slate-300 text-center font-mono">{c.coef}</td>
                            <td className="p-2.5 border border-slate-300 text-center">{c.int1 || '-'}</td>
                            <td className="p-2.5 border border-slate-300 text-center">{c.int2 || '-'}</td>
                            <td className="p-2.5 border border-slate-300 text-center">{c.dev1 || '-'}</td>
                            <td className="p-2.5 border border-slate-300 text-center">{c.dev2 || '-'}</td>
                            <td className={`p-2.5 border border-slate-300 text-center font-bold font-mono ${parseFloat(c.avg) >= 10 ? 'text-emerald-700' : 'text-red-600'}`}>
                              {c.avg || '-'}
                            </td>
                            <td className="p-2.5 border border-slate-300 text-center font-mono font-bold text-slate-700">
                              {c.points}
                            </td>
                            <td className="p-2.5 border border-slate-300 text-slate-700">{c.appreciation}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 font-bold text-xs text-gray-800">
                          <td className="p-2.5 border border-slate-300 uppercase">Totaux</td>
                          <td className="p-2.5 border border-slate-300 text-center font-mono">{bulletinData.totalCoefs}</td>
                          <td colSpan={5} className="p-2.5 border border-slate-300 text-right pr-4">Total Points :</td>
                          <td className="p-2.5 border border-slate-300 text-center font-mono text-emerald-800 font-black">{bulletinData.totalPoints}</td>
                          <td className="p-2.5 border border-slate-300"></td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Synthèse du bulletin */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="border border-slate-200 p-4 rounded-lg bg-slate-50 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Moyenne Générale Trimestrielle</span>
                          <div className="text-3xl font-black text-gray-800 mt-1">
                            {bulletinData.generalAverage} <span className="text-sm font-normal text-slate-500">/ 20</span>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-2">
                          <Award size={18} className="text-emerald-600" />
                          <span className="text-xs font-bold text-gray-700">
                            Mention : {parseFloat(bulletinData.generalAverage) >= 16 ? "Très Bien (Félicitations)" : parseFloat(bulletinData.generalAverage) >= 14 ? "Bien (Tableau d'Honneur)" : parseFloat(bulletinData.generalAverage) >= 12 ? "Assez Bien (Encouragements)" : parseFloat(bulletinData.generalAverage) >= 10 ? "Passable" : "Insuffisant"}
                          </span>
                        </div>
                      </div>

                      <div className="border border-slate-200 p-4 rounded-lg flex flex-col justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Observation & Décision du Conseil</span>
                        <p className="text-xs text-slate-600 italic mt-2">
                          {parseFloat(bulletinData.generalAverage) >= 10 
                            ? "Travail satisfaisant. Doit continuer à persévérer et maintenir ses efforts." 
                            : "Résultats insuffisants. Un effort soutenu et un suivi rigoureux sont recommandés."}
                        </p>
                        <div className="mt-6 flex justify-between text-center text-xs font-bold text-slate-700 pt-4 border-t border-slate-200">
                          <div>
                            <p className="mb-8">Le Professeur Principal</p>
                            <p className="text-[10px] text-slate-400 italic">(Signature)</p>
                          </div>
                          <div>
                            <p className="mb-8">Le Directeur des Études</p>
                            <p className="text-[10px] text-slate-400 italic">(Cachet & Signature)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
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
