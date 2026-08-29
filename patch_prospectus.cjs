const fs = require('fs');
let content = fs.readFileSync('src/pages/ParentProspectus.tsx', 'utf-8');

const fetchTarget = `const saved = localStorage.getItem(\`prospectus_\${user.schoolId}\`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setImageUrl(parsed.imageUrl || imageUrl);
        setBottomImageUrl(parsed.bottomImageUrl || "");
        setTexts(parsed.texts || texts);
      } catch (e) {}
    }`;
const fetchInsert = `supabase.from('schools').select('prospectus_data').eq('id', user.schoolId).single().then(({data}) => {
      if (data && data.prospectus_data) {
        setImageUrl(data.prospectus_data.imageUrl || imageUrl);
        setBottomImageUrl(data.prospectus_data.bottomImageUrl || "");
        setTexts(data.prospectus_data.texts || texts);
      }
    });`;
content = content.replace(fetchTarget, fetchInsert);

const saveTarget = `localStorage.setItem(\`prospectus_\${user?.schoolId}\`, JSON.stringify({
      imageUrl,
      bottomImageUrl,
      texts
    }));`;
const saveInsert = `if (user?.schoolId) {
      supabase.from('schools').update({
        prospectus_data: { imageUrl, bottomImageUrl, texts }
      }).eq('id', user.schoolId).then(() => {});
    }`;
content = content.replace(saveTarget, saveInsert);

// Fix file input click by moving id and htmlFor
const upload1Target = `<label className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 text-gray-800 rounded font-bold uppercase tracking-wider text-xs hover:bg-white transition cursor-pointer shadow-sm">
                <Upload size={16} /> Changer l'image principale
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, false)} />
             </label>`;
const upload1Insert = `<label htmlFor="main-img-upload" className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 text-gray-800 rounded font-bold uppercase tracking-wider text-xs hover:bg-white transition cursor-pointer shadow-sm z-10">
                <Upload size={16} /> Changer l'image principale
             </label>
             <input id="main-img-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, false)} />`;
content = content.replace(upload1Target, upload1Insert);

const upload2Target = `<label className="absolute top-4 right-4 z-10 flex items-center gap-2 px-4 py-2 bg-white text-gray-800 rounded font-bold uppercase tracking-wider text-xs border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-sm">
                <Upload size={16} /> Ajouter/Changer image du bas
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, true)} />
             </label>`;
const upload2Insert = `<label htmlFor="bottom-img-upload" className="absolute top-4 right-4 z-10 flex items-center gap-2 px-4 py-2 bg-white text-gray-800 rounded font-bold uppercase tracking-wider text-xs border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-sm">
                <Upload size={16} /> Ajouter/Changer image du bas
             </label>
             <input id="bottom-img-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, true)} />`;
content = content.replace(upload2Target, upload2Insert);

fs.writeFileSync('src/pages/ParentProspectus.tsx', content);
console.log("Patched prospectus");
