import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Course, Timetable, LEVELS } from "../types";
import { useAuth } from "../lib/auth";
import { Calendar, Plus, Trash2 } from "lucide-react";

export function SecretaryTimetables() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [courseLevel, setCourseLevel] = useState(LEVELS[0]);

  const [showTimetableForm, setShowTimetableForm] = useState(false);
  const [ttCourseId, setTtCourseId] = useState("");
  const [ttDay, setTtDay] = useState(1);
  const [ttStart, setTtStart] = useState("08:00");
  const [ttEnd, setTtEnd] = useState("10:00");
  const [ttRoom, setTtRoom] = useState("");

  const [selectedLevelFilter, setSelectedLevelFilter] = useState(LEVELS[0]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courseTeacherId, setCourseTeacherId] = useState("");

  const fetchData = async () => {
    if (!user?.schoolId) return;
    
    const [coursesRes, timetablesRes, teachersRes] = await Promise.all([
      supabase.from('courses').select('*').eq('school_id', user.schoolId),
      supabase.from('timetables').select('*').eq('school_id', user.schoolId),
      supabase.from('profiles').select('*').eq('school_id', user.schoolId).eq('role', 'TEACHER')
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
    
    if (teachersRes.data) {
       setTeachers(teachersRes.data);
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

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;
    
    const { error } = await supabase.from('courses').insert({
       school_id: user.schoolId,
       name: courseName,
       level: courseLevel,
       teacher_id: user.id // or proper teacher selection
    });
    
    if (!error) {
       setShowCourseForm(false);
       setCourseName("");
       fetchData();
    } else {
       alert("Erreur lors de la création");
    }
  };

  const handleCreateTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId || !ttCourseId) return;
    
    // Conflit detection (basic logic: same day, overlap time, same room)
    const hasConflict = timetables.some(t => {
       if (t.dayOfWeek !== ttDay || t.room !== ttRoom) return false;
       return (ttStart >= t.startTime && ttStart < t.endTime) || (ttEnd > t.startTime && ttEnd <= t.endTime);
    });

    if (hasConflict) {
       alert("Attention: Conflit détecté ! Cette salle est déjà occupée sur ce créneau.");
       return;
    }

    const { error } = await supabase.from('timetables').insert({
       school_id: user.schoolId,
       course_id: ttCourseId,
       day_of_week: ttDay,
       start_time: ttStart,
       end_time: ttEnd,
       room: ttRoom
    });
    
    if (!error) {
       setShowTimetableForm(false);
       fetchData();
    } else {
       alert("Erreur lors de la création");
    }
  };

  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

  const filteredTimetables = timetables.filter(t => {
     const c = courses.find(crs => crs.id === t.courseId);
     return c?.level === selectedLevelFilter;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-700">Matières / Cours</h3>
             <button onClick={() => setShowCourseForm(!showCourseForm)} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded"><Plus size={16}/></button>
          </div>
          {showCourseForm && (
            <form onSubmit={handleCreateCourse} className="mb-4 space-y-2 p-3 bg-slate-50 border rounded text-sm">
              <input required value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="Nom de la matière" className="w-full px-2 py-1 border rounded" />
              <select value={courseLevel} onChange={e => setCourseLevel(e.target.value)} className="w-full px-2 py-1 border rounded">
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <button className="w-full bg-emerald-600 text-white py-1 rounded">Ajouter</button>
            </form>
          )}
          <div className="space-y-2 max-h-40 overflow-y-auto">
             {courses.map(c => (
                <div key={c.id} className="text-sm p-2 border rounded flex justify-between">
                   <span className="font-semibold text-gray-700">{c.name}</span>
                   <span className="text-slate-500">{c.level}</span>
                </div>
             ))}
             {courses.length === 0 && <p className="text-xs text-slate-400 text-center">Aucun cours</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-700">Créneaux Horaires</h3>
             <button onClick={() => setShowTimetableForm(!showTimetableForm)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Plus size={16}/></button>
          </div>
          {showTimetableForm && (
            <form onSubmit={handleCreateTimetable} className="mb-4 space-y-2 p-3 bg-slate-50 border rounded text-sm">
              <select required value={ttCourseId} onChange={e => setTtCourseId(e.target.value)} className="w-full px-2 py-1 border rounded">
                <option value="">Sélectionner un cours</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.level})</option>)}
              </select>
              <div className="flex gap-2">
                 <select value={ttDay} onChange={e => setTtDay(Number(e.target.value))} className="flex-1 px-2 py-1 border rounded">
                   {days.map((d, i) => <option key={i} value={i+1}>{d}</option>)}
                 </select>
                 <input required value={ttRoom} onChange={e => setTtRoom(e.target.value)} placeholder="Salle (ex: S1)" className="w-1/3 px-2 py-1 border rounded" />
              </div>
              <div className="flex gap-2">
                 <input required type="time" value={ttStart} onChange={e => setTtStart(e.target.value)} className="flex-1 px-2 py-1 border rounded" />
                 <span className="self-center">à</span>
                 <input required type="time" value={ttEnd} onChange={e => setTtEnd(e.target.value)} className="flex-1 px-2 py-1 border rounded" />
              </div>
              <button className="w-full bg-blue-600 text-white py-1 rounded">Placer</button>
            </form>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex justify-between items-center mb-6">
           <h3 className="font-bold text-gray-700">Emploi du temps</h3>
           <select value={selectedLevelFilter} onChange={e => setSelectedLevelFilter(e.target.value)} className="px-3 py-1 border rounded text-sm font-bold bg-slate-50">
             {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
           </select>
        </div>
        
        <div className="grid grid-cols-6 gap-2 min-w-[800px]">
           {days.map((day, dIdx) => (
              <div key={dIdx} className="bg-slate-100 rounded-t p-2 text-center font-bold text-sm text-slate-700">
                {day}
              </div>
           ))}
           {days.map((_, dIdx) => {
              const dayNum = dIdx + 1;
              const tts = filteredTimetables.filter(t => t.dayOfWeek === dayNum).sort((a,b) => a.startTime.localeCompare(b.startTime));
              return (
                 <div key={dIdx} className="space-y-2 p-2 bg-slate-50 min-h-[300px] border-x border-b rounded-b">
                    {tts.map(t => {
                       const crs = courses.find(c => c.id === t.courseId);
                       return (
                          <div key={t.id} className="bg-white p-2 rounded shadow-sm border-l-2 border-emerald-500 text-xs">
                             <div className="font-bold text-gray-800">{crs?.name}</div>
                             <div className="text-slate-500 mt-1">{t.startTime} - {t.endTime}</div>
                             <div className="text-emerald-700 font-semibold mt-1 text-[10px]">Salle: {t.room}</div>
                          </div>
                       );
                    })}
                 </div>
              );
           })}
        </div>
      </div>
    </div>
  );
}
