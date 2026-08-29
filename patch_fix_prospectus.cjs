const fs = require('fs');

let content = fs.readFileSync('src/pages/ParentProspectus.tsx', 'utf-8');

const target1 = `{isEditing && (
             <label htmlFor="main-img-upload" className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 text-gray-800 rounded font-bold uppercase tracking-wider text-xs hover:bg-white transition cursor-pointer shadow-sm z-10">
                <Upload size={16} /> Changer l'image principale
             </label>
             <input id="main-img-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, false)} />
           )}`;
const insert1 = `{isEditing && (
             <>
             <label htmlFor="main-img-upload" className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 text-gray-800 rounded font-bold uppercase tracking-wider text-xs hover:bg-white transition cursor-pointer shadow-sm z-10">
                <Upload size={16} /> Changer l'image principale
             </label>
             <input id="main-img-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, false)} />
             </>
           )}`;
content = content.replace(target1, insert1);

const target2 = `{isEditing && (
             <label htmlFor="bottom-img-upload" className="absolute top-4 right-4 z-10 flex items-center gap-2 px-4 py-2 bg-white text-gray-800 rounded font-bold uppercase tracking-wider text-xs border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-sm">
                <Upload size={16} /> Ajouter/Changer image du bas
             </label>
             <input id="bottom-img-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, true)} />
           )}`;
const insert2 = `{isEditing && (
             <>
             <label htmlFor="bottom-img-upload" className="absolute top-4 right-4 z-10 flex items-center gap-2 px-4 py-2 bg-white text-gray-800 rounded font-bold uppercase tracking-wider text-xs border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-sm">
                <Upload size={16} /> Ajouter/Changer image du bas
             </label>
             <input id="bottom-img-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, true)} />
             </>
           )}`;
content = content.replace(target2, insert2);

fs.writeFileSync('src/pages/ParentProspectus.tsx', content);

console.log("Fixed JSX");
