const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolAdmin.tsx', 'utf8');

const target = `<div className="md:col-span-2">
               <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Modèle de la fiche d'engagement</label>`;

const replacement = `<div className="md:col-span-2">
               <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Signature du directeur</label>
               <div className="flex flex-col sm:flex-row gap-4 items-start">
                 <div className="border border-slate-300 rounded bg-slate-50 relative overflow-hidden" style={{ width: 300, height: 150 }}>
                   <SignatureCanvas 
                     ref={sigCanvas} 
                     penColor="black"
                     canvasProps={{width: 300, height: 150, className: 'sigCanvas'}} 
                     onEnd={() => setSignatureBase64(sigCanvas.current.getTrimmedCanvas().toDataURL('image/png'))}
                   />
                 </div>
                 <div className="flex flex-col gap-2">
                   <button 
                     type="button" 
                     onClick={() => { sigCanvas.current?.clear(); setSignatureBase64(""); }}
                     className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded hover:bg-slate-100"
                   >
                     Effacer
                   </button>
                   {(settings as any)?.directorSignature && !signatureBase64 && (
                     <div className="mt-2">
                       <p className="text-[10px] text-slate-500 mb-1 uppercase">Signature Actuelle :</p>
                       <img src={(settings as any).directorSignature} alt="Signature actuelle" className="h-16 object-contain border border-slate-200 bg-white" />
                     </div>
                   )}
                 </div>
               </div>
             </div>

             <div className="md:col-span-2">
               <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Modèle de la fiche d'engagement</label>`;

if (code.includes(target)) {
  fs.writeFileSync('src/pages/SchoolAdmin.tsx', code.replace(target, replacement));
  console.log("Patched successfully");
} else {
  console.log("Target not found!");
}
