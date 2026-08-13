const fs = require('fs');
let content = fs.readFileSync('src/pages/SchoolOnboarding.tsx', 'utf-8');

// Replace state
content = content.replace(
  /const \[formData, setFormData\] = useState\(\{[\s\S]*?\}\);/,
  `const [formData, setFormData] = useState({
    name: '',
    locality: '',
    contacts: '',
    directorName: ''
  });`
);

// Replace profile update
content = content.replace(
  /const \{ error: profileError \} = await supabase\s*\.from\('profiles'\)\s*\.update\(\{ school_id: school\.id, role: 'SCHOOL_ADMIN' \}\)\s*\.eq\('id', user\?\.id\);/,
  `const { error: profileError } = await supabase
        .from('profiles')
        .update({ school_id: school.id, role: 'SCHOOL_ADMIN', full_name: formData.directorName })
        .eq('id', user?.id);`
);

// Add input field for director name before the button
const btnSearch = `            <div>
              <button
                type="submit"`;
                
const directorInput = `            <div>
              <label htmlFor="directorName" className="block text-sm font-medium text-gray-700">
                Nom et Prénom du Directeur
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="text"
                  name="directorName"
                  id="directorName"
                  required
                  value={formData.directorName}
                  onChange={(e) => setFormData({...formData, directorName: e.target.value})}
                  className="focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-gray-300 rounded-md py-3 px-4 border"
                  placeholder="Ex: Jean Dupont"
                />
              </div>
            </div>
            
`;

content = content.replace(btnSearch, directorInput + btnSearch);

fs.writeFileSync('src/pages/SchoolOnboarding.tsx', content);
console.log("Patched SchoolOnboarding");
