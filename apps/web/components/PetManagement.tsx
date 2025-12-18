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
    approximateAge: pet?.approximateAge || "",
    weight: pet?.weight,
    color: pet?.color || "",
    medicalNotes: pet?.medicalNotes || "",
    allergies: pet?.allergies || [],
    vaccinations: pet?.vaccinations || [],
  });

  const [allergiesInput, setAllergiesInput] = useState(
    pet?.allergies?.join(", ") || ""
  );
  const [vaccinationsInput, setVaccinationsInput] = useState(
    pet?.vaccinations?.join(", ") || ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      allergies: allergiesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      vaccinations: vaccinationsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
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
          <input
            type="text"
            value={formData.breed}
            onChange={(e) =>
              setFormData({ ...formData, breed: e.target.value })
            }
            className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
          />
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

        <div>
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

        <div>
          <label className="block text-sm font-medium mb-1">
            Approximate Age
          </label>
          <input
            type="text"
            placeholder="e.g., 2 years"
            value={formData.approximateAge}
            onChange={(e) =>
              setFormData({ ...formData, approximateAge: e.target.value })
            }
            className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Weight (kg)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={formData.weight || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                weight: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Color</label>
          <input
            type="text"
            value={formData.color}
            onChange={(e) =>
              setFormData({ ...formData, color: e.target.value })
            }
            className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Allergies (comma-separated)
        </label>
        <input
          type="text"
          placeholder="e.g., Chicken, Pollen"
          value={allergiesInput}
          onChange={(e) => setAllergiesInput(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Vaccinations (comma-separated)
        </label>
        <input
          type="text"
          placeholder="e.g., Rabies, Distemper"
          value={vaccinationsInput}
          onChange={(e) => setVaccinationsInput(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Medical Notes</label>
        <textarea
          rows={3}
          value={formData.medicalNotes}
          onChange={(e) =>
            setFormData({ ...formData, medicalNotes: e.target.value })
          }
          className="w-full px-3 py-2 border border-border rounded-lg bg-transparent focus:outline-none focus:border-foreground resize-none"
        />
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
}

function PetCard({ pet, onEdit, onRemove, onRestore }: PetCardProps) {
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
        {pet.approximateAge && (
          <p>
            <span className="opacity-70">Age:</span> {pet.approximateAge}
          </p>
        )}
        {pet.weight && (
          <p>
            <span className="opacity-70">Weight:</span> {pet.weight} kg
          </p>
        )}
        {pet.color && (
          <p>
            <span className="opacity-70">Color:</span> {pet.color}
          </p>
        )}
      </div>

      {pet.allergies && pet.allergies.length > 0 && (
        <div className="mb-2">
          <span className="text-xs opacity-70">Allergies: </span>
          <span className="text-xs">{pet.allergies.join(", ")}</span>
        </div>
      )}

      {pet.vaccinations && pet.vaccinations.length > 0 && (
        <div className="mb-2">
          <span className="text-xs opacity-70">Vaccinations: </span>
          <span className="text-xs">{pet.vaccinations.join(", ")}</span>
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
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const fetchPets = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await getMyPets(token, showArchived);
      setPets(data.pets);
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

      {pets.length === 0 ? (
        <div className="text-center py-12 opacity-70">
          <p className="text-lg mb-2">No pets yet</p>
          <p className="text-sm">Add your first pet to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map((pet) => (
            <PetCard
              key={pet._id}
              pet={pet}
              onEdit={(p) => setEditingPet(p)}
              onRemove={handleRemovePet}
              onRestore={showArchived ? handleRestorePet : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
