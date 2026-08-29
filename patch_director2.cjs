const fs = require('fs');

let content = fs.readFileSync('src/components/director/DirectorAcademic.tsx', 'utf-8');
const addTarget = `<button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">`;
const addInsert = `<button onClick={() => {
    const title = window.prompt("Titre:");
    if (title) setEvents([...events, {id: Date.now(), title, date: "Nouveau", type: "EXAM", status: "PENDING"}]);
}} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">`;
content = content.replace(addTarget, addInsert);

const actionsTarget = `<button className="text-blue-600 hover:text-blue-800 p-1">
                      <Edit size={16} />
                    </button>
                    <button className="text-red-600 hover:text-red-800 p-1">
                      <Trash2 size={16} />
                    </button>`;
const actionsInsert = `<button onClick={() => {
                       const title = window.prompt("Nouveau titre:", event.title);
                       if (title) setEvents(events.map(e => e.id === event.id ? {...e, title} : e));
                    }} className="text-blue-600 hover:text-blue-800 p-1">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => setEvents(events.filter(e => e.id !== event.id))} className="text-red-600 hover:text-red-800 p-1">
                      <Trash2 size={16} />
                    </button>`;
content = content.replace(actionsTarget, actionsInsert);
fs.writeFileSync('src/components/director/DirectorAcademic.tsx', content);

// DirectorExams
let exams = fs.readFileSync('src/components/director/DirectorExams.tsx', 'utf-8');
exams = exams.replace(`<button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">`, `<button onClick={() => {
    const name = window.prompt("Nom de la session:");
    if (name) setSessions([...sessions, {id: Date.now(), name, startDate: "Nouveau", endDate: "Nouveau", type: "TRIMESTRE", status: "UPCOMING"}]);
}} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">`);
exams = exams.replace(`<button className="text-blue-600 hover:text-blue-800 p-1">
                      <Edit size={16} />
                    </button>
                    <button className="text-red-600 hover:text-red-800 p-1">
                      <Trash2 size={16} />
                    </button>`, `<button onClick={() => {
                       const name = window.prompt("Nouveau nom:", session.name);
                       if (name) setSessions(sessions.map(s => s.id === session.id ? {...s, name} : s));
                    }} className="text-blue-600 hover:text-blue-800 p-1">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => setSessions(sessions.filter(s => s.id !== session.id))} className="text-red-600 hover:text-red-800 p-1">
                      <Trash2 size={16} />
                    </button>`);
fs.writeFileSync('src/components/director/DirectorExams.tsx', exams);

console.log("Patched other director parts");
