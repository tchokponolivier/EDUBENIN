import re

# 1. Update SchoolAdminStudents.tsx
with open('src/pages/SchoolAdminStudents.tsx', 'r') as f:
    content = f.read()

tabs_ui_students = '''      <div className="flex p-1 bg-slate-100 rounded-lg shrink-0 overflow-x-auto mb-2">
        <button onClick={() => setActiveTab("ELEVES")} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "ELEVES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}>Élèves & Inscriptions</button>
        {user?.role === 'SCHOOL_ADMIN' && (
          <>
            <button onClick={() => setActiveTab("ABSENCES")} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "ABSENCES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}>Absences & Retards</button>
            <button onClick={() => setActiveTab("EMPLOIS_TEMPS")} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "EMPLOIS_TEMPS" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}>Emplois du temps</button>
            <button onClick={() => setActiveTab("ARCHIVES")} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "ARCHIVES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}>Archivage</button>
          </>
        )}
      </div>'''

# We just replace the entire div containing the tabs
content = re.sub(r'<div className="flex p-1 bg-slate-100 rounded-lg shrink-0 overflow-x-auto mb-2">.*?</div>', tabs_ui_students, content, flags=re.DOTALL, count=1)

with open('src/pages/SchoolAdminStudents.tsx', 'w') as f:
    f.write(content)

# 2. Update SchoolAdminPayments.tsx
with open('src/pages/SchoolAdminPayments.tsx', 'r') as f:
    content = f.read()

tabs_ui_payments = '''      <div className="flex p-1 bg-slate-100 rounded-lg shrink-0 overflow-x-auto mb-2">
        <button onClick={() => setActiveTab("PAIEMENTS")} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "PAIEMENTS" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}>Paiements Scolarité</button>
        {user?.role === 'SCHOOL_ADMIN' && (
          <button onClick={() => setActiveTab("CREANCES")} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "CREANCES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}>Créances & Relances</button>
        )}
        {user?.role === 'SCHOOL_ADMIN' && (
          <button onClick={() => setActiveTab("DEPENSES")} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "DEPENSES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}>Dépenses</button>
        )}
        <button onClick={() => setActiveTab("CAISSE_JOUR")} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "CAISSE_JOUR" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}>Caisse Journalière</button>
      </div>'''

content = re.sub(r'<div className="flex p-1 bg-slate-100 rounded-lg shrink-0 overflow-x-auto mb-2">.*?</div>', tabs_ui_payments, content, flags=re.DOTALL, count=1)

with open('src/pages/SchoolAdminPayments.tsx', 'w') as f:
    f.write(content)
