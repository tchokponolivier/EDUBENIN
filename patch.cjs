const fs = require('fs');
let code = fs.readFileSync('src/components/SchoolAdminFees.tsx', 'utf8');

// Add state
const targetState = 'const [selectedLevels, setSelectedLevels] = useState<string[]>([]);';
const replaceState = 'const [selectedLevels, setSelectedLevels] = useState<string[]>([]);\n  const [showLevelsDropdown, setShowLevelsDropdown] = useState(false);';
code = code.replace(targetState, replaceState);

// Replace ChevronDown import
code = code.replace(/import \{([^\}]+)\} from "lucide-react";/, (m, p1) => {
    if(!p1.includes('ChevronDown')) return 'import {' + p1 + ', ChevronDown} from "lucide-react";';
    return m;
});

// Replace grid
const gridStart = '<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded">';
const gridEnd = '</div>';
// This is dangerous, let's use a robust replace
const gridRegex = /<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded">[\s\S]*?<\/div>/;

const dropdownHTML = 
'<div className="relative">\n' +
'  <button type="button" onClick={() => setShowLevelsDropdown(!showLevelsDropdown)} className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded outline-none focus:border-emerald-500 bg-white text-sm">\n' +
'    <span className="truncate">{selectedLevels.length === 0 ? "Sélectionner des classes" : selectedLevels.includes("ALL") ? "Toutes les classes" : selectedLevels.join(", ")}</span>\n' +
'    <ChevronDown size={16} className="text-slate-400" />\n' +
'  </button>\n' +
'  {showLevelsDropdown && (\n' +
'    <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 shadow-xl rounded-lg z-50 p-2 grid grid-cols-2 gap-2">\n' +
'      <label className="flex items-center gap-2 text-sm cursor-pointer col-span-full border-b border-slate-100 pb-2 mb-1">\n' +
'        <input type="checkbox" checked={selectedLevels.includes("ALL")} onChange={(e) => { if (e.target.checked) setSelectedLevels(["ALL"]); else setSelectedLevels([]); }} className="rounded text-emerald-600 focus:ring-emerald-500" />\n' +
'        <span className="font-semibold text-gray-700">Toutes les classes</span>\n' +
'      </label>\n' +
'      {LEVELS.map(l => (\n' +
'        <label key={l} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">\n' +
'          <input type="checkbox" checked={selectedLevels.includes(l)} onChange={(e) => { if (e.target.checked) setSelectedLevels(prev => prev.filter(p => p !== "ALL").concat(l)); else setSelectedLevels(prev => prev.filter(p => p !== l)); }} className="rounded text-emerald-600 focus:ring-emerald-500" />\n' +
'          <span className="text-gray-700">{l}</span>\n' +
'        </label>\n' +
'      ))}\n' +
'    </div>\n' +
'  )}\n' +
'</div>';

code = code.replace(gridRegex, dropdownHTML);

// Replace "Année" with "Année scolaire"
code = code.replace('<th className="p-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Année</th>', '<th className="p-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Année scolaire</th>');

fs.writeFileSync('src/components/SchoolAdminFees.tsx', code);
