import React, { useState, useEffect } from "react";
import { db } from "../lib/db";
import { Student, LEVELS } from "../types";
import { useAuth } from "../lib/auth";
import { BookOpen, Users, Save, Download, LayoutGrid, ArrowLeft, Plus, Trash2, CheckSquare } from "lucide-react";
import { supabase } from "../lib/supabase";
import { TeacherAttendance } from "../components/TeacherAttendance";
import { TeacherTimetable } from "../components/TeacherTimetable";
import { SharedCalendar } from "../components/SharedCalendar";

interface Subject {
  id: string;
  name: string;
  coef: number;
}

export function TeacherDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"GRADES" | "ATTENDANCE" | "TIMETABLE" | "CALENDAR">("GRADES");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [myClasses, setMyClasses] = useState<string[]>([]);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  
  
  
  
  
  const [grades, setGrades] = useState<Record<string, Record<string, {int1: string, int2: string, dev1: string, dev2: string, avg: string, app: string}>>>({});
  
  const [includedStudents, setIncludedStudents] = useState<string[]>([]);
  const [period, setPeriod] = useState("1er Trimestre");

  const isMaternelle = selectedClass?.includes("Maternelle");

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.schoolId) return;
      const { data } = await supabase.from('students').select('*').eq('school_id', user.schoolId);
      if (data) {
        setStudents(data.map(d => ({...d, createdAt: d.created_at, firstName: d.first_name, lastName: d.last_name, parentId: d.parent_id, schoolId: d.school_id, studentType: d.studentType, educmasterNumber: d.educmasterNumber, gender: d.gender})) as any);
      }
    };
    fetchData();
  }, []);

  const classStudents = students.filter(s => s.level === selectedClass);

  useEffect(() => {
    // When class changes, select all students by default for the report card
    setIncludedStudents(classStudents.map(s => s.id));
    // Provide default subjects if Maternelle
    
  }, [selectedClass]);

  
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

