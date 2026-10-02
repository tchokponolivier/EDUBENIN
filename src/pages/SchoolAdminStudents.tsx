import React, { useState, useEffect } from "react";
import { Student, LEVELS } from "../types";
import { useAuth } from "../lib/auth";
import { useLocation } from "react-router-dom";
import { Users, Search, Edit2, AlertCircle, Download, CheckSquare, Trash2, ArrowLeft, LayoutGrid, Clock, FileText } from "lucide-react";
import { SecretaryAbsences } from "../components/SecretaryAbsences";
import { SecretaryDocuments } from "../components/SecretaryDocuments";
import { SecretaryTimetables } from "../components/SecretaryTimetables";
import { SecretaryMails } from "../components/SecretaryMails";
import { SecretaryExams } from "../components/SecretaryExams";
import { SecretaryPlanning } from "../components/SecretaryPlanning";
import { SecretaryHR } from "../components/SecretaryHR";
import { AddStudentModal } from "../components/AddStudentModal";
import { getDirectorAcademicYears } from "../lib/academicYears";

export function SchoolAdminStudents() {
  const { user } = useAuth();
  const location = useLocation();
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"STUDENTS" | "ABSENCES" | "DOCUMENTS" | "MAILS" | "EXAMS" | "PLANNING" | "TIMETABLES" | "HR">(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const validTabs = ["STUDENTS", "ABSENCES", "DOCUMENTS", "MAILS", "EXAMS", "PLANNING", "TIMETABLES", "HR"];
    if (tab && validTabs.includes(tab)) return tab as any;
    return "STUDENTS";
  });
  
  // Sync state if URL changes
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const validTabs = ["STUDENTS", "ABSENCES", "DOCUMENTS", "MAILS", "EXAMS", "PLANNING", "TIMETABLES", "HR"];
    if (tab && validTabs.includes(tab)) setActiveTab(tab as any);
  }, [location.search]);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [academicYears, setAcademicYears] = useState<{id: string, name: string}[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<"CONTACTS" | "SIMPLE" | "FULL">("CONTACTS");
  const [exportClass, setExportClass] = useState<string>("ALL");
  const [exportStatus, setExportStatus] = useState<"ALL" | "NEW" | "OLD">("ALL");
  const [exportYear, setExportYear] = useState<string>("ALL");

  const executeExport = () => {
    let selectedStudents = students;
    
    if (exportClass !== "ALL") {
        selectedStudents = selectedStudents.filter(s => s.level === exportClass);
    }
    
    if (exportStatus !== "ALL") {
        selectedStudents = selectedStudents.filter(s => s.studentType === exportStatus);
    }
    
    if (exportYear !== "ALL") {
        selectedStudents = selectedStudents.filter(s => s.academicYear === exportYear);
    }
    
    if (selectedStudents.length === 0) return alert("Aucun élève à exporter avec ces critères.");
    
    let csvData = "";
    
    if (exportFormat === "CONTACTS") {
        csvData = "Nom Parent,Telephone,Relation,Eleve,Classe\n";
        selectedStudents.forEach(student => {
           const hasFather = student.fatherName && student.fatherContact;
           const hasMother = student.motherName && student.motherContact;
           const hasGuardian = student.guardianName && student.guardianContact;

           const createCSVRow = (name: string, phone: string, relation: string) => `"${name}","${phone}","${relation}","${student.lastName} ${student.firstName}","${student.level}"\n`;

           if (hasFather) csvData += createCSVRow(student.fatherName!, student.fatherContact!, "Père");
           if (hasMother) csvData += createCSVRow(student.motherName!, student.motherContact!, "Mère");
           if (hasGuardian) csvData += createCSVRow(student.guardianName!, student.guardianContact!, "Tuteur");

           if (!hasFather && !hasMother && !hasGuardian) {
               csvData += createCSVRow(`Parent de ${student.lastName}`, "+22900000000", "Parent");
           }
        });
    } else if (exportFormat === "SIMPLE") {
        csvData = "Nom,Prenom,Classe,Sexe,Date Naissance\n";
        selectedStudents.forEach(student => {
            csvData += `"${student.lastName}","${student.firstName}","${student.level}","${student.gender || ''}","${student.dateOfBirth || ''}"\n`;
        });
    } else if (exportFormat === "FULL") {
        csvData = "Nom,Prenom,Classe,Sexe,N° EducMaster,Statut Eleve,Annee Frequente,Etab. Anterieur,Date Naissance,Lieu Naissance,Nationalite,Religion\n";
        selectedStudents.forEach(student => {
            csvData += `"${student.lastName}","${student.firstName}","${student.level}","${student.gender || ''}","${student.educmasterNumber || ''}","${student.studentType || ''}","${student.lastYearAttended || ''}","${student.previousSchool || ''}","${student.dateOfBirth || ''}","${student.placeOfBirth || ''}","${student.nationality || ''}","${student.religion || ''}"\n`;
        });
    }

    const blob = new Blob(["\ufeff" + csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export_${exportFormat}_${exportClass}_${new Date().toISOString().split('T')[0]}.csv`.replace(/\//g, '_');
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);

    setShowExportModal(false);
  };
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState<any | null>(null);
  
  useEffect(() => {
    const fetchStudents = async () => {
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

      let targetSchoolId = user?.schoolId || localStorage.getItem('edubenin_active_school_id');
      if (!targetSchoolId) {
        try {
          const { supabase } = await import('../lib/supabase');
          const { data: sc } = await supabase.from('schools').select('id, academic_year').order('created_at', { ascending: false }).limit(1).maybeSingle();
          if (sc?.id) {
            targetSchoolId = sc.id;
            localStorage.setItem('edubenin_active_school_id', sc.id);
          }
        } catch (e) {}
      }
      if (!targetSchoolId) targetSchoolId = "11111111-1111-4111-8111-111111111111";

      try {
        const { supabase } = await import('../lib/supabase');
        const [studentsRes, directorYears] = await Promise.all([
           supabase.from('students').select('*'),
           getDirectorAcademicYears(targetSchoolId)
        ]);
        setAcademicYears(directorYears);
        
        let list = studentsRes.data && Array.isArray(studentsRes.data) ? [...studentsRes.data] : [];
        try {
          const customS = localStorage.getItem(`school_custom_students_${targetSchoolId}`);
          if (customS) {
            const parsed = JSON.parse(customS);
            parsed.forEach((cs: any) => {
              if (!list.some(x => x.id === cs.id)) list.push(cs);
            });
          }
        } catch(e) {}

        try {
          const mockS = localStorage.getItem('mock_db_students');
          if (mockS) {
            const parsed = JSON.parse(mockS);
            parsed.forEach((ms: any) => {
              if (!list.some(x => x.id === ms.id)) list.push(ms);
            });
          }
        } catch(e) {}

        const mappedStudents = list
          .filter(d => !isDummyStudent(d) && (!d.school_id || d.school_id === targetSchoolId || d.school_id === "11111111-1111-4111-8111-111111111111"))
          .map(d => ({
            ...d,
            id: d.id,
            firstName: d.first_name || d.firstName,
            lastName: d.last_name || d.lastName,
            level: d.level,
            status: d.status,
            schoolId: d.school_id || targetSchoolId,
            parentId: d.parent_id || d.parentId,
            dateOfBirth: d.date_of_birth || d.dateOfBirth,
            fatherContact: d.father_contact || d.fatherContact,
            motherContact: d.mother_contact || d.motherContact,
            guardianContact: d.guardian_contact || d.guardianContact,
            fatherName: d.father_name || d.fatherName,
            motherName: d.mother_name || d.motherName,
            guardianName: d.guardian_name || d.guardianName,
            createdAt: d.created_at ? new Date(d.created_at).getTime() : Date.now()
          })) as any[];
        setStudents(mappedStudents);
      } catch (err) {
        console.error("Fetch failed", err);
      }
    };
    
    fetchStudents();
  }, [user?.schoolId]);

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    try {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase.from('students').update({
        first_name: showEditModal.firstName,
        last_name: showEditModal.lastName,
        level: showEditModal.level
      }).eq('id', showEditModal.id);
      if (error) throw error;
      setStudents(students.map(s => s.id === showEditModal.id ? showEditModal : s));
      setShowEditModal(null);
      alert("Informations de l'élève mises à jour avec succès.");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour");
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet élève ? Cette action est irréversible.")) {
      try {
        const { supabase } = await import('../lib/supabase');
        const { error } = await supabase.from('students').delete().eq('id', id);
        if (error) throw error;
        setStudents(students.filter(s => s.id !== id));
        alert("Élève supprimé avec succès.");
      } catch (err) {
        console.error(err);
        alert("Erreur lors de la suppression");
      }
    }
  };

  const filteredStudents = students.filter(s => {
    if (selectedClass && s.level !== selectedClass) return false;
    const searchLower = searchTerm.toLowerCase();
    const nameStr = `${s.firstName} ${s.lastName}`.toLowerCase();
    const idStr = s.id.toLowerCase();
    return nameStr.includes(searchLower) || idStr.includes(searchLower);
  });

  const getClassesToDisplay = () => {
     const classGroups = LEVELS.map(level => {
         return { level, count: students.filter(s => s.level === level).length };
     }).filter(c => c.count > 0);
     
     // Include any unknown levels from students
     students.forEach(s => {
        if (s.level && !LEVELS.includes(s.level) && !classGroups.some(c => c.level === s.level)) {
            classGroups.push({ level: s.level, count: students.filter(x => x.level === s.level).length });
        }
     });

     return classGroups;
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Secrétariat & Scolarité</h1>
        <p className="text-xs text-slate-500 mt-1">Gérez les inscriptions, absences et emplois du temps</p>
      </div>
      
      {/* Navigation Tabs - Ajustés en bas du titre de la page */}
      <div className="flex p-1.5 bg-slate-100/90 border border-slate-200 overflow-x-auto whitespace-nowrap hide-scrollbar rounded-xl gap-1 max-w-full shadow-inner">
        <button 
          onClick={() => setActiveTab("STUDENTS")} 
          className={`px-4 py-2 rounded-lg text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-all ${activeTab === "STUDENTS" ? "bg-white shadow-xs text-gray-800 border border-slate-200" : "text-slate-500 hover:text-gray-800 hover:bg-white/60"}`}
        >
          Inscriptions
        </button>
        <button 
          onClick={() => setActiveTab("ABSENCES")} 
          className={`px-4 py-2 rounded-lg text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-all ${activeTab === "ABSENCES" ? "bg-white shadow-xs text-gray-800 border border-slate-200" : "text-slate-500 hover:text-gray-800 hover:bg-white/60"}`}
        >
          Absences & Retards
        </button>
        <button 
          onClick={() => setActiveTab("DOCUMENTS")} 
          className={`px-4 py-2 rounded-lg text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-all ${activeTab === "DOCUMENTS" ? "bg-white shadow-xs text-gray-800 border border-slate-200" : "text-slate-500 hover:text-gray-800 hover:bg-white/60"}`}
        >
          Documents
        </button>
        <button 
          onClick={() => setActiveTab("MAILS")} 
          className={`px-4 py-2 rounded-lg text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-all ${activeTab === "MAILS" ? "bg-white shadow-xs text-gray-800 border border-slate-200" : "text-slate-500 hover:text-gray-800 hover:bg-white/60"}`}
        >
          Courriers
        </button>
        <button 
          onClick={() => setActiveTab("EXAMS")} 
          className={`px-4 py-2 rounded-lg text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-all ${activeTab === "EXAMS" ? "bg-white shadow-xs text-gray-800 border border-slate-200" : "text-slate-500 hover:text-gray-800 hover:bg-white/60"}`}
        >
          Épreuves
        </button>
        <button 
          onClick={() => setActiveTab("PLANNING")} 
          className={`px-4 py-2 rounded-lg text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-all ${activeTab === "PLANNING" ? "bg-white shadow-xs text-gray-800 border border-slate-200" : "text-slate-500 hover:text-gray-800 hover:bg-white/60"}`}
        >
          Planning
        </button>
        <button 
          onClick={() => setActiveTab("TIMETABLES")} 
          className={`px-4 py-2 rounded-lg text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-all ${activeTab === "TIMETABLES" ? "bg-white shadow-xs text-gray-800 border border-slate-200" : "text-slate-500 hover:text-gray-800 hover:bg-white/60"}`}
        >
          Emplois du temps
        </button>
        <button 
          onClick={() => setActiveTab("HR")} 
          className={`px-4 py-2 rounded-lg text-xs whitespace-nowrap shrink-0 font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${activeTab === "HR" ? "bg-emerald-600 text-white shadow-xs" : "text-emerald-700 hover:text-emerald-900 bg-emerald-50/80"}`}
        >
          <span>Personnel & RH</span>
        </button>
      </div>


      {activeTab === "STUDENTS" && (
        <>
          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => setShowAddStudentModal(true)} 
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded font-bold uppercase tracking-wider text-xs hover:bg-emerald-700 transition shadow-sm"
            >
               Inscrire un élève
            </button>
            <button
              onClick={() => setShowExportModal(true)}
             className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded font-bold uppercase tracking-wider text-xs hover:bg-emerald-700 transition shadow-sm"
          >
             <Download size={14} /> Exporter Données
          </button>
          </div>
          {!selectedClass ? (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {getClassesToDisplay().map((c) => (
              <div 
                 key={c.level} 
                 onClick={() => setSelectedClass(c.level)} 
                 className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center gap-3 hover:border-emerald-500 group"
              >
                 <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <LayoutGrid size={24} />
                 </div>
                 <span className="font-bold text-gray-700 text-lg text-center">{c.level}</span>
                 <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{c.count} élève{c.count > 1 ? 's' : ''}</span>
              </div>
            ))}
            {getClassesToDisplay().length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                 Aucune classe avec des élèves enregistrés pour le moment.
              </div>
            )}
         </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
           <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap">
             <div className="flex items-center gap-3">
               <button onClick={() => setSelectedClass(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-gray-700 transition-colors" title="Retour aux classes">
                 <ArrowLeft size={18} />
               </button>
               <h3 className="font-bold text-gray-700 flex items-center gap-2 text-lg">
                 <Users size={18} className="text-emerald-600" />
                 Classe : {selectedClass}
               </h3>
             </div>
             <div className="relative">
               <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
               <input 
                 type="text" 
                 placeholder="Rechercher par nom ou ID..." 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none w-full sm:w-64"
               />
             </div>
           </div>
           <div className="overflow-x-auto text-sm">
           <table className="w-full text-left border-collapse">
             <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold">
               <tr className="border-b border-slate-100">
                 <th className="px-4 py-3">
                    <input 
                       type="checkbox" 
                       className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                       checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                       onChange={(e) => {
                          if (e.target.checked) setSelectedStudentIds(filteredStudents.map(s => s.id));
                          else setSelectedStudentIds([]);
                       }}
                    />
                 </th>
                 <th className="px-4 py-3">Nom complet</th>
                 <th className="px-4 py-3">Niveau</th>
                 <th className="px-4 py-3">Contact Parent</th>
                 <th className="px-4 py-3">Âge / Naissance</th>
                 <th className="px-4 py-3">Statut</th>
                 <th className="px-4 py-3 text-right">Remise (%)</th>
                 <th className="px-4 py-3 text-center">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {filteredStudents.map(student => (
                 <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                   <td className="px-4 py-3">
                      <input 
                         type="checkbox" 
                         className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                         checked={selectedStudentIds.includes(student.id)}
                         onChange={(e) => {
                            if (e.target.checked) setSelectedStudentIds([...selectedStudentIds, student.id]);
                            else setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                         }}
                      />
                   </td>
                   <td className="px-4 py-3">
                     <div className="font-semibold text-gray-700">{student.lastName} {student.firstName}</div>
                     <div className="text-[10px] text-slate-400 font-mono">Matricule: {student.matricule || student.id.substring(0,8).toUpperCase()}</div>
                   </td>
                   <td className="px-4 py-3 text-slate-600">{student.level}</td>
                   <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                     {student.fatherContact || student.motherContact || student.guardianContact || "-"}
                   </td>
                   <td className="px-4 py-3 text-slate-500">
                      {student.dateOfBirth && !isNaN(new Date(student.dateOfBirth).getTime()) ? new Date(student.dateOfBirth).toLocaleDateString() : '-'}
                   </td>
                   <td className="px-4 py-3">
                     {student.status === "ACTIVE" || !student.status ? <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] uppercase font-bold">Actif</span> : null}
                     {student.status === "DROPOUT" ? <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-[10px] uppercase font-bold">Abandon</span> : null}
                     {student.status === "EXCLUDED" ? <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded text-[10px] uppercase font-bold">Exclus</span> : null}
                     {student.status === "PASSING" ? <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px] uppercase font-bold">Admis</span> : null}
                     {student.status === "REPEATING" ? <span className="text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded text-[10px] uppercase font-bold">Redoublant</span> : null}
                   </td>
                   <td className="px-4 py-3 text-right font-mono font-bold text-gray-700">{student.discountPercentage || 0}%</td>
                   <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                      <button 
                         onClick={() => {
                            setShowEditModal({...student});
                         }}
                         className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                         title="Éditer"
                      >
                         <Edit2 size={16} />
                      </button>
                      <button 
                         onClick={() => handleDeleteStudent(student.id)}
                         className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                         title="Supprimer"
                      >
                         <Trash2 size={16} />
                      </button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
      </div>
      )}

      {showEditModal && (
          <AddStudentModal isOpen={true} onClose={() => setShowEditModal(null)} onSuccess={() => { setShowEditModal(null); window.location.reload(); }} initialData={showEditModal} />
      )}

      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                   <h3 className="font-bold text-lg text-gray-700">Exporter les Données</h3>
                   <p className="text-xs text-slate-500">Configurez l'export CSV</p>
                </div>
            </div>
            <div className="p-4 space-y-4">
                <div>
                   <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Type d'Export</label>
                   <select value={exportFormat} onChange={e => setExportFormat(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                      <option value="CONTACTS">Contacts Parents (Nom parent, Tél, Relation, Nom Élève)</option>
                      <option value="SIMPLE">Liste Simple (Nom, Prénom, Sexe, Date naiss.)</option>
                      <option value="FULL">Fiche Complète (N° EducMaster, Statut, Origine...)</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Filtrer par Classe</label>
                   <select value={exportClass} onChange={e => setExportClass(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                      <option value="ALL">Toutes les classes</option>
                      {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Filtre Statut Initiale (Élève)</label>
                   <select value={exportStatus} onChange={e => setExportStatus(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                      <option value="ALL">Tous (Nouveaux et Anciens)</option>
                      <option value="NEW">Nouveaux Élèves Uniquement</option>
                      <option value="OLD">Anciens Élèves (Réinscrits)</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Filtre par Année Scolaire</label>
                   <select value={exportYear} onChange={e => setExportYear(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                      <option value="ALL">Toutes les années actives</option>
                      {academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
                   </select>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                 <button type="button" onClick={() => setShowExportModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded uppercase tracking-wider transition-colors">Annuler</button>
                 <button onClick={executeExport} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-sm uppercase tracking-wider transition-colors">
                    <Download size={14} /> Exporter
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {activeTab === "ABSENCES" && <SecretaryAbsences />}
      {activeTab === "DOCUMENTS" && <SecretaryDocuments />}
      {activeTab === "MAILS" && <SecretaryMails />}
      {activeTab === "EXAMS" && <SecretaryExams />}
      {activeTab === "PLANNING" && <SecretaryPlanning />}
      {activeTab === "TIMETABLES" && <SecretaryTimetables />}
      {activeTab === "HR" && <SecretaryHR />}
      {showAddStudentModal && <AddStudentModal isOpen={true} onClose={() => setShowAddStudentModal(false)} onSuccess={() => { setShowAddStudentModal(false); window.location.reload(); }} />}

    </div>
  );
}
