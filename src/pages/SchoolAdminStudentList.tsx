import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { Users, Search, Filter, BookOpen, GraduationCap, Plus } from "lucide-react";
import { AddStudentModal } from "../components/AddStudentModal";
import { Student } from "../types";

export function SchoolAdminStudentList() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [academicYears, setAcademicYears] = useState<{id: string, name: string}[]>([]);
  const [selectedStudentInfo, setSelectedStudentInfo] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const activeSchoolId = user?.schoolId || "11111111-1111-4111-8111-111111111111";

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let targetSchoolId = user?.schoolId || localStorage.getItem('edubenin_active_school_id');
      if (!targetSchoolId) {
        const { data: sc } = await supabase.from('schools').select('id, academic_year').order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (sc?.id) {
          targetSchoolId = sc.id;
          localStorage.setItem('edubenin_active_school_id', sc.id);
        }
      }
      if (!targetSchoolId) targetSchoolId = "11111111-1111-4111-8111-111111111111";

      const [allStudentsRes, coursesRes, yearsRes, schoolRes, allProfilesRes] = await Promise.all([
        supabase.from('students').select('*'),
        supabase.from('courses').select('*, profiles(full_name)'),
        supabase.from('academic_years').select('id, name'),
        supabase.from('schools').select('*').eq('id', targetSchoolId).maybeSingle(),
        supabase.from('profiles').select('*')
      ]);
      
      const isDummyStudent = (s: any) => {
        if (!s) return false;
        const id = String(s.id || '');
        const f = String(s.first_name || s.firstName || '').toLowerCase();
        const l = String(s.last_name || s.lastName || '').toLowerCase();
        return id === "s1" || id === "s2" || id === "s3" ||
               (f === "marc" && l === "dubois") ||
               (f === "sophie" && l === "dubois") ||
               (f === "junior" && l === "kodjo");
      };

      // Purge dummy students from local caches
      try {
        const local = localStorage.getItem('mock_db_students');
        if (local) {
          const parsed = JSON.parse(local).filter((s: any) => !isDummyStudent(s));
          localStorage.setItem('mock_db_students', JSON.stringify(parsed));
        }
      } catch(e) {}

      try {
        const customS = localStorage.getItem(`school_custom_students_${targetSchoolId}`);
        if (customS) {
          const parsed = JSON.parse(customS).filter((s: any) => !isDummyStudent(s));
          localStorage.setItem(`school_custom_students_${targetSchoolId}`, JSON.stringify(parsed));
        }
      } catch(e) {}

      let stList = allStudentsRes.data && Array.isArray(allStudentsRes.data) ? [...allStudentsRes.data] : [];
      try {
        const local = localStorage.getItem('mock_db_students');
        const parsed = local ? JSON.parse(local) : [];
        parsed.forEach((s: any) => {
          if (!isDummyStudent(s) && !stList.some((existing: any) => existing.id === s.id)) {
            stList.push(s);
          }
        });
      } catch(e) {}

      try {
        const customS = localStorage.getItem(`school_custom_students_${targetSchoolId}`);
        const parsedCustom = customS ? JSON.parse(customS) : [];
        parsedCustom.forEach((s: any) => {
          if (!isDummyStudent(s) && !stList.some((existing: any) => existing.id === s.id)) {
            stList.push(s);
          }
        });
      } catch(e) {}

      // Keep only non-dummy students belonging to this school
      stList = stList.filter(s => !isDummyStudent(s) && (!s.school_id || s.school_id === targetSchoolId));

      let coursesList = coursesRes.data && Array.isArray(coursesRes.data) ? [...coursesRes.data] : [];
      try {
        const localC = localStorage.getItem('mock_db_courses');
        const parsedC = localC ? JSON.parse(localC) : [];
        parsedC.forEach((c: any) => {
          if (!coursesList.some(ec => ec.id === c.id)) {
            coursesList.push(c);
          }
        });
      } catch (e) {}

      let profList = allProfilesRes.data && Array.isArray(allProfilesRes.data) ? [...allProfilesRes.data] : [];
      try {
        const localP = localStorage.getItem('mock_db_profiles');
        const parsedP = localP ? JSON.parse(localP) : [];
        parsedP.forEach((p: any) => {
          if (!profList.some(ep => ep.id === p.id || (p.email && ep.email && ep.email.toLowerCase() === p.email.toLowerCase()))) {
            profList.push(p);
          }
        });
      } catch (e) {}

      setStudents(stList);
      setCourses(coursesList);
      setProfiles(profList);

      const realYears: { id: string; name: string }[] = [];
      if (yearsRes?.data && yearsRes.data.length > 0) {
        yearsRes.data.forEach((y: any) => {
          if (!realYears.some(ry => ry.name === y.name)) {
            realYears.push(y);
          }
        });
      }

      // Harvest academic years directly from all students
      stList.forEach((s: any) => {
        const y = s.academic_year || s.academicYear;
        if (y && !realYears.some(ry => ry.name === y)) {
          realYears.push({ id: `st_${y}`, name: y });
        }
      });

      let extraYear = "";
      try {
        const saved = localStorage.getItem('schoolSettings_extra_' + targetSchoolId);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.academicYear) extraYear = parsed.academicYear;
        }
      } catch (e) {}

      if (extraYear && !realYears.some(y => y.name === extraYear)) {
        realYears.push({ id: `extra_${extraYear}`, name: extraYear });
      }
      if (schoolRes?.data?.academic_year && !realYears.some(y => y.name === schoolRes.data.academic_year)) {
        realYears.push({ id: `sc_${schoolRes.data.academic_year}`, name: schoolRes.data.academic_year });
      }
      setAcademicYears(realYears);
      setSelectedYear("ALL");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const classes = Array.from<string>(new Set(students.map(s => (s.level || s.classe || 'Non classé') as string))).filter(Boolean).sort();

  const filteredStudents = students.filter(s => {
    const sYear = s.academic_year || s.academicYear;
    const matchesYear = !selectedYear || selectedYear === "ALL" || !sYear || sYear === selectedYear;
    const fName = (s.first_name || s.firstName || "").toLowerCase();
    const lName = (s.last_name || s.lastName || "").toLowerCase();
    const mat = (s.matricule || s.id || "").toLowerCase();
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q || fName.includes(q) || lName.includes(q) || mat.includes(q);
    
    const sLevel = (s.level || s.classe || 'Non classé').trim();
    const matchesClass = !selectedClass || selectedClass === "ALL" || sLevel === selectedClass.trim();
    
    return matchesSearch && matchesClass && matchesYear;
  });

  const getTeachersForClass = (level: string) => {
    return courses.filter(c => c.level === level).map(c => {
      const p = profiles.find((prof: any) => prof.id === c.teacher_id);
      return {
        ...c,
        resolvedTeacherName: p?.full_name || c.profiles?.full_name || c.teacher_name || 'Enseignant'
      };
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-emerald-600" />
            Liste Classifiée des Élèves
          </h1>
          <p className="text-slate-500 mt-1">Gérez et recherchez vos élèves par classe, avec les informations sur leurs professeurs.</p>
        </div>
        
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Recherche Avancée</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Nom, prénom, matricule..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>
        <div className="w-full md:w-48">
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide flex items-center gap-1">
            <Filter size={14} /> Année Scolaire
          </label>
          <select 
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium text-xs"
          >
            {academicYears.length > 0 ? (
              <>
                <option value="ALL">Toutes les années</option>
                {academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
              </>
            ) : (
              <option value="ALL">Toutes les années</option>
            )}
          </select>
        </div>
        <div className="w-full md:w-48">
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide flex items-center gap-1">
            <Filter size={14} /> Classe
          </label>
          <select 
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
          >
            <option value="ALL">Toutes les classes</option>
            {classes.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Chargement des données...</div>
      ) : (
        <div className="space-y-8">
          {selectedClass === "ALL" ? (
            classes.map(className => (
              <ClassSection 
                key={className} 
                className={className} 
                students={filteredStudents.filter(s => (s.level || s.classe || 'Non classé').trim() === className.trim())} 
                teachers={getTeachersForClass(className)}
                 onUpdateStatus={async (id, status) => { await supabase.from('students').update({ status }).eq('id', id); fetchData(); }}
              />
            ))
          ) : (
            <ClassSection 
              className={selectedClass} 
              students={filteredStudents.filter(s => (s.level || s.classe || 'Non classé').trim() === selectedClass.trim())} 
              teachers={getTeachersForClass(selectedClass)}
               onUpdateStatus={async (id, status) => { await supabase.from('students').update({ status }).eq('id', id); fetchData(); }}
            />
          )}
          {filteredStudents.length === 0 && (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
              Aucun élève trouvé pour ces critères de recherche.
            </div>
          )}
        </div>
      )}
      
    </div>
  );
}

function ClassSection({ className, students, teachers, onUpdateStatus }: { key?: string, className: string, students: any[], teachers: any[], onUpdateStatus: (id: string, status: string) => void }) {
  if (students.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <GraduationCap className="text-emerald-600" />
            Classe : {className}
          </h3>
          <p className="text-sm text-slate-500">{students.length} élève(s) inscrit(s)</p>
        </div>
        
        {teachers.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {teachers.map(t => (
              <div key={t.id} className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded text-xs shadow-sm">
                <BookOpen size={12} className="text-blue-500" />
                <span className="font-semibold text-gray-700">{t.name}</span>
                <span className="text-slate-400 text-[10px] ml-1">({t.resolvedTeacherName || t.profiles?.full_name || 'Non assigné'})</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Matricule</th>
              <th className="px-6 py-3">Nom</th>
              <th className="px-6 py-3">Prénoms</th>
              <th className="px-6 py-3">Statut Scolaire</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-3 text-sm font-mono text-slate-500">{s.matricule || s.id.substring(0,8).toUpperCase()}</td>
                <td className="px-6 py-3 text-sm font-bold text-gray-800 uppercase">{s.last_name || s.lastName || "—"}</td>
                <td className="px-6 py-3 text-sm text-gray-700 capitalize">{s.first_name || s.firstName || "—"}</td>
                <td className="px-6 py-3">
                  <select 
                    value={s.status || 'PASSING'} 
                    onChange={(e) => onUpdateStatus(s.id, e.target.value)}
                    className={`text-[10px] font-bold uppercase px-2 py-1 rounded border-none outline-none cursor-pointer ${
                      s.status === 'PASSING' ? 'bg-emerald-100 text-emerald-700' : 
                      s.status === 'REPEATING' ? 'bg-amber-100 text-amber-700' : 
                      s.status === 'EXCLUDED' ? 'bg-red-100 text-red-700' : 
                      'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <option value="PASSING">Passant</option>
                    <option value="REPEATING">Redoublant</option>
                    <option value="EXCLUDED">Exclus</option>
                    <option value="ACTIVE">Actif</option>
                    <option value="INACTIVE">Inactif</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
