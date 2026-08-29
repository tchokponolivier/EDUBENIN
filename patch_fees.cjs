const fs = require('fs');
let content = fs.readFileSync('src/components/SchoolAdminFees.tsx', 'utf-8');

const typesTarget = `const MANDATORY_FEE_TYPES: Record<string, string> = {
  INSCRIPTION: "Inscription",
  MONTHLY: "Mensualité / Scolarité",
  TRANSPORT: "Transport",
  OTHER: "Autre"
};`;
const typesInsert = `const MANDATORY_FEE_TYPES: Record<string, string> = {
  INSCRIPTION: "Inscription",
  MONTHLY: "Scolarité",
  TD: "TD",
  ID_CARD: "Carte Scolaire",
  TRANSPORT: "Transport",
  OTHER: "Autre"
};`;
content = content.replace(typesTarget, typesInsert);

const typesOptTarget = `const OPTIONAL_FEE_TYPES: Record<string, string> = {
  CANTEEN: "Cantine",
  BOOKS: "Livres Scolaires",
  ID_CARD: "Cartes Scolaires",
  UNIFORMS: "Achat des Uniformes",
  EVALUATION: "Frais d'Évaluation",
  BOOK_KITS: "Kits Livres par Classe"
};`;
const typesOptInsert = `const OPTIONAL_FEE_TYPES: Record<string, string> = {
  CANTEEN: "Cantine",
  BOOKS: "Livres Scolaires",
  UNIFORMS: "Achat des Uniformes",
  EVALUATION: "Frais d'Évaluation",
  BOOK_KITS: "Kits Livres par Classe"
};`;
content = content.replace(typesOptTarget, typesOptInsert);

const deleteBtnTarget = `<button onClick={() => handleDelete(fee.id)} className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wider">
                     Supprimer
                   </button>`;
const deleteBtnInsert = `<button onClick={() => {
                     setLevel(fee.level);
                     setFeeType(fee.feeType);
                     setAmount(fee.amount.toString());
                     setShowForm(true);
                     handleDelete(fee.id); // Delete old one so we can save new
                   }} className="text-blue-500 hover:text-blue-700 text-xs font-bold uppercase tracking-wider mr-3">
                     Éditer
                   </button>
                   <button onClick={() => handleDelete(fee.id)} className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wider">
                     Supprimer
                   </button>`;
content = content.replace(deleteBtnTarget, deleteBtnInsert);

fs.writeFileSync('src/components/SchoolAdminFees.tsx', content);
console.log("Patched fees");
