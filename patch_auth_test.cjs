const fs = require('fs');
let content = fs.readFileSync('src/lib/auth.tsx', 'utf-8');

const target = `    let foundUser = MOCK_USERS[email];
    let mockPassword = password || "password123";`;
    
const replacement = `    let foundUser = MOCK_USERS[email];
    let mockPassword = password || "password123";
    
    if (foundUser || email.includes("test")) {
       localStorage.setItem("is_test_account", "true");
    } else {
       localStorage.removeItem("is_test_account");
    }`;
    
content = content.replace(target, replacement);

const logoutTarget = `  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem("edubenin_auth");
  };`;
  
const logoutReplace = `  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem("edubenin_auth");
    localStorage.removeItem("is_test_account");
  };`;
  
content = content.replace(logoutTarget, logoutReplace);

fs.writeFileSync('src/lib/auth.tsx', content);
console.log("Patched auth.tsx for test accounts");
