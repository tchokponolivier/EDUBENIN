const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolAdminStats.tsx', 'utf8');

const newTabContent = `
      {activeTab === "SYNTHESE_ELEVE" && (
         <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
               <div className="flex-1">
                 <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Année Scolaire</label>
                 <select value={synthYear} onChange={e => setSynthYear(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 outline-none text-sm">
                    <option value="">Toutes les années</option>
                    {academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
                 </select>
               </div>
               <div className="flex-1">
                 <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Classe</label>
                 <select value={synthClass} onChange={e => setSynthClass(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 outline-none text-sm">
                    <option value="">Toutes les classes</option>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
               </div>
               <div className="flex-1">
                 <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Élève (Matricule - Nom)</label>
                 <select value={synthStudentId} onChange={e => setSynthStudentId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 outline-none text-sm">
                    <option value="">Sélectionner un élève</option>
                    {synthFilteredStudents.map(s => (
                       <option key={s.id} value={s.id}>
                          {s.matricule || s.id.substring(0,8)} - {s.first_name} {s.last_name}
                       </option>
                    ))}
                 </select>
               </div>
            </div>

            {selectedSynthStudent ? (
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                     <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Informations de l'Élève</h3>
                     <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                           <span className="text-slate-500">Nom Complet:</span>
                           <span className="font-bold">{selectedSynthStudent.first_name} {selectedSynthStudent.last_name}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-slate-500">Matricule:</span>
                           <span className="font-bold">{selectedSynthStudent.matricule || selectedSynthStudent.id.substring(0,8)}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-slate-500">Classe:</span>
                           <span className="font-bold">{selectedSynthStudent.level}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-slate-500">Année Scolaire:</span>
                           <span className="font-bold">{selectedSynthStudent.academic_year || selectedSynthStudent.academicYear}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-slate-500">Sexe:</span>
                           <span className="font-bold">{selectedSynthStudent.gender === 'MALE' ? 'Masculin' : (selectedSynthStudent.gender === 'FEMALE' ? 'Féminin' : '-')}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-slate-500">Statut:</span>
                           <span className="font-bold text-emerald-600">{selectedSynthStudent.student_type === 'NEW' ? 'Nouveau' : 'Ancien'}</span>
                        </div>
                     </div>
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Synthèse Globale</h3>
                     <div className="flex items-center justify-center h-32 bg-slate-50 rounded border border-slate-100 text-center p-4">
                        <p className="text-slate-500 text-sm">
                           Les bulletins de notes et historiques des paiements détaillés apparaîtront ici dès que les modules pédagogiques et financiers seront consolidés pour cet élève.
                        </p>
                     </div>
                  </div>
               </div>
            ) : (
               <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 text-sm max-w-md mx-auto">
                     Sélectionnez un élève dans les filtres ci-dessus pour afficher sa synthèse individuelle.
                  </p>
               </div>
            )}
         </div>
      )}`;

const idx = code.indexOf('{activeTab === "SYNTHESE_ELEVE"');
if (idx !== -1) {
  const endIdx = code.indexOf('</div>\n  );\n}');
  if (endIdx !== -1) {
    code = code.substring(0, idx) + newTabContent + '\n    </div>\n  );\n}';
    fs.writeFileSync('src/pages/SchoolAdminStats.tsx', code);
  }
}
