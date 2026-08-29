const fs = require('fs');
let content = fs.readFileSync('src/pages/SchoolAdmin.tsx', 'utf-8');

const stateTarget = `const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");`;
const stateInsert = `const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementTarget, setAnnouncementTarget] = useState("Parents");`;
content = content.replace(stateTarget, stateInsert);

const uiTarget = `<div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Titre de l'annonce</label>`;
const uiInsert = `<div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Destinataires</label>
                <select value={announcementTarget} onChange={e => setAnnouncementTarget(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 outline-none mb-4">
                  <option value="Parents">Parents</option>
                  <option value="Professeurs">Professeurs</option>
                  <option value="Administration">Administration</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Titre de l'annonce</label>`;
content = content.replace(uiTarget, uiInsert);

const insertTarget = `author_name: user?.name || "Administration"
    }).select().single();`;
const insertInsert = `author_name: user?.name || "Administration",
      target_audience: announcementTarget
    }).select().single();`;
content = content.replace(insertTarget, insertInsert);

const mapTarget = `authorName: d.author_name,
        date: new Date(d.created_at).getTime()`;
const mapInsert = `authorName: d.author_name,
        targetAudience: d.target_audience || "Tous",
        date: new Date(d.created_at).getTime()`;
content = content.replace(mapTarget, mapInsert);
content = content.replace(`authorName: data.author_name,
        date: new Date(data.created_at).getTime()`, `authorName: data.author_name,
        targetAudience: data.target_audience || announcementTarget,
        date: new Date(data.created_at).getTime()`);

const displayTarget = `Publié le {new Date(announcement.date).toLocaleDateString()} par {announcement.authorName}`;
const displayInsert = `Publié le {new Date(announcement.date).toLocaleDateString()} par {announcement.authorName} • Destiné aux: {announcement.targetAudience}`;
content = content.replace(displayTarget, displayInsert);

fs.writeFileSync('src/pages/SchoolAdmin.tsx', content);
console.log("Patched Announcements");
