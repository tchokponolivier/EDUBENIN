const fs = require('fs');
let code = fs.readFileSync('src/components/SchoolAdminFees.tsx', 'utf8');

code = code.replace(
  `const [amount, setAmount] = useState("");`,
  `const [amount, setAmount] = useState("");
  const [academicYears, setAcademicYears] = useState<{id: string, name: string}[]>([]);`
);

code = code.replace(
  `const fetchFees = async () => {`,
  `const fetchAcademicYears = async () => {
    if (!user?.schoolId) return;
    const { data } = await supabase.from('academic_years').select('id, name').eq('school_id', user.schoolId);
    if (data) setAcademicYears(data);
  };

  const fetchFees = async () => {`
);

code = code.replace(
  `useEffect(() => {
    fetchFees();
  }, [user]);`,
  `useEffect(() => {
    fetchFees();
    fetchAcademicYears();
  }, [user]);`
);

code = code.replace(
  `<option value="2024-2025">2024-2025</option>
            <option value="2023-2024">2023-2024</option>`,
  `{academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}`
);

fs.writeFileSync('src/components/SchoolAdminFees.tsx', code);
