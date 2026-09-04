import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { User, Calculator, BookOpen, Clock, Banknote, Calendar, Plus } from "lucide-react";
import { AddTeacherModal } from "../components/AddTeacherModal";

export function SchoolAdminTeachers() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (user?.schoolId) {
      fetchData();
    }
  }, [user?.schoolId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teachersRes, coursesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('school_id', user?.schoolId).eq('role', 'TEACHER'),
        supabase.from('courses').select('*').eq('school_id', user?.schoolId)
      ]);
      
      setTeachers(teachersRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTeacherStats = (teacherId: string) => {
    const teacherCourses = courses.filter(c => c.teacher_id === teacherId);
    // Simulation du calcul d'heures (dans un vrai système, on utiliserait timetables ou pointages)
    const hoursPerWeek = teacherCourses.length * 4; // Arbitraire: 4h/semaine par matière
    const hourlyRate = 3500; // Tarif horaire moyen
    const monthlySalary = hoursPerWeek * 4 * hourlyRate; // 4 semaines par mois
    
    return {
      courses: teacherCourses,
      hoursPerWeek,
      monthlySalary
    };
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <User className="text-emerald-600" />
            Gestion des Professeurs
          </h1>
          <p className="text-slate-500 mt-1">Suivez les heures de cours, les classes assignées et calculez les salaires.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded font-bold uppercase tracking-wider text-xs hover:bg-emerald-700 transition shadow-sm">
          <Plus size={16} /> Inscrire un professeur
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Chargement des données...</div>
      ) : teachers.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
          Aucun professeur enregistré dans l'établissement.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {teachers.map(t => {
            const stats = getTeacherStats(t.id);
            return (
              <div key={t.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-lg font-bold border-2 border-emerald-200 shrink-0">
                    {t.avatar_url ? (
                      <img src={t.avatar_url} alt={t.full_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      t.full_name ? t.full_name.charAt(0).toUpperCase() : 'P'
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{t.full_name || "Nom non défini"}</h3>
                    <p className="text-xs text-slate-500">{t.email}</p>
                    {t.phone && <p className="text-xs text-slate-500">{t.phone}</p>}
                  </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col gap-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
                      <BookOpen size={14} /> Classes & Matières
                    </h4>
                    {stats.courses.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Aucune matière assignée</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {stats.courses.map(c => (
                          <div key={c.id} className="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-xs">
                            <span className="font-bold text-gray-700">{c.name}</span>
                            <span className="text-slate-400 ml-1">({c.level})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-slate-100">
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 mb-1">
                        <Clock size={12} /> Heures / Semaine
                      </div>
                      <div className="font-bold text-gray-800 text-lg">{stats.hoursPerWeek}h</div>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
                      <div className="text-[10px] uppercase font-bold text-emerald-600 flex items-center gap-1 mb-1">
                        <Calculator size={12} /> Salaire Est.
                      </div>
                      <div className="font-bold text-emerald-700 text-lg">{stats.monthlySalary.toLocaleString()} F</div>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                  <button onClick={() => window.location.href = '/school-admin/students?tab=TIMETABLES'} className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded shadow-sm hover:bg-slate-100 transition-colors flex items-center justify-center gap-1">
                    <Calendar size={14} /> Emploi du temps
                  </button>
                  <button onClick={() => window.location.href = '/school-admin/payments?tab=SALARIES'} className="flex-1 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded shadow-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1">
                    <Banknote size={14} /> Payer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <AddTeacherModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={fetchData} />
    </div>
  );
}