const handleGradeChange = (studentId: string, subjectId: string, value: string) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subjectId]: value
      }
    }));
  };

  

  const handleSaveGrades = async () => {
    if (!user?.schoolId) return;

    try {
      const gradesToInsert: any[] = [];
      const now = new Date().toISOString();

      Object.entries(grades).forEach(([studentId, subjectsData]) => {
        if (!includedStudents.includes(studentId)) return;
        
        Object.entries(subjectsData).forEach(([courseId, data]) => {
           const insertGrade = (val: string, type: string) => {
               if (val && String(val).trim() !== '') {
                  let score = parseFloat(String(val).replace(',', '.'));
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

      if (gradesToInsert.length > 0) {
        await supabase.from('grades').insert(gradesToInsert);
      }
      
      alert("Notes enregistrées avec succès");
    } catch (err: any) {
      alert("Erreur lors de la sauvegarde: " + err.message);
    }
  };
  
  const toggleStudentIncluded = (studentId: string) => {
    setIncludedStudents(prev => 
       prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };
  
  const getClassesToDisplay = () => {
     const classGroups = LEVELS.map(level => {
         return { level, count: students.filter(s => s.level === level).length };
     }).filter(c => c.count > 0);
     
     // Include unknown levels
     students.forEach(s => {
        if (s.level && !LEVELS.includes(s.level) && !classGroups.some(c => c.level === s.level)) {
            classGroups.push({ level: s.level, count: students.filter(x => x.level === s.level).length });
        }
     });

     return classGroups;
  };

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-700">Espace Professeur</h1>
          <p className="text-xs text-slate-500 mt-1">Gérez vos matières, notes, absences et planning.</p>
        </div>
        
        <div className="flex p-1 bg-slate-100 overflow-x-auto whitespace-nowrap hide-scrollbar rounded-lg shrink-0 overflow-x-auto max-w-full">
          <button 
            onClick={() => setActiveTab("GRADES")} 
            className={`px-4 py-2 rounded text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-colors ${activeTab === "GRADES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Notes & Bulletins
          </button>
          <button 
            onClick={() => setActiveTab("ATTENDANCE")} 
            className={`px-4 py-2 rounded text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-colors ${activeTab === "ATTENDANCE" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Appel
          </button>
          <button 
            onClick={() => setActiveTab("TIMETABLE")} 
            className={`px-4 py-2 rounded text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-colors ${activeTab === "TIMETABLE" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Mon Planning
          </button>
          <button 
            onClick={() => setActiveTab("CALENDAR")}
            className={`px-4 py-2 rounded text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-colors ${activeTab === "CALENDAR" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Calendrier
          </button>
        </div>
      </div>

      {activeTab === "GRADES" && (
        <>
          {!selectedClass ? (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {getClassesToDisplay().map((c) => (
              <div 
                 key={c.level} 
                 onClick={() => setSelectedClass(c.level)} 
                 className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center gap-3 hover:border-emerald-500 group"
              >
                 <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <LayoutGrid size={24} />
                 </div>
                 <span className="font-bold text-gray-700 text-lg text-center">{c.level}</span>
                 <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{c.count} élève{c.count > 1 ? 's' : ''} inscrits</span>
              </div>
            ))}
            {getClassesToDisplay().length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                 Aucune classe avec des élèves enregistrés pour le moment.
              </div>
            )}
         </div>
      ) : (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
         <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
           <button onClick={() => setSelectedClass(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-gray-700 transition-colors" title="Retour aux classes">
             <ArrowLeft size={18} />
           </button>
           <h3 className="font-bold text-gray-700 flex items-center gap-2 text-lg">
             <Users size={18} className="text-emerald-600" />
             Classe : {selectedClass}
           </h3>
         </div>

         <div className="flex flex-col lg:flex-row gap-8 mb-6">
            {/* Configuration des matières */}
            

            {/* Période / Actions */}
            <div className="w-full lg:w-72 bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
               <div>
                 <h4 className="font-bold text-gray-700 mb-2">Période</h4>
                 <input 
                    type="text" 
                    value={period} 
                    onChange={e => setPeriod(e.target.value)} 
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none mb-4" 
                    placeholder="Ex: 1er Trimestre" 
                 />
               </div>
               <div className="space-y-2">
                 <button onClick={handleSaveGrades} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded text-sm font-bold uppercase tracking-wider hover:bg-emerald-700 transition shadow-sm">
                   <Save size={16} /> Saisir les notes
                 </button>
                 <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-white rounded text-sm font-bold uppercase tracking-wider hover:bg-slate-700 transition shadow-sm">
                   <Download size={16} /> Générer Relevés
                 </button>
               </div>
            </div>
         </div>

         {/* Table des élèves et notes */}
         <div className="overflow-x-auto print:overflow-visible">
            <h4 className="font-bold text-gray-700 mb-3 ml-1">Constitution des relevés {classStudents.length > 0 && `(${includedStudents.length}/${classStudents.length} sélectionnés)`}</h4>
            <table className="w-full text-left border-collapse border border-slate-200">
               <thead className="bg-slate-800 text-[10px] uppercase text-white font-bold tracking-wider">
                 <tr>
                   <th className="px-3 py-2 border border-slate-700 text-center w-8" title="Sélectionner pour le relevé">
                      <CheckSquare size={14} className="mx-auto" />
                   </th>
                   <th className="px-3 py-2 border border-slate-700 w-48">Nom et prénoms</th>
                   {myCourses.filter(c => c.level === selectedClass).map(course => (
                     <React.Fragment key={course.id}>
                       <th className="px-2 py-2 border border-slate-700 text-center bg-slate-700/50 text-[10px]">Int 1<br/>(/20)</th>
                       <th className="px-2 py-2 border border-slate-700 text-center bg-slate-700/50 text-[10px]">Int 2<br/>(/20)</th>
                       <th className="px-2 py-2 border border-slate-700 text-center bg-slate-700/50 text-[10px]">Dev 1<br/>(/20)</th>
                       <th className="px-2 py-2 border border-slate-700 text-center bg-slate-700/50 text-[10px]">Dev 2<br/>(/20)</th>
                       <th className="px-2 py-2 border border-slate-700 text-center text-emerald-400 text-[10px]">
                          Moy.<br/>{course.name}
                       </th>
                     </React.Fragment>
                   ))}
                   <th className="px-3 py-2 border border-slate-700 min-w-[150px]">Appréciation globale</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-200 text-sm">
                 {classStudents.length === 0 ? (
                   <tr><td colSpan={10} className="p-8 text-center text-slate-500">Aucun élève dans cette classe.</td></tr>
                 ) : (
                   classStudents.map((student) => {
                     const isIncluded = includedStudents.includes(student.id);
                     const sGrades = grades[student.id] || {};
                     return (
                       <tr key={student.id} className={`transition-colors ${isIncluded ? 'hover:bg-slate-50' : 'bg-slate-50/50 opacity-60'}`}>
                         <td className="px-3 py-2 border border-slate-200 text-center">
                            <input 
                              type="checkbox" 
                              checked={isIncluded}
                              onChange={() => toggleStudentIncluded(student.id)}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                         </td>
                         <td className="px-3 py-2 font-semibold text-gray-700 border border-slate-200 uppercase text-xs">
                           {student.lastName} {student.firstName}
                         </td>
                         
                         {subjects.map(s => (
                           <td key={s.id} className="p-1 border border-slate-200 text-center">
                             <input 
                               type="text" 
                               disabled={!isIncluded}
                               placeholder={isMaternelle ? "A/ECA/NA" : "/20"}
                               className="w-full min-w-[60px] text-center text-xs p-1.5 outline-none focus:ring-1 ring-emerald-500 rounded bg-transparent disabled:cursor-not-allowed" 
                               value={sGrades[s.id] || ''} 
                               onChange={e => handleGradeChange(student.id, s.id, e.target.value)} 
                             />
                           </td>
                         ))}
                         
                         <td className="p-1 border border-slate-200">
                            <input 
                              type="text" 
                              disabled={!isIncluded}
                              placeholder="Observation / Appréciation" 
                              className="w-full text-xs p-1.5 outline-none focus:ring-1 ring-emerald-500 rounded bg-transparent disabled:cursor-not-allowed" 
                              value={Object.values(sGrades)[0]?.app || ''} 
                              onChange={e => {
const courseId = myCourses.find(c => c.level === selectedClass)?.id;
if (courseId) handleManualAppreciation(student.id, courseId, e.target.value);
}} 
                            />
                         </td>
                       </tr>
                     );
                   })
                 )}
               </tbody>
            </table>
            <div className="mt-4 p-4 bg-blue-50 text-blue-800 text-xs rounded-lg flex gap-2">
               L'impression des relevés se basera sur les élèves cochés et les colonnes de matières configurées. Le système s'occupera du calcul des moyennes automatiquement.
            </div>
         </div>
      </div>
      )}
      </>
      )}

      {activeTab === "ATTENDANCE" && <TeacherAttendance />}
      {activeTab === "TIMETABLE" && <TeacherTimetable />}
      {activeTab === "CALENDAR" && <SharedCalendar userRole={user?.role || "TEACHER"} />}

    </div>
  );
}
