const fs = require('fs');

function replaceInFile(path, replacements) {
    let content = fs.readFileSync(path, 'utf8');
    for (let r of replacements) {
        content = content.replace(r.search, r.replace);
    }
    fs.writeFileSync(path, content);
}

replaceInFile('src/pages/SchoolAdmin.tsx', [
    { search: /const newAnnouncement = db\.addAnnouncement\(\{[\s\S]*?\}\);/g, replace: '/* db.addAnnouncement removed */' },
    { search: /db\.deleteAnnouncement\(id\);/g, replace: '/* db.deleteAnnouncement removed */' }
]);

replaceInFile('src/pages/SchoolAdminPayments.tsx', [
    { search: /const newPayment = db\.addPayment\(\{[\s\S]*?\}\);/g, replace: '/* db.addPayment removed */' }
]);

replaceInFile('src/pages/Parent.tsx', [
    { search: /setSettings\(db\.getSchoolSettings\(\)\);/g, replace: '/* db removed */' },
    { search: /setAnnouncements\(db\.getAnnouncements\(\)\);/g, replace: '/* db removed */' },
    { search: /db\.addStudent\(\{[\s\S]*?\}\);/g, replace: '/* db.addStudent removed */' },
    { search: /db\.addSpecialRequest\(\{[\s\S]*?\}\);/g, replace: '/* db.addSpecialRequest removed */' }
]);

replaceInFile('src/pages/ParentPayments.tsx', [
    { search: /const newPayment = db\.addPayment\(\{[\s\S]*?\}\);/g, replace: '/* db.addPayment removed */' }
]);
