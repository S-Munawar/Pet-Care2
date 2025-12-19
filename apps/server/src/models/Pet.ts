import mongoose, { Schema, Document } from "mongoose";

/**
 * Pet status enumeration
 * - active: Pet is currently owned and active
 * - archived: Pet has been soft-deleted or is no longer active
 */
export const PET_STATUSES = {
  ACTIVE: "active",
  ARCHIVED: "archived",
} as const;

export type PetStatus = (typeof PET_STATUSES)[keyof typeof PET_STATUSES];

/**
 * Common pet species
 */
export const PET_SPECIES = {
  DOG: "dog",
  CAT: "cat",
  BIRD: "bird",
  FISH: "fish",
  RABBIT: "rabbit",
  HAMSTER: "hamster",
  REPTILE: "reptile",
  OTHER: "other",
} as const;

export type PetSpecies = (typeof PET_SPECIES)[keyof typeof PET_SPECIES];

export interface IPet extends Document {
  // Ownership - links to User model
  ownerId: mongoose.Types.ObjectId;

  // Basic info
  name: string;
  species: PetSpecies;
  breed?: string;
  gender?: "male" | "female" | "unknown";
  dateOfBirth?: Date;

  // Status
  status: PetStatus;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const PetSchema = new Schema<IPet>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    species: {
      type: String,
      required: true,
      enum: Object.values(PET_SPECIES),
      index: true,
    },

    breed: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    gender: {
      type: String,
      enum: ["male", "female", "unknown"],
    },

    dateOfBirth: {
      type: Date,
    },

    status: {
      type: String,
      enum: Object.values(PET_STATUSES),
      default: PET_STATUSES.ACTIVE,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for owner's active pets
PetSchema.index({ ownerId: 1, status: 1 });

// Text index for search
PetSchema.index({ name: "text", breed: "text" });

export default mongoose.model<IPet>("Pet", PetSchema);
