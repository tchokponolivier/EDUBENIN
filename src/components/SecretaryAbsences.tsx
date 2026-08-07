import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { AttendanceRecord, Student } from "../types";
import { useAuth } from "../lib/auth";
import { Clock, CheckSquare, Plus, BellRing } from "lucide-react";

export function SecretaryAbsences() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  const [studentId, setStudentId] = useState("");
  const [type, setType] = useState<"ABSENCE" | "DELAY">("ABSENCE");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [isJustified, setIsJustified] = useState(false);

  const fetchData = async () => {
    if (!user?.schoolId) return;
    
    const [studentsRes, attendanceRes] = await Promise.all([
      supabase.from('students').select('*').eq('school_id', user.schoolId),
      supabase.from('attendance').select('*').eq('school_id', user.schoolId).order('date', { ascending: false })
    ]);
    
    if (studentsRes.data) {
       setStudents(studentsRes.data.map(d => ({
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
    
    if (attendanceRes.data) {
       setRecords(attendanceRes.data.map(d => ({
         id: d.id,
         schoolId: d.school_id,
         studentId: d.student_id,
         type: d.type,
         date: new Date(d.date).getTime(),
         reason: d.reason,
         isJustified: d.is_justified,
         reportedBy: d.reported_by,
         createdAt: new Date(d.created_at).getTime()
       })));
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId || !studentId) return;
    
    const { error } = await supabase.from('attendance').insert({
       school_id: user.schoolId,
       student_id: studentId,
       type,
       date: new Date(date).toISOString(),
       reason,
       is_justified: isJustified,
       reported_by: user.name || "Secrétariat"
    });
    
    if (!error) {
       setShowForm(false);
       setStudentId("");
       setDate("");
       setReason("");
       setIsJustified(false);
       fetchData();
       alert("Enregistré. Une notification serait envoyée aux parents.");
    } else {
       alert("Erreur lors de l'enregistrement");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-700">Gestion des Absences & Retards</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Signaler Absence/Retard
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Élève</label>
            <select required value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full px-3 py-2 border rounded">
              <option value="">Sélectionner...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.lastName} {s.firstName} ({s.level})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
            <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-3 py-2 border rounded">
              <option value="ABSENCE">Absence</option>
              <option value="DELAY">Retard</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Date & Heure</label>
            <input required value={date} onChange={e => setDate(e.target.value)} type="datetime-local" className="w-full px-3 py-2 border rounded" />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Motif (Appel / Courrier)</label>
            <input value={reason} onChange={e => setReason(e.target.value)} type="text" className="w-full px-3 py-2 border rounded" placeholder="Raison invoquée..." />
          </div>
          <div className="flex items-center gap-2 h-10">
            <input type="checkbox" id="justified" checked={isJustified} onChange={e => setIsJustified(e.target.checked)} className="w-4 h-4 text-emerald-600" />
            <label htmlFor="justified" className="text-sm font-semibold text-gray-700 cursor-pointer">Absence/Retard Justifié(e)</label>
          </div>
          <div className="lg:col-span-3 pt-2">
            <button type="submit" className="w-full px-6 py-2 bg-slate-900 text-white rounded font-bold flex items-center justify-center gap-2">
              <BellRing size={16} /> Enregistrer & Notifier les parents
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Élève</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Motif & Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map(record => {
              const student = students.find(s => s.id === record.studentId);
              return (
                <tr key={record.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                    {new Date(record.date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-800">
                    {student ? `${student.lastName} ${student.firstName}` : "Inconnu"}
                    <span className="block text-xs font-normal text-slate-500">{student?.level}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit ${record.type === 'ABSENCE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {record.type === 'ABSENCE' ? <Clock size={12} /> : <Clock size={12} />}
                      {record.type === 'ABSENCE' ? 'Absence' : 'Retard'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">{record.reason || "Non renseigné"}</div>
                    <div className={`text-xs mt-1 font-semibold flex items-center gap-1 ${record.isJustified ? 'text-emerald-600' : 'text-red-600'}`}>
                      <CheckSquare size={12} /> {record.isJustified ? 'Justifié' : 'Non Justifié'}
                    </div>
                  </td>
                </tr>
              );
            })}
            {records.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                  Aucun historique.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
