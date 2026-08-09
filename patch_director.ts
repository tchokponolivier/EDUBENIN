import fs from 'fs';
let content = fs.readFileSync('src/pages/DirectorDashboard.tsx', 'utf-8');

content = content.replace(
  '<p className="text-slate-500 text-sm">Comparaison des résultats d\'une année sur l\'autre et identification des zones de fragilité.</p>',
  `<p className="text-slate-500 text-sm">Comparaison des résultats d'une année sur l'autre et identification des zones de fragilité.</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 hover:border-emerald-500 transition-colors cursor-pointer group">
                  <FileText className="text-emerald-600 mb-4 group-hover:scale-110 transition-transform" size={24} />
                  <h3 className="font-bold text-gray-700 text-lg mb-2">Préparation des Conseils de Classe</h3>
                  <p className="text-slate-500 text-sm">Fiches de synthèse par élève (notes, absences) et validation des décisions finales (mention, passage).</p>`
);

fs.writeFileSync('src/pages/DirectorDashboard.tsx', content);
