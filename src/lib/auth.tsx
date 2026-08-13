import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "../types";
import { supabase } from "./supabase";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, fullName?: string, password?: string, role?: string) => void; // Keeps mock support
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
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
  },
  "prof@school.com": {
    id: "77777777-7777-4777-8777-777777777777",
    email: "prof@school.com",
    name: "Professeur P.",
    role: "TEACHER",
    schoolId: "11111111-1111-4111-8111-111111111111",
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [realSchoolId, setRealSchoolId] = useState<string | null>(null);
  const [realProfileId, setRealProfileId] = useState<string | null>(null);

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
        
        if (pendingRole) {
          localStorage.removeItem("pending_google_role");
          // If they chose a role during Google Sign-In, update their profile
          // This overrides the default 'PARENT' role created by the database trigger
          // Fetch current profile to see if school_id is missing
          const { data: tempProfile } = await supabase.from('profiles').select('school_id').eq('id', sessionUser.id).single();
          let schoolId = tempProfile?.school_id;
          if (pendingRole === 'SCHOOL_ADMIN' && !schoolId) {
             // Do not automatically create a school. Let the user go to onboarding.
             schoolId = null;
          }
          const { error: updateError } = await supabase.from('profiles').update({ role: pendingRole, school_id: schoolId }).eq('id', sessionUser.id);
          if (updateError) {
            console.error("Erreur lors de la mise à jour du rôle :", updateError);
            alert(`Erreur: Le rôle n'a pas pu être mis à jour. Détail: ${updateError.message}`);
          }
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, full_name, school_id')
          .eq('id', sessionUser.id)
          .single();

        if (profile) {
          if (sessionUser.email === 'contact.tchok@gmail.com' && profile.role !== 'SUPER_ADMIN') {
             await supabase.from('profiles').update({ role: 'SUPER_ADMIN', school_id: null }).eq('id', sessionUser.id);
             profile.role = 'SUPER_ADMIN';
             profile.school_id = null;
          }
          setUser({
            id: sessionUser.id,
            email: sessionUser.email || "",
            name: profile.full_name || sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0] || "User",
            role: profile.role as any,
            schoolId: profile.school_id,
          });
        } else {
          // Fallback if profile not created yet
          setUser({
            id: sessionUser.id,
            email: sessionUser.email || "",
            name: sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0] || "User",
            role: getRoleForSupabaseUser(sessionUser.email || ""),
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });
    if (error) {
      console.error("Google Auth Error:", error.message);
      throw error;
    }
  };

  
  const login = async (email: string, fullName?: string, password?: string, role?: string) => {
    let foundUser = MOCK_USERS[email];
    let mockPassword = password || "password123";
    
    let userToSet = foundUser ? 
      (role ? { ...foundUser, role: role as any, schoolId: (role === 'SUPER_ADMIN' || role === 'PARENT') ? undefined : (realSchoolId || foundUser.schoolId) } : { ...foundUser, schoolId: (foundUser.role === 'SUPER_ADMIN' || foundUser.role === 'PARENT') ? undefined : (realSchoolId || foundUser.schoolId) })
      : {
        id: "00000000-0000-4000-8000-000000000000",
        email,
        name: fullName || email.split("@")[0],
        role: (role as any) || "PARENT",
        schoolId: (role === 'SUPER_ADMIN' || role === 'PARENT' || role === 'SCHOOL_ADMIN') ? undefined : (realSchoolId || '11111111-1111-4111-8111-111111111111')
      };

    try {
      // 1. Try to login
      let { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password: mockPassword });
      
      if (authError && (authError.message.includes('Invalid login credentials') || authError.message.includes('Invalid') || authError.status === 400)) {
         // 2. Try to signup
         const signupRes = await supabase.auth.signUp({ email, password: mockPassword });
         authData = signupRes.data;
      }
      
      if (authData?.user) {
         userToSet.id = authData.user.id;
         // Upsert profile
         await supabase.from('profiles').upsert({
           id: userToSet.id,
           email: userToSet.email,
           full_name: userToSet.name,
           role: userToSet.role,
           school_id: userToSet.schoolId
         });
         
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
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem("edubenin_auth");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
