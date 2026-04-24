"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  user: string | null;
  setUser: (user: string | null) => void;
}

// Create a context for authentication
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<string | null>("user");
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
