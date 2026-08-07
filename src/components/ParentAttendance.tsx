import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { AttendanceRecord, Student } from "../types";
import { Clock, CheckSquare, AlertTriangle } from "lucide-react";

interface Props {
  student: Student;
}

export function ParentAttendance({ student }: Props) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!student?.id) return;
      const { data, error } = await supabase.from('attendance').select('*').eq('student_id', student.id).order('date', { ascending: false });
      
      if (data && !error) {
         setRecords(data.map(d => ({
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
    
    fetchData();
  }, [student]);

  const absences = records.filter(r => r.type === "ABSENCE").length;
  const retards = records.filter(r => r.type === "DELAY").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-xl">
             {absences}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Absences Totales</p>
            <p className="text-sm font-semibold text-gray-700">Depuis le début de l'année</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold text-xl">
             {retards}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Retards Cumulés</p>
            <p className="text-sm font-semibold text-gray-700">Depuis le début de l'année</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
           <h3 className="font-bold text-gray-700">Historique détaillé</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Date & Heure</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Motif & Justification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map(record => (
              <tr key={record.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-medium text-slate-600">
                  {new Date(record.date).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit ${record.type === 'ABSENCE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    <Clock size={12} />
                    {record.type === 'ABSENCE' ? 'Absence' : 'Retard'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-700">{record.reason || "Non renseigné"}</div>
                  <div className={`text-xs mt-1 font-semibold flex items-center gap-1 ${record.isJustified ? 'text-emerald-600' : 'text-red-600'}`}>
                    {record.isJustified ? <CheckSquare size={12} /> : <AlertTriangle size={12} />}
                    {record.isJustified ? 'Justifié' : 'Non Justifié'}
                  </div>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-500 text-sm">
                  Aucune absence ni retard enregistré.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
