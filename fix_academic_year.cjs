const fs = require('fs');
let code = fs.readFileSync('src/components/SchoolAdminAcademic.tsx', 'utf8');

code = code.replace(
  `  useEffect(() => {
    fetchYears(); window.location.reload();
  }, [user]);`,
  `  useEffect(() => {
    fetchYears();
  }, [user]);`
);

fs.writeFileSync('src/components/SchoolAdminAcademic.tsx', code);
