import re

with open('src/pages/TeacherDashboard.tsx', 'r') as f:
    content = f.read()

tabs_ui = '''      <div className="flex p-1 bg-slate-100 rounded-lg shrink-0 overflow-x-auto mb-2">
        <button onClick={() => setActiveTab("NOTES")} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "NOTES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}>Notes & Bulletins</button>
        <button onClick={() => setActiveTab("APPEL")} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "APPEL" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}>Faire l'Appel</button>
        <button onClick={() => setActiveTab("PLANNING")} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "PLANNING" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}>Mon Planning</button>
      </div>

      {activeTab === "NOTES" && (
        <>
'''

content = content.replace('<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">', tabs_ui + '\n<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">')

other_tabs = '''
        </>
      )}

      {activeTab === "APPEL" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-6">Faire l'appel</h2>
          <div className="text-center p-8 bg-slate-50 rounded border border-slate-100 text-slate-500">
            Sélectionnez une classe pour commencer l'appel.
          </div>
        </div>
      )}

'''
# Add other tabs right before {activeTab === "PLANNING" && ( because I see it already has PLANNING.
content = content.replace('{activeTab === "PLANNING" && (', other_tabs + '{activeTab === "PLANNING" && (')

with open('src/pages/TeacherDashboard.tsx', 'w') as f:
    f.write(content)

