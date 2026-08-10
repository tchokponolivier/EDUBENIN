const fs = require('fs');
let content = fs.readFileSync('src/pages/Parent.tsx', 'utf-8');

const fetchSettingsCode = `
  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      const { data: schools } = await supabase.from('schools').select('*').limit(1);
      if (schools && schools.length > 0) {
        setSettings(schools[0]);
      }
    };
    fetchSettings();
  }, [user]);
`;

content = content.replace(
  'const [settings, setSettings] = useState<SchoolSettings | null>(null);',
  'const [settings, setSettings] = useState<SchoolSettings | null>(null);\n' + fetchSettingsCode
);

content = content.replace(/\{settings\.logo/g, '{settings?.logo');
content = content.replace(/settings\.name/g, 'settings?.name');
content = content.replace(/settings\.motto/g, 'settings?.motto');
content = content.replace(/settings\.address/g, 'settings?.address');
content = content.replace(/settings\.contact/g, 'settings?.contact');
content = content.replace(/settings\.enrollmentContractTemplate/g, 'settings?.enrollmentContractTemplate');

fs.writeFileSync('src/pages/Parent.tsx', content);
