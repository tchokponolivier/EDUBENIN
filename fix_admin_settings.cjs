const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolAdmin.tsx', 'utf8');

code = code.replace(
  `<div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-2xl">`,
  `<div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full">`
);

// Remove academic year from the form
code = code.replace(
  `             <div>
               <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Année académique en cours</label>
               <input name="academicYear" defaultValue={settings?.academicYear || ""} required type="text" className="w-full px-4 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
             </div>`,
  ``
);

// Remove academicYear from updates object in handleSettingsSave to avoid undefined error
code = code.replace(
  `academicYear: formData.get("academicYear") as string,`,
  ``
);

// Change Devise to dropdown
code = code.replace(
  `             <div>
               <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Devise</label>
               <input name="motto" defaultValue={settings?.motto || ""} required type="text" className="w-full px-4 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
             </div>`,
  `             <div>
               <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Devise (Monnaie)</label>
               <select name="motto" defaultValue={settings?.motto || "FCFA"} className="w-full px-4 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white">
                  <option value="FCFA">Franc CFA (XOF/XAF)</option>
                  <option value="GNF">Franc Guinéen (GNF)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="USD">Dollar US ($)</option>
               </select>
             </div>`
);

fs.writeFileSync('src/pages/SchoolAdmin.tsx', code);
