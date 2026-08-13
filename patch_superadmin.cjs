const fs = require('fs');
let content = fs.readFileSync('src/pages/SuperAdmin.tsx', 'utf-8');

const search = `<div className="text-xs text-slate-500 mt-2 flex items-center gap-1"><Mail size={12}/> {school.contacts || "Aucun contact"}</div>`;

const replacement = `<div className="text-xs text-slate-500 mt-2 flex items-center gap-1"><Mail size={12}/> {school.contacts || "Aucun contact"}</div>
                          {staff.find((p: any) => p.role === 'SCHOOL_ADMIN') && (
                            <div className="text-xs text-emerald-600 mt-1 font-semibold flex items-center gap-1">
                               <User size={12}/> Dir: {staff.find((p: any) => p.role === 'SCHOOL_ADMIN').full_name || "Non défini"}
                            </div>
                          )}`;
                          
content = content.replace(search, replacement);

fs.writeFileSync('src/pages/SuperAdmin.tsx', content);
console.log("Patched SuperAdmin");
