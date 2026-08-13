const fs = require('fs');
let content = fs.readFileSync('src/pages/ParentPayments.tsx', 'utf-8');

// Update CSV generation
content = content.replace(
  /payment.amount.toString\(\),\n\s+"Validé"/,
  `payment.amount.toString(),\n        payment.status === 'PENDING' ? 'En vérification' : (payment.status === 'FAILED' ? 'Échoué' : 'Validé')`
);

// Update table render
const search = `<span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                           Validé
                         </span>`;
                         
const replacement = `{payment.status === 'PENDING' ? (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold uppercase tracking-wider">En Vérification</span>
                         ) : payment.status === 'FAILED' ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Échoué</span>
                         ) : (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Validé</span>
                         )}`;
                         
content = content.replace(search, replacement);

fs.writeFileSync('src/pages/ParentPayments.tsx', content);
console.log("Patched status render");
