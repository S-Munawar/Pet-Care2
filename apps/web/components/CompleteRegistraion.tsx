import React, { useState } from "react";
import { register } from "@/api/api";
import { useAuth } from "@/context/AuthContext";
import { ROLES } from "@repo/shared";
import { useRouter } from "next/navigation";

const CompleteRegistration = () => {
  const { getToken, refreshUserData } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>(ROLES.PET_OWNER);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseCountry, setLicenseCountry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompleteRegistration = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      // Only pass requestedRole if user wants vet/admin (higher privilege)
      const requestedRole =
        selectedRole === ROLES.VET || selectedRole === ROLES.ADMIN
          ? selectedRole
          : undefined;

      await register(token, requestedRole);

      // Refresh user data to get updated role state
      await refreshUserData();

      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to complete registration:", err);
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <form onSubmit={handleCompleteRegistration} className="flex flex-col gap-5">
        <h2 className="text-2xl font-bold mb-4">Complete Your Registration</h2>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <label htmlFor="role" className="font-medium">
            Select your role:
          </label>
          <select
            id="role"
            name="role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-3 border border-border rounded-lg text-base bg-transparent text-foreground transition-colors duration-200 focus:outline-none focus:border-foreground"
          >
            <option value={ROLES.PET_OWNER}>Pet Owner</option>
            <option value={ROLES.VET}>Veterinarian (requires approval)</option>
            <option value={ROLES.ADMIN}>Admin (requires approval)</option>
          </select>

          {/* Show license fields for vet role */}
          {selectedRole === ROLES.VET && (
            <div className="flex flex-col gap-3 p-4 border rounded-lg bg-blue-50">
              <p className="text-sm text-blue-700">
                Vet registration requires license verification. Your account will
                be pending until approved by an admin.
              </p>
              <input
                type="text"
                placeholder="License Number"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="px-4 py-2 border rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="License Country"
                value={licenseCountry}
                onChange={(e) => setLicenseCountry(e.target.value)}
                className="px-4 py-2 border rounded-lg"
                required
              />
            </div>
          )}

          {selectedRole === ROLES.ADMIN && (
            <div className="p-4 border rounded-lg bg-yellow-50">
              <p className="text-sm text-yellow-700">
                Admin role requires approval. You will start as a Pet Owner until
                your request is reviewed.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 px-6 py-3 rounded-lg text-base font-medium transition-all duration-200 bg-foreground text-background hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Registering..." : "Complete Registration"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompleteRegistration;
