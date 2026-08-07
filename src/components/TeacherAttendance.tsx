import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Student, LEVELS } from "../types";
import { useAuth } from "../lib/auth";
import { Check, X, Clock, Save } from "lucide-react";

export function TeacherAttendance() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>(LEVELS[0]);
  const [attendance, setAttendance] = useState<Record<string, "PRESENT" | "ABSENT" | "DELAY">>(({}));

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user?.schoolId) return;
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
    const now = new Date().toISOString();
    
    const entriesToInsert: any[] = [];
    
    Object.entries(attendance).forEach(([studentId, status]) => {
      if (status === "ABSENT" || status === "DELAY") {
        entriesToInsert.push({
          school_id: user.schoolId!,
          student_id: studentId,
          type: status,
          date: now,
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
    
    alert(`Appel terminé ! ${count} absence(s)/retard(s) enregistré(s) et transmis au secrétariat.`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
           <h3 className="font-bold text-gray-700">Faire l'appel</h3>
           <p className="text-xs text-slate-500">Sélectionnez la classe et pointez les présences</p>
        </div>
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="px-4 py-2 border rounded font-bold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500">
          {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
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
            <button onClick={submitAttendance} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white font-bold rounded uppercase tracking-wider text-sm hover:bg-emerald-700 transition">
              <Save size={16} /> Enregistrer l'appel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
