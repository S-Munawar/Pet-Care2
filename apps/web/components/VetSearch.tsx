"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  searchVets,
  getSpecializations,
  getVetPublicProfile,
  type VetProfile,
  type Specialization,
} from "@/api/api";

interface VetCardProps {
  vet: VetProfile;
  onClick: () => void;
}

function VetCard({ vet, onClick }: VetCardProps) {
  return (
    <div
      onClick={onClick}
      className="p-4 border border-border rounded-lg cursor-pointer hover:border-foreground transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
          {vet.profileImage ? (
            <img
              src={vet.profileImage}
              alt={vet.displayName || "Vet"}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            "👨‍⚕️"
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">
              {vet.displayName || "Veterinarian"}
            </h3>
            {vet.verified && (
              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                ✓ Verified
              </span>
            )}
          </div>
          {vet.specializations && vet.specializations.length > 0 && (
            <p className="text-sm opacity-70 capitalize">
              {vet.specializations.slice(0, 2).join(", ").replace(/-/g, " ")}
              {vet.specializations.length > 2 &&
                ` +${vet.specializations.length - 2} more`}
            </p>
          )}
          {(vet.clinicCity || vet.clinicCountry) && (
            <p className="text-sm opacity-70 mt-1">
              📍 {[vet.clinicCity, vet.clinicCountry].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {vet.yearsOfExperience && (
          <span className="px-2 py-1 text-xs bg-gray-100 rounded">
            {vet.yearsOfExperience} years exp.
          </span>
        )}
        {vet.availableForOnlineConsultation && (
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
            Online Consultation
          </span>
        )}
        {vet.consultationFee && (
          <span className="px-2 py-1 text-xs bg-gray-100 rounded">
            {vet.currency || "$"} {vet.consultationFee}
          </span>
        )}
      </div>
    </div>
  );
}

interface VetDetailModalProps {
  vet: VetProfile;
  onClose: () => void;
}

function VetDetailModal({ vet, onClose }: VetDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
                {vet.profileImage ? (
                  <img
                    src={vet.profileImage}
                    alt={vet.displayName || "Vet"}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  "👨‍⚕️"
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">
                    {vet.displayName || "Veterinarian"}
                  </h2>
                  {vet.verified && (
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                      ✓ Verified
                    </span>
                  )}
                </div>
                {vet.email && (
                  <a
                    href={`mailto:${vet.email}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {vet.email}
                  </a>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ✕
            </button>
          </div>

          {vet.bio && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-sm opacity-80">{vet.bio}</p>
            </div>
          )}

          {vet.specializations && vet.specializations.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Specializations</h3>
              <div className="flex flex-wrap gap-2">
                {vet.specializations.map((spec) => (
                  <span
                    key={spec}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm capitalize"
                  >
                    {spec.replace(/-/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {(vet.degrees?.length || vet.certifications?.length) && (
              <div>
                <h3 className="font-semibold mb-2">Qualifications</h3>
                {vet.degrees && vet.degrees.length > 0 && (
                  <div className="mb-2">
                    <span className="text-sm font-medium">Degrees: </span>
                    <span className="text-sm opacity-80">
                      {vet.degrees.join(", ")}
                    </span>
                  </div>
                )}
                {vet.certifications && vet.certifications.length > 0 && (
                  <div>
                    <span className="text-sm font-medium">Certifications: </span>
                    <span className="text-sm opacity-80">
                      {vet.certifications.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Experience</h3>
              {vet.yearsOfExperience && (
                <p className="text-sm opacity-80">
                  {vet.yearsOfExperience} years of experience
                </p>
              )}
              {vet.languagesSpoken && vet.languagesSpoken.length > 0 && (
                <p className="text-sm opacity-80 mt-1">
                  Languages: {vet.languagesSpoken.join(", ")}
                </p>
              )}
            </div>
          </div>

          {vet.clinicName && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Clinic Information</h3>
              <p className="font-medium">{vet.clinicName}</p>
              {vet.clinicAddress && (
                <p className="text-sm opacity-80">{vet.clinicAddress}</p>
              )}
              {(vet.clinicCity || vet.clinicState || vet.clinicCountry) && (
                <p className="text-sm opacity-80">
                  {[vet.clinicCity, vet.clinicState, vet.clinicCountry]
                    .filter(Boolean)
                    .join(", ")}
                  {vet.clinicPostalCode && ` ${vet.clinicPostalCode}`}
                </p>
              )}
              {vet.clinicPhone && (
                <p className="text-sm mt-2">
                  📞{" "}
                  <a
                    href={`tel:${vet.clinicPhone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {vet.clinicPhone}
                  </a>
                </p>
              )}
              {vet.clinicEmail && (
                <p className="text-sm">
                  ✉️{" "}
                  <a
                    href={`mailto:${vet.clinicEmail}`}
                    className="text-blue-600 hover:underline"
                  >
                    {vet.clinicEmail}
                  </a>
                </p>
              )}
              {vet.clinicWebsite && (
                <p className="text-sm">
                  🌐{" "}
                  <a
                    href={vet.clinicWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Website
                  </a>
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              {vet.availableForOnlineConsultation && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  ✓ Available for Online Consultation
                </span>
              )}
            </div>
            {vet.consultationFee && (
              <p className="font-semibold">
                Consultation Fee: {vet.currency || "USD"} {vet.consultationFee}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VetSearch() {
  const { getToken } = useAuth();
  const [allVets, setAllVets] = useState<VetProfile[]>([]);
  const [filteredVets, setFilteredVets] = useState<VetProfile[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVet, setSelectedVet] = useState<VetProfile | null>(null);
  const [searchSpecialization, setSearchSpecialization] = useState("");

  // Load all vets and specializations on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) return;

        // Load specializations
        const specsData = await getSpecializations();
        setSpecializations(specsData.specializations);

        // Load all vets (with a high limit to get all)
        const vetsData = await searchVets(token, { limit: 1000 });
        setAllVets(vetsData.vets);
        setFilteredVets(vetsData.vets);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [getToken]);

  // Filter vets when specialization changes
  useEffect(() => {
      setFilteredVets(
        allVets.filter((vet) =>
          vet.specializations?.includes(searchSpecialization)
        )
      );
 
  }, [searchSpecialization, allVets]);

  const handleVetClick = async (vet: VetProfile) => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await getVetPublicProfile(token, vet._id);
      setSelectedVet(data.profile);
    } catch (err) {
      console.error("Failed to load vet profile:", err);
      setSelectedVet(vet);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Find a Veterinarian</h2>

      {/* Simple Search Bar */}
      <div className="mb-6">
        <div className="max-w-md">
          <label className="block text-sm font-medium mb-2">
            Filter by Specialization
          </label>
          <select
            value={searchSpecialization}
            onChange={(e) => setSearchSpecialization(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground text-base"
          >
            <option value="">All Specializations</option>
            {specializations.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        {searchSpecialization && (
          <p className="text-sm opacity-70 mt-2">
            Showing {filteredVets.length} veterinarian
            {filteredVets.length !== 1 ? "s" : ""} with this specialization
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </div>
      ) : filteredVets.length === 0 ? (
        <div className="text-center py-12 opacity-70">
          <p className="text-lg mb-2">No veterinarians found</p>
          <p className="text-sm">
            {searchSpecialization
              ? "Try selecting a different specialization"
              : "No veterinarians available"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVets.map((vet) => (
            <VetCard
              key={vet._id}
              vet={vet}
              onClick={() => handleVetClick(vet)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedVet && (
        <VetDetailModal vet={selectedVet} onClose={() => setSelectedVet(null)} />
      )}
    </div>
  );
}