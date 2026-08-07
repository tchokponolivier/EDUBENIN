import fs from 'fs';

let content = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf-8');

// Add imports
content = content.replace('import { EduBeninLogo } from "../Logo";', 
`import { EduBeninLogo } from "../Logo";
import { UserSettingsModal } from "../UserSettingsModal";
import { supabase } from "../../lib/supabase";
import { useEffect } from "react";`);

// Add state and effect for school name
content = content.replace('const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);',
`const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [schoolName, setSchoolName] = useState<string | null>(null);

  useEffect(() => {
    if (user?.schoolId) {
      supabase.from('schools').select('name').eq('id', user.schoolId).single()
        .then(({ data }) => {
          if (data) setSchoolName(data.name);
        });
    }
  }, [user]);`);

// Add settings button to profile section
content = content.replace(
`<div className="overflow-hidden">`,
`<div className="overflow-hidden flex-1">`
);

content = content.replace(
`<p className="text-[10px] text-slate-400 truncate capitalize">{user.role.replace('_', ' ').toLowerCase()}</p>
            </div>
          </div>`,
`<p className="text-[10px] text-slate-400 truncate capitalize">{user.role.replace('_', ' ').toLowerCase()}</p>
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="text-slate-400 hover:text-white p-1 ml-auto">
              <Settings className="w-4 h-4" />
            </button>
          </div>`
);

// We need to import Settings from lucide-react if not present
content = content.replace('User, Menu, X }', 'User, Menu, X, Settings }');

// Change the top header title based on schoolName
content = content.replace(
`<h2 className="text-xl font-bold text-gray-700 hidden md:block">Vue d'ensemble du Système</h2>
            <h2 className="text-xl font-bold text-gray-700 md:hidden">EduBénin</h2>`,
`<h2 className="text-xl font-bold text-gray-700 hidden md:block">{schoolName || "Vue d'ensemble du Système"}</h2>
            <h2 className="text-xl font-bold text-gray-700 md:hidden">{schoolName ? schoolName.substring(0, 15) + (schoolName.length > 15 ? '...' : '') : "EduBénin"}</h2>`
);

// Add the UserSettingsModal at the end
content = content.replace(
`{children}
          </div>
        </div>
      </main>
    </div>
  );`,
`{children}
          </div>
        </div>
        <UserSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </main>
    </div>
  );`
);

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', content);
