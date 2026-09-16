import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { User, Calculator, BookOpen, Clock, Banknote, Calendar, Plus , Edit2, Trash2} from "lucide-react";
import { AddTeacherModal } from "../components/AddTeacherModal";
import { LEVELS } from "../types";

export function SchoolAdminTeachers() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState("");
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");
  const [filterSubject, setFilterSubject] = useState("ALL");
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [editingClasses, setEditingClasses] = useState<string[]>([]);
  const [editingCoefs, setEditingCoefs] = useState<Record<string, number>>({});
  
  const handleDeleteTeacher = async (id: string) => {
     if (window.confirm("Voulez-vous vraiment supprimer ce professeur ?")) {
        await supabase.from('profiles').delete().eq('id', id);
        await supabase.from('courses').delete().eq('teacher_id', id);
        fetchData();
     }
  };
  
  const handleEditTeacher = async (e: React.FormEvent) => {
     e.preventDefault();
     if (editingTeacher && editingTeacherId) {
         // Update profile
         await supabase.from('profiles').update({
             full_name: editingTeacher.full_name,
             email: editingTeacher.email,
             phone: editingTeacher.phone
         }).eq('id', editingTeacherId);
         
         // Update courses: simply delete old and insert new
         await supabase.from('courses').delete().eq('teacher_id', editingTeacherId);
         
         if (editingSubject && editingClasses.length > 0) {
            const coursesToInsert = editingClasses.map(cls => ({
                school_id: user?.schoolId,
                name: editingSubject,
                level: cls,
                teacher_id: editingTeacherId,
                coefficient: editingCoefs[cls] || 1
            }));
            await supabase.from('courses').insert(coursesToInsert);
         }
         
         setEditingTeacherId(null);
         fetchData();
     }
  };
  
  const handleToggleEditClass = (cls: string) => {
    setEditingClasses(prev => {
        if (prev.includes(cls)) return prev.filter(c => c !== cls);
        return [...prev, cls];
    });
    setEditingCoefs(prev => {
        if (prev[cls] !== undefined) {
            const next = { ...prev }; delete next[cls]; return next;
        }
        return { ...prev, [cls]: 1 };
    });
  };

  useEffect(() => {
    if (user?.schoolId) {
      fetchData();
    }
  }, [user?.schoolId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teachersRes, coursesRes, yearsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('school_id', user?.schoolId).eq('role', 'TEACHER'),
        supabase.from('courses').select('*').eq('school_id', user?.schoolId),
        supabase.from('academic_years').select('id, name').eq('school_id', user?.schoolId)
      ]);
      
      setTeachers(teachersRes.data || []);
      setCourses(coursesRes.data || []);
      setAcademicYears(yearsRes.data || []);
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

      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex-1 min-w-[200px]">
           <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Année scolaire</label>
           <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 outline-none bg-white">
             <option value="ALL">Toutes les années</option>
             {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
           </select>
        </div>
        <div className="flex-1 min-w-[200px]">
           <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Classe</label>
           <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 outline-none bg-white">
             <option value="ALL">Toutes les classes</option>
             <option value="Maternelle">Maternelle (toutes)</option>
             <option value="Primaire">Primaire (toutes)</option>
             <option value="Collège">Collège (toutes)</option>
             <option value="Lycée">Lycée (toutes)</option>
             {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
           </select>
        </div>
        <div className="flex-1 min-w-[200px]">
           <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Matière</label>
           <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 outline-none bg-white">
             <option value="ALL">Toutes les matières</option>
             {Array.from(new Set(courses.map(c => c.name))).map((s: any) => <option key={s} value={s}>{s}</option>)}
           </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Chargement des données...</div>
      ) : teachers.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
          Aucun professeur enregistré dans l'établissement.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {teachers.filter(t => {
          const tc = courses.filter(c => c.teacher_id === t.id);
          if (filterClass !== "ALL") {
             if (filterClass === "Maternelle" && !tc.some(c => c.level.includes('Maternelle'))) return false;
             else if (filterClass === "Primaire" && !tc.some(c => ['CI','CP','CE1','CE2','CM1','CM2'].includes(c.level))) return false;
             else if (filterClass === "Collège" && !tc.some(c => ['6ème','5ème','4ème','3ème'].includes(c.level))) return false;
             else if (filterClass === "Lycée" && !tc.some(c => c.level.includes('2nde') || c.level.includes('1ère') || c.level.includes('Terminale'))) return false;
             else if (!["Maternelle","Primaire","Collège","Lycée"].includes(filterClass) && !tc.some(c => c.level === filterClass)) return false;
          }
          if (filterSubject !== "ALL") {
             if (!tc.some(c => c.name === filterSubject)) return false;
          }
          if (filterYear !== "ALL") {
             // For now we assume the courses don't have academic_year, but if they do we filter here.
             // Or maybe we just filter by creation date or assume it's always current if not specified.
             // We'll skip strict year filtering if it breaks the data, or we just leave it passing for now if they don't have years.
             if (t.academic_year && t.academic_year !== filterYear) return false; 
          }
          return true;
        }).map(t => {
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
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{t.full_name || "Nom non défini"}</h3>
                    <p className="text-xs text-slate-500">{t.email}</p>
                    {t.phone && <p className="text-xs text-slate-500">{t.phone}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => {
                        const tc = courses.filter(c => c.teacher_id === t.id);
                        setEditingTeacher(t);
                        setEditingSubject(tc.length > 0 ? tc[0].name : "");
                        setEditingClasses(tc.map(c => c.level));
                        const coefs = {};
                        tc.forEach(c => { coefs[c.level] = c.coefficient || 1; });
                        setEditingCoefs(coefs);
                        setEditingTeacherId(t.id);
                    }} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded transition-colors" title="Modifier">
                       <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteTeacher(t.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded transition-colors" title="Supprimer">
                       <Trash2 size={16} />
                    </button>
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
      
      {editingTeacherId && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
               <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-700">Modifier le professeur</h3>
                  <button type="button" onClick={() => setEditingTeacherId(null)} className="text-slate-400 hover:text-slate-600">×</button>
               </div>
               <form onSubmit={handleEditTeacher} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Nom complet</label>
                      <input type="text" value={editingTeacher?.full_name || ""} onChange={e => setEditingTeacher({...editingTeacher, full_name: e.target.value})} required className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                      <input type="email" value={editingTeacher?.email || ""} onChange={e => setEditingTeacher({...editingTeacher, email: e.target.value})} required className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Téléphone</label>
                      <input type="text" value={editingTeacher?.phone || ""} onChange={e => setEditingTeacher({...editingTeacher, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Matière principale</label>
                      <input type="text" value={editingSubject} onChange={e => setEditingSubject(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-emerald-500" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Classes assignées et Coefficients</label>
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded bg-slate-50">
                      {LEVELS.map(l => (
                        <div key={l} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-1 border-b border-slate-200 last:border-0">
                          <label className="flex items-center gap-2 text-sm cursor-pointer flex-1">
                            <input 
                              type="checkbox" 
                              checked={editingClasses.includes(l)} 
                              onChange={() => handleToggleEditClass(l)} 
                              className="rounded text-emerald-600 focus:ring-emerald-500" 
                            />
                            <span className="text-gray-700 font-medium">{l}</span>
                          </label>
                          {editingClasses.includes(l) && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">Coef.</span>
                              <input 
                                type="number" 
                                min="1" 
                                value={editingCoefs[l] || 1} 
                                onChange={e => setEditingCoefs(prev => ({...prev, [l]: Number(e.target.value)}))} 
                                className="w-16 px-2 py-1 text-xs border border-slate-300 rounded outline-none" 
                                required 
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                     <button type="button" onClick={() => setEditingTeacherId(null)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded">Annuler</button>
                     <button type="submit" className="px-4 py-2 text-sm font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700">Enregistrer les modifications</button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
}
