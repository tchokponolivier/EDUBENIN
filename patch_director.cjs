const fs = require('fs');

let content = fs.readFileSync('src/components/director/DirectorPrograms.tsx', 'utf-8');

const targetAddBtn = `<button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">`;
const insertAddBtn = `<button onClick={() => {
    const name = window.prompt("Nom de la matière:");
    const level = window.prompt("Classe:");
    if (name && level) {
      setSubjects([...subjects, { id: Date.now(), name, level, coefficient: 2, weeklyHours: 2, competencies: [] }]);
    }
}} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">`;
content = content.replace(targetAddBtn, insertAddBtn);

const targetActions = `<button className="text-blue-600 hover:text-blue-800 p-1">
                      <Edit size={16} />
                    </button>
                    <button className="text-red-600 hover:text-red-800 p-1">
                      <Trash2 size={16} />
                    </button>`;
const insertActions = `<button onClick={() => {
                       const name = window.prompt("Nouveau nom:", subject.name);
                       if (name) {
                         setSubjects(subjects.map(s => s.id === subject.id ? { ...s, name } : s));
                       }
                    }} className="text-blue-600 hover:text-blue-800 p-1">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => setSubjects(subjects.filter(s => s.id !== subject.id))} className="text-red-600 hover:text-red-800 p-1">
                      <Trash2 size={16} />
                    </button>`;
content = content.replace(targetActions, insertActions);
fs.writeFileSync('src/components/director/DirectorPrograms.tsx', content);

console.log("Patched DirectorPrograms");
