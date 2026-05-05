"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const { role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is not an admin, redirect to login
    if (role && role !== "admin") {
      router.replace("/auth/login");
    }
    // If no role, also redirect (not authenticated)
    if (role === null) {
      const timer = setTimeout(() => {
        router.replace("/auth/login");
      }, 100); // Small delay to ensure context is ready
      return () => clearTimeout(timer);
    }
  }, [role, router]);

  // Show nothing while checking permissions
  if (!role || role !== "admin") {
    return null;
  }

  return <>{children}</>;
};
