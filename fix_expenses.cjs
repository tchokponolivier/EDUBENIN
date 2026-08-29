const fs = require('fs');
let code = fs.readFileSync('src/components/CashierExpenses.tsx', 'utf8');

// The categories array
const CATEGORIES = [
  "Matériels et Fournitures de Bureau",
  "Entretien & réparations",
  "Travaux",
  "Prélèvements BANQUE",
  "Uniformes",
  "Livres",
  "Cantine",
  "Communications",
  "Prestataires",
  "Impots",
  "Collations",
  "Matériels didactiques",
  "Primes",
  "FACTURE",
  "AUTRE"
];

// In CashierExpenses.tsx:
// Find standard categories and replace them.
code = code.replace(
  `  const [category, setCategory] = useState("FOURNITURE");`,
  `  const [category, setCategory] = useState("Matériels et Fournitures de Bureau");
  const [customCategory, setCustomCategory] = useState("");`
);

code = code.replace(
  `                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="FOURNITURE">Fournitures</option>
                    <option value="FACTURE">Facture</option>
                    <option value="SALAIRE">Salaire</option>
                    <option value="AUTRE">Autre</option>
                  </select>`,
  `                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="Matériels et Fournitures de Bureau">Matériels et Fournitures de Bureau</option>
                    <option value="Entretien & réparations">Entretien & réparations</option>
                    <option value="Travaux">Travaux</option>
                    <option value="Prélèvements BANQUE">Prélèvements BANQUE</option>
                    <option value="Uniformes">Uniformes</option>
                    <option value="Livres">Livres</option>
                    <option value="Cantine">Cantine</option>
                    <option value="Communications">Communications</option>
                    <option value="Prestataires">Prestataires</option>
                    <option value="Impots">Impots</option>
                    <option value="Collations">Collations</option>
                    <option value="Matériels didactiques">Matériels didactiques</option>
                    <option value="Primes">Primes</option>
                    <option value="FACTURE">Facture (Electricité/Eau)</option>
                    <option value="AUTRE">Autre (Préciser)</option>
                  </select>
                </div>
                {category === "AUTRE" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Catégorie Personnalisée</label>
                    <input required type="text" value={customCategory} onChange={e => setCustomCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                )}
                <div>` // This relies on the div structure being there, wait, I'll be careful.
);

// We need to inject `customCategory` into the save payload:
code = code.replace(
  `      category,`,
  `      category: category === "AUTRE" ? customCategory : category,`
);

// We need to fix the JSX replacement carefully.
fs.writeFileSync('src/components/CashierExpenses.tsx', code);
