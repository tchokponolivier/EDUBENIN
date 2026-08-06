import re

def rewrite_students():
    with open('src/pages/SchoolAdminStudents.tsx', 'r') as f:
        content = f.read()

    # Locate the return statement
    return_index = content.find("return (\n    <div className=\"flex flex-col h-full relative\">\n")
    if return_index == -1:
        print("Cannot find return in Students")
        return

    # Add the tabs UI right after
    tabs_ui = '''      <div className="flex p-1 bg-slate-100 rounded-lg shrink-0 overflow-x-auto mb-6">
        <button onClick={() => setActiveTab("ELEVES")} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "ELEVES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}>Élèves & Inscriptions</button>
        <button onClick={() => setActiveTab("ABSENCES")} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "ABSENCES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}>Absences & Retards</button>
        <button onClick={() => setActiveTab("EMPLOIS_TEMPS")} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "EMPLOIS_TEMPS" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}>Emplois du temps</button>
        <button onClick={() => setActiveTab("ARCHIVES")} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "ARCHIVES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}>Archivage</button>
      </div>

      {activeTab === "ELEVES" && (
        <>
'''
    content = content.replace("return (\n    <div className=\"flex flex-col h-full relative\">\n", "return (\n    <div className=\"flex flex-col h-full relative p-2\">\n" + tabs_ui)
    
    # Locate the end of the main view before modals
    end_main_index = content.find("{/* Modal Export */}")
    
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
    content = content.replace("{/* Modal Export */}", other_tabs + "{/* Modal Export */}")

    with open('src/pages/SchoolAdminStudents.tsx', 'w') as f:
        f.write(content)

rewrite_students()
