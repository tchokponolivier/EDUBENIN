const fs = require('fs');
let content = fs.readFileSync('src/lib/auth.tsx', 'utf-8');

// We need to fetch a real schoolId on boot for mock users to work with foreign keys
content = content.replace(
  'const [isLoading, setIsLoading] = useState(true);',
  `const [isLoading, setIsLoading] = useState(true);
  const [realSchoolId, setRealSchoolId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('schools').select('id').limit(1).then(({ data }) => {
      if (data && data.length > 0) {
        setRealSchoolId(data[0].id);
      } else {
        supabase.from('schools').insert({ name: 'Ecole Primaire Test', locality: 'Cotonou', contacts: '0000' }).select('id').single().then(({ data: newSchool }) => {
          if (newSchool) setRealSchoolId(newSchool.id);
        });
      }
    });
  }, []);`
);

// Update mock login to use realSchoolId
content = content.replace(
  `const newUser: User = {
        id: "00000000-0000-4000-8000-" + Date.now().toString().slice(-12),
        email,
        name: fullName || email.split("@")[0],
        role: (role as any) || "PARENT",
        schoolId: (role === "SCHOOL_ADMIN") ? "11111111-1111-4111-8111-111111111111" : undefined
      };`,
  `const newUser: User = {
        id: "00000000-0000-4000-8000-" + Date.now().toString().slice(-12),
        email,
        name: fullName || email.split("@")[0],
        role: (role as any) || "PARENT",
        schoolId: (role === "SUPER_ADMIN" || role === "PARENT") ? undefined : (realSchoolId || "11111111-1111-4111-8111-111111111111")
      };`
);

content = content.replace(
  `const userToSet = role ? { ...foundUser, role: role as any } : foundUser;`,
  `const userToSet = role ? { ...foundUser, role: role as any, schoolId: (role === 'SUPER_ADMIN' || role === 'PARENT') ? undefined : (realSchoolId || foundUser.schoolId) } : { ...foundUser, schoolId: (foundUser.role === 'SUPER_ADMIN' || foundUser.role === 'PARENT') ? undefined : (realSchoolId || foundUser.schoolId) };`
);

fs.writeFileSync('src/lib/auth.tsx', content);
