const fs = require('fs');
let content = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf-8');

// Cashier nav
const cashierSearch = `{ name: "Encaissements", href: "/school-admin/payments?tab=PAYMENTS", icon: CreditCard },`;
const cashierReplace = `{ name: "Vérifications", href: "/school-admin/payments?tab=VERIFICATION", icon: CreditCard },
          { name: "Encaissements", href: "/school-admin/payments?tab=PAYMENTS", icon: CreditCard },`;
content = content.replace(cashierSearch, cashierReplace);

// Director nav
const directorSearch = `{ name: "Caisse & Facturation", href: "/school-admin/payments?tab=PAYMENTS", icon: CreditCard },`;
const directorReplace = `{ name: "Vérifications Caisse", href: "/school-admin/payments?tab=VERIFICATION", icon: CreditCard },
          { name: "Caisse & Facturation", href: "/school-admin/payments?tab=PAYMENTS", icon: CreditCard },`;
content = content.replace(directorSearch, directorReplace);

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', content);
console.log("Patched nav");
