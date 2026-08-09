import fs from 'fs';
let content = fs.readFileSync('src/pages/Login.tsx', 'utf-8');

if (!content.includes('director@school.com')) {
  content = content.replace(
    '    { email: "admin@school.com", title: "Directeur", desc: "Gestion globale" },',
    '    { email: "admin@school.com", title: "Directeur", desc: "Gestion globale" },\n    { email: "director@school.com", title: "Directeur des Études", desc: "Pédagogie & Notes" },'
  );

  content = content.replace(
    '                  { id: "SCHOOL_ADMIN", title: "Directeur", desc: "Gestion globale" },',
    '                  { id: "SCHOOL_ADMIN", title: "Directeur", desc: "Gestion globale" },\n                  { id: "DIRECTOR_OF_STUDIES", title: "Directeur des Études", desc: "Programmes, Notes et Résultats" },'
  );

  fs.writeFileSync('src/pages/Login.tsx', content);
}
