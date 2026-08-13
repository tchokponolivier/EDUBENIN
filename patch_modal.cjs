const fs = require('fs');

let content = fs.readFileSync('src/components/AddStudentModal.tsx', 'utf-8');

const search = `                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">WhatsApp / Contact du tuteur</label>
                    <input value={guardianContact} onChange={e => setGuardianContact(e.target.value)} type="tel" placeholder="Si différent des parents" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-slate-300" />
                  </div>
                </div>`;

const replace = `                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">WhatsApp / Contact du tuteur</label>
                    <input value={guardianContact} onChange={e => setGuardianContact(e.target.value)} type="tel" placeholder="Si différent des parents" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-slate-300" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Adresse (Tuteur)</label>
                    <input value={guardianAddress} onChange={e => setGuardianAddress(e.target.value)} type="text" placeholder="Si différent des parents" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-slate-300" />
                  </div>
                </div>`;
                
if(content.includes(search)) {
   content = content.replace(search, replace);
   fs.writeFileSync('src/components/AddStudentModal.tsx', content);
   console.log("Patched AddStudentModal");
} else {
   console.log("Could not find block in AddStudentModal");
}
