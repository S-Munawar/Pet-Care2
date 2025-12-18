"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getMyVetProfile,
  updateVetProfile,
  getSpecializations,
  type VetProfile,
  type VetProfileInput,
  type Specialization,
} from "@/api/api";

export default function VetProfileEditor() {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<VetProfile | null>(null);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<VetProfileInput>({
    displayName: "",
    specializations: [],
    degrees: [],
    certifications: [],
    yearsOfExperience: undefined,
    languagesSpoken: [],
    clinicName: "",
    clinicAddress: "",
    clinicCity: "",
    clinicState: "",
    clinicCountry: "",
    clinicPostalCode: "",
    clinicPhone: "",
    clinicEmail: "",
    clinicWebsite: "",
    consultationFee: undefined,
    currency: "USD",
    availableForOnlineConsultation: false,
    bio: "",
  });

  const [degreesInput, setDegreesInput] = useState("");
  const [certificationsInput, setCertificationsInput] = useState("");
  const [languagesInput, setLanguagesInput] = useState("");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const [specsData] = await Promise.all([getSpecializations()]);
      setSpecializations(specsData.specializations);

      const token = await getToken();
      if (!token) return;

      try {
        const profileData = await getMyVetProfile(token);
        setProfile(profileData.profile);
        setFormData({
          displayName: profileData.profile.displayName || "",
          specializations: profileData.profile.specializations || [],
          degrees: profileData.profile.degrees || [],
          certifications: profileData.profile.certifications || [],
          yearsOfExperience: profileData.profile.yearsOfExperience,
          languagesSpoken: profileData.profile.languagesSpoken || [],
          clinicName: profileData.profile.clinicName || "",
          clinicAddress: profileData.profile.clinicAddress || "",
          clinicCity: profileData.profile.clinicCity || "",
          clinicState: profileData.profile.clinicState || "",
          clinicCountry: profileData.profile.clinicCountry || "",
          clinicPostalCode: profileData.profile.clinicPostalCode || "",
          clinicPhone: profileData.profile.clinicPhone || "",
          clinicEmail: profileData.profile.clinicEmail || "",
          clinicWebsite: profileData.profile.clinicWebsite || "",
          consultationFee: profileData.profile.consultationFee,
          currency: profileData.profile.currency || "USD",
          availableForOnlineConsultation:
            profileData.profile.availableForOnlineConsultation || false,
          bio: profileData.profile.bio || "",
        });
        setDegreesInput((profileData.profile.degrees || []).join(", "));
        setCertificationsInput(
          (profileData.profile.certifications || []).join(", ")
        );
        setLanguagesInput(
          (profileData.profile.languagesSpoken || []).join(", ")
        );
      } catch {
        // Profile might not exist yet
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const updates: VetProfileInput = {
        ...formData,
        degrees: degreesInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        certifications: certificationsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        languagesSpoken: languagesInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      await updateVetProfile(token, updates);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSpecializationToggle = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations?.includes(value)
        ? prev.specializations.filter((s) => s !== value)
        : [...(prev.specializations || []), value],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Vet Profile</h2>
        {profile?.verified && (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            ✓ Verified
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {profile && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">License Information</h3>
          <p className="text-sm">
            <span className="opacity-70">License Number:</span>{" "}
            {profile.licenseNumber}
          </p>
          <p className="text-sm">
            <span className="opacity-70">Country:</span> {profile.licenseCountry}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                placeholder="Dr. John Smith"
                className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Years of Experience
              </label>
              <input
                type="number"
                min="0"
                max="70"
                value={formData.yearsOfExperience || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    yearsOfExperience: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell pet owners about yourself..."
              className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground resize-none"
            />
          </div>
        </div>

        {/* Specializations */}
        <div className="border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Specializations</h3>
          <div className="flex flex-wrap gap-2">
            {specializations.map((spec) => (
              <button
                key={spec.value}
                type="button"
                onClick={() => handleSpecializationToggle(spec.value)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  formData.specializations?.includes(spec.value)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {spec.label}
              </button>
            ))}
          </div>
        </div>

        {/* Qualifications */}
        <div className="border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Qualifications</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Degrees (comma-separated)
              </label>
              <input
                type="text"
                value={degreesInput}
                onChange={(e) => setDegreesInput(e.target.value)}
                placeholder="DVM, PhD"
                className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Certifications (comma-separated)
              </label>
              <input
                type="text"
                value={certificationsInput}
                onChange={(e) => setCertificationsInput(e.target.value)}
                placeholder="Board Certified, Fear Free Certified"
                className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Languages Spoken (comma-separated)
              </label>
              <input
                type="text"
                value={languagesInput}
                onChange={(e) => setLanguagesInput(e.target.value)}
                placeholder="English, Spanish"
                className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
              />
            </div>
          </div>
        </div>

        {/* Clinic Info */}
        <div className="border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Clinic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Clinic Name
              </label>
              <input
                type="text"
                value={formData.clinicName}
                onChange={(e) =>
                  setFormData({ ...formData, clinicName: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                type="text"
                value={formData.clinicAddress}
                onChange={(e) =>
                  setFormData({ ...formData, clinicAddress: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                value={formData.clinicCity}
                onChange={(e) =>
                  setFormData({ ...formData, clinicCity: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <input
                type="text"
                value={formData.clinicState}
                onChange={(e) =>
                  setFormData({ ...formData, clinicState: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Country</label>
              <input
                type="text"
                value={formData.clinicCountry}
                onChange={(e) =>
                  setFormData({ ...formData, clinicCountry: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Postal Code
              </label>
              <input
                type="text"
                value={formData.clinicPostalCode}
                onChange={(e) =>
                  setFormData({ ...formData, clinicPostalCode: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={formData.clinicPhone}
                onChange={(e) =>
                  setFormData({ ...formData, clinicPhone: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={formData.clinicEmail}
                onChange={(e) =>
                  setFormData({ ...formData, clinicEmail: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Website</label>
              <input
                type="url"
                value={formData.clinicWebsite}
                onChange={(e) =>
                  setFormData({ ...formData, clinicWebsite: e.target.value })
                }
                placeholder="https://"
                className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
              />
            </div>
          </div>
        </div>

        {/* Consultation */}
        <div className="border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Consultation Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Consultation Fee
              </label>
              <input
                type="number"
                min="0"
                value={formData.consultationFee || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    consultationFee: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
                <option value="AUD">AUD</option>
                <option value="CAD">CAD</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.availableForOnlineConsultation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      availableForOnlineConsultation: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <span className="text-sm">Available for Online Consultation</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-foreground text-background rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
