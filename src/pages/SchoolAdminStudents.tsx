import React, { useState, useEffect } from "react";
import { db } from "../lib/db";
import { Student, LEVELS } from "../types";
import { useAuth } from "../lib/auth";
import { Users, Search, Edit2, AlertCircle, Download, CheckSquare, Trash2, ArrowLeft, LayoutGrid } from "lucide-react";

export function SchoolAdminStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<"CONTACTS" | "SIMPLE" | "FULL">("CONTACTS");
  const [exportClass, setExportClass] = useState<string>("ALL");
  const [exportStatus, setExportStatus] = useState<"ALL" | "NEW" | "OLD">("ALL");

  const executeExport = () => {
    let selectedStudents = students;
    
    if (exportClass !== "ALL") {
        selectedStudents = selectedStudents.filter(s => s.level === exportClass);
    }
    
    if (exportStatus !== "ALL") {
        selectedStudents = selectedStudents.filter(s => s.studentType === exportStatus);
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
  const [showEditModal, setShowEditModal] = useState<Student | null>(null);
  
  useEffect(() => {
    setStudents(db.getStudents());
  }, []);

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;

    try {
      db.updateStudent(showEditModal.id, showEditModal);
      setStudents(db.getStudents());
      setShowEditModal(null);
      alert("Informations de l'élève mises à jour avec succès.");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour");
    }
  };

  const handleDeleteStudent = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet élève ? Cette action est irréversible.")) {
      try {
        db.deleteStudent(id);
        setStudents(db.getStudents());
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Gestion des Élèves</h1>
          <p className="text-xs text-slate-500 mt-1">Gérez le statut (abandon, exclus), les remises et les infos</p>
        </div>
        <button 
           onClick={() => setShowExportModal(true)}
           className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded font-bold uppercase tracking-wider text-xs hover:bg-emerald-700 transition shadow-sm"
        >
           <Download size={14} /> Exporter Données
        </button>
      </div>

      {!selectedClass ? (
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {getClassesToDisplay().map((c) => (
              <div 
                 key={c.level} 
                 onClick={() => setSelectedClass(c.level)} 
                 className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center gap-3 hover:border-emerald-500 group"
              >
                 <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <LayoutGrid size={24} />
                 </div>
                 <span className="font-bold text-slate-800 text-lg text-center">{c.level}</span>
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
           <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
             <div className="flex items-center gap-3">
               <button onClick={() => setSelectedClass(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors" title="Retour aux classes">
                 <ArrowLeft size={18} />
               </button>
               <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
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
           <div className="overflow-x-auto overflow-hidden text-sm">
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
                     <div className="font-semibold text-slate-800">{student.lastName} {student.firstName}</div>
                     <div className="text-[10px] text-slate-400 font-mono">ID: {student.id}</div>
                   </td>
                   <td className="px-4 py-3 text-slate-600">{student.level}</td>
                   <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                     {student.fatherContact || student.motherContact || student.guardianContact || "-"}
                   </td>
                   <td className="px-4 py-3 text-slate-500">
                      {new Date(student.dateOfBirth).toLocaleDateString()}
                   </td>
                   <td className="px-4 py-3">
                     {student.status === "ACTIVE" || !student.status ? <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] uppercase font-bold">Actif</span> : null}
                     {student.status === "DROPOUT" ? <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-[10px] uppercase font-bold">Abandon</span> : null}
                     {student.status === "EXCLUDED" ? <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded text-[10px] uppercase font-bold">Exclus</span> : null}
                     {student.status === "PASSING" ? <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px] uppercase font-bold">Admis</span> : null}
                     {student.status === "REPEATING" ? <span className="text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded text-[10px] uppercase font-bold">Redoublant</span> : null}
                   </td>
                   <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">{student.discountPercentage || 0}%</td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex flex-col">
               <h3 className="font-bold text-lg text-slate-800">Éditer {showEditModal.firstName}</h3>
               <p className="text-xs text-slate-500">Mise à jour du statut ou de la remise</p>
            </div>
            <form onSubmit={handleSaveStudent} className="p-4 space-y-4">
               <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">Statut</label>
                  <select required value={showEditModal.status || "ACTIVE"} onChange={e => setShowEditModal({...showEditModal, status: e.target.value as any})} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                     <option value="ACTIVE">Actif (Inscrit normalement)</option>
                     <option value="DROPOUT">Abandon</option>
                     <option value="EXCLUDED">Exclus</option>
                     <option value="PASSING">Admis (Fin d'année)</option>
                     <option value="REPEATING">Redoublant</option>
                  </select>
                  {showEditModal.status === "EXCLUDED" && (
                     <p className="text-[10px] text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={10} /> L'élève sera marqué comme exclu de l'établissement.</p>
                  )}
               </div>
               <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">Remise sur scolarité (%)</label>
                  <input required type="number" min="0" max="100" value={showEditModal.discountPercentage || 0} onChange={e => setShowEditModal({...showEditModal, discountPercentage: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded text-sm outline-none" />
                  <p className="text-[10px] text-slate-500 mt-1">Exemple: 10 pour 10% de réduction.</p>
               </div>
               
               <div className="flex justify-end gap-3 mt-6">
                 <button type="button" onClick={() => setShowEditModal(null)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded uppercase tracking-wider transition-colors">Annuler</button>
                 <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-sm uppercase tracking-wider transition-colors">Enregistrer</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                   <h3 className="font-bold text-lg text-slate-800">Exporter les Données</h3>
                   <p className="text-xs text-slate-500">Configurez l'export CSV</p>
                </div>
            </div>
            <div className="p-4 space-y-4">
                <div>
                   <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">Type d'Export</label>
                   <select value={exportFormat} onChange={e => setExportFormat(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                      <option value="CONTACTS">Contacts Parents (Nom parent, Tél, Relation, Nom Élève)</option>
                      <option value="SIMPLE">Liste Simple (Nom, Prénom, Sexe, Date naiss.)</option>
                      <option value="FULL">Fiche Complète (N° EducMaster, Statut, Origine...)</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">Filtrer par Classe</label>
                   <select value={exportClass} onChange={e => setExportClass(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                      <option value="ALL">Toutes les classes</option>
                      {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">Filtre Statut Initiale (Élève)</label>
                   <select value={exportStatus} onChange={e => setExportStatus(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                      <option value="ALL">Tous (Nouveaux et Anciens)</option>
                      <option value="NEW">Nouveaux Élèves Uniquement</option>
                      <option value="OLD">Anciens Élèves (Réinscrits)</option>
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
    </div>
  );
}
