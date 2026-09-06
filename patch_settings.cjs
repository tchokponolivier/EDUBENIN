const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolAdmin.tsx', 'utf8');

code = code.replace(
  `enrollmentContractTemplate: formData.get("enrollmentContractTemplate") as string,`,
  `enrollmentContractTemplate: formData.get("enrollmentContractTemplate") as string,\n      directorSignature: signatureBase64 || settings.directorSignature || "",`
);

code = code.replace(
  `academicYear: updates.academicYear,
           enrollmentContractTemplate: updates.enrollmentContractTemplate`,
  `academicYear: updates.academicYear,
           enrollmentContractTemplate: updates.enrollmentContractTemplate,
           directorSignature: updates.directorSignature`
);

fs.writeFileSync('src/pages/SchoolAdmin.tsx', code);
