import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Course, Timetable, Student } from "../types";
import { Calendar } from "lucide-react";

interface Props {
  student: Student;
}

export function ParentTimetable({ student }: Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!student.schoolId) return;
      
      const [coursesRes, timetablesRes] = await Promise.all([
        supabase.from('courses').select('*').eq('school_id', student.schoolId),
        supabase.from('timetables').select('*').eq('school_id', student.schoolId)
      ]);
      
      if (coursesRes.data) {
         setCourses(coursesRes.data.map(d => ({
           id: d.id,
           schoolId: d.school_id,
           name: d.name,
           level: d.level,
           teacherId: d.teacher_id,
           createdAt: new Date(d.created_at).getTime()
         })));
      }
      
      if (timetablesRes.data) {
         setTimetables(timetablesRes.data.map(d => ({
           id: d.id,
           schoolId: d.school_id,
           courseId: d.course_id,
           dayOfWeek: d.day_of_week,
           startTime: d.start_time,
           endTime: d.end_time,
           room: d.room,
           createdAt: new Date(d.created_at).getTime()
         })));
      }
    };
    
    fetchData();
  }, [student]);

  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

  const classCourses = courses.filter(c => c.level === student.level);
  const classTimetables = timetables.filter(t => classCourses.some(c => c.id === t.courseId));

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
      <div className="flex items-center gap-2 mb-6">
         <Calendar className="text-emerald-600" size={20} />
         <h3 className="font-bold text-gray-700">Emploi du temps - {student.level}</h3>
      </div>
      
      <div className="grid grid-cols-6 gap-2 min-w-[800px]">
         {days.map((day, dIdx) => (
            <div key={dIdx} className="bg-slate-100 rounded-t p-2 text-center font-bold text-sm text-slate-700">
              {day}
            </div>
         ))}
         {days.map((_, dIdx) => {
            const dayNum = dIdx + 1;
            const tts = classTimetables.filter(t => t.dayOfWeek === dayNum).sort((a,b) => a.startTime.localeCompare(b.startTime));
            return (
               <div key={dIdx} className="space-y-2 p-2 bg-slate-50 min-h-[300px] border-x border-b rounded-b">
                  {tts.map(t => {
                     const crs = classCourses.find(c => c.id === t.courseId);
                     return (
                        <div key={t.id} className="bg-white p-3 rounded shadow-sm border-l-2 border-emerald-500 text-xs">
                           <div className="font-bold text-gray-800 text-sm mb-1">{crs?.name}</div>
                           <div className="text-slate-600 font-semibold mb-1">{t.startTime} - {t.endTime}</div>
                           <div className="text-emerald-700 text-xs">Salle {t.room}</div>
                        </div>
                     );
                  })}
                  {tts.length === 0 && (
                     <div className="text-center text-slate-400 text-xs mt-4">Libre</div>
                  )}
               </div>
            );
         })}
      </div>
    </div>
  );
}
