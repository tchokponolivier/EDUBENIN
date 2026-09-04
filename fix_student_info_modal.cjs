const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolAdminStudentList.tsx', 'utf8');

const modalCode = `
      {selectedStudentInfo && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
               <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-gray-700">Profil de l'Élève</h3>
                  <button onClick={() => setSelectedStudentInfo(null)} className="text-slate-400 hover:text-slate-600">
                     <span className="text-xl">&times;</span>
                  </button>
               </div>
               <div className="p-6 overflow-y-auto space-y-6">
                  <div className="flex items-center gap-4">
                     {selectedStudentInfo.photo ? (
                         <img src={selectedStudentInfo.photo} alt="Photo" className="w-20 h-20 rounded-full object-cover border-4 border-slate-100" />
                     ) : (
                         <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-4 border-slate-50">
                             <Users size={32} />
                         </div>
                     )}
                     <div>
                         <h2 className="text-2xl font-bold text-gray-800">{selectedStudentInfo.first_name} {selectedStudentInfo.last_name}</h2>
                         <p className="text-emerald-600 font-bold">{selectedStudentInfo.level} • {selectedStudentInfo.academic_year}</p>
                         <p className="text-sm text-slate-500">Matricule: {selectedStudentInfo.matricule || selectedStudentInfo.id.substring(0,8)}</p>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <h4 className="font-bold text-slate-700 mb-2 border-b pb-1">Informations Personnelles</h4>
                          <ul className="space-y-2 text-sm">
                              <li><span className="text-slate-500">Date de naissance:</span> {selectedStudentInfo.date_of_birth || 'N/A'}</li>
                              <li><span className="text-slate-500">Lieu de naissance:</span> {selectedStudentInfo.place_of_birth || 'N/A'}</li>
                              <li><span className="text-slate-500">Sexe:</span> {selectedStudentInfo.gender === 'MALE' ? 'Masculin' : (selectedStudentInfo.gender === 'FEMALE' ? 'Féminin' : 'N/A')}</li>
                              <li><span className="text-slate-500">Nationalité:</span> {selectedStudentInfo.nationality || 'N/A'}</li>
                              <li><span className="text-slate-500">Religion:</span> {selectedStudentInfo.religion || 'N/A'}</li>
                          </ul>
                      </div>
                      <div>
                          <h4 className="font-bold text-slate-700 mb-2 border-b pb-1">Scolarité</h4>
                          <ul className="space-y-2 text-sm">
                              <li><span className="text-slate-500">Type d'élève:</span> {selectedStudentInfo.student_type === 'NEW' ? 'Nouveau' : 'Ancien'}</li>
                              <li><span className="text-slate-500">École précédente:</span> {selectedStudentInfo.previous_school || 'N/A'}</li>
                              <li><span className="text-slate-500">Classe précédente:</span> {selectedStudentInfo.previous_class || 'N/A'}</li>
                              <li><span className="text-slate-500">Numéro EducMaster:</span> {selectedStudentInfo.educmaster_number || 'N/A'}</li>
                              <li><span className="text-slate-500">Option Cantine:</span> {selectedStudentInfo.canteen_options || 'N/A'}</li>
                          </ul>
                      </div>
                      <div className="md:col-span-2">
                          <h4 className="font-bold text-slate-700 mb-2 border-b pb-1">Informations Parents / Tuteur</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div>
                                  <p className="font-semibold text-slate-600 mb-1">Père</p>
                                  <p><span className="text-slate-500">Nom:</span> {selectedStudentInfo.father_name || 'N/A'}</p>
                                  <p><span className="text-slate-500">Profession:</span> {selectedStudentInfo.father_profession || 'N/A'}</p>
                                  <p><span className="text-slate-500">Contact:</span> {selectedStudentInfo.father_contact || 'N/A'}</p>
                              </div>
                              <div>
                                  <p className="font-semibold text-slate-600 mb-1">Mère</p>
                                  <p><span className="text-slate-500">Nom:</span> {selectedStudentInfo.mother_name || 'N/A'}</p>
                                  <p><span className="text-slate-500">Profession:</span> {selectedStudentInfo.mother_profession || 'N/A'}</p>
                                  <p><span className="text-slate-500">Contact:</span> {selectedStudentInfo.mother_contact || 'N/A'}</p>
                              </div>
                          </div>
                      </div>
                  </div>
               </div>
            </div>
         </div>
      )}`;

code = code.replace(
  `{showAddModal && (`,
  modalCode + '\n      {showAddModal && ('
);

fs.writeFileSync('src/pages/SchoolAdminStudentList.tsx', code);
