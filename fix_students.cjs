const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolAdminStudents.tsx', 'utf8');

// Move buttons
code = code.replace(
  `{activeTab === "STUDENTS" && (
          <div className="flex gap-2">
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
        )}`,
  ``
);

code = code.replace(
  `{activeTab === "STUDENTS" && (
        <>
          {!selectedClass ? (`,
  `{activeTab === "STUDENTS" && (
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
          {!selectedClass ? (`
);

// Add exportYear state
code = code.replace(
  `const [exportStatus, setExportStatus] = useState<"ALL" | "NEW" | "OLD">("ALL");`,
  `const [exportStatus, setExportStatus] = useState<"ALL" | "NEW" | "OLD">("ALL");
  const [exportYear, setExportYear] = useState<string>("ALL");`
);

// Add exportYear filter
code = code.replace(
  `if (exportStatus !== "ALL") {
        selectedStudents = selectedStudents.filter(s => s.studentType === exportStatus);
    }`,
  `if (exportStatus !== "ALL") {
        selectedStudents = selectedStudents.filter(s => s.studentType === exportStatus);
    }
    
    if (exportYear !== "ALL") {
        selectedStudents = selectedStudents.filter(s => s.academicYear === exportYear);
    }`
);

// Add exportYear UI
code = code.replace(
  `<option value="OLD">Anciens Élèves (Réinscrits)</option>
                   </select>
                </div>`,
  `<option value="OLD">Anciens Élèves (Réinscrits)</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Filtre par Année Scolaire</label>
                   <select value={exportYear} onChange={e => setExportYear(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                      <option value="ALL">Toutes les années</option>
                      <option value="2024-2025">2024-2025</option>
                      <option value="2023-2024">2023-2024</option>
                   </select>
                </div>`
);

fs.writeFileSync('src/pages/SchoolAdminStudents.tsx', code);
