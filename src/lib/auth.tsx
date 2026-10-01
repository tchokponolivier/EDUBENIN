import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "../types";
import { supabase } from "./supabase";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, fullName?: string, password?: string, role?: string) => void; // Keeps mock support
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserSchool: (schoolId: string, schoolName?: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock Users for testing
const MOCK_USERS: Record<string, User> = {
  "admin@school.com": {
    id: "22222222-2222-4222-8222-222222222222",
    email: "admin@school.com",
    name: "Directeur Ecole A",
    role: "SCHOOL_ADMIN",
    schoolId: "11111111-1111-4111-8111-111111111111",
  },
  "caisse@school.com": {
    id: "33333333-3333-4333-8333-333333333333",
    email: "caisse@school.com",
    name: "Caisse Ecole",
    role: "CASHIER",
    schoolId: "11111111-1111-4111-8111-111111111111",
  },
  "secretary@school.com": {
    id: "44444444-4444-4444-8444-444444444444",
    email: "secretary@school.com",
    name: "Secrétaire Ecole",
    role: "SECRETARY",
    schoolId: "11111111-1111-4111-8111-111111111111",
  },
  "surveillant@school.com": {
    id: "88888888-8888-4888-8888-888888888888",
    email: "surveillant@school.com",
    name: "Surveillant Test",
    role: "SUPERVISOR",
    schoolId: "11111111-1111-4111-8111-111111111111",
  },
  "parent@mail.com": {
    id: "55555555-5555-4555-8555-555555555555",
    email: "parent@mail.com",
    name: "Parent E.",
    role: "PARENT",
  },
  "director@school.com": {
    id: "66666666-6666-4666-8666-666666666666",
    email: "director@school.com",
    name: "Directeur des Études",
    role: "DIRECTOR_OF_STUDIES",
    schoolId: "11111111-1111-4111-8111-111111111111",
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [realSchoolId, setRealSchoolId] = useState<string | null>(null);
  const [realProfileId, setRealProfileId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('schools').select('id').order('created_at', { ascending: false }).limit(1).then(({ data }) => {
      if (data && data.length > 0) {
        setRealSchoolId(data[0].id);
        if (!localStorage.getItem('edubenin_active_school_id')) {
          localStorage.setItem('edubenin_active_school_id', data[0].id);
        }
      } else {
        // No school exists in database: do not inject dummy school!
        setRealSchoolId(null);
        localStorage.removeItem('edubenin_active_school_id');
      }
    });
    supabase.from('profiles').select('id').limit(1).then(({ data }) => {
      if (data && data.length > 0) {
        setRealProfileId(data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    // Helper to get role
    const getRoleForSupabaseUser = (email: string) => {
      const pendingRole = localStorage.getItem("pending_google_role");
      if (pendingRole) {
        localStorage.removeItem("pending_google_role");
        return pendingRole as any;
      }
      return "PARENT";
    };

    // Fetch real profile from Supabase
    const fetchSupabaseProfile = async (sessionUser: any) => {
      try {
        const pendingRole = localStorage.getItem("pending_google_role");
        const userEmail = sessionUser.email ? sessionUser.email.toLowerCase().trim() : "";

        // Check if there is an active invitation for this user's email
        let invitedSchoolId: string | null = null;
        let invitedRole: string | null = null;
        if (userEmail) {
          try {
            const { data: inv } = await supabase
              .from('invitations')
              .select('*')
              .ilike('email', userEmail)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (inv) {
              invitedSchoolId = inv.school_id;
              invitedRole = inv.role;
            }
          } catch (e) {
            console.warn("Could not query invitations table:", e);
          }

          if (!invitedSchoolId) {
            try {
              const localInvs = JSON.parse(localStorage.getItem('mock_db_invitations') || '[]');
              const localInv = localInvs.find((i: any) => i.email && i.email.toLowerCase().trim() === userEmail);
              if (localInv) {
                invitedSchoolId = localInv.school_id;
                invitedRole = localInv.role;
              }
            } catch (e) {}
          }
        }

        // Fetch current profile if it exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, school_id, avatar_url')
          .eq('id', sessionUser.id)
          .maybeSingle();

        if (pendingRole) {
          localStorage.removeItem("pending_google_role");

          if (pendingRole === 'SCHOOL_ADMIN') {
            // For director: keep existing school or leave null for onboarding
            let schoolId = profile?.school_id || null;
            try {
              await supabase.from('profiles').upsert({
                id: sessionUser.id,
                email: sessionUser.email,
                role: 'SCHOOL_ADMIN',
                school_id: schoolId,
                full_name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0],
                avatar_url: sessionUser.user_metadata?.avatar_url
              });
            } catch (e) {}
          } else {
            // Non-director role selected (e.g. TEACHER, DIRECTOR_OF_STUDIES, etc.)
            const targetSchoolId = invitedSchoolId || profile?.school_id;

            if (targetSchoolId) {
              // VERIFIED: User has an invitation or existing school!
              const targetRole = pendingRole || invitedRole || profile?.role || 'TEACHER';
              try {
                await supabase.from('profiles').upsert({
                  id: sessionUser.id,
                  email: sessionUser.email,
                  role: targetRole,
                  school_id: targetSchoolId,
                  full_name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0],
                  avatar_url: sessionUser.user_metadata?.avatar_url
                });
              } catch (e) {}
              localStorage.setItem('edubenin_active_school_id', targetSchoolId);
            } else {
              // NOT VERIFIED: New uninvited user trying to access non-director role
              // Must not let them through to uninvited dashboard
              await supabase.auth.signOut({ scope: 'local' });
              sessionStorage.setItem('edubenin_login_notice', JSON.stringify({
                email: sessionUser.email,
                role: pendingRole
              }));
              setUser(null);
              setIsLoading(false);
              return;
            }
          }
        }

        // Re-fetch profile to get up-to-date state
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .select('role, full_name, school_id, avatar_url')
          .eq('id', sessionUser.id)
          .maybeSingle();

        const currentProfile = updatedProfile || profile;

        if (currentProfile) {
          if (sessionUser.email === 'contact.tchok@gmail.com' && currentProfile.role !== 'SUPER_ADMIN') {
             await supabase.from('profiles').update({ role: 'SUPER_ADMIN', school_id: null }).eq('id', sessionUser.id);
             currentProfile.role = 'SUPER_ADMIN';
             currentProfile.school_id = null;
          }

          let resolvedSchoolId = currentProfile.school_id || invitedSchoolId;
          
          // Verify if the assigned school actually exists in schools table
          if (resolvedSchoolId) {
            try {
              const { data: existingSchool } = await supabase.from('schools').select('id').eq('id', resolvedSchoolId).maybeSingle();
              if (!existingSchool) {
                // School was deleted by Super Admin!
                resolvedSchoolId = null;
                localStorage.removeItem('edubenin_active_school_id');
                await supabase.from('profiles').update({ school_id: null }).eq('id', sessionUser.id);
              }
            } catch (e) {}
          }

          // ONLY for staff (non-director), if schoolId is missing, check active school
          if (!resolvedSchoolId && currentProfile.role !== 'SUPER_ADMIN' && currentProfile.role !== 'PARENT' && currentProfile.role !== 'SCHOOL_ADMIN') {
            const activeFallback = localStorage.getItem('edubenin_active_school_id');
            if (activeFallback) {
              resolvedSchoolId = activeFallback;
            }
          }

          // If SCHOOL_ADMIN has no school (new or school deleted), do NOT invent a fallback school!
          // Leave resolvedSchoolId undefined so onboarding is properly triggered.
          const finalSchoolId = (currentProfile.role === 'SUPER_ADMIN' || currentProfile.role === 'PARENT' || (currentProfile.role === 'SCHOOL_ADMIN' && !resolvedSchoolId)) 
            ? undefined 
            : (resolvedSchoolId || undefined);

          if (finalSchoolId) {
            localStorage.setItem('edubenin_active_school_id', finalSchoolId);
          } else if (currentProfile.role === 'SCHOOL_ADMIN') {
            localStorage.removeItem('edubenin_active_school_id');
          }

          setUser({
            id: sessionUser.id,
            email: sessionUser.email || "",
            name: currentProfile.full_name || sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0] || "User",
            role: currentProfile.role as any,
            schoolId: finalSchoolId,
            avatar: currentProfile.avatar_url,
          });
        } else {
          // Profile was deleted or not created yet
          const chosenRole = (localStorage.getItem("pending_google_role") as any) || getRoleForSupabaseUser(sessionUser.email || "");
          
          // Check if an active school exists in localStorage (e.g. just created during onboarding)
          const activeSchoolFromStorage = invitedSchoolId || localStorage.getItem('edubenin_active_school_id') || undefined;

          // For SUPER_ADMIN or PARENT, schoolId is undefined
          // For SCHOOL_ADMIN, if they have an active school in storage, use it; otherwise undefined to prompt onboarding
          const fallbackSchoolId = (chosenRole === 'SUPER_ADMIN' || chosenRole === 'PARENT') 
            ? undefined 
            : activeSchoolFromStorage;

          setUser({
            id: sessionUser.id,
            email: sessionUser.email || "",
            name: sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0] || "User",
            role: chosenRole,
            schoolId: fallbackSchoolId,
          });
        }
      } catch (err) {
        console.error("Error fetching profile", err);
      } finally {
        setIsLoading(false);
      }
    };

    // 1. Check Supabase auth state first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchSupabaseProfile(session.user);
      } else {
        // 2. Fallback to local storage (mock user)
        const savedUser = localStorage.getItem("edubenin_auth");
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
      }
    });

    // Listen to Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchSupabaseProfile(session.user);
        localStorage.removeItem("edubenin_auth"); // Clear mock user if logged in with Supabase
      } else {
        // If logged out from Supabase, check if there's a local mock user, otherwise null
        const savedUser = localStorage.getItem("edubenin_auth");
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {}
    localStorage.removeItem("edubenin_auth");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline'
        }
      }
    });
    if (error) {
      console.error("Google Auth Error:", error.message);
      throw error;
    }
  };

  const updateUserSchool = (schoolId: string, schoolName?: string) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, schoolId, ...(schoolName ? { schoolName } : {}) };
      localStorage.setItem("edubenin_auth", JSON.stringify(updated));
      return updated;
    });
    localStorage.setItem("edubenin_active_school_id", schoolId);
  };

  const login = async (email: string, fullName?: string, password?: string, role?: string) => {
    let cleanEmail = email.trim().toLowerCase();
    let foundUser = MOCK_USERS[cleanEmail] || MOCK_USERS[email];
    let mockPassword = password || "password123";

    // Check if an invitation exists for this email
    let invitedSchoolId: string | null = null;
    let invitedRole: string | null = null;
    try {
      const { data: inv } = await supabase
        .from('invitations')
        .select('*')
        .ilike('email', cleanEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (inv) {
        invitedSchoolId = inv.school_id;
        invitedRole = inv.role;
      }
    } catch (e) {}

    if (!invitedSchoolId) {
      try {
        const localInvs = JSON.parse(localStorage.getItem('mock_db_invitations') || '[]');
        const localInv = localInvs.find((i: any) => i.email && i.email.toLowerCase().trim() === cleanEmail);
        if (localInv) {
          invitedSchoolId = localInv.school_id;
          invitedRole = localInv.role;
        }
      } catch (e) {}
    }

    const effectiveRole = (role || invitedRole || (foundUser ? foundUser.role : "PARENT")) as any;
    const activeSchoolFallback = invitedSchoolId || localStorage.getItem('edubenin_active_school_id') || realSchoolId;
    
    // For SCHOOL_ADMIN: if no real school exists in database, do NOT assign a fallback school!
    let schoolIdForUser: string | undefined = undefined;
    if (effectiveRole !== 'SUPER_ADMIN' && effectiveRole !== 'PARENT') {
      if (effectiveRole === 'SCHOOL_ADMIN') {
        schoolIdForUser = activeSchoolFallback || undefined;
      } else {
        schoolIdForUser = invitedSchoolId || activeSchoolFallback || foundUser?.schoolId || undefined;
      }
    }

    let userToSet = foundUser ? 
      { ...foundUser, email: cleanEmail, role: effectiveRole, schoolId: schoolIdForUser }
      : {
        id: "00000000-0000-4000-8000-000000000000",
        email: cleanEmail,
        name: fullName || cleanEmail.split("@")[0],
        role: effectiveRole,
        schoolId: schoolIdForUser
      };

    if (userToSet.schoolId) {
      localStorage.setItem('edubenin_active_school_id', userToSet.schoolId);
    } else if (effectiveRole === 'SCHOOL_ADMIN') {
      localStorage.removeItem('edubenin_active_school_id');
    }

    if (foundUser || email.includes("test")) {
       localStorage.setItem("is_test_account", "true");
       setUser(userToSet);
       localStorage.setItem("edubenin_auth", JSON.stringify(userToSet));
       return;
    } else {
       localStorage.removeItem("is_test_account");
    }

    try {
      // 1. Try to login
      let { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: mockPassword });
      
      if (authError && (authError.message.includes('Invalid login credentials') || authError.message.includes('Invalid') || authError.status === 400)) {
         // 2. Try to signup
         const signupRes = await supabase.auth.signUp({ email: cleanEmail, password: mockPassword });
         authData = signupRes.data;
      }
      
      if (authData?.user) {
         userToSet.id = authData.user.id;
         // Upsert profile
         try {
           await supabase.from('profiles').upsert({
             id: userToSet.id,
             email: cleanEmail,
             full_name: userToSet.name,
             role: userToSet.role,
             school_id: userToSet.schoolId || null
           });
         } catch (e) {}
         
         setUser(userToSet);
         localStorage.removeItem("edubenin_auth");
         return; // Success!
      }
    } catch (e) {
      console.error("Supabase auth failed, falling back to local mock", e);
    }
    
    // Fallback if Supabase fails (e.g. no internet)
    setUser(userToSet);
    localStorage.setItem("edubenin_auth", JSON.stringify(userToSet));
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
    localStorage.removeItem("edubenin_auth");
    localStorage.removeItem("is_test_account");
    localStorage.removeItem("edubenin_active_school_id");
    localStorage.removeItem("pending_google_role");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogle, logout, updateUserSchool }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
