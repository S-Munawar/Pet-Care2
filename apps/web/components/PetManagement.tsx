"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getMyPets,
  addPet,
  updatePet,
  removePet,
  restorePet,
  type Pet,
  type PetInput,
} from "@/api/api";
import HealthAnalysis from "./HealthAnalysis";
import HealthHistory from "./HealthHistory";

const PET_SPECIES = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "bird", label: "Bird" },
  { value: "fish", label: "Fish" },
  { value: "rabbit", label: "Rabbit" },
  { value: "hamster", label: "Hamster" },
  { value: "reptile", label: "Reptile" },
  { value: "other", label: "Other" },
];

const PET_BREEDS = {
  dog: [
    "Labrador Retriever", "Golden Retriever", "German Shepherd", "Bulldog", "Poodle",
    "Beagle", "Rottweiler", "Yorkshire Terrier", "Dachshund", "Siberian Husky",
    "Boxer", "Border Collie", "Chihuahua", "Shih Tzu", "Boston Terrier", "Mixed Breed"
  ],
  cat: [
    "Persian", "Maine Coon", "British Shorthair", "Ragdoll", "Bengal",
    "Abyssinian", "Birman", "Oriental Shorthair", "Manx", "Russian Blue",
    "American Shorthair", "Scottish Fold", "Sphynx", "Siamese", "Mixed Breed"
  ],
  bird: [
    "Budgerigar", "Cockatiel", "Canary", "Lovebird", "Conure", "Macaw",
    "African Grey", "Cockatoo", "Finch", "Parakeet", "Other"
  ],
  fish: [
    "Goldfish", "Betta", "Guppy", "Angelfish", "Tetra", "Molly",
    "Platy", "Swordtail", "Barb", "Cichlid", "Other"
  ],
  rabbit: [
    "Holland Lop", "Netherland Dwarf", "Mini Rex", "Lionhead", "Flemish Giant",
    "English Angora", "Dutch", "Mini Lop", "Rex", "Mixed Breed"
  ],
  hamster: [
    "Syrian", "Dwarf Campbell Russian", "Dwarf Winter White Russian",
    "Roborovski", "Chinese", "European"
  ],
  reptile: [
    "Bearded Dragon", "Leopard Gecko", "Ball Python", "Corn Snake",
    "Blue-Tongued Skink", "Iguana", "Turtle", "Tortoise", "Other"
  ],
  other: ["Mixed", "Unknown", "Other"]
};

