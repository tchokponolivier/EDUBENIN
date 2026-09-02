const fs = require('fs');
let code = fs.readFileSync('src/components/SchoolAdminFees.tsx', 'utf8');

// Remove double delete button
code = code.replace(
  `<button onClick={() => handleDelete(fee.id)} className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wider">
                     Supprimer
                   </button>
                   <button onClick={() => handleDelete(fee.id)} className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wider">
                     Supprimer
                   </button>`,
  `<button onClick={() => handleDelete(fee.id)} className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wider">
                     Supprimer
                   </button>`
);

// Add filter states
code = code.replace(
  `const [amount, setAmount] = useState("");`,
  `const [amount, setAmount] = useState("");
  const [filterLevel, setFilterLevel] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");`
);

// Modify filtering logic
code = code.replace(
  `const displayedFees = fees.filter(f => 
    activeTab === "MANDATORY" 
      ? Object.keys(MANDATORY_FEE_TYPES).includes(f.feeType)
      : Object.keys(OPTIONAL_FEE_TYPES).includes(f.feeType)
  );`,
  `const displayedFees = fees.filter(f => {
    const isTabMatch = activeTab === "MANDATORY" 
      ? Object.keys(MANDATORY_FEE_TYPES).includes(f.feeType)
      : Object.keys(OPTIONAL_FEE_TYPES).includes(f.feeType);
    if (!isTabMatch) return false;
    
    if (filterLevel !== "ALL" && f.level !== filterLevel) return false;
    if (filterType !== "ALL" && f.feeType !== filterType) return false;
    
    return true;
  });`
);

// Add UI for filters
code = code.replace(
  `{showForm && (`,
  `<div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Classe</label>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded text-xs outline-none">
            <option value="ALL">Toutes les classes</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded text-xs outline-none">
            <option value="ALL">Tous les types</option>
            {activeTab === "MANDATORY" 
              ? Object.entries(MANDATORY_FEE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)
              : Object.entries(OPTIONAL_FEE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)
            }
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Année Scolaire</label>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded text-xs outline-none">
            <option value="ALL">Toutes les années</option>
            <option value="2024-2025">2024-2025</option>
            <option value="2023-2024">2023-2024</option>
          </select>
        </div>
      </div>
      {showForm && (`
);

fs.writeFileSync('src/components/SchoolAdminFees.tsx', code);
