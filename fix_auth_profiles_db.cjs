const fs = require('fs');
let content = fs.readFileSync('src/lib/auth.tsx', 'utf-8');

// Inside useEffect on mount, let's create a generic profile if none exists, or better yet, just insert the mock user profile when they login!
const insertMockProfile = `
      // Upsert the profile in Supabase to ensure foreign keys work
      supabase.from('profiles').upsert({
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.name,
        role: newUser.role,
        school_id: newUser.schoolId
      }).then(({ error }) => {
        if (error) console.error("Mock Profile Upsert Error:", error);
      });
`;

content = content.replace(
  'localStorage.setItem("edubenin_auth", JSON.stringify(newUser));',
  'localStorage.setItem("edubenin_auth", JSON.stringify(newUser));\n' + insertMockProfile
);

content = content.replace(
  'localStorage.setItem("edubenin_auth", JSON.stringify(userToSet));',
  'localStorage.setItem("edubenin_auth", JSON.stringify(userToSet));\n' + insertMockProfile.replace(/newUser/g, 'userToSet')
);

fs.writeFileSync('src/lib/auth.tsx', content);
