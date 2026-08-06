import re

def fix_students():
    with open('src/pages/SchoolAdminStudents.tsx', 'r') as f:
        content = f.read()

    tabs_ui = '''      <div className="flex p-1 bg-slate-100 rounded-lg shrink-0 overflow-x-auto mb-2">
        <button onClick={() => setActiveTab("ELEVES")} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "ELEVES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}>Élèves & Inscriptions</button>
        <button onClick={() => setActiveTab("ABSENCES")} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "ABSENCES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}>Absences & Retards</button>
        <button onClick={() => setActiveTab("EMPLOIS_TEMPS")} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "EMPLOIS_TEMPS" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}>Emplois du temps</button>
        <button onClick={() => setActiveTab("ARCHIVES")} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "ARCHIVES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}>Archivage</button>
      </div>

      {activeTab === "ELEVES" && (
        <>
'''
    
    content = content.replace('<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">', tabs_ui + '\n<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">')
    
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
    # Put other tabs right before {/* Modal Export */}
    content = content.replace("{/* Modal Export */}", other_tabs + "{/* Modal Export */}")
    
    with open('src/pages/SchoolAdminStudents.tsx', 'w') as f:
        f.write(content)


def fix_payments():
    with open('src/pages/SchoolAdminPayments.tsx', 'r') as f:
        content = f.read()

    tabs_ui = '''      <div className="flex p-1 bg-slate-100 rounded-lg shrink-0 overflow-x-auto mb-2">
        <button onClick={() => setActiveTab("PAIEMENTS")} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "PAIEMENTS" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}>Paiements Scolarité</button>
        <button onClick={() => setActiveTab("CREANCES")} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "CREANCES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}>Créances & Relances</button>
        <button onClick={() => setActiveTab("DEPENSES")} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "DEPENSES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}>Dépenses</button>
        <button onClick={() => setActiveTab("CAISSE_JOUR")} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "CAISSE_JOUR" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}>Caisse Journalière</button>
      </div>

      {activeTab === "PAIEMENTS" && (
        <>
'''
    content = content.replace('<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">', tabs_ui + '\n<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">')
    
    other_tabs = '''
        </>
      )}

      {activeTab === "CREANCES" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-6">État des Créances</h2>
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-6 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-orange-800 mb-1">Total des impayés</h3>
              <p className="text-sm text-orange-700">1 450 000 FCFA</p>
            </div>
            <button className="px-4 py-2 bg-orange-600 text-white font-bold rounded shadow-sm text-sm" onClick={() => alert("Relances envoyées !")}>Envoyer Relance SMS/WhatsApp Groupée</button>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Élève</th>
                <th className="px-4 py-3">Classe</th>
                <th className="px-4 py-3">Reste à payer</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium">BIAOU Océane</td>
                <td className="px-4 py-3">Terminale D</td>
                <td className="px-4 py-3 font-bold text-red-600">45 000 FCFA</td>
                <td className="px-4 py-3"><button className="text-emerald-600 font-bold" onClick={() => alert("Message envoyé à Océane.")}>Relancer</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "DEPENSES" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-700">Journal des Dépenses</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 border border-slate-200 rounded-lg p-4 bg-slate-50">
              <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Nouvelle Dépense</h3>
              <form className="space-y-4" onSubmit={e => { e.preventDefault(); alert("Dépense enregistrée"); }}>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Motif</label>
                  <input type="text" required className="w-full px-3 py-2 border border-slate-300 rounded" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Montant (FCFA)</label>
                  <input type="number" required className="w-full px-3 py-2 border border-slate-300 rounded" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Catégorie</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded">
                    <option>Fournitures</option>
                    <option>Entretien</option>
                    <option>Factures (Eau/Électricité)</option>
                    <option>Autre</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-slate-800 text-white font-bold py-2 rounded">Enregistrer</button>
              </form>
            </div>
            <div className="col-span-2">
               <div className="text-center p-8 bg-slate-50 rounded border border-slate-100 text-slate-500">
                 Aucune dépense récente.
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "CAISSE_JOUR" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-700">Point de Caisse Journalière</h2>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${caisseStatus === "OUVERTE" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                {caisseStatus === "OUVERTE" ? "Caisse Ouverte" : "Caisse Fermée"}
              </span>
              <button 
                onClick={() => setCaisseStatus(prev => prev === "OUVERTE" ? "FERMEE" : "OUVERTE")}
                className="px-4 py-2 border border-slate-200 rounded text-sm font-bold text-gray-700 hover:bg-slate-50"
              >
                {caisseStatus === "OUVERTE" ? "Fermer la caisse" : "Rouvrir la caisse"}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="text-xs font-bold text-emerald-800 uppercase mb-1">Entrées (Paiements)</div>
              <div className="text-2xl font-black text-emerald-600">350 000 F</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
              <div className="text-xs font-bold text-red-800 uppercase mb-1">Sorties (Dépenses)</div>
              <div className="text-2xl font-black text-red-600">0 F</div>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg border border-slate-900 shadow-md">
              <div className="text-xs font-bold text-slate-300 uppercase mb-1">Solde Caisse</div>
              <div className="text-2xl font-black text-white">350 000 F</div>
            </div>
          </div>
          
          <button className="w-full py-3 bg-emerald-600 text-white font-bold rounded shadow-sm hover:bg-emerald-700" onClick={() => alert("Bilan exporté.")}>
            Télécharger le bilan du jour (PDF)
          </button>
        </div>
      )}

'''
    
    # Put other tabs right before {showPayModal && (
    content = content.replace("{showPayModal && (", other_tabs + "{showPayModal && (")
    with open('src/pages/SchoolAdminPayments.tsx', 'w') as f:
        f.write(content)

fix_students()
fix_payments()
