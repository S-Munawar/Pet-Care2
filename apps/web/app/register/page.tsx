"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const { register, loginWithGoogle, user, loading, isRegistered } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      // Always go to dashboard - it will handle registration completion
      router.push("/dashboard");
    }
  }, [loading, user, isRegistered, router]);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      if (!email || !password) {
        setError("Please fill in all required fields");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      // Create Firebase account
      await register(email, password);
      // User will be redirected to dashboard via useEffect
      // Dashboard will show CompleteRegistration component
    } catch (err: unknown) {
      console.error("Registration failed:", err);
      if (err instanceof Error && err.message.includes("email-already-in-use")) {
        setError("This email is already registered. Please sign in instead.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      await loginWithGoogle();
      // User will be redirected via useEffect
    } catch (err) {
      console.error("Google sign-up failed:", err);
      setError("Google sign-up failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-2xl font-bold no-underline inline-block mb-6"
          >
            🐾 Pet Care
          </Link>
          <h1 className="text-3xl font-semibold mb-2">Create Account</h1>
          <p className="opacity-70">Join us to care for your pets</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="you@example.com"
              required
              className="px-4 py-3 border border-border rounded-lg text-base bg-transparent text-foreground transition-colors duration-200 focus:outline-none focus:border-foreground placeholder:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              required
              minLength={6}
              className="px-4 py-3 border border-border rounded-lg text-base bg-transparent text-foreground transition-colors duration-200 focus:outline-none focus:border-foreground placeholder:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="••••••••"
              required
              minLength={6}
              className="px-4 py-3 border border-border rounded-lg text-base bg-transparent text-foreground transition-colors duration-200 focus:outline-none focus:border-foreground placeholder:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 py-3.5 bg-foreground text-background border-none rounded-lg text-base font-medium cursor-pointer transition-opacity duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-foreground opacity-70">
                Or continue with
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={isSubmitting}
            className="py-3.5 border border-border rounded-lg text-base font-medium cursor-pointer transition-all duration-200 hover:bg-foreground hover:text-background disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </form>

        <p className="text-xs text-center mt-6 opacity-70">
          After creating your account, you&apos;ll choose your role (Pet Owner,
          Vet, or Admin). Vet and Admin roles require approval.
        </p>

        <div className="text-center mt-4">
          <p>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium underline hover:opacity-80"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
