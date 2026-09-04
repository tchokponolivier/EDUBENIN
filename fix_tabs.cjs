const fs = require('fs');

// Fix SchoolAdminPayments
let pCode = fs.readFileSync('src/pages/SchoolAdminPayments.tsx', 'utf8');
pCode = pCode.replace(
  /<button\s+onClick=\{\(\) => setActiveTab\("INSCRIPTIONS"\)\}\s+className=\{\`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors \$\{activeTab === "INSCRIPTIONS" \? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"\}\`\}\s+>\s+Inscriptions\s+<\/button>/g,
  ''
);
fs.writeFileSync('src/pages/SchoolAdminPayments.tsx', pCode);

// Fix SchoolAdmin
let aCode = fs.readFileSync('src/pages/SchoolAdmin.tsx', 'utf8');
aCode = aCode.replace(
  /<button\s+onClick=\{\(\) => setActiveTab\("SETTINGS"\)\}\s+className=\{\`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors \$\{activeTab === "SETTINGS" \? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"\}\`\}\s+>\s+<span className="flex items-center gap-2"><Settings size=\{14\} \/> Paramètres<\/span>\s+<\/button>/g,
  ''
);

// Fix Settings Form layout
aCode = aCode.replace(
  /<form onSubmit=\{handleSettingsSave\} className="space-y-4">/g,
  '<form onSubmit={handleSettingsSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">'
);
// Adjust the submit button wrapper to span full width
aCode = aCode.replace(
  /<div className="pt-4 mt-4 border-t border-slate-100">/g,
  '<div className="pt-4 mt-4 border-t border-slate-100 md:col-span-2">'
);
// Adjust the textarea container to span full width
aCode = aCode.replace(
  /<div>\s*<label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Modèle de la fiche d'engagement<\/label>/g,
  '<div className="md:col-span-2">\n               <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Modèle de la fiche d\'engagement</label>'
);
fs.writeFileSync('src/pages/SchoolAdmin.tsx', aCode);
