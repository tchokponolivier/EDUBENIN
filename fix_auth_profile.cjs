const fs = require('fs');
let content = fs.readFileSync('src/lib/auth.tsx', 'utf-8');

content = content.replace(
  'const [realSchoolId, setRealSchoolId] = useState<string | null>(null);',
  `const [realSchoolId, setRealSchoolId] = useState<string | null>(null);
  const [realProfileId, setRealProfileId] = useState<string | null>(null);`
);

content = content.replace(
  `if (newSchool) setRealSchoolId(newSchool.id);
        });
      }
    });
  }, []);`,
  `if (newSchool) setRealSchoolId(newSchool.id);
        });
      }
    });
    supabase.from('profiles').select('id').limit(1).then(({ data }) => {
      if (data && data.length > 0) {
        setRealProfileId(data[0].id);
      }
    });
  }, []);`
);

content = content.replace(
  `const userToSet = role ? { ...foundUser, role: role as any, schoolId: (role === "SUPER_ADMIN" || role === "PARENT") ? undefined : (realSchoolId || foundUser.schoolId) } : { ...foundUser, schoolId: (foundUser.role === "SUPER_ADMIN" || foundUser.role === "PARENT") ? undefined : (realSchoolId || foundUser.schoolId) };`,
  `const userToSet = role ? { ...foundUser, id: realProfileId || foundUser.id, role: role as any, schoolId: (role === "SUPER_ADMIN" || role === "PARENT") ? undefined : (realSchoolId || foundUser.schoolId) } : { ...foundUser, id: realProfileId || foundUser.id, schoolId: (foundUser.role === "SUPER_ADMIN" || foundUser.role === "PARENT") ? undefined : (realSchoolId || foundUser.schoolId) };`
);

content = content.replace(
  'id: "00000000-0000-4000-8000-000000000000",',
  'id: realProfileId || "00000000-0000-4000-8000-000000000000",'
);

fs.writeFileSync('src/lib/auth.tsx', content);
