"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const NavBar = () => {
  const { logout, user, role, roleStatus, isRegistered, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // Format role for display
  const formatRole = (r: string | null) => {
    if (!r) return null;
    return r
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Get role badge color
  const getRoleBadgeColor = () => {
    if (roleStatus === "pending") return "bg-yellow-100 text-yellow-800";
    if (roleStatus === "rejected") return "bg-red-100 text-red-800";
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "vet":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold no-underline">
            🐾 Pet Care
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-6 h-6 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin"></div>
            ) : user ? (
              <>
                {/* Dashboard Link */}
                <Link
                  href="/dashboard"
                  className="text-sm hover:opacity-70 transition-opacity"
                >
                  Dashboard
                </Link>

                {/* User Info */}
                <div className="flex items-center gap-3">
                  {/* Role Badge */}
                  {isRegistered && role && (
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor()}`}
                    >
                      {roleStatus === "pending"
                        ? `${formatRole(role)} (Pending)`
                        : roleStatus === "rejected"
                          ? `${formatRole(role)} (Rejected)`
                          : formatRole(role)}
                    </span>
                  )}

                  {/* User Email */}
                  <span className="text-sm opacity-70 hidden sm:inline">
                    {user.email}
                  </span>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-foreground hover:text-background transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm hover:opacity-70 transition-opacity"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
