const fs = require('fs');
let code = fs.readFileSync('src/pages/ParentProspectus.tsx', 'utf8');

code = code.replace(
  `<label htmlFor="main-img-upload" className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 text-gray-800 rounded font-bold uppercase tracking-wider text-xs hover:bg-white transition cursor-pointer shadow-sm z-10">
                <Upload size={16} /> Changer l'image principale
             </label>
             <input id="main-img-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, false)} />`,
  `<button onClick={() => document.getElementById("main-img-upload")?.click()} className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 text-gray-800 rounded font-bold uppercase tracking-wider text-xs hover:bg-white transition cursor-pointer shadow-sm z-10">
                <Upload size={16} /> Changer l'image principale
             </button>
             <input id="main-img-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, false)} />`
);

code = code.replace(
  `<label htmlFor="bottom-img-upload" className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 text-gray-800 rounded font-bold uppercase tracking-wider text-xs hover:bg-white transition cursor-pointer shadow-sm z-10">
                <Upload size={16} /> Ajouter/Changer image du bas
             </label>
             <input id="bottom-img-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, true)} />`,
  `<button onClick={() => document.getElementById("bottom-img-upload")?.click()} className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 text-gray-800 rounded font-bold uppercase tracking-wider text-xs hover:bg-white transition cursor-pointer shadow-sm z-10">
                <Upload size={16} /> Ajouter/Changer image du bas
             </button>
             <input id="bottom-img-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, true)} />`
);

// Add resizing to handlePhotoUpload
code = code.replace(
  `  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isBottom: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isBottom) setBottomImageUrl(reader.result as string);
        else setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };`,
  `  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isBottom: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height = height * (MAX_WIDTH / width);
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width = width * (MAX_HEIGHT / height);
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if(ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                const resized = canvas.toDataURL('image/jpeg', 0.7);
                if (isBottom) setBottomImageUrl(resized);
                else setImageUrl(resized);
            }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };`
);


fs.writeFileSync('src/pages/ParentProspectus.tsx', code);
