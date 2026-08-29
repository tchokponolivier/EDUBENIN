const fs = require('fs');
let content = fs.readFileSync('src/pages/SchoolAdminStudentList.tsx', 'utf-8');

const targetListAddBtn = `<button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded font-bold uppercase tracking-wider text-xs hover:bg-emerald-700 transition shadow-sm">
          <Plus size={16} /> Inscrire un élève
        </button>`;
content = content.replace(targetListAddBtn, ``);

fs.writeFileSync('src/pages/SchoolAdminStudentList.tsx', content);
console.log("Patched list buttons");
