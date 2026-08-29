const fs = require('fs');
let code = fs.readFileSync('src/components/director/DirectorPrograms.tsx', 'utf8');

code = code.replace(
  `                    <button className="text-blue-600 hover:text-blue-900 mr-3"><Edit size={16} /></button>
                    <button className="text-rose-600 hover:text-rose-900"><Trash2 size={16} /></button>`,
  `                    <button onClick={() => {
                        const newName = window.prompt("Nouveau nom de la matière:", subject.name);
                        const newLevel = window.prompt("Nouveau niveau/classe:", subject.level);
                        if (newName && newLevel) {
                            setSubjects(subjects.map(s => s.id === subject.id ? { ...s, name: newName, level: newLevel } : s));
                        }
                    }} className="text-blue-600 hover:text-blue-900 mr-3"><Edit size={16} /></button>
                    <button onClick={() => {
                        if (window.confirm("Supprimer cette matière ?")) {
                            setSubjects(subjects.filter(s => s.id !== subject.id));
                        }
                    }} className="text-rose-600 hover:text-rose-900"><Trash2 size={16} /></button>`
);

fs.writeFileSync('src/components/director/DirectorPrograms.tsx', code);
