const fs = require('fs');
let content = fs.readFileSync('src/pages/SchoolAdminPayments.tsx', 'utf-8');
content = content.replace('{activeTab === "INSCRIPTIONS" && <CashierEnrollment />}\n      {activeTab === "PAYMENTS" && (', '{activeTab === "PAYMENTS" && (');
fs.writeFileSync('src/pages/SchoolAdminPayments.tsx', content);
