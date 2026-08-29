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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedStudentInfo, setSelectedStudentInfo] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (user?.schoolId) {
      fetchData();
    }
  }, [user?.schoolId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, coursesRes] = await Promise.all([
        supabase.from('students').select('*').eq('school_id', user?.schoolId),
        supabase.from('courses').select('*, profiles(full_name)').eq('school_id', user?.schoolId)
      ]);
      
      setStudents(studentsRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const classes = Array.from<string>(new Set(students.map(s => s.level as string))).sort();

  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.matricule && s.matricule.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesClass = selectedClass === "ALL" || s.level === selectedClass;
    
    return matchesSearch && matchesClass;
  });

  const getTeachersForClass = (level: string) => {
    return courses.filter(c => c.level === level);
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
        <div className="w-full md:w-64">
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide flex items-center gap-1">
            <Filter size={14} /> Filtrer par classe
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
                students={filteredStudents.filter(s => s.level === className)} 
                teachers={getTeachersForClass(className)}
              />
            ))
          ) : (
            <ClassSection 
              className={selectedClass} 
              students={filteredStudents} 
              teachers={getTeachersForClass(selectedClass)}
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

function ClassSection({ className, students, teachers }: { key?: string, className: string, students: any[], teachers: any[] }) {
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
                <span className="text-slate-400 text-[10px] ml-1">({t.profiles?.full_name || 'Non assigné'})</span>
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
              <th className="px-6 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-3 text-sm font-mono text-slate-500">{s.id.substring(0,8).toUpperCase()}</td>
                <td className="px-6 py-3 text-sm font-bold text-gray-800 uppercase">{s.last_name}</td>
                <td className="px-6 py-3 text-sm text-gray-700 capitalize">{s.first_name}</td>
                <td className="px-6 py-3">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                    s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {s.status === 'ACTIVE' ? 'Inscrit' : 'Inactif'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
