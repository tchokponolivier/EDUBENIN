const fs = require('fs');
let content = fs.readFileSync('src/pages/Parent.tsx', 'utf-8');

const target = `                    {child.canteenOptions && child.canteenOptions.length > 0 && (
                      <div className="mt-2 text-[10px] text-slate-500 font-semibold flex flex-wrap gap-1">
                        {child.canteenOptions.map((opt, i) => (
                           <span key={i} className="inline-block bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded">{opt}</span>
                        ))}
                      </div>
                    )}`;

const insert = `                    <div className="mt-2 text-[10px] text-slate-500 font-semibold flex flex-wrap gap-1">
                      {child.canteenOptions && child.canteenOptions.length > 0 ? (
                        child.canteenOptions.map((opt, i) => (
                           <span key={i} className="inline-block bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded">{opt}</span>
                        ))
                      ) : (
                        <span className="inline-block bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded">Garde surveillée & Cantine : Non intéressé</span>
                      )}
                    </div>`;

content = content.replace(target, insert);
fs.writeFileSync('src/pages/Parent.tsx', content);
console.log("Patched canteen in Parent.tsx");
