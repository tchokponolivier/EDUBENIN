const fs = require('fs');
let content = fs.readFileSync('src/pages/Parent.tsx', 'utf-8');

const target1 = `<h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-widest">Signaler / Demande Spéciale</h4>`;
const insert1 = `<h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-widest mt-8">Signaler / Demande Spéciale</h4>`;
content = content.replace(target1, insert1);

const target2 = `                     try {
                        const typeFr = requestType === "ABSENCE" ? "Absence" : requestType === "DELAY" ? "Retard" : "Autre";
                        await fetch("https://formsubmit.co/ajax/gcservice00@gmail.com", {
                           method: "POST",
                           headers: {
                             'Content-Type': 'application/json',
                             'Accept': 'application/json'
                           },
                           body: JSON.stringify({
                             _subject: \`Nouvelle demande: \${typeFr} pour \${selectedChildForAttendance.firstName} \${selectedChildForAttendance.lastName}\`,
                             Élève: \`\${selectedChildForAttendance.firstName} \${selectedChildForAttendance.lastName}\`,
                             Classe: selectedChildForAttendance.level,
                             Parent: user.name,
                             Type: typeFr,
                             Date: new Date(requestDate).toLocaleDateString("fr-FR"),
                             Motif: requestReason
                           })
                        });
                     } catch (err) {
                        console.error("Erreur d'envoi d'email:", err);
                     }`;

const insert2 = `                     try {
                        const typeFr = requestType === "ABSENCE" ? "Absence" : requestType === "DELAY" ? "Retard" : "Autre";
                        
                        // Insert into notifications
                        if (user?.schoolId) {
                          await supabase.from('notifications').insert({
                            school_id: user.schoolId,
                            title: \`Nouveau Signalement: \${typeFr}\`,
                            message: \`\${selectedChildForAttendance.firstName} \${selectedChildForAttendance.lastName} - \${requestReason}\`,
                            type: 'SUPPORT'
                          });
                        }
                        
                        await fetch("https://formsubmit.co/ajax/gcservice00@gmail.com", {
                           method: "POST",
                           headers: {
                             'Content-Type': 'application/json',
                             'Accept': 'application/json'
                           },
                           body: JSON.stringify({
                             _subject: \`Nouvelle demande: \${typeFr} pour \${selectedChildForAttendance.firstName} \${selectedChildForAttendance.lastName}\`,
                             Élève: \`\${selectedChildForAttendance.firstName} \${selectedChildForAttendance.lastName}\`,
                             Classe: selectedChildForAttendance.level,
                             Parent: user.name,
                             Type: typeFr,
                             Date: new Date(requestDate).toLocaleDateString("fr-FR"),
                             Motif: requestReason
                           })
                        });
                     } catch (err) {
                        console.error("Erreur d'envoi d'email:", err);
                     }`;

content = content.replace(target2, insert2);

fs.writeFileSync('src/pages/Parent.tsx', content);
console.log("Patched Parent signaler");