interface PetFormProps {
  pet?: Pet;
  onSubmit: (data: PetInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function PetForm({ pet, onSubmit, onCancel, isSubmitting }: PetFormProps) {
  const [formData, setFormData] = useState<PetInput>({
    name: pet?.name || "",
    species: pet?.species || "dog",
    breed: pet?.breed || "",
    gender: pet?.gender,
    dateOfBirth: pet?.dateOfBirth ? pet.dateOfBirth.split("T")[0] : "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Species *</label>
          <select
            required
            value={formData.species}
            onChange={(e) =>
              setFormData({ ...formData, species: e.target.value })
            }
            className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
          >
            {PET_SPECIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Breed</label>
          <select
            value={formData.breed || ""}
            onChange={(e) =>
              setFormData({ ...formData, breed: e.target.value })
            }
            className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
          >
            <option value="">Select breed...</option>
            {PET_BREEDS[formData.species as keyof typeof PET_BREEDS]?.map((breed) => (
              <option key={breed} value={breed}>
                {breed}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Gender</label>
          <select
            value={formData.gender || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                gender: e.target.value as "male" | "female" | "unknown" | undefined,
              })
            }
            className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
          >
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Date of Birth</label>
          <input
            type="date"
            value={formData.dateOfBirth || ""}
            onChange={(e) =>
              setFormData({ ...formData, dateOfBirth: e.target.value })
            }
            className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : pet ? "Update Pet" : "Add Pet"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-border rounded-lg hover:bg-foreground/5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

interface PetCardProps {
  pet: Pet;
  onEdit: (pet: Pet) => void;
  onRemove: (pet: Pet) => void;
  onRestore?: (pet: Pet) => void;
  onAnalyzeHealth?: (pet: Pet) => void;
  onHealthHistory?: (pet: Pet) => void;
}

function PetCard({ pet, onEdit, onRemove, onRestore, onAnalyzeHealth, onHealthHistory }: PetCardProps) {
  const isArchived = pet.status === "archived";

  return (
    <div
      className={`p-4 border border-border rounded-lg ${isArchived ? "opacity-60" : ""}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">{pet.name}</h3>
          <p className="text-sm opacity-70 capitalize">
            {pet.species}
            {pet.breed && ` • ${pet.breed}`}
          </p>
        </div>
        {isArchived && (
          <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
            Archived
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
        {pet.gender && (
          <p>
            <span className="opacity-70">Gender:</span>{" "}
            <span className="capitalize">{pet.gender}</span>
          </p>
        )}
        {pet.dateOfBirth && (
          <p>
            <span className="opacity-70">Born:</span> {new Date(pet.dateOfBirth).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Health Action Buttons */}
      {!isArchived && (onAnalyzeHealth || onHealthHistory) && (
        <div className="flex gap-2 mb-3">
          {onAnalyzeHealth && (
            <button
              onClick={() => onAnalyzeHealth(pet)}
              className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
            >
              Analyze Health
            </button>
          )}
          {onHealthHistory && (
            <button
              onClick={() => onHealthHistory(pet)}
              className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
            >
              Health History
            </button>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-4 pt-3 border-t border-border">
        {!isArchived ? (
          <>
            <button
              onClick={() => onEdit(pet)}
              className="px-3 py-1.5 text-sm border border-border rounded hover:bg-foreground/5"
            >
              Edit
            </button>
            <button
              onClick={() => onRemove(pet)}
              className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
            >
              Archive
            </button>
          </>
        ) : (
          onRestore && (
            <button
              onClick={() => onRestore(pet)}
              className="px-3 py-1.5 text-sm text-green-600 border border-green-200 rounded hover:bg-green-50"
            >
              Restore
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default function PetManagement() {
  const { getToken } = useAuth();
  const [allPets, setAllPets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [selectedPetForAnalysis, setSelectedPetForAnalysis] = useState<Pet | null>(null);
  const [selectedPetForHistory, setSelectedPetForHistory] = useState<Pet | null>(null);

  const fetchPets = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await getMyPets(token, showArchived);
      setAllPets(data.pets);
      setFilteredPets(data.pets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

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

  const handleAddPet = async (data: PetInput) => {
    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await addPet(token, data);
      await fetchPets();
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add pet");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePet = async (data: PetInput) => {
    if (!editingPet) return;
    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await updatePet(token, editingPet._id, data);
      await fetchPets();
      setEditingPet(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update pet");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePet = async (pet: Pet) => {
    if (!confirm(`Are you sure you want to archive ${pet.name}?`)) return;
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await removePet(token, pet._id);
      await fetchPets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive pet");
    }
  };

  const handleRestorePet = async (pet: Pet) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await restorePet(token, pet._id);
      await fetchPets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore pet");
    }
  };

  const handleAnalyzeHealth = (pet: Pet) => {
    setSelectedPetForAnalysis(pet);
  };

  const handleHealthHistory = (pet: Pet) => {
    setSelectedPetForHistory(pet);
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
        <h2 className="text-2xl font-bold">My Pets</h2>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded"
            />
            Show Archived
          </label>
          {!showForm && !editingPet && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:opacity-90"
            >
              + Add Pet
            </button>
          )}
        </div>
      </div>

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
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-900 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {(showForm || editingPet) && (
        <div className="mb-6 p-4 border border-border rounded-lg bg-background">
          <h3 className="text-lg font-semibold mb-4">
            {editingPet ? "Edit Pet" : "Add New Pet"}
          </h3>
          <PetForm
            pet={editingPet}
            onSubmit={editingPet ? handleUpdatePet : handleAddPet}
            onCancel={() => {
              setShowForm(false);
              setEditingPet(undefined);
            }}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {filteredPets.length === 0 ? (
        <div className="text-center py-12 opacity-70">
          <p className="text-lg mb-2">
            {searchName ? "No pets found" : "No pets yet"}
          </p>
          <p className="text-sm">
            {searchName
              ? "Try a different search term"
              : "Add your first pet to get started!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPets.map((pet) => (
            <PetCard
              key={pet._id}
              pet={pet}
              onEdit={(p) => setEditingPet(p)}
              onRemove={handleRemovePet}
              onRestore={showArchived ? handleRestorePet : undefined}
              onAnalyzeHealth={handleAnalyzeHealth}
              onHealthHistory={handleHealthHistory}
            />
          ))}
        </div>
      )}

      {/* Health Analysis Modal */}
      {selectedPetForAnalysis && (
        <HealthAnalysis
          pet={selectedPetForAnalysis}
          onClose={() => setSelectedPetForAnalysis(null)}
        />
      )}

      {/* Health History Modal */}
      {selectedPetForHistory && (
        <HealthHistory
          pet={selectedPetForHistory}
          onClose={() => setSelectedPetForHistory(null)}
        />
      )}
    </div>
  );
}
