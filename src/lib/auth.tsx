import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "../types";
import { supabase } from "./supabase";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string) => void; // Keeps mock support
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock Users for testing
const MOCK_USERS: Record<string, User> = {
  "super@edubenin.com": {
    id: "super_1",
    email: "super@edubenin.com",
    name: "Tola (Super Admin)",
    role: "SUPER_ADMIN",
  },
  "admin@school.com": {
    id: "admin_1",
    email: "admin@school.com",
    name: "Directeur Ecole A",
    role: "SCHOOL_ADMIN",
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
    // 1. Check Supabase auth state first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Build user from supabase
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
          role: "PARENT", // By default for Google logins, you can implement role mapping later
        });
      } else {
        // 2. Fallback to local storage (mock user)
        const savedUser = localStorage.getItem("edubenin_auth");
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      }
      setIsLoading(false);
    });

    // Listen to Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
          role: "PARENT", // Default role
        });
        localStorage.removeItem("edubenin_auth"); // Clear mock user if logged in with Supabase
      } else {
        // If logged out from Supabase, check if there's a local mock user, otherwise null
        const savedUser = localStorage.getItem("edubenin_auth");
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          setUser(null);
        }
      }
      setIsLoading(false);
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

  const login = (email: string) => {
    const foundUser = MOCK_USERS[email];
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem("edubenin_auth", JSON.stringify(foundUser));
    } else {
      // Auto-create a mock user if not found just to not block testing
      const newUser: User = {
        id: `user_${Date.now()}`,
        email,
        name: email.split("@")[0],
        role: "PARENT"
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
