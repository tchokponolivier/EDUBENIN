const fs = require('fs');
let content = fs.readFileSync('src/pages/Parent.tsx', 'utf-8');

// Add "Non intéressé"
content = content.replace(
  `"Garde surveillée (200F / jour)",
                    "Repas cantine (200F / jour)",
                    "Repas cantine (500F / jour)",
                    "Repas cantine (1000F / jour)"`,
  `"Garde surveillée (200F / jour)",
                    "Repas cantine (200F / jour)",
                    "Repas cantine (500F / jour)",
                    "Repas cantine (1000F / jour)",
                    "Non intéressé"`
);

// Remove signature
const signatureBlock = `{disciplinaryCommitment && (
                    <div className="mt-4">
                      <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Signature (Écrivez votre nom complet précédé de "Lu et approuvé")</label>
                      <input 
                         required 
                         value={disciplinarySignature} 
                         onChange={e => setDisciplinarySignature(e.target.value)} 
                         type="text" 
                         placeholder="Lu et approuvé, [Votre Nom]"
                        className="w-full md:w-1/2 px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" 
                       />
                    </div>
                  )}`;
content = content.replace(signatureBlock, '');

// Fix modal not opening due to settings null
content = content.replace(
  '{showCommitmentModal && settings && (',
  '{showCommitmentModal && ('
);
// Also for SchoolAdmin Settings tab
let adminContent = fs.readFileSync('src/pages/SchoolAdmin.tsx', 'utf-8');
adminContent = adminContent.replace(
  '{activeTab === "SETTINGS" && settings && (',
  '{activeTab === "SETTINGS" && ('
);
// Add a fallback for settings default values
adminContent = adminContent.replace(
  'defaultValue={settings.name}',
  'defaultValue={settings?.name || ""}'
);
adminContent = adminContent.replace(
  'defaultValue={settings.address}',
  'defaultValue={settings?.address || ""}'
);
adminContent = adminContent.replace(
  'defaultValue={settings.contact}',
  'defaultValue={settings?.contact || ""}'
);
adminContent = adminContent.replace(
  'defaultValue={settings.motto}',
  'defaultValue={settings?.motto || ""}'
);
adminContent = adminContent.replace(
  'defaultValue={settings.directorName}',
  'defaultValue={settings?.directorName || ""}'
);
adminContent = adminContent.replace(
  'defaultValue={settings.establishmentDecision}',
  'defaultValue={settings?.establishmentDecision || ""}'
);
fs.writeFileSync('src/pages/Parent.tsx', content);
fs.writeFileSync('src/pages/SchoolAdmin.tsx', adminContent);
