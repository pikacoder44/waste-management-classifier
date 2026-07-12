"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
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

// Helper function to get token expiry time
const getTokenExpiry = (): number | null => {
  if (typeof window === "undefined") return null;

  // Read expiry from localStorage (set during login)
  const expiryStr = localStorage.getItem("tokenExpiry");
  if (!expiryStr) return null;

  const expirySeconds = parseInt(expiryStr, 10);
  if (isNaN(expirySeconds)) return null;

  return expirySeconds * 1000; // Convert from seconds to milliseconds
};

// Compute initial role based on stored role and token expiry
const getInitialRole = (): RoleType => {
  if (typeof window === "undefined") return null;
  const savedRole = localStorage.getItem("userRole") as RoleType | null;
  const expiry = getTokenExpiry();
  if (!expiry || Date.now() >= expiry) {
    localStorage.removeItem("userRole");
    localStorage.removeItem("tokenExpiry");
    return null;
  }
  return savedRole || null;
};

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<RoleType>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setRole(getInitialRole());
  }, []);

  // Centralized logout function
  const logout = useCallback(async () => {
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
      localStorage.removeItem("tokenExpiry");
      setRole(null);
      router.replace("/auth/login"); // Use replace to prevent back-button access
    }
  }, [router, setRole]);

  // Check token on mount and set up timeout to logout at exact expiry
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Decode expiry and check if token is expired
    const expiry = getTokenExpiry();
    if (!expiry || Date.now() >= expiry) {
      // If token already expired on mount, clear stored role and redirect
      localStorage.removeItem("userRole");
      localStorage.removeItem("tokenExpiry");
      if (pathname?.startsWith("/admin") || pathname?.startsWith("/history")) {
        router.replace("/auth/login");
      }
      return;
    }

    const timeUntilExpiry = expiry - Date.now();

    // Declare timer variable upfront, initialized to null
    let logoutTimer: NodeJS.Timeout | null = null;

    if (timeUntilExpiry > 0) {
      // Set timeout to logout exactly when token expires
      logoutTimer = setTimeout(() => {
        console.log("Session expired - logging out");
        logout(); // Reuse centralized logout logic
      }, timeUntilExpiry);
    }

    return () => {
      if (logoutTimer) clearTimeout(logoutTimer);
    };
  }, [router, pathname, role, logout]);

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
