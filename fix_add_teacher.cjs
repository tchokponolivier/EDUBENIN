const fs = require('fs');
let code = fs.readFileSync('src/components/AddTeacherModal.tsx', 'utf8');

if (!code.includes('LEVELS')) {
    code = code.replace(
        `import { X, UserPlus } from "lucide-react";`,
        `import { X, UserPlus } from "lucide-react";\nimport { LEVELS } from "../types";`
    );
}

code = code.replace(
  `const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });`,
  `const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    subject: "",
    classes: [] as string[]
  });
  
  const handleToggleClass = (cls: string) => {
    setFormData(prev => ({
        ...prev,
        classes: prev.classes.includes(cls) ? prev.classes.filter(c => c !== cls) : [...prev.classes, cls]
    }));
  };`
);

code = code.replace(
  `      const { error } = await supabase.from('profiles').insert({
        id: dummyId,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        role: 'TEACHER',
        school_id: user?.schoolId
      });
      if (error) throw error;`,
  `      const { error } = await supabase.from('profiles').insert({
        id: dummyId,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        role: 'TEACHER',
        school_id: user?.schoolId
      });
      if (error) throw error;
      
      if (formData.subject && formData.classes.length > 0) {
          const coursesToInsert = formData.classes.map(cls => ({
              school_id: user?.schoolId,
              name: formData.subject,
              level: cls,
              teacher_id: dummyId
          }));
          await supabase.from('courses').insert(coursesToInsert);
      }`
);

code = code.replace(
  `          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Téléphone</label>
            <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 outline-none" />
          </div>`,
  `          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Téléphone</label>
            <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Matière enseignée</label>
            <input type="text" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Mathématiques, Français..." className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Classes (Cochez une ou plusieurs)</label>
            <div className="max-h-32 overflow-y-auto border border-slate-300 rounded p-2 grid grid-cols-2 gap-2 bg-slate-50">
               {LEVELS.map(l => (
                   <label key={l} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                       <input type="checkbox" checked={formData.classes.includes(l)} onChange={() => handleToggleClass(l)} className="rounded text-emerald-600 focus:ring-emerald-500" />
                       {l}
                   </label>
               ))}
            </div>
          </div>`
);

// We need to add overflow-y-auto to the modal container to prevent it from going offscreen
code = code.replace(
  `w-full max-w-md overflow-hidden animate-in zoom-in-95`,
  `w-full max-w-md overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col`
);

code = code.replace(
  `        <form onSubmit={handleSubmit} className="p-6 space-y-4">`,
  `        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">`
);

fs.writeFileSync('src/components/AddTeacherModal.tsx', code);
