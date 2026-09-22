import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Student, LEVELS } from "../types";
import { useAuth } from "../lib/auth";
import { Check, X, Clock, Save, Printer, Download } from "lucide-react";

export function TeacherAttendance() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [myClasses, setMyClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [attendance, setAttendance] = useState<Record<string, "PRESENT" | "ABSENT" | "DELAY">>(({}));
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [history, setHistory] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [viewHistory, setViewHistory] = useState<any>(null);

  useEffect(() => {
    const fetchHistory = async () => {
       if (!user?.id) return;
       const { data } = await supabase.from('attendance').select('date, type, student_id, students(level, first_name, last_name)').eq('reported_by', user.name || "Professeur").order('date', { ascending: false }).limit(200);
       if (data) {
          // Group by date and class
          const historyMap = new Map();
          data.forEach(item => {
             const d = item.date.split('T')[0];
             const c = Array.isArray(item.students) ? (item.students as any)[0]?.level : (item.students as any)?.level || 'Inconnue';
             const key = d + '_' + c;
             if (!historyMap.has(key)) historyMap.set(key, { date: d, class: c, absentCount: 0, details: [] });
             historyMap.get(key).absentCount += 1;
             historyMap.get(key).details.push({
                type: item.type,
                firstName: Array.isArray(item.students) ? (item.students as any)[0]?.first_name : (item.students as any)?.first_name,
                lastName: Array.isArray(item.students) ? (item.students as any)[0]?.last_name : (item.students as any)?.last_name
             });
          });
          setHistory(Array.from(historyMap.values()));
       }
    };
    fetchHistory();
    const fetchStudents = async () => {
      if (!user?.schoolId) return;
      
      const { data: teacherCourses } = await supabase.from('courses').select('level').eq('teacher_id', user.id);
      if (teacherCourses) {
         const levels = [...new Set(teacherCourses.map((c: any) => c.level))];
         setMyClasses(levels as string[]);
         if (levels.length > 0) setSelectedClass(levels[0] as string);
      }
      
      const { data, error } = await supabase.from('students').select('*').eq('school_id', user.schoolId);
      if (data && !error) {
         setStudents(data.map(d => ({
           id: d.id,
           schoolId: d.school_id,
           firstName: d.first_name,
           lastName: d.last_name,
           level: d.level,
           dateOfBirth: d.date_of_birth,
           gender: d.gender,
           address: d.address,
           parentName: d.parent_name,
           parentPhone: d.parent_phone,
           parentEmail: d.parent_email,
           status: d.status,
           createdAt: new Date(d.created_at).getTime()
         })));
      }
    };
    fetchStudents();
  }, [user]);

  const classStudents = students.filter(s => s.level === selectedClass);

  useEffect(() => {
    // Reset attendance state when class changes
    const initial: Record<string, "PRESENT" | "ABSENT" | "DELAY"> = {};
    classStudents.forEach(s => {
      initial[s.id] = "PRESENT";
    });
    setAttendance(initial);
  }, [selectedClass, students]);

  const handleStatusChange = (studentId: string, status: "PRESENT" | "ABSENT" | "DELAY") => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const submitAttendance = async () => {
    if (!user?.schoolId) return;
    
    let count = 0;
    const entriesToInsert: any[] = [];
    
    Object.entries(attendance).forEach(([studentId, status]) => {
      if (status === "ABSENT" || status === "DELAY") {
        entriesToInsert.push({
          school_id: user.schoolId!,
          student_id: studentId,
          type: status,
          date: new Date(date).toISOString(),
          reason: "Signalé par le professeur",
          is_justified: false,
          reported_by: user.name || "Professeur"
        });
        count++;
      }
    });
    
    if (entriesToInsert.length > 0) {
       const { error } = await supabase.from('attendance').insert(entriesToInsert);
       if (error) {
          alert("Erreur lors de l'enregistrement de l'appel");
          return;
       }
    }
    
    setShowPreview(false);
    alert(`Appel terminé pour le ${new Date(date).toLocaleDateString()} ! ${count} absence(s)/retard(s) enregistré(s).`);
    // Refresh history (trigger fetchHistory theoretically, but we can just add a basic entry)
    setHistory([{ date: new Date(date).toISOString(), class: selectedClass, absentCount: count }, ...history]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
           <h3 className="font-bold text-gray-700">Faire l'appel</h3>
           <p className="text-xs text-slate-500">Sélectionnez la classe et la date</p>
        </div>
        <div className="flex items-center gap-3">
           <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-2 border rounded font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
           <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="px-4 py-2 border rounded font-bold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50">
             {myClasses.length > 0 ? myClasses.map(l => <option key={l} value={l}>{l}</option>) : LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
           </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Élève</th>
              <th className="px-6 py-4 text-center">Présent</th>
              <th className="px-6 py-4 text-center">Absent</th>
              <th className="px-6 py-4 text-center">Retard</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classStudents.map(student => (
              <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-700 text-sm">
                  {student.lastName} {student.firstName}
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => handleStatusChange(student.id, "PRESENT")}
                    className={`p-2 rounded-full transition-colors ${attendance[student.id] === "PRESENT" ? 'bg-emerald-100 text-emerald-600' : 'text-slate-300 hover:bg-slate-100'}`}
                  >
                    <Check size={20} />
                  </button>
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => handleStatusChange(student.id, "ABSENT")}
                    className={`p-2 rounded-full transition-colors ${attendance[student.id] === "ABSENT" ? 'bg-red-100 text-red-600' : 'text-slate-300 hover:bg-slate-100'}`}
                  >
                    <X size={20} />
                  </button>
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => handleStatusChange(student.id, "DELAY")}
                    className={`p-2 rounded-full transition-colors ${attendance[student.id] === "DELAY" ? 'bg-amber-100 text-amber-600' : 'text-slate-300 hover:bg-slate-100'}`}
                  >
                    <Clock size={20} />
                  </button>
                </td>
              </tr>
            ))}
            {classStudents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">Aucun élève dans cette classe.</td>
              </tr>
            )}
          </tbody>
        </table>
        
        {classStudents.length > 0 && (
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button onClick={() => setShowPreview(true)} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white font-bold rounded uppercase tracking-wider text-sm hover:bg-emerald-700 transition shadow-sm">
              <Save size={16} /> Prévisualiser et Enregistrer
            </button>
          </div>
        )}
      
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-gray-700">Récapitulatif de l'appel</h3>
               <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-4 overflow-y-auto">
               <p className="text-sm font-semibold text-slate-600 mb-2">Classe : {selectedClass} - Date : {new Date(date).toLocaleDateString()}</p>
               <div className="space-y-1 mt-4">
                  {classStudents.map(student => {
                     const status = attendance[student.id] || "PRESENT";
                     if (status === "PRESENT") return null;
                     return (
                        <div key={student.id} className="flex justify-between items-center p-2 rounded border border-slate-100 text-sm">
                           <span className="font-medium text-gray-700">{student.lastName} {student.firstName}</span>
                           <span className={`px-2 py-1 rounded text-xs font-bold ${status === 'ABSENT' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                              {status === 'ABSENT' ? 'ABSENT' : 'RETARD'}
                           </span>
                        </div>
                     );
                  })}
                  {classStudents.filter(s => attendance[s.id] && attendance[s.id] !== "PRESENT").length === 0 && (
                     <div className="p-4 bg-emerald-50 text-emerald-600 text-center rounded border border-emerald-100 text-sm font-semibold">
                       Tous les élèves sont présents.
                     </div>
                  )}
               </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
               <button onClick={() => setShowPreview(false)} className="px-4 py-2 font-bold text-sm text-slate-600 hover:bg-slate-200 rounded">Annuler</button>
               <button onClick={submitAttendance} className="px-4 py-2 font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-sm">Confirmer et Sauvegarder</button>
            </div>
          </div>
        </div>
      )}

      </div>
      {history.length > 0 && (
         <div className="mt-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-gray-700">Historique des appels récents</h4>
              <button 
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                title="Imprimer / Exporter l'historique"
              >
                <Printer size={14} /> Exporter / Imprimer PDF
              </button>
            </div>
            <div className="space-y-2">
               {history.map((h, i) => (
                  <div key={i} onClick={() => setViewHistory(h)} className="flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded text-sm cursor-pointer transition">
                     <div>
                        <span className="font-bold text-gray-700">{h.class}</span>
                        <span className="text-slate-500 ml-2">- {new Date(h.date).toLocaleDateString()}</span>
                     </div>
                     <div className="flex items-center gap-3">
                       <span className={`font-bold ${h.absentCount > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
                          {h.absentCount} signalement(s)
                       </span>
                       <span className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-0.5 rounded font-medium">
                         Voir la feuille
                       </span>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}
      {viewHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col print:max-h-none print:shadow-none print:border-none">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <div>
                 <h3 className="font-bold text-gray-700">Feuille d'Appel Officielle</h3>
                 <p className="text-xs text-slate-500">Classe : {viewHistory.class} • Date : {new Date(viewHistory.date).toLocaleDateString()}</p>
               </div>
               <div className="flex items-center gap-2 print:hidden">
                 <button 
                   onClick={() => window.print()}
                   className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition shadow-sm"
                   title="Imprimer / Télécharger en PDF"
                 >
                   <Printer size={14} /> PDF
                 </button>
                 <button onClick={() => setViewHistory(null)} className="text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
               </div>
            </div>
            <div className="p-4 overflow-y-auto">
               <div className="space-y-2">
                  {students.filter(s => s.level === viewHistory.class).map((s) => {
                     const detail = viewHistory.details?.find((d: any) => d.lastName === s.lastName && d.firstName === s.firstName);
                     const isAbsent = detail?.type === 'ABSENT';
                     const isDelay = detail?.type === 'DELAY' || detail?.type === 'RETARD';
                     const isPresent = !isAbsent && !isDelay;
                     return (
                        <div key={s.id} className="flex justify-between items-center p-2 rounded border border-slate-100 text-sm">
                           <span className="font-medium text-gray-700">{s.lastName} {s.firstName}</span>
                           {isPresent ? (
                              <span className="px-2 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-600">PRÉSENT</span>
                           ) : isAbsent ? (
                              <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-600">ABSENT</span>
                           ) : (
                              <span className="px-2 py-1 rounded text-xs font-bold bg-amber-100 text-amber-600">RETARD</span>
                           )}
                        </div>
                     );
                  })}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
