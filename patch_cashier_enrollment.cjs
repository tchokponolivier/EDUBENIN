const fs = require('fs');
let content = fs.readFileSync('src/components/CashierEnrollment.tsx', 'utf-8');

const signatureBlock2 = `{disciplinaryCommitment && (
                  <div className="mt-4">
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Signature Parent (Lu et approuvé)</label>
                    <input 
                      required 
                      value={disciplinarySignature} 
                      onChange={e => setDisciplinarySignature(e.target.value)} 
                      type="text" 
                      placeholder="Lu et approuvé, [Nom du parent]"
                      className="w-full md:w-1/2 px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" 
                    />
                  </div>
                )}`;
content = content.replace(signatureBlock2, '');
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
fs.writeFileSync('src/components/CashierEnrollment.tsx', content);
