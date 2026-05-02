"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useRouter, usePathname } from "next/navigation";

type RoleType = "admin" | "user" | null;
type AuthContextType = {
  role: RoleType;
  setRole: (role: RoleType) => void;
  logout: () => Promise<void>;
};

// Create a context for authentication
export const AuthContext = createContext<AuthContextType | null>(null);

// Helper function to decode JWT and get expiry time
const getTokenExpiry = (): number | null => {
  try {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("access_token="))
      ?.split("=")[1];

    if (!token) return null;

    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch {
    return null;
  }
};

// Helper function to check if JWT token is expired
const isTokenExpired = (): boolean => {
  const expiry = getTokenExpiry();
  return !expiry || Date.now() >= expiry;
};

// Compute initial role based on stored role and token expiry
const getInitialRole = (): RoleType => {
  if (typeof window === "undefined") return null;
  const savedRole = localStorage.getItem("userRole") as RoleType | null;
  if (isTokenExpired()) {
    localStorage.removeItem("userRole");
    return null;
  }
  return savedRole || null;
};

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<RoleType>(() => getInitialRole());
  const router = useRouter();
  const pathname = usePathname();

  // Check token on mount and set up timeout to logout at exact expiry
  useEffect(() => {
    if (typeof window === "undefined") return;

    // If token already expired on mount, clear stored role and redirect
    if (isTokenExpired()) {
      localStorage.removeItem("userRole");
      if (pathname?.startsWith("/admin") || pathname?.startsWith("/history")) {
        router.push("/auth/login");
      }
      return;
    }

    // Decode expiry and set timeout for exact expiry moment
    const expiry = getTokenExpiry();
    if (!expiry) return;

    const timeUntilExpiry = expiry - Date.now();
    if (timeUntilExpiry <= 0) return; // Token already expired

    // Set timeout to logout exactly when token expires
    const logoutTimer = setTimeout(() => {
      console.log("Session expired - logging out");
      localStorage.removeItem("userRole");
      setRole(null);
      if (pathname?.startsWith("/admin") || pathname?.startsWith("/history")) {
        router.push("/auth/login");
      }
    }, timeUntilExpiry);

    return () => clearTimeout(logoutTimer);
  }, [router, pathname, role]);

  // Save role to localStorage whenever it changes
  const handleSetRole = (newRole: RoleType) => {
    setRole(newRole);
    if (newRole) {
      localStorage.setItem("userRole", newRole);
    } else {
      localStorage.removeItem("userRole"); // Remove if setting to null
    }
  };

  // Centralized logout function
  const logout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
    } catch (error) {
      console.error("Error during logout API call:", error);
    } finally {
      // Always clear local state regardless of API response
      localStorage.removeItem("userRole");
      setRole(null);
      router.push("/auth/login");
    }
  };

  return (
    <AuthContext.Provider value={{ role, setRole: handleSetRole, logout }}>
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
