"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isRegistered } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user && isRegistered) {
      router.push("/dashboard");
    }
  }, [loading, user, isRegistered, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="flex flex-col items-center gap-12 max-w-4xl w-full">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">🐾 Pet Care</h1>
          <p className="text-xl opacity-80">
            Your trusted companion for pet health and happiness
          </p>
        </div>

        {loading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        ) : user ? (
          // User is authenticated but not registered
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg">Welcome! Complete your registration to get started.</p>
            <Link
              href="/dashboard"
              className="px-8 py-3.5 rounded-lg text-base font-medium transition-all duration-200 bg-foreground text-background hover:opacity-90 hover:-translate-y-0.5 text-center"
            >
              Complete Registration
            </Link>
          </div>
        ) : (
          // Not authenticated
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-lg text-base font-medium transition-all duration-200 bg-foreground text-background hover:opacity-90 hover:-translate-y-0.5 text-center"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-8 py-3.5 rounded-lg text-base font-medium transition-all duration-200 border-2 border-foreground text-foreground bg-transparent hover:bg-foreground hover:text-background text-center"
            >
              Register
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <div className="text-center p-6 rounded-xl border border-border-light">
            <span className="text-4xl block mb-4">📅</span>
            <h3 className="text-lg font-semibold mb-2">Schedule Appointments</h3>
            <p className="text-sm opacity-70">
              Book vet visits and grooming sessions
            </p>
          </div>
          <div className="text-center p-6 rounded-xl border border-border-light">
            <span className="text-4xl block mb-4">💊</span>
            <h3 className="text-lg font-semibold mb-2">Track Health</h3>
            <p className="text-sm opacity-70">
              Monitor medications and vaccinations
            </p>
          </div>
          <div className="text-center p-6 rounded-xl border border-border-light">
            <span className="text-4xl block mb-4">🏥</span>
            <h3 className="text-lg font-semibold mb-2">Find Vets</h3>
            <p className="text-sm opacity-70">
              Locate trusted veterinarians nearby
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
