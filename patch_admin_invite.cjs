const fs = require('fs');
let content = fs.readFileSync('src/pages/SchoolAdmin.tsx', 'utf-8');

const target = `<option value="TEACHER">Professeur (Teacher)</option>
                  <option value="SECRETARY">Secrétaire (Secretary)</option>
                  <option value="CASHIER">Caissier(e) (Cashier)</option>
                  <option value="PARENT">Parent (Parent)</option>`;
const insert = `<option value="TEACHER">Professeur (Teacher)</option>
                  <option value="SECRETARY">Secrétaire (Secretary)</option>
                  <option value="CASHIER">Caissier(e) (Cashier)</option>
                  <option value="PARENT">Parent (Parent)</option>
                  <option value="DIRECTOR_OF_STUDIES">Directeur des Études</option>
                  <option value="SUPERVISOR">Surveillant</option>`;

content = content.replace(target, insert);

fs.writeFileSync('src/pages/SchoolAdmin.tsx', content);
console.log("Patched SchoolAdmin.tsx invitations");
