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
    id: "admin_1",
    email: "admin@school.com",
    name: "Directeur Ecole A",
    role: "SCHOOL_ADMIN",
    schoolId: "school_1",
  },
  "caisse@school.com": {
    id: "caisse_1",
    email: "caisse@school.com",
    name: "Caisse Ecole",
    role: "CASHIER",
    schoolId: "school_1",
  },
  "secretary@school.com": {
    id: "sec_1",
    email: "secretary@school.com",
    name: "Secrétaire Ecole",
    role: "SECRETARY",
    schoolId: "school_1",
  },
  "parent@mail.com": {
    id: "parent_1",
    email: "parent@mail.com",
    name: "Parent E.",
    role: "PARENT",
  },
  "prof@school.com": {
    id: "prof_1",
    email: "prof@school.com",
    name: "Professeur P.",
    role: "TEACHER",
    schoolId: "school_1",
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
             const { data: newSchool, error: schoolErr } = await supabase.from('schools').insert({
                name: "Mon Établissement",
                locality: "À définir",
                contacts: ""
             }).select().single();
             if (newSchool) {
                schoolId = newSchool.id;
             }
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

  const login = (email: string, fullName?: string, password?: string, role?: string) => {
    const foundUser = MOCK_USERS[email];
    if (foundUser) {
      // If a role is explicitly requested, we can update the mock user's role
      const userToSet = role ? { ...foundUser, role: role as any } : foundUser;
      setUser(userToSet);
      localStorage.setItem("edubenin_auth", JSON.stringify(userToSet));
    } else {
      // Auto-create a mock user if not found just to not block testing
      const newUser: User = {
        id: `user_${Date.now()}`,
        email,
        name: fullName || email.split("@")[0],
        role: (role as any) || "PARENT",
        schoolId: (role === "SCHOOL_ADMIN") ? "school_mock_1" : undefined
      };
      setUser(newUser);
      localStorage.setItem("edubenin_auth", JSON.stringify(newUser));
    }
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
