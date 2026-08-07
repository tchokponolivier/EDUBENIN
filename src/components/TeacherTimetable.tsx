import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Timetable, Course } from "../types";
import { useAuth } from "../lib/auth";

export function TeacherTimetable() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.schoolId) return;
      
      const [coursesRes, timetablesRes] = await Promise.all([
        supabase.from('courses').select('*').eq('school_id', user.schoolId),
        supabase.from('timetables').select('*').eq('school_id', user.schoolId)
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
  }, [user]);

  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
      <h3 className="font-bold text-gray-700 mb-6">Mon Emploi du Temps</h3>
      
      <div className="grid grid-cols-6 gap-2 min-w-[800px]">
         {days.map((day, dIdx) => (
            <div key={dIdx} className="bg-slate-100 rounded-t p-2 text-center font-bold text-sm text-slate-700">
              {day}
            </div>
         ))}
         {days.map((_, dIdx) => {
            const dayNum = dIdx + 1;
            const tts = timetables.filter(t => t.dayOfWeek === dayNum).sort((a,b) => a.startTime.localeCompare(b.startTime));
            return (
               <div key={dIdx} className="space-y-2 p-2 bg-slate-50 min-h-[400px] border-x border-b rounded-b">
                  {tts.map(t => {
                     const crs = courses.find(c => c.id === t.courseId);
                     return (
                        <div key={t.id} className="bg-white p-3 rounded shadow border-l-4 border-emerald-500 text-xs hover:-translate-y-1 transition-transform">
                           <div className="font-bold text-gray-800 text-sm mb-1">{crs?.name}</div>
                           <div className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded w-fit mb-2">{crs?.level}</div>
                           <div className="text-slate-600 flex justify-between">
                             <span>{t.startTime} - {t.endTime}</span>
                             <span className="font-semibold text-slate-800">Salle {t.room}</span>
                           </div>
                        </div>
                     );
                  })}
               </div>
            );
         })}
      </div>
    </div>
  );
}
