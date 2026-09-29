import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { 
  Award, 
  Printer, 
  Search, 
  Filter, 
  Users, 
  TrendingUp, 
  BookOpen, 
  CheckCircle2, 
  FileText, 
  ChevronRight, 
  ArrowLeft,
  GraduationCap,
  Calendar,
  AlertCircle
} from "lucide-react";
import { getGradeAppreciation } from "./TeacherDashboard";

interface CourseInfo {
  id: string;
  name: string;
  level: string;
  teacherName?: string;
  coefficient: number;
}

interface StudentGradeSummary {
  student: any;
  coursesGrades: {
    courseId: string;
    courseName: string;
    teacherName: string;
    coefficient: number;
    interros: string[];
    devoirs: string[];
    avgInterro: string;
    avgDevoir: string;
    avgCourse: number | null;
    points: number;
    appreciation: string;
    rankInCourse?: number;
  }[];
  totalPoints: number;
  totalCoeff: number;
  generalAverage: number | null;
  rank: number;
  appreciation: string;
}

export function DirectorBulletins() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string }[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>("6ème");
  const [selectedYear, setSelectedYear] = useState<string>("2024-2025");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("1er Trimestre");
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Views & Print selection
  const [activeView, setActiveView] = useState<"TABLE" | "BULLETIN_PREVIEW">("TABLE");
  const [selectedStudentForBulletin, setSelectedStudentForBulletin] = useState<string | "ALL">("ALL");

  const activeSchoolId = user?.schoolId || "11111111-1111-4111-8111-111111111111";

  // Charger les données de base (Élèves, Matières, Années scolaires, Infos Établissement)
  const fetchData = async () => {
    setLoading(true);
    try {
      let targetSchoolId = user?.schoolId || localStorage.getItem('edubenin_active_school_id');
      if (!targetSchoolId) {
        const { data: sc } = await supabase.from('schools').select('id, academic_year').order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (sc?.id) targetSchoolId = sc.id;
      }
      if (!targetSchoolId) targetSchoolId = "11111111-1111-4111-8111-111111111111";

      const [allStudentsRes, coursesRes, yearsRes, schoolRes] = await Promise.all([
        supabase.from('students').select('*'),
        supabase.from('courses').select('*, profiles(full_name)').eq('school_id', targetSchoolId),
        supabase.from('academic_years').select('id, name').eq('school_id', targetSchoolId),
        supabase.from('schools').select('*').eq('id', targetSchoolId).maybeSingle()
      ]);

      let stList = allStudentsRes.data && Array.isArray(allStudentsRes.data) ? [...allStudentsRes.data] : [];
      try {
        const local = localStorage.getItem('mock_db_students');
        const parsed = local ? JSON.parse(local) : [];
        parsed.forEach((s: any) => {
          if (!stList.some((existing: any) => existing.id === s.id)) {
            stList.push(s);
          }
        });
      } catch(e) {}

      const DEFAULT_STUDENTS = [
        { id: "s1", parent_id: "55555555-5555-4555-8555-555555555555", school_id: targetSchoolId, first_name: "Marc", last_name: "Dubois", level: "6ème", matricule: "2026-001", status: "ACTIVE", gender: "MALE", studentType: "OLD", parent_phone: "+229 97 12 34 56", contacts: "+229 97 12 34 56", academic_year: "2026-2027", created_at: new Date().toISOString() },
        { id: "s2", parent_id: "55555555-5555-4555-8555-555555555555", school_id: targetSchoolId, first_name: "Sophie", last_name: "Dubois", level: "3ème", matricule: "2026-002", status: "ACTIVE", gender: "FEMALE", studentType: "OLD", parent_phone: "+229 95 44 22 11", contacts: "+229 95 44 22 11", academic_year: "2026-2027", created_at: new Date().toISOString() },
        { id: "s3", parent_id: "55555555-5555-4555-8555-555555555555", school_id: targetSchoolId, first_name: "Junior", last_name: "Kodjo", level: "Terminale D", matricule: "2026-003", status: "ACTIVE", gender: "MALE", studentType: "NEW", parent_phone: "+229 96 82 79 23", contacts: "+229 96 82 79 23", academic_year: "2026-2027", created_at: new Date().toISOString() }
      ];
      DEFAULT_STUDENTS.forEach(ds => {
        if (!stList.some((existing: any) => existing.id === ds.id)) {
          stList.push(ds);
        }
      });

      if (stList.length > 0 && targetSchoolId && targetSchoolId !== "11111111-1111-4111-8111-111111111111") {
        const schoolStudents = stList.filter(s => s.school_id === targetSchoolId || !s.school_id);
        if (schoolStudents.length === 0) {
          // Keep all students so none are lost
        } else if (schoolStudents.length < stList.length) {
          const combined = stList.filter(s => !s.school_id || s.school_id === targetSchoolId || s.school_id === "11111111-1111-4111-8111-111111111111");
          stList = combined.length > 0 ? combined : stList;
        } else {
          stList = schoolStudents;
        }
      }
      setStudents(stList);

      let cList = coursesRes.data && Array.isArray(coursesRes.data) ? [...coursesRes.data] : [];
      try {
        const localCourses = localStorage.getItem('mock_db_courses');
        const parsedC = localCourses ? JSON.parse(localCourses) : [];
        parsedC.forEach((lc: any) => {
          if (!cList.some(rc => rc.id === lc.id)) {
            cList.push(lc);
          }
        });
      } catch(e) {}

      const DEFAULT_COURSES = [
        { id: "c1", school_id: targetSchoolId, name: "Mathématiques", level: "6ème", coefficient: 3 },
        { id: "c2", school_id: targetSchoolId, name: "Français", level: "6ème", coefficient: 3 },
        { id: "c3", school_id: targetSchoolId, name: "SVT", level: "6ème", coefficient: 2 },
        { id: "c4", school_id: targetSchoolId, name: "Histoire-Géographie", level: "3ème", coefficient: 2 },
        { id: "c5", school_id: targetSchoolId, name: "Anglais", level: "6ème", coefficient: 2 },
        { id: "c6", school_id: targetSchoolId, name: "Mathématiques", level: "3ème", coefficient: 3 },
        { id: "c7", school_id: targetSchoolId, name: "Français", level: "3ème", coefficient: 3 }
      ];
      DEFAULT_COURSES.forEach(dc => {
        if (!cList.some(rc => rc.id === dc.id)) {
          cList.push(dc);
        }
      });
      setCourses(cList);

      const realYears: { id: string; name: string }[] = [];
      if (yearsRes?.data && yearsRes.data.length > 0) {
        yearsRes.data.forEach((y: any) => {
          if (!realYears.some(ry => ry.name === y.name)) {
            realYears.push(y);
          }
        });
      }

      // Harvest academic years directly from students
      (allStudentsRes.data || []).forEach((s: any) => {
        const y = s.academic_year || s.academicYear;
        if (y && !realYears.some(ry => ry.name === y)) {
          realYears.push({ id: `st_${y}`, name: y });
        }
      });

      let extraYear = "";
      try {
        const saved = localStorage.getItem('schoolSettings_extra_' + targetSchoolId);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.academicYear) extraYear = parsed.academicYear;
        }
      } catch (e) {}

      if (extraYear && !realYears.some(y => y.name === extraYear)) {
        realYears.push({ id: `extra_${extraYear}`, name: extraYear });
      }
      if (schoolRes?.data?.academic_year && !realYears.some(y => y.name === schoolRes.data.academic_year)) {
        realYears.push({ id: `sc_${schoolRes.data.academic_year}`, name: schoolRes.data.academic_year });
      }

      setAcademicYears(realYears);
      if (realYears.length > 0) {
        setSelectedYear(realYears[0].name);
      } else {
        setSelectedYear("");
      }

      setSchoolInfo(schoolRes?.data || {
        name: "ÉTABLISSEMENT SCOLAIRE",
        locality: "Bénin",
        contacts: "",
        motto: ""
      });
    } catch (err) {
      console.error("Error fetching bulletin base data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.schoolId]);

  // Récupérer les classes disponibles à partir des données réelles
  const availableClasses = useMemo(() => {
    const list = Array.from(new Set(students.map(s => s.level))).filter(Boolean);
    return list.sort();
  }, [students]);

  // Sélection automatique de la première classe disponible si nécessaire
  useEffect(() => {
    if (availableClasses.length > 0) {
      if (!availableClasses.includes(selectedClass)) {
        setSelectedClass(availableClasses[0]);
      }
    } else {
      setSelectedClass("");
    }
  }, [availableClasses, selectedClass]);

  // Récupération des métadonnées (coefficients)
  const getCoursesMeta = (schoolId: string): Record<string, { coefficient?: number }> => {
    try {
      const raw = localStorage.getItem(`school_courses_meta_${schoolId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  };

  // Matières de la classe sélectionnée avec coefficients
  const classCourses: CourseInfo[] = useMemo(() => {
    const meta = getCoursesMeta(activeSchoolId);
    const filtered = courses.filter(c => c.level === selectedClass);
    return filtered.map(c => {
      const key1 = c.id;
      const key2 = `${(c.name || '').trim().toLowerCase()}_${c.level}`;
      const coeff = meta[key1]?.coefficient || meta[key2]?.coefficient || 2;
      return {
        id: c.id,
        name: c.name,
        level: c.level,
        teacherName: c.profiles?.full_name || "Professeur",
        coefficient: coeff
      };
    });
  }, [courses, selectedClass, activeSchoolId]);

  // État des notes de la classe (depuis base + localStorage de TeacherDashboard)
  const [loadedGradesMap, setLoadedGradesMap] = useState<Record<string, Record<string, any>>>({});

  useEffect(() => {
    const loadGrades = async () => {
      // 1. Lire le cache direct écrit par TeacherDashboard pour cette classe, année et période
      const storageKey = `school_teacher_grades_${activeSchoolId}_${selectedClass}_${selectedYear}_${selectedPeriod}`;
      let cached: Record<string, Record<string, any>> = {};
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) cached = JSON.parse(raw);
      } catch (e) {}

      // 2. Lire depuis la table Supabase `grades`
      try {
        const { data: dbGrades } = await supabase
          .from('grades')
          .select('*')
          .eq('school_id', activeSchoolId);

        if (dbGrades && dbGrades.length > 0) {
          dbGrades.forEach((g: any) => {
            const evalType = g.evaluation_type || '';
            let isCurrent = false;
            let evalKey = '';

            if (evalType.includes('#')) {
              const parts = evalType.split('#');
              evalKey = parts[0]?.toUpperCase() || '';
              const gPeriod = parts[1] || '';
              const gYear = parts[2] || '';
              if (gPeriod === selectedPeriod && (!gYear || gYear === selectedYear)) {
                isCurrent = true;
              }
            } else if (evalType.includes('_')) {
              const parts = evalType.split('_');
              evalKey = parts[0]?.toUpperCase() || '';
              const gPeriod = parts.slice(1).join('_');
              if (gPeriod === selectedPeriod) {
                isCurrent = true;
              }
            }

            if (isCurrent && g.student_id && g.course_id) {
              if (!cached[g.student_id]) cached[g.student_id] = {};
              if (!cached[g.student_id][g.course_id]) {
                cached[g.student_id][g.course_id] = { interros: [], devoirs: [], avgGeneral: '', app: '' };
              }
              const item = cached[g.student_id][g.course_id];
              if (evalKey.startsWith('INT')) {
                const idx = parseInt(evalKey.replace('INT', ''), 10) - 1;
                if (!isNaN(idx) && idx >= 0) {
                  while (item.interros.length <= idx) item.interros.push('');
                  item.interros[idx] = String(g.score ?? '');
                }
              } else if (evalKey.startsWith('DEV')) {
                const idx = parseInt(evalKey.replace('DEV', ''), 10) - 1;
                if (!isNaN(idx) && idx >= 0) {
                  while (item.devoirs.length <= idx) item.devoirs.push('');
                  item.devoirs[idx] = String(g.score ?? '');
                }
              }
              if (g.appreciation) item.app = g.appreciation;
            }
          });
        }
      } catch (err) {
        console.error("Error reading Supabase grades:", err);
      }

      setLoadedGradesMap(cached);
    };

    loadGrades();
  }, [activeSchoolId, selectedClass, selectedYear, selectedPeriod]);

  // Calcul complet des moyennes de chaque élève, rangs et appréciations
  const classSummaries: StudentGradeSummary[] = useMemo(() => {
    const classStudents = students.filter(s => s.level === selectedClass);
    if (classStudents.length === 0) return [];

    // Pour chaque élève, calculer ses moyennes par matière
    const summaries: StudentGradeSummary[] = classStudents.map(student => {
      const studentGrades = loadedGradesMap[student.id] || {};
      let totalPts = 0;
      let totalCoeff = 0;

      const coursesGrades = classCourses.map(course => {
        const cData = studentGrades[course.id] || { interros: [], devoirs: [], avgGeneral: '', app: '' };

        // Calcul des interros
        let sumInt = 0;
        let countInt = 0;
        (cData.interros || []).forEach((val: any) => {
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            const num = parseFloat(String(val).replace(',', '.'));
            if (!isNaN(num)) {
              sumInt += num;
              countInt++;
            }
          }
        });

        // Calcul des devoirs
        let sumDev = 0;
        let countDev = 0;
        (cData.devoirs || []).forEach((val: any) => {
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

        let avgCourse: number | null = null;
        if (avgInt !== null && avgDev !== null) {
          avgCourse = (avgInt + avgDev) / 2;
        } else if (avgInt !== null) {
          avgCourse = avgInt;
        } else if (avgDev !== null) {
          avgCourse = avgDev;
        } else if (cData.avgGeneral) {
          const direct = parseFloat(String(cData.avgGeneral).replace(',', '.'));
          if (!isNaN(direct)) avgCourse = direct;
        }

        const pts = avgCourse !== null ? (avgCourse * course.coefficient) : 0;
        if (avgCourse !== null) {
          totalPts += pts;
          totalCoeff += course.coefficient;
        }

        const app = cData.app || getGradeAppreciation(avgCourse);

        return {
          courseId: course.id,
          courseName: course.name,
          teacherName: course.teacherName || "Enseignant",
          coefficient: course.coefficient,
          interros: cData.interros || [],
          devoirs: cData.devoirs || [],
          avgInterro: avgInt !== null ? avgInt.toFixed(2) : '-',
          avgDevoir: avgDev !== null ? avgDev.toFixed(2) : '-',
          avgCourse: avgCourse !== null ? parseFloat(avgCourse.toFixed(2)) : null,
          points: parseFloat(pts.toFixed(2)),
          appreciation: app
        };
      });

      const genAvg = totalCoeff > 0 ? (totalPts / totalCoeff) : null;
      const roundedAvg = genAvg !== null ? parseFloat(genAvg.toFixed(2)) : null;

      return {
        student,
        coursesGrades,
        totalPoints: parseFloat(totalPts.toFixed(2)),
        totalCoeff,
        generalAverage: roundedAvg,
        rank: 1, // sera calculé après le tri
        appreciation: getGradeAppreciation(roundedAvg)
      };
    });

    // Tri par moyenne générale décroissante pour assigner les rangs
    summaries.sort((a, b) => {
      const avgA = a.generalAverage !== null ? a.generalAverage : -1;
      const avgB = b.generalAverage !== null ? b.generalAverage : -1;
      return avgB - avgA;
    });

    summaries.forEach((item, index) => {
      item.rank = index + 1;
    });

    // Rangs par matière
    classCourses.forEach(course => {
      const sortedByCourse = [...summaries].sort((a, b) => {
        const cA = a.coursesGrades.find(cg => cg.courseId === course.id)?.avgCourse ?? -1;
        const cB = b.coursesGrades.find(cg => cg.courseId === course.id)?.avgCourse ?? -1;
        return cB - cA;
      });
      sortedByCourse.forEach((item, idx) => {
        const found = item.coursesGrades.find(cg => cg.courseId === course.id);
        if (found) found.rankInCourse = idx + 1;
      });
    });

    return summaries;
  }, [students, selectedClass, classCourses, loadedGradesMap]);

  // Données statistiques de la classe
  const stats = useMemo(() => {
    const evaluated = classSummaries.filter(s => s.generalAverage !== null);
    if (evaluated.length === 0) {
      return {
        count: classSummaries.length,
        evaluatedCount: 0,
        classAverage: 0,
        maxAverage: 0,
        minAverage: 0,
        majorName: '-',
        passCount: 0,
        passRate: 0
      };
    }

    const sumAverages = evaluated.reduce((acc, curr) => acc + (curr.generalAverage || 0), 0);
    const classAvg = sumAverages / evaluated.length;
    const maxAvg = evaluated[0].generalAverage || 0;
    const minAvg = evaluated[evaluated.length - 1].generalAverage || 0;
    const major = evaluated[0].student;
    const passing = evaluated.filter(s => (s.generalAverage || 0) >= 10);
    const passRate = (passing.length / evaluated.length) * 100;

    return {
      count: classSummaries.length,
      evaluatedCount: evaluated.length,
      classAverage: parseFloat(classAvg.toFixed(2)),
      maxAverage: parseFloat(maxAvg.toFixed(2)),
      minAverage: parseFloat(minAvg.toFixed(2)),
      majorName: `${major.last_name} ${major.first_name}`,
      passCount: passing.length,
      passRate: parseFloat(passRate.toFixed(1))
    };
  }, [classSummaries]);

  // Filtrage par terme de recherche et par élève
  const filteredSummaries = useMemo(() => {
    let list = classSummaries;
    if (selectedStudentFilter !== "ALL") {
      list = list.filter(s => s.student.id === selectedStudentFilter);
    }
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(s => 
      s.student.first_name.toLowerCase().includes(q) ||
      s.student.last_name.toLowerCase().includes(q) ||
      (s.student.matricule && s.student.matricule.toLowerCase().includes(q))
    );
  }, [classSummaries, selectedStudentFilter, searchTerm]);

  // Élèves sélectionnés pour le bulletin
  const bulletinsToRender = useMemo(() => {
    if (selectedStudentForBulletin !== "ALL") {
      return classSummaries.filter(s => s.student.id === selectedStudentForBulletin);
    }
    if (selectedStudentFilter !== "ALL") {
      return classSummaries.filter(s => s.student.id === selectedStudentFilter);
    }
    return classSummaries;
  }, [classSummaries, selectedStudentForBulletin, selectedStudentFilter]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      {/* En-tête de la page */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Award className="text-emerald-600" />
            Gestion des Bulletins & Performances Académiques
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Consultez les notes saisies par les professeurs, analysez les performances statistiques et tirez les bulletins officiels par classe et année scolaire.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {activeView === "BULLETIN_PREVIEW" ? (
            <button
              onClick={() => setActiveView("TABLE")}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-gray-700 bg-white rounded-lg text-xs font-bold uppercase hover:bg-slate-50 transition shadow-xs"
            >
              <ArrowLeft size={16} /> Retour au tableau
            </button>
          ) : (
            <button
              onClick={() => {
                setSelectedStudentForBulletin("ALL");
                setActiveView("BULLETIN_PREVIEW");
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition shadow-sm"
            >
              <Printer size={16} /> Tirer les Bulletins de la classe
            </button>
          )}

          {activeView === "BULLETIN_PREVIEW" && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition shadow-md"
            >
              <Printer size={16} /> Lancer l'Impression (PDF)
            </button>
          )}
        </div>
      </div>

      {/* Barre de filtres principale */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end flex-wrap">
        <div className="w-full md:w-44">
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide flex items-center gap-1">
            <GraduationCap size={14} className="text-emerald-600" /> Classe
          </label>
          <select
            value={selectedClass}
            onChange={e => {
              setSelectedClass(e.target.value);
              setSelectedStudentFilter("ALL");
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-gray-800"
          >
            {availableClasses.map(c => (
              <option key={c} value={c}>Classe : {c}</option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-44">
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide flex items-center gap-1">
            <Calendar size={14} className="text-emerald-600" /> Année Scolaire
          </label>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-gray-800"
          >
            {academicYears.length > 0 ? (
              academicYears.map(y => (
                <option key={y.id} value={y.name}>{y.name}</option>
              ))
            ) : (
              <option value="">Aucune année scolaire</option>
            )}
          </select>
        </div>

        <div className="w-full md:w-44">
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide flex items-center gap-1">
            <Filter size={14} className="text-emerald-600" /> Période
          </label>
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-gray-800"
          >
            <option value="1er Trimestre">1er Trimestre</option>
            <option value="2ème Trimestre">2ème Trimestre</option>
            <option value="3ème Trimestre">3ème Trimestre</option>
          </select>
        </div>

        <div className="w-full md:w-56">
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide flex items-center gap-1">
            <Users size={14} className="text-emerald-600" /> Filtrer par Élève
          </label>
          <select
            value={selectedStudentFilter}
            onChange={e => setSelectedStudentFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-gray-800"
          >
            <option value="ALL">Tous les élèves de la classe ({classSummaries.length})</option>
            {classSummaries.map(item => (
              <option key={item.student.id} value={item.student.id}>
                {item.student.last_name || item.student.lastName} {item.student.first_name || item.student.firstName} {item.student.matricule ? `(${item.student.matricule})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px] w-full">
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
            Rechercher un élève
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom ou matricule..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div className="w-full md:w-auto flex gap-2">
          <button
            onClick={() => setActiveView("TABLE")}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
              activeView === "TABLE" ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Vue Tableau
          </button>
          <button
            onClick={() => {
              setSelectedStudentForBulletin("ALL");
              setActiveView("BULLETIN_PREVIEW");
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
              activeView === "BULLETIN_PREVIEW" ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tirer Bulletins
          </button>
        </div>
      </div>

      {/* Cartes KPI Statistiques de performance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Effectif Évalué</div>
          <div className="text-2xl font-black text-gray-800 mt-1">
            {stats.evaluatedCount} <span className="text-xs font-normal text-slate-400">/ {stats.count} élèves</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Classe de {selectedClass}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Moyenne de Classe</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {stats.classAverage.toFixed(2)} <span className="text-xs font-normal text-slate-400">/ 20</span>
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">Performance collective</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Plus Forte Moyenne</div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {stats.maxAverage.toFixed(2)} <span className="text-xs font-normal text-slate-400">/ 20</span>
          </div>
          <div className="text-[11px] text-slate-600 font-bold truncate mt-1" title={stats.majorName}>
            1er : {stats.majorName}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Plus Faible Moyenne</div>
          <div className="text-2xl font-black text-rose-500 mt-1">
            {stats.minAverage.toFixed(2)} <span className="text-xs font-normal text-slate-400">/ 20</span>
          </div>
          <div className="text-[11px] text-slate-400 font-semibold mt-1">Seuil minimal</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Taux de Réussite</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {stats.passRate}%
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, stats.passRate)}%` }}></div>
          </div>
        </div>
      </div>

      {/* VUE 1 : TABLEAU DES NOTES ET STATISTIQUES */}
      {activeView === "TABLE" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <BookOpen size={18} className="text-emerald-600" />
                Tableau Récapitulatif des Notes — {selectedClass} ({selectedPeriod})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {classCourses.length} matière(s) configurée(s) • Total coefficients : {classCourses.reduce((sum, c) => sum + c.coefficient, 0)}
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Matières :</span>
              <div className="flex flex-wrap gap-1">
                {classCourses.map(c => (
                  <span key={c.id} className="px-2 py-0.5 bg-slate-200/70 text-slate-700 rounded text-[10px] font-bold">
                    {c.name} (×{c.coefficient})
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100/80 text-[10px] uppercase font-bold text-slate-600 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-3 py-3 text-center w-12">Rang</th>
                  <th className="px-3 py-3 w-28">Matricule</th>
                  <th className="px-3 py-3 min-w-[160px]">Nom & Prénoms</th>
                  {classCourses.map(c => (
                    <th key={c.id} className="px-2 py-3 text-center min-w-[90px]" title={`${c.name} (Prof: ${c.teacherName})`}>
                      <div className="font-bold truncate">{c.name}</div>
                      <div className="text-[9px] text-slate-400 font-normal">Coeff: {c.coefficient}</div>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center bg-slate-200/60 min-w-[70px]">Points</th>
                  <th className="px-3 py-3 text-center bg-emerald-50 text-emerald-800 min-w-[85px] font-black">Moyenne</th>
                  <th className="px-3 py-3 min-w-[130px]">Appréciation</th>
                  <th className="px-3 py-3 text-center w-28">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={classCourses.length + 6} className="px-6 py-12 text-center text-slate-400">
                      Aucun élève trouvé dans la classe {selectedClass} pour l'année {selectedYear}.
                    </td>
                  </tr>
                ) : (
                  filteredSummaries.map(item => (
                    <tr key={item.student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-2.5 text-center font-black">
                        <span className={`inline-block w-6 h-6 leading-6 rounded-full text-[11px] ${
                          item.rank === 1 ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400' :
                          item.rank === 2 ? 'bg-slate-200 text-slate-700' :
                          item.rank === 3 ? 'bg-orange-100 text-orange-800' :
                          'text-slate-600'
                        }`}>
                          {item.rank}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500">
                        {item.student.matricule || item.student.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-bold text-gray-800 uppercase">{item.student.last_name}</div>
                        <div className="text-slate-500 text-[11px] capitalize">{item.student.first_name}</div>
                      </td>

                      {/* Notes par matière */}
                      {classCourses.map(c => {
                        const cg = item.coursesGrades.find(x => x.courseId === c.id);
                        const score = cg?.avgCourse;
                        return (
                          <td key={c.id} className="px-2 py-2.5 text-center">
                            {score !== null && score !== undefined ? (
                              <div className="flex flex-col items-center">
                                <span className={`font-black px-1.5 py-0.5 rounded text-[11px] ${
                                  score >= 14 ? 'text-emerald-700 bg-emerald-50' :
                                  score >= 10 ? 'text-blue-700 bg-blue-50' :
                                  score >= 8 ? 'text-amber-700 bg-amber-50' :
                                  'text-rose-700 bg-rose-50'
                                }`}>
                                  {score.toFixed(2)}
                                </span>
                                <span className="text-[9px] text-slate-400 mt-0.5">
                                  pts: {(score * c.coefficient).toFixed(1)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300 font-mono">-</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="px-3 py-2.5 text-center font-bold bg-slate-50 text-slate-700">
                        {item.totalPoints > 0 ? item.totalPoints.toFixed(1) : '-'}
                      </td>

                      <td className="px-3 py-2.5 text-center font-black bg-emerald-50/50">
                        {item.generalAverage !== null ? (
                          <span className={`text-xs px-2 py-1 rounded font-black ${
                            item.generalAverage >= 14 ? 'bg-emerald-600 text-white' :
                            item.generalAverage >= 10 ? 'bg-blue-600 text-white' :
                            item.generalAverage >= 8 ? 'bg-amber-500 text-white' :
                            'bg-rose-500 text-white'
                          }`}>
                            {item.generalAverage.toFixed(2)}/20
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Non évalué</span>
                        )}
                      </td>

                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          item.appreciation === "Exceptionnel" || item.appreciation === "Excellent" || item.appreciation === "Très bien" ? "bg-emerald-100 text-emerald-800" :
                          item.appreciation === "Bien" || item.appreciation === "Assez bien" ? "bg-blue-100 text-blue-800" :
                          item.appreciation === "Moyen" ? "bg-amber-100 text-amber-800" :
                          "bg-rose-100 text-rose-800"
                        }`}>
                          {item.appreciation || "Non défini"}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => {
                            setSelectedStudentForBulletin(item.student.id);
                            setActiveView("BULLETIN_PREVIEW");
                          }}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-[11px] font-bold flex items-center gap-1 mx-auto transition"
                          title="Générer et voir le bulletin officiel de cet élève"
                        >
                          <Printer size={12} /> Bulletin
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VUE 2 : PRÉVISUALISATION ET IMPRESSION DES BULLETINS */}
      {activeView === "BULLETIN_PREVIEW" && (
        <div className="space-y-6">
          {/* Barre de contrôle du bulletin */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-gray-700 uppercase">
                Élève à afficher :
              </label>
              <select
                value={selectedStudentForBulletin}
                onChange={e => setSelectedStudentForBulletin(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-gray-800"
              >
                <option value="ALL">Tous les élèves ({classSummaries.length} bulletins)</option>
                {classSummaries.map(s => (
                  <option key={s.student.id} value={s.student.id}>
                    {s.rank}e - {s.student.last_name} {s.student.first_name} ({s.generalAverage !== null ? `${s.generalAverage}/20` : 'S.N'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                {selectedStudentForBulletin === "ALL" 
                  ? `Impression groupée : ${classSummaries.length} bulletins` 
                  : "Impression individuelle"}
              </span>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition shadow-md"
              >
                <Printer size={16} /> Imprimer en PDF
              </button>
            </div>
          </div>

          {/* ZONE OFFICIELLE DU BULLETIN POUR L'ÉCRAN ET L'IMPRESSION */}
          <div id="bulletin-print-area" className="space-y-8">
            {bulletinsToRender.map((bulletinItem, index) => {
              const { student, coursesGrades, totalPoints, totalCoeff, generalAverage, rank, appreciation } = bulletinItem;
              return (
                <div 
                  key={student.id} 
                  className="bg-white p-8 md:p-10 border border-slate-300 rounded-xl shadow-sm text-slate-900 mx-auto max-w-4xl print:border-none print:shadow-none print:p-0 print:m-0 page-break-after"
                  style={{ pageBreakAfter: index < bulletinsToRender.length - 1 ? 'always' : 'auto' }}
                >
                  {/* En-tête officiel République du Bénin */}
                  <div className="border-b-2 border-slate-900 pb-4 mb-5">
                    <div className="flex justify-between items-start text-center">
                      <div className="w-1/3 text-left">
                        <div className="text-[10px] font-bold uppercase tracking-wider">RÉPUBLIQUE DU BÉNIN</div>
                        <div className="text-[9px] text-slate-600 mt-0.5">Ministère des Enseignements Secondaire, Technique et de la Formation Professionnelle</div>
                        <div className="text-[9px] font-bold text-slate-700 mt-1">DDTFP / DÉPARTEMENT DU LITTORAL</div>
                      </div>

                      <div className="w-1/3 text-center">
                        <div className="text-sm font-black uppercase text-emerald-800 tracking-wide">
                          {schoolInfo?.name || "COMPLEXE SCOLAIRE LES LAURÉATS"}
                        </div>
                        <div className="text-[9px] text-slate-500 italic mt-0.5">
                          « {schoolInfo?.motto || "Discipline - Travail - Succès"} »
                        </div>
                        <div className="text-[9px] text-slate-600 mt-1">
                          Tél : {schoolInfo?.contacts || "+229 00 00 00 00"} • {schoolInfo?.locality || "Cotonou"}
                        </div>
                      </div>

                      <div className="w-1/3 text-right">
                        <div className="text-[10px] font-bold uppercase">ANNÉE SCOLAIRE : {selectedYear}</div>
                        <div className="text-xs font-black text-emerald-700 uppercase mt-1">
                          {selectedPeriod.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-200 text-center">
                      <h2 className="text-base font-black tracking-widest uppercase bg-slate-100 py-1 rounded inline-block px-8 text-gray-900 border border-slate-300">
                        BULLETIN DE NOTES DU {selectedPeriod.toUpperCase()}
                      </h2>
                    </div>
                  </div>

                  {/* Fiche d'identification de l'élève */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs mb-5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Nom & Prénoms :</span>
                      <strong className="text-sm text-gray-900 uppercase">{student.last_name} {student.first_name}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Matricule & Sexe :</span>
                      <span className="font-mono font-bold text-slate-700">{student.matricule || student.id.substring(0, 8).toUpperCase()}</span>
                      <span className="ml-2 text-slate-500">({student.gender === 'F' ? 'Féminin' : 'Masculin'})</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Classe & Effectif :</span>
                      <strong className="text-emerald-700 font-bold">{selectedClass}</strong>
                      <span className="text-slate-500 ml-1">({classSummaries.length} élèves)</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Rang dans la classe :</span>
                      <span className="px-2 py-0.5 bg-emerald-600 text-white font-black rounded text-xs">
                        {rank}e sur {classSummaries.length}
                      </span>
                    </div>
                  </div>

                  {/* Tableau détaillé des matières */}
                  <div className="overflow-x-auto border border-slate-300 rounded-lg mb-5">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700 border-b border-slate-300">
                        <tr>
                          <th className="p-2 border-r border-slate-300">Matière</th>
                          <th className="p-2 border-r border-slate-300">Enseignant</th>
                          <th className="p-2 text-center border-r border-slate-300 w-12">Coeff</th>
                          <th className="p-2 text-center border-r border-slate-300">Moy. Interros</th>
                          <th className="p-2 text-center border-r border-slate-300">Moy. Devoirs</th>
                          <th className="p-2 text-center border-r border-slate-300 font-black bg-slate-200/60 w-20">Moy./20</th>
                          <th className="p-2 text-center border-r border-slate-300 font-bold w-16">Points</th>
                          <th className="p-2 text-center border-r border-slate-300 w-14">Rang</th>
                          <th className="p-2">Appréciation de l'enseignant</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-[11px]">
                        {coursesGrades.map(cg => (
                          <tr key={cg.courseId} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-gray-800 border-r border-slate-300">{cg.courseName}</td>
                            <td className="p-2 text-slate-600 text-[10px] border-r border-slate-300 truncate max-w-[120px]">{cg.teacherName}</td>
                            <td className="p-2 text-center font-bold text-slate-700 border-r border-slate-300">{cg.coefficient}</td>
                            <td className="p-2 text-center text-slate-600 border-r border-slate-300">{cg.avgInterro}</td>
                            <td className="p-2 text-center text-slate-600 border-r border-slate-300">{cg.avgDevoir}</td>
                            <td className="p-2 text-center font-black border-r border-slate-300 bg-slate-50">
                              {cg.avgCourse !== null ? (
                                <span className={cg.avgCourse >= 10 ? "text-emerald-700 font-black" : "text-rose-600 font-black"}>
                                  {cg.avgCourse.toFixed(2)}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="p-2 text-center font-bold text-slate-800 border-r border-slate-300">
                              {cg.points > 0 ? cg.points.toFixed(1) : '-'}
                            </td>
                            <td className="p-2 text-center text-slate-600 border-r border-slate-300">
                              {cg.rankInCourse ? `${cg.rankInCourse}e` : '-'}
                            </td>
                            <td className="p-2 text-slate-700 italic text-[10px]">
                              {cg.appreciation || "Travail régulier"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-100 font-bold text-xs border-t-2 border-slate-300">
                        <tr>
                          <td colSpan={2} className="p-2 text-right uppercase border-r border-slate-300">Totaux :</td>
                          <td className="p-2 text-center border-r border-slate-300 font-black">{totalCoeff}</td>
                          <td colSpan={3} className="p-2 text-right uppercase border-r border-slate-300">Total Points :</td>
                          <td className="p-2 text-center font-black border-r border-slate-300">{totalPoints.toFixed(1)}</td>
                          <td colSpan={2} className="p-2"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Bilan Général & Statistiques */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Moyenne de l'élève */}
                    <div className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-lg text-center flex flex-col justify-center">
                      <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                        MOYENNE GÉNÉRALE
                      </span>
                      <div className="text-3xl font-black text-emerald-700 my-1">
                        {generalAverage !== null ? `${generalAverage.toFixed(2)}` : 'S.N'}
                        <span className="text-sm font-normal text-slate-500"> / 20</span>
                      </div>
                      <div className="text-xs font-black uppercase tracking-wider text-emerald-900 mt-1">
                        Mention : {appreciation}
                      </div>
                    </div>

                    {/* Données de la classe */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-xs space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b pb-1">
                        Statistiques de la Classe
                      </span>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Moyenne de la classe :</span>
                        <strong className="text-slate-800">{stats.classAverage.toFixed(2)} / 20</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Plus forte moyenne :</span>
                        <strong className="text-blue-700">{stats.maxAverage.toFixed(2)} / 20</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Plus faible moyenne :</span>
                        <strong className="text-rose-600">{stats.minAverage.toFixed(2)} / 20</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Taux de réussite :</span>
                        <strong className="text-emerald-700">{stats.passRate}%</strong>
                      </div>
                    </div>

                    {/* Discipline & Décision du Conseil */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-xs space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b pb-1">
                        Discipline & Décision du Conseil
                      </span>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Assiduité & Conduite :</span>
                        <strong className="text-emerald-700">Bonne</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Absences injustifiées :</span>
                        <strong className="text-slate-700">0 heure</strong>
                      </div>
                      <div className="mt-2 pt-1 border-t border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Décision du conseil :</span>
                        <div className="font-bold text-xs text-gray-800 mt-0.5">
                          {generalAverage !== null && generalAverage >= 14 ? "Félicitations du Conseil des Professeurs" :
                           generalAverage !== null && generalAverage >= 12 ? "Tableau d'Honneur avec Encouragements" :
                           generalAverage !== null && generalAverage >= 10 ? "Travail satisfaisant — Peut encore progresser" :
                           "Avertissement travail — Fournir un effort soutenu"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Signatures officielles */}
                  <div className="mt-6 pt-4 border-t border-slate-300">
                    <div className="text-right text-[11px] text-slate-500 mb-6 italic">
                      Fait à {schoolInfo?.locality || "Cotonou"}, le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>

                    <div className="grid grid-cols-3 gap-6 text-center text-xs">
                      <div>
                        <div className="font-bold uppercase text-slate-700">Le Professeur Principal</div>
                        <div className="h-16 flex items-end justify-center text-[10px] text-slate-400 italic">
                          (Signature)
                        </div>
                      </div>

                      <div>
                        <div className="font-bold uppercase text-slate-700">Le Directeur des Études</div>
                        <div className="h-16 flex items-end justify-center text-[10px] text-slate-400 italic">
                          (Signature & Visa)
                        </div>
                      </div>

                      <div>
                        <div className="font-bold uppercase text-slate-700">Le Chef d'Établissement</div>
                        <div className="h-16 flex items-end justify-center text-[10px] text-slate-400 italic">
                          (Cachet et Signature)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
