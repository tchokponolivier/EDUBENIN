import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { User, Calculator, BookOpen, Clock, Banknote, Calendar, Plus, Edit2, Trash2, Mail, Layers, CheckCircle } from "lucide-react";
import { AddTeacherModal } from "../components/AddTeacherModal";
import { LEVELS, SUBJECTS } from "../types";

export function SchoolAdminTeachers() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"TEACHERS" | "SUBJECTS">("TEACHERS");
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
  const [currentConfiguredYear, setCurrentConfiguredYear] = useState<string>("");
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [editingClasses, setEditingClasses] = useState<string[]>([]);
  const [editingCoefs, setEditingCoefs] = useState<Record<string, number>>({});
  
  // Matières tab state
  const [subjectFilterClass, setSubjectFilterClass] = useState<string>("ALL");
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourseName, setNewCourseName] = useState(SUBJECTS[0]);
  const [newCourseLevel, setNewCourseLevel] = useState(LEVELS[0]);
  const [newCourseTeacherId, setNewCourseTeacherId] = useState("");
  const [newCourseCoef, setNewCourseCoef] = useState(2);
  const [editingCourse, setEditingCourse] = useState<any>(null);

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
             phone: editingTeacher.phone,
             title: editingTeacher.title || "Permanent"
         }).eq('id', editingTeacherId);
         
         // Update courses: delete old and insert new with explicit academic year and school_id
         await supabase.from('courses').delete().eq('teacher_id', editingTeacherId);
         
         if (editingSubject && editingClasses.length > 0) {
            const yearToUse = filterYear !== "ALL" ? filterYear : (currentConfiguredYear || null);
            const coursesToInsert = editingClasses.map(cls => ({
                school_id: user?.schoolId,
                name: editingSubject,
                level: cls,
                teacher_id: editingTeacherId,
                coefficient: editingCoefs[cls] || 1,
                academic_year: yearToUse
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

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;
    try {
      const yearToUse = filterYear !== "ALL" ? filterYear : (currentConfiguredYear || null);
      if (editingCourse) {
        await supabase.from('courses').update({
          name: editingCourse.name,
          level: editingCourse.level,
          teacher_id: editingCourse.teacher_id || null,
          coefficient: Number(editingCourse.coefficient) || 1,
          academic_year: editingCourse.academic_year || yearToUse
        }).eq('id', editingCourse.id);
        setEditingCourse(null);
      } else {
        await supabase.from('courses').insert([{
          school_id: user.schoolId,
          name: newCourseName,
          level: newCourseLevel,
          teacher_id: newCourseTeacherId || null,
          coefficient: Number(newCourseCoef) || 1,
          academic_year: yearToUse
        }]);
        setShowAddCourseModal(false);
      }
      fetchData();
    } catch (err: any) {
      alert("Erreur lors de l'enregistrement de la matière: " + err.message);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette matière ?")) {
      await supabase.from('courses').delete().eq('id', courseId);
      fetchData();
    }
  };

  useEffect(() => {
    if (user?.schoolId) {
      fetchData();
    }
  }, [user?.schoolId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch profiles of TEACHER role
      // 2. Fetch pending teacher invitations so invited teachers also appear
      // 3. Fetch courses
      // 4. Fetch academic years and configured school settings
      const [teachersRes, invitationsRes, coursesRes, yearsRes, schoolRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('school_id', user?.schoolId).eq('role', 'TEACHER'),
        supabase.from('invitations').select('*').eq('school_id', user?.schoolId).eq('role', 'TEACHER'),
        supabase.from('courses').select('*').eq('school_id', user?.schoolId),
        supabase.from('academic_years').select('id, name').eq('school_id', user?.schoolId),
        supabase.from('schools').select('*').eq('id', user?.schoolId).maybeSingle()
      ]);
      
      const teacherProfiles = teachersRes.data || [];
      const invitedTeachers = (invitationsRes.data || []).map((inv: any) => ({
        id: `inv_${inv.id}`,
        full_name: inv.email ? inv.email.split('@')[0].toUpperCase() : "Professeur Invité",
        email: inv.email,
        phone: "",
        role: "TEACHER",
        title: "Invité",
        isInvitation: true,
        invitationId: inv.id,
        school_id: user?.schoolId
      }));

      // Combine real profiles and pending invitations (avoiding duplicate emails)
      const existingEmails = new Set(teacherProfiles.map(t => t.email?.toLowerCase()));
      const combinedTeachers = [
        ...teacherProfiles,
        ...invitedTeachers.filter(inv => !existingEmails.has(inv.email?.toLowerCase()))
      ];

      setTeachers(combinedTeachers);
      setCourses(coursesRes.data || []);
      setAcademicYears(yearsRes.data || []);

      // Get configured school academic year if available
      let configuredYear = "";
      try {
        const savedExtra = localStorage.getItem('schoolSettings_extra_' + user?.schoolId);
        if (savedExtra) {
          const parsed = JSON.parse(savedExtra);
          if (parsed.academicYear) configuredYear = parsed.academicYear;
        }
      } catch (e) {}
      if (!configuredYear && schoolRes.data?.academic_year) {
        configuredYear = schoolRes.data.academic_year;
      }
      setCurrentConfiguredYear(configuredYear);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTeacherStats = (teacherId: string) => {
    const teacherCourses = courses.filter(c => c.teacher_id === teacherId);
    const hoursPerWeek = teacherCourses.length * 4;
    const hourlyRate = 3500;
    const monthlySalary = hoursPerWeek * 4 * hourlyRate;
    
    return {
      courses: teacherCourses,
      hoursPerWeek,
      monthlySalary
    };
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <User className="text-emerald-600" />
            Gestion des Professeurs & Matières
          </h1>
          <p className="text-slate-500 mt-1">Suivez les enseignants, assignez les matières par classe et paramétrez les coefficients.</p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "TEACHERS" ? (
            <button 
              onClick={() => setShowAddModal(true)} 
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-emerald-700 transition shadow-sm"
            >
              <Plus size={16} /> Inscrire un professeur
            </button>
          ) : (
            <button 
              onClick={() => { setEditingCourse(null); setShowAddCourseModal(true); }} 
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-emerald-700 transition shadow-sm"
            >
              <Plus size={16} /> Ajouter une matière
            </button>
          )}
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 bg-white px-4 pt-2 rounded-t-xl gap-4">
        <button
          onClick={() => setActiveTab("TEACHERS")}
          className={`pb-3 px-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "TEACHERS"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-gray-700"
          }`}
        >
          <User size={15} />
          Professeurs ({teachers.length})
        </button>
        <button
          onClick={() => setActiveTab("SUBJECTS")}
          className={`pb-3 px-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "SUBJECTS"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-gray-700"
          }`}
        >
          <BookOpen size={15} />
          Matières par Classe ({courses.length})
        </button>
      </div>

      {activeTab === "TEACHERS" && (
        <>
          <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex-1 min-w-[200px]">
               <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Année scolaire</label>
               <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 outline-none bg-white">
                 <option value="ALL">Toutes les années</option>
                 {currentConfiguredYear && !academicYears.some(y => y.name === currentConfiguredYear || y.id === currentConfiguredYear) && (
                   <option value={currentConfiguredYear}>{currentConfiguredYear} (En cours)</option>
                 )}
                 {academicYears.map(y => <option key={y.id} value={y.name || y.id}>{y.name}</option>)}
               </select>
            </div>
            <div className="flex-1 min-w-[200px]">
               <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Classe</label>
               <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 outline-none bg-white">
                 <option value="ALL">Toutes les classes</option>
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
                   // If teacher has assigned courses for this year, keep them
                   const matchesCourseYear = tc.some(c => c.academic_year === filterYear || c.academic_year === filterYear.replace(' ', ''));
                   // Also if teacher is invited/created in current year or without year restriction, keep them
                   if (!matchesCourseYear && tc.length > 0) return false;
                }
                return true;
              }).map(t => {
                const stats = getTeacherStats(t.id);
                const teacherType = t.title || (t.isInvitation ? "Invité" : "Permanent");

                return (
                  <div key={t.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-slate-300 transition">
                    <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-lg font-bold border-2 border-emerald-200 shrink-0">
                        {t.avatar_url ? (
                          <img src={t.avatar_url} alt={t.full_name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          t.full_name ? t.full_name.charAt(0).toUpperCase() : 'P'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-800 truncate">{t.full_name || "Nom non défini"}</h3>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            teacherType === "Vacataire" ? "bg-amber-100 text-amber-700" :
                            teacherType === "Invité" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {teacherType}
                          </span>
                          {t.phone && <span className="text-xs text-slate-500 font-medium">{t.phone}</span>}
                        </div>
                        {t.email && !t.email.endsWith('@ecole.local') && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">{t.email}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {!t.isInvitation && (
                          <button onClick={() => {
                              const tc = courses.filter(c => c.teacher_id === t.id);
                              setEditingTeacher(t);
                              setEditingSubject(tc.length > 0 ? tc[0].name : "");
                              setEditingClasses(tc.map(c => c.level));
                              const coefs: Record<string, number> = {};
                              tc.forEach(c => { coefs[c.level] = c.coefficient || 1; });
                              setEditingCoefs(coefs);
                              setEditingTeacherId(t.id);
                          }} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded transition-colors" title="Modifier">
                             <Edit2 size={16} />
                          </button>
                        )}
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
                              <div key={c.id} className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded text-xs">
                                <span className="font-bold text-emerald-800">{c.name}</span>
                                <span className="text-emerald-600 font-semibold ml-1.5">({c.level})</span>
                                <span className="text-[10px] text-emerald-500 ml-1">c.{c.coefficient || 1}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-slate-100">
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 mb-1">
                            <Clock size={12} /> Heures / Semaine
                          </div>
                          <div className="font-bold text-gray-800 text-lg">{stats.hoursPerWeek}h</div>
                        </div>
                        <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
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
        </>
      )}

      {/* Matière Tab : Inscription et gestion des matières par classe, coefficient et professeur assigné */}
      {activeTab === "SUBJECTS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Filtrer par classe :</span>
              <select 
                value={subjectFilterClass} 
                onChange={e => setSubjectFilterClass(e.target.value)} 
                className="px-3 py-1.5 border border-slate-300 rounded text-xs font-bold text-gray-800 bg-white"
              >
                <option value="ALL">Toutes les classes</option>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Total : {courses.filter(c => subjectFilterClass === "ALL" || c.level === subjectFilterClass).length} matière(s) configurée(s)
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Matière</th>
                    <th className="px-6 py-3">Classe</th>
                    <th className="px-6 py-3 text-center">Coefficient</th>
                    <th className="px-6 py-3">Professeur assigné</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {courses
                    .filter(c => subjectFilterClass === "ALL" || c.level === subjectFilterClass)
                    .map(course => {
                      const assignedTeacher = teachers.find(t => t.id === course.teacher_id);
                      return (
                        <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-800">{course.name}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded text-xs font-bold">
                              {course.level}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-emerald-700">
                            {course.coefficient || 1}
                          </td>
                          <td className="px-6 py-4">
                            {assignedTeacher ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                  {assignedTeacher.full_name?.charAt(0) || "P"}
                                </div>
                                <span className="font-semibold text-gray-800 text-xs">{assignedTeacher.full_name}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Non assigné</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => {
                                  setEditingCourse(course);
                                  setShowAddCourseModal(true);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                title="Modifier"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button 
                                onClick={() => handleDeleteCourse(course.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                title="Supprimer"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {courses.filter(c => subjectFilterClass === "ALL" || c.level === subjectFilterClass).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400 italic">
                        Aucune matière configurée pour ce filtre.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Teacher */}
      <AddTeacherModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSuccess={fetchData} 
        currentAcademicYear={currentConfiguredYear || filterYear !== "ALL" ? filterYear : undefined}
      />
      
      {/* Modal Edit Teacher */}
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
                    <input type="text" value={editingTeacher?.full_name || ""} onChange={e => setEditingTeacher({...editingTeacher, full_name: e.target.value})} required className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-emerald-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Type de Professeur</label>
                    <select 
                      value={editingTeacher?.title || "Permanent"} 
                      onChange={e => setEditingTeacher({...editingTeacher, title: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-emerald-500 text-sm bg-white"
                    >
                      <option value="Permanent">Permanent</option>
                      <option value="Vacataire">Vacataire</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Téléphone</label>
                    <input type="text" value={editingTeacher?.phone || ""} onChange={e => setEditingTeacher({...editingTeacher, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-emerald-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Matière principale</label>
                    <select required value={editingSubject} onChange={e => setEditingSubject(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 outline-none bg-white text-sm">
                      <option value="" disabled>Sélectionnez une matière</option>
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
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
                          <span className="text-gray-700 font-medium text-xs">{l}</span>
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

      {/* Modal Add / Edit Course in Matières tab */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700">
                {editingCourse ? "Modifier la matière" : "Ajouter une matière par classe"}
              </h3>
              <button onClick={() => setShowAddCourseModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleSaveCourse} className="p-4 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Matière</label>
                {editingCourse ? (
                  <input 
                    type="text" 
                    value={editingCourse.name} 
                    onChange={e => setEditingCourse({...editingCourse, name: e.target.value})} 
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:ring-emerald-500" 
                    required 
                  />
                ) : (
                  <select 
                    value={newCourseName} 
                    onChange={e => setNewCourseName(e.target.value)} 
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:ring-emerald-500 bg-white"
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Classe</label>
                {editingCourse ? (
                  <select 
                    value={editingCourse.level} 
                    onChange={e => setEditingCourse({...editingCourse, level: e.target.value})} 
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:ring-emerald-500 bg-white"
                  >
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                ) : (
                  <select 
                    value={newCourseLevel} 
                    onChange={e => setNewCourseLevel(e.target.value)} 
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:ring-emerald-500 bg-white"
                  >
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Coefficient</label>
                <input 
                  type="number" 
                  min="1" 
                  max="10" 
                  value={editingCourse ? editingCourse.coefficient : newCourseCoef} 
                  onChange={e => {
                    const val = Number(e.target.value);
                    if (editingCourse) setEditingCourse({...editingCourse, coefficient: val});
                    else setNewCourseCoef(val);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:ring-emerald-500" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Professeur assigné</label>
                <select 
                  value={editingCourse ? (editingCourse.teacher_id || "") : newCourseTeacherId} 
                  onChange={e => {
                    const val = e.target.value;
                    if (editingCourse) setEditingCourse({...editingCourse, teacher_id: val || null});
                    else setNewCourseTeacherId(val);
                  }} 
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:ring-emerald-500 bg-white"
                >
                  <option value="">-- Aucun professeur assigné --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.title || (t.isInvitation ? "Invité" : "Permanent")})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowAddCourseModal(false)} 
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded text-sm font-semibold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-semibold hover:bg-emerald-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
