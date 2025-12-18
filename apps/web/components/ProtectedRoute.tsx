"use client";

import { useAuth } from "@/context/AuthContext";
import type { Role } from "@repo/shared";
import { ROLE_STATUSES } from "@repo/shared";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Role[];
  requireRegistration?: boolean;
  requireApproval?: boolean;
  fallbackPath?: string;
}

/**
 * UX-only route guard component.
 * This provides a better user experience by redirecting unauthorized users.
 *
 * IMPORTANT: This does NOT enforce security. All security is enforced by the backend.
 * This component only prevents users from seeing UI they can't interact with.
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
  requireRegistration = true,
  requireApproval = true,
  fallbackPath = "/login",
}: ProtectedRouteProps) {
  const { user, loading, role, roleStatus, isRegistered } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Not authenticated
    if (!user) {
      router.push(fallbackPath);
      return;
    }

    // Not registered but registration required
    if (requireRegistration && !isRegistered) {
      router.push("/register");
      return;
    }

    // Role not approved but approval required
    if (requireApproval && roleStatus !== ROLE_STATUSES.APPROVED) {
      router.push("/dashboard"); // Dashboard handles pending/rejected states
      return;
    }

    // Role check (if specific roles required)
    if (allowedRoles && role && !allowedRoles.includes(role)) {
      router.push("/dashboard"); // Redirect to appropriate dashboard
      return;
    }
  }, [
    loading,
    user,
    role,
    roleStatus,
    isRegistered,
    allowedRoles,
    requireRegistration,
    requireApproval,
    fallbackPath,
    router,
  ]);

  // Show nothing while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
      </div>
    );
  }

  // Show nothing if not authorized (will redirect)
  if (!user) return null;
  if (requireRegistration && !isRegistered) return null;
  if (requireApproval && roleStatus !== ROLE_STATUSES.APPROVED) return null;
  if (allowedRoles && role && !allowedRoles.includes(role)) return null;

  return <>{children}</>;
}
