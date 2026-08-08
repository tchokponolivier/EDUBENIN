import fs from 'fs';
let content = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf-8');

content = content.replace(
  '<span className="hidden md:inline-block px-2 py-0.5 bg-emerald-100 text-gray-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Bénin • 2026</span>',
  '<span className="hidden md:inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">Année Scolaire 2025-2026</span>'
);

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', content);
