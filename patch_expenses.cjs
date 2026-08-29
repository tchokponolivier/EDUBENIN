const fs = require('fs');
let content = fs.readFileSync('src/components/CashierExpenses.tsx', 'utf-8');

// State for custom category
const stateTarget = `const [category, setCategory] = useState<"FOURNITURE" | "FACTURE" | "SALAIRE" | "AUTRE">("FOURNITURE");`;
const stateInsert = `const [category, setCategory] = useState<string>("MATERIEL_FOURNITURE");
  const [customCategory, setCustomCategory] = useState("");`;
content = content.replace(stateTarget, stateInsert);

// The select field
const selectTarget = `<select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full px-3 py-2 border rounded">
              <option value="FOURNITURE">Fournitures</option>
              <option value="FACTURE">Factures (Eau/Élec)</option>
              <option value="SALAIRE">Salaires</option>
              <option value="AUTRE">Autre</option>
            </select>`;
const selectInsert = `<select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded">
              <option value="MATERIEL_FOURNITURE">Matériels et Fournitures de Bureau</option>
              <option value="ENTRETIEN_REPARATION">Entretien & réparations</option>
              <option value="TRAVAUX">Travaux</option>
              <option value="PRELEVEMENTS_BANQUE">Prélèvements BANQUE</option>
              <option value="UNIFORMES">Uniformes</option>
              <option value="LIVRES">Livres</option>
              <option value="CANTINE">Cantine</option>
              <option value="COMMUNICATIONS">Communications</option>
              <option value="PRESTATAIRES">Prestataires</option>
              <option value="IMPOTS">Impôts</option>
              <option value="COLLATIONS">Collations</option>
              <option value="MATERIEL_DIDACTIQUE">Matériels didactiques</option>
              <option value="PRIMES">Primes</option>
              <option value="FACTURE">Factures (Eau/Élec)</option>
              <option value="AUTRE">Autre</option>
            </select>
            {category === "AUTRE" && (
                <input required type="text" placeholder="Précisez la catégorie..." value={customCategory} onChange={e => setCustomCategory(e.target.value)} className="w-full mt-2 px-3 py-2 border rounded text-sm" />
            )}`;
content = content.replace(selectTarget, selectInsert);

// Payload logic
const payloadTarget = `category,`;
const payloadInsert = `category: category === "AUTRE" ? customCategory : category,`;
content = content.replace(payloadTarget, payloadInsert);

// Display mapping
const displayTarget = `{expense.category === 'FOURNITURE' ? 'Fournitures' : 
                     expense.category === 'FACTURE' ? 'Facture' : 
                     expense.category === 'SALAIRE' ? 'Salaire' : 'Autre'}`;
const displayInsert = `{
  expense.category === 'MATERIEL_FOURNITURE' ? 'Matériels et Fournitures' :
  expense.category === 'ENTRETIEN_REPARATION' ? 'Entretien & réparations' :
  expense.category === 'TRAVAUX' ? 'Travaux' :
  expense.category === 'PRELEVEMENTS_BANQUE' ? 'Prélèvements BANQUE' :
  expense.category === 'UNIFORMES' ? 'Uniformes' :
  expense.category === 'LIVRES' ? 'Livres' :
  expense.category === 'CANTINE' ? 'Cantine' :
  expense.category === 'COMMUNICATIONS' ? 'Communications' :
  expense.category === 'PRESTATAIRES' ? 'Prestataires' :
  expense.category === 'IMPOTS' ? 'Impôts' :
  expense.category === 'COLLATIONS' ? 'Collations' :
  expense.category === 'MATERIEL_DIDACTIQUE' ? 'Matériels didactiques' :
  expense.category === 'PRIMES' ? 'Primes' :
  expense.category === 'FACTURE' ? 'Factures (Eau/Élec)' :
  expense.category
}`;
content = content.replace(displayTarget, displayInsert);

fs.writeFileSync('src/components/CashierExpenses.tsx', content);
console.log("Patched Expenses");
