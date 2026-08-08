import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Student } from "../types";
import { useAuth } from "../lib/auth";
import { FileText, Printer, FileBadge2 } from "lucide-react";
import html2pdf from "html2pdf.js";

export function SecretaryDocuments() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [docType, setDocType] = useState<"CERTIFICAT" | "BULLETIN" | "ATTESTATION">("CERTIFICAT");
  const [schoolSettings, setSchoolSettings] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.schoolId) return;
      
      const [studentsRes, settingsRes] = await Promise.all([
        supabase.from('students').select('*').eq('school_id', user.schoolId),
        supabase.from('schools').select('*').eq('id', user.schoolId).single()
      ]);
      
      if (studentsRes.data) {
         setStudents(studentsRes.data.map(d => ({
           id: d.id,
           schoolId: d.school_id,
           firstName: d.first_name,
           lastName: d.last_name,
           level: d.level,
           dateOfBirth: d.date_of_birth,
           gender: d.gender,
           address: d.address,
           parentName: d.parent_name,
           parentPhone: d.parent_phone,
           parentEmail: d.parent_email,
           status: d.status,
           createdAt: new Date(d.created_at).getTime()
         })));
      }
      
      if (settingsRes.data) {
         setSchoolSettings(settingsRes.data);
      }
    };
    
    fetchData();
  }, [user]);

  const generatePDF = () => {
    if (!selectedStudent) return;
    const element = document.getElementById("document-preview");
    if (!element) return;
    
    const fileName = `${docType}_${selectedStudent.lastName}_${selectedStudent.firstName}.pdf`;
    
    const opt = {
      margin:       10,
      filename:     fileName.replace(/ /g, '_'),
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  const filteredStudents = students.filter(s => {
    const nameStr = `${s.firstName} ${s.lastName}`.toLowerCase();
    return nameStr.includes(searchTerm.toLowerCase());
  }).slice(0, 5); // Just show top 5 for fast selection

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="w-full sm:w-1/3 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-gray-700 mb-3">Sélection de l'Élève</h3>
            <input 
              type="text" 
              placeholder="Rechercher un élève..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm mb-2"
            />
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {filteredStudents.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => setSelectedStudent(s)}
                  className={`p-2 rounded cursor-pointer text-sm ${selectedStudent?.id === s.id ? 'bg-emerald-100 border border-emerald-300 font-bold' : 'hover:bg-slate-50 border border-transparent'}`}
                >
                  {s.lastName} {s.firstName} - {s.level}
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-gray-700 mb-3">Type de document</h3>
            <select value={docType} onChange={e => setDocType(e.target.value as any)} className="w-full px-3 py-2 border rounded text-sm">
              <option value="CERTIFICAT">Certificat de Scolarité</option>
              <option value="BULLETIN">Bulletin de Notes (Simulation)</option>
              <option value="ATTESTATION">Attestation de Fréquentation</option>
            </select>
            
            <button 
              onClick={generatePDF}
              disabled={!selectedStudent}
              className="w-full mt-4 px-4 py-2 bg-slate-900 text-white rounded text-sm font-bold uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Printer size={16} /> Générer PDF
            </button>
          </div>
        </div>

        <div className="w-full sm:w-2/3">
          {selectedStudent ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 overflow-auto flex justify-center items-center bg-slate-50">
               <div id="document-preview" className="bg-white w-[210mm] min-h-[297mm] p-[20mm] shadow-lg text-black" style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}>
                  {/* Document Header */}
                  <div className="text-center mb-10">
                     <h1 className="text-2xl font-black uppercase mb-2 border-b-2 border-black inline-block pb-1">{schoolSettings?.name || "L'ÉCOLE"}</h1>
                     <p className="text-sm">{schoolSettings?.address}</p>
                     <p className="text-sm mt-1">Tél: {schoolSettings?.phone}</p>
                     <p className="text-sm mt-1 font-bold">Année Scolaire: 2023-2024</p>
                  </div>

                  {/* Document Body */}
                  <h2 className="text-xl font-bold text-center underline uppercase mb-12 tracking-widest">
                     {docType === 'CERTIFICAT' ? 'Certificat de Scolarité' : docType === 'ATTESTATION' ? 'Attestation de Fréquentation' : 'Bulletin de Notes'}
                  </h2>

                  {(docType === 'CERTIFICAT' || docType === 'ATTESTATION') && (
                    <div className="text-justify leading-loose text-lg px-8">
                       <p>Je soussigné(e), Directeur/Directrice de <strong>{schoolSettings?.name || "L'École"}</strong>,</p>
                       <p className="mt-4">Certifie par la présente que :</p>
                       <p className="mt-4 ml-8">L'élève <strong>{selectedStudent.lastName} {selectedStudent.firstName}</strong>,</p>
                       <p className="ml-8">Inscrit(e) sous le numéro matricule / EducMaster : {selectedStudent.educmasterNumber || 'Néant'},</p>
                       <p className="mt-4">Est régulièrement inscrit(e) et fréquente la classe de <strong>{selectedStudent.level}</strong> dans notre établissement au titre de l'année scolaire <strong>2023-2024</strong>.</p>
                       
                       <p className="mt-12">En foi de quoi, ce présent {docType.toLowerCase()} lui est délivré pour servir et valoir ce que de droit.</p>
                    </div>
                  )}

                  {docType === 'BULLETIN' && (
                    <div className="px-8">
                       <div className="flex justify-between mb-8">
                         <div>
                           <p><strong>Nom:</strong> {selectedStudent.lastName}</p>
                           <p><strong>Prénom:</strong> {selectedStudent.firstName}</p>
                         </div>
                         <div>
                           <p><strong>Classe:</strong> {selectedStudent.level}</p>
                           <p><strong>Effectif:</strong> 42</p>
                         </div>
                       </div>
                       <table className="w-full border-collapse border border-black mb-8">
                         <thead>
                           <tr className="bg-gray-100">
                             <th className="border border-black p-2 text-left">Matières</th>
                             <th className="border border-black p-2 text-center">Moyenne</th>
                             <th className="border border-black p-2 text-center">Coef</th>
                             <th className="border border-black p-2 text-left">Appréciations</th>
                           </tr>
                         </thead>
                         <tbody>
                           <tr>
                             <td className="border border-black p-2">Mathématiques</td>
                             <td className="border border-black p-2 text-center">14.50</td>
                             <td className="border border-black p-2 text-center">4</td>
                             <td className="border border-black p-2">Bon travail</td>
                           </tr>
                           <tr>
                             <td className="border border-black p-2">Français</td>
                             <td className="border border-black p-2 text-center">12.00</td>
                             <td className="border border-black p-2 text-center">3</td>
                             <td className="border border-black p-2">Assez bien</td>
                           </tr>
                           <tr>
                             <td className="border border-black p-2">Physique-Chimie</td>
                             <td className="border border-black p-2 text-center">16.00</td>
                             <td className="border border-black p-2 text-center">4</td>
                             <td className="border border-black p-2">Très bon trimestre</td>
                           </tr>
                         </tbody>
                       </table>
                       <p className="text-right font-bold text-lg">Moyenne Trimestrielle: 14.38 / 20</p>
                       <p className="text-right mt-2">Rang: 5ème</p>
                    </div>
                  )}

                  {/* Signatures */}
                  <div className="mt-20 flex justify-end px-8">
                     <div className="text-center">
                        <p>Fait à {schoolSettings?.address?.split(',')[0] || 'Cotonou'}, le {new Date().toLocaleDateString()}</p>
                        <p className="mt-2 font-bold">Le Chef d'Établissement</p>
                        <div className="h-24 w-48 mt-4 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">Cachet & Signature</div>
                     </div>
                  </div>
               </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-slate-200 shadow-sm p-12 text-center h-full flex flex-col items-center justify-center">
               <FileBadge2 size={48} className="text-slate-300 mb-4" />
               <p className="text-slate-500">Sélectionnez un élève pour prévisualiser le document.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
