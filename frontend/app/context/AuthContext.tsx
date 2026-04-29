"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type RoleType = "admin" | "user" | null;
type AuthContextType = {
  role: RoleType;
  setRole: (role: RoleType) => void;
};

// Create a context for authentication
export const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<RoleType>(() => {
    if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem("userRole") as RoleType | null;
      return savedRole || null; // Return null if no saved role
    }
    return null;
  });

  // Save role to localStorage whenever it changes
  const handleSetRole = (newRole: RoleType) => {
    setRole(newRole);
    if (newRole) {
      localStorage.setItem("userRole", newRole);
    } else {
      localStorage.removeItem("userRole"); // Remove if setting to null
    }
  };

  return (
    <AuthContext.Provider value={{ role, setRole: handleSetRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
