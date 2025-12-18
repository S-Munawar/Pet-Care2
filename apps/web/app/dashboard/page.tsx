"use client";
import React from "react";
import PetOwnerDashboard from "@/components/PetOwnerDashboard";
import VetDashboard from "@/components/VetDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import PendingApproval from "@/components/PendingApproval";
import CompleteRegistration from "@/components/CompleteRegistraion";
import { useAuth } from "@/context/AuthContext";
import { ROLES, ROLE_STATUSES } from "@repo/shared";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
    </div>
  );
}

function Rejected() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Role Request Rejected
        </h2>
        <p className="text-gray-600 mb-4">
          Your role upgrade request has been rejected. You can continue using the
          platform as a Pet Owner or contact support for more information.
        </p>
        <p className="text-sm text-gray-500">
          You can submit a new request from your profile settings.
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, loading, role, roleStatus, isRegistered, hasPendingRequest } =
    useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // Show loading while checking auth state
  if (loading) {
    return <Loading />;
  }

  // Not authenticated
  if (!user) {
    return null; // Will redirect
  }

  // Authenticated but not registered in our system
  if (!isRegistered) {
    return <CompleteRegistration />;
  }

  // Role status checks (UX only - backend enforces security)
  if (roleStatus === ROLE_STATUSES.REJECTED) {
    return <Rejected />;
  }

  // Show pending approval UI if user has a pending role request
  if (hasPendingRequest) {
    return <PendingApproval />;
  }

  // Role-based dashboard rendering (UX only)
  switch (role) {
    case ROLES.ADMIN:
      return <AdminDashboard />;
    case ROLES.VET:
      return <VetDashboard />;
    case ROLES.PET_OWNER:
    default:
      return <PetOwnerDashboard />;
  }
}


 