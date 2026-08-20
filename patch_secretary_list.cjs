const fs = require('fs');
let content = fs.readFileSync('src/pages/SchoolAdminStudentList.tsx', 'utf-8');

const target1 = `  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");`;
const insert1 = `  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedStudentInfo, setSelectedStudentInfo] = useState<any>(null);`;
content = content.replace(target1, insert1);

const target2 = `  const filteredStudents = students.filter(s => {
    const matchSearch = (s.first_name + " " + s.last_name).toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (s.educmaster_number || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = selectedClass === "ALL" || s.level === selectedClass;
    return matchSearch && matchClass;
  });`;
const insert2 = `  const years = Array.from(new Set(students.map(s => {
    if (!s.created_at) return null;
    return new Date(s.created_at).getFullYear().toString();
  }).filter(Boolean))).sort().reverse();

  const filteredStudents = students.filter(s => {
    const matchSearch = (s.first_name + " " + s.last_name).toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (s.educmaster_number || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = selectedClass === "ALL" || s.level === selectedClass;
    const matchYear = selectedYear === "ALL" || (s.created_at && new Date(s.created_at).getFullYear().toString() === selectedYear);
    return matchSearch && matchClass && matchYear;
  });`;
content = content.replace(target2, insert2);

const target3 = `            <select 
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-700 bg-white"
            >`;
const insert3 = `            <select 
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-700 bg-white"
            >
              <option value="ALL">Toutes les années</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select 
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-700 bg-white"
            >`;
content = content.replace(target3, insert3);

// Card de la classe : "voir date inscription et qui a inscrit l'enfant" "quand on clique sur un enfant on doit pouvoir voir toutes ces informations"
// Let's add onClick to the cards and show a modal.

const target4 = `                <div key={student.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0">
                    <img src={student.photo || "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=150&h=150"} alt="Elève" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-sm truncate">{student.last_name} {student.first_name}</h3>
                    <p className="text-xs text-slate-500 mb-2">N° EducMaster: {student.educmaster_number || "Non renseigné"}</p>
                    
                    <div className="flex flex-wrap gap-2">
                       <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                         {student.status === "ACTIVE" ? "Actif" : student.status}
                       </span>
                       <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                         {student.student_type === "NEW" ? "Nouvel Élève" : "Ancien Élève"}
                       </span>
                    </div>
                  </div>
                </div>`;

const insert4 = `                <div key={student.id} onClick={() => setSelectedStudentInfo(student)} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex items-start gap-4 cursor-pointer">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0">
                    <img src={student.photo || "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=150&h=150"} alt="Elève" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-sm truncate">{student.last_name} {student.first_name}</h3>
                    <p className="text-[10px] text-slate-400 mb-1">Inscrit le {student.created_at ? new Date(student.created_at).toLocaleDateString() : '-'} par {student.parent_id ? 'Parent' : 'Secrétariat/Admin'}</p>
                    <p className="text-xs text-slate-500 mb-2">N° EducMaster: {student.educmaster_number || "Non renseigné"}</p>
                    
                    <div className="flex flex-wrap gap-2">
                       <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                         {student.status === "ACTIVE" ? "Actif" : student.status}
                       </span>
                       <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                         {student.student_type === "NEW" ? "Nouvel Élève" : "Ancien Élève"}
                       </span>
                    </div>
                  </div>
                </div>`;

content = content.replace(target4, insert4);

const target5 = `      {showAddModal && (
        <AddStudentModal onClose={() => setShowAddModal(false)} onSuccess={fetchData} />
      )}
    </div>
  );
}`;

const insert5 = `      {showAddModal && (
        <AddStudentModal onClose={() => setShowAddModal(false)} onSuccess={fetchData} />
      )}
      
      {selectedStudentInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 fade-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
               <h3 className="text-xl font-bold text-gray-800">Détails de l'élève</h3>
               <button onClick={() => setSelectedStudentInfo(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">Fermer</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
               <div className="flex items-center gap-6">
                 <img src={selectedStudentInfo.photo || "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=150&h=150"} alt="" className="w-24 h-24 rounded-full object-cover" />
                 <div>
                   <h2 className="text-2xl font-bold text-gray-800">{selectedStudentInfo.last_name} {selectedStudentInfo.first_name}</h2>
                   <p className="text-slate-500">{selectedStudentInfo.level}</p>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4 text-sm">
                 <div className="p-4 bg-slate-50 rounded-lg">
                   <p className="text-xs text-slate-500 font-bold uppercase mb-1">Informations</p>
                   <p><strong>Né(e) le :</strong> {selectedStudentInfo.date_of_birth ? new Date(selectedStudentInfo.date_of_birth).toLocaleDateString() : '?'}</p>
                   <p><strong>Sexe :</strong> {selectedStudentInfo.gender}</p>
                   <p><strong>EducMaster :</strong> {selectedStudentInfo.educmaster_number}</p>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-lg">
                   <p className="text-xs text-slate-500 font-bold uppercase mb-1">Contact Parent / Tuteur</p>
                   <p><strong>Père :</strong> {selectedStudentInfo.father_name} ({selectedStudentInfo.father_contact})</p>
                   <p><strong>Mère :</strong> {selectedStudentInfo.mother_name} ({selectedStudentInfo.mother_contact})</p>
                   <p><strong>Tuteur :</strong> {selectedStudentInfo.guardian_name} ({selectedStudentInfo.guardian_contact})</p>
                 </div>
               </div>
               
               <div className="p-4 bg-slate-50 rounded-lg text-sm">
                 <p className="text-xs text-slate-500 font-bold uppercase mb-1">Scolarité</p>
                 <p><strong>Classe précédente :</strong> {selectedStudentInfo.previous_class}</p>
                 <p><strong>École précédente :</strong> {selectedStudentInfo.previous_school}</p>
                 <p><strong>Cantine :</strong> {selectedStudentInfo.canteen_options || 'Non inscrit'}</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;
content = content.replace(target5, insert5);

fs.writeFileSync('src/pages/SchoolAdminStudentList.tsx', content);
console.log("Patched SchoolAdminStudentList");
