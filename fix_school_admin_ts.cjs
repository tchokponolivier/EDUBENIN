const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolAdmin.tsx', 'utf8');

code = code.replace(
  `enrollmentContractTemplate: formData.get("enrollmentContractTemplate") as string,
      logo: logoBase64 || settings.logo,
    };`,
  `enrollmentContractTemplate: formData.get("enrollmentContractTemplate") as string,
      logo: logoBase64 || settings.logo,
      academicYear: settings.academicYear,
    };`
);

fs.writeFileSync('src/pages/SchoolAdmin.tsx', code);
