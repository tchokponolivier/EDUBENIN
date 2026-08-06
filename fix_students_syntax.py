import re

with open('src/pages/SchoolAdminStudents.tsx', 'r') as f:
    content = f.read()

other_tabs = '''
        </>
      )}

      {activeTab === "ABSENCES" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-6">Gestion Centralisée des Absences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wider border-b pb-2">Déclarer une absence</h3>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Absence enregistrée."); }}>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Élève</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded">
                    {students.map(s => <option key={s.id}>{s.firstName} {s.lastName} ({s.level})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Motif</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded">
                    <option>Justifiée (Maladie)</option>
                    <option>Non justifiée</option>
                    <option>Retard</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-2 bg-emerald-600 text-white rounded font-bold">Enregistrer</button>
              </form>
            </div>
            <div>
              <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wider border-b pb-2">Absences Récentes</h3>
              <ul className="space-y-3">
                <li className="p-3 bg-red-50 border border-red-100 rounded">
                  <div className="flex justify-between font-bold text-gray-800 text-sm">
                    <span>HOUENOU Dylan (6ème)</span>
                    <span className="text-red-600">Non Justifiée</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === "EMPLOIS_TEMPS" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-6">Emplois du Temps</h2>
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-6">
            <h3 className="font-bold text-orange-800 mb-2">⚠️ Conflits Détectés (1)</h3>
            <p className="text-sm text-orange-700">Le Professeur M. DUPONT est affecté en 6ème et en 5ème le Mardi à 10h00.</p>
          </div>
        </div>
      )}

      {activeTab === "ARCHIVES" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-6">Archives des Élèves</h2>
          <div className="text-center p-8 bg-slate-50 rounded border border-slate-100 text-slate-500">
            Aucun élève archivé pour le moment.
          </div>
        </div>
      )}

'''

# I will replace '{showExportModal && (' with the tabs followed by '{showExportModal && ('
content = content.replace('{showExportModal && (', other_tabs + '{showExportModal && (')

with open('src/pages/SchoolAdminStudents.tsx', 'w') as f:
    f.write(content)

