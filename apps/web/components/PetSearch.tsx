"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMyPets, Pet } from "@/api/api";

interface PetCardProps {
  pet: Pet;
  onAnalyzeHealth: (pet: Pet) => void;
  onHealthHistory: (pet: Pet) => void;
}

function PetCard({ pet, onAnalyzeHealth, onHealthHistory }: PetCardProps) {
  const formatAge = () => {
    if (pet.dateOfBirth) {
      const birthDate = new Date(pet.dateOfBirth);
      const today = new Date();
      const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                         (today.getMonth() - birthDate.getMonth());
      
      if (ageInMonths < 12) {
        return `${ageInMonths} months`;
      } else {
        const years = Math.floor(ageInMonths / 12);
        return `${years} year${years !== 1 ? 's' : ''}`;
      }
    }
    return pet.approximateAge || "Age unknown";
  };

  return (
    <div className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {pet.profileImage ? (
          <img
            src={pet.profileImage}
            alt={pet.name}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
            🐾
          </div>
        )}
        
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{pet.name}</h3>
          <p className="text-sm opacity-70 capitalize">
            {pet.species} {pet.breed && `• ${pet.breed}`}
          </p>
          <p className="text-sm opacity-70">{formatAge()}</p>
          {pet.weight && (
            <p className="text-sm opacity-70">{pet.weight} kg</p>
          )}
        </div>
      </div>

      {pet.medicalNotes && (
        <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
          <strong>Medical Notes:</strong> {pet.medicalNotes}
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onAnalyzeHealth(pet)}
          className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
        >
          Analyze Health
        </button>
        <button
          onClick={() => onHealthHistory(pet)}
          className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
        >
          Health History
        </button>
      </div>
    </div>
  );
}

export default function PetSearch() {
  const { getToken } = useAuth();
  const [allPets, setAllPets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchName, setSearchName] = useState("");

  // Load user's pets on mount
  useEffect(() => {
    const loadPets = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) return;

        const petsData = await getMyPets(token);
        setAllPets(petsData.pets);
        setFilteredPets(petsData.pets);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load pets");
      } finally {
        setLoading(false);
      }
    };

    loadPets();
  }, [getToken]);

  // Filter pets when search name changes
  useEffect(() => {
    if (!searchName.trim()) {
      setFilteredPets(allPets);
    } else {
      setFilteredPets(
        allPets.filter((pet) =>
          pet.name.toLowerCase().includes(searchName.toLowerCase())
        )
      );
    }
  }, [searchName, allPets]);

  const handleAnalyzeHealth = (pet: Pet) => {
    // TODO: Navigate to health analysis component
    console.log("Analyze health for:", pet.name);
  };

  const handleHealthHistory = (pet: Pet) => {
    // TODO: Navigate to health history component
    console.log("View health history for:", pet.name);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">My Pets</h2>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="max-w-md">
          <label className="block text-sm font-medium mb-2">
            Search by Name
          </label>
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Enter pet name..."
            className="w-full px-4 py-3 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground text-base"
          />
        </div>
        {searchName && (
          <p className="text-sm opacity-70 mt-2">
            Showing {filteredPets.length} pet{filteredPets.length !== 1 ? "s" : ""} matching "{searchName}"
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
      ) : filteredPets.length === 0 ? (
        <div className="text-center py-12 opacity-70">
          <p className="text-lg mb-2">
            {searchName ? "No pets found" : "No pets registered"}
          </p>
          <p className="text-sm">
            {searchName
              ? "Try a different search term"
              : "Add your first pet to get started"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPets.map((pet) => (
            <PetCard
              key={pet._id}
              pet={pet}
              onAnalyzeHealth={handleAnalyzeHealth}
              onHealthHistory={handleHealthHistory}
            />
          ))}
        </div>
      )}
    </div>
  );
}