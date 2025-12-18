import mongoose, { Schema, Document } from "mongoose";

/**
 * Vet specialization options
 */
export const VET_SPECIALIZATIONS = {
  GENERAL_PRACTICE: "general-practice",
  SURGERY: "surgery",
  DERMATOLOGY: "dermatology",
  CARDIOLOGY: "cardiology",
  ONCOLOGY: "oncology",
  NEUROLOGY: "neurology",
  OPHTHALMOLOGY: "ophthalmology",
  DENTISTRY: "dentistry",
  EMERGENCY_CRITICAL_CARE: "emergency-critical-care",
  INTERNAL_MEDICINE: "internal-medicine",
  EXOTIC_ANIMALS: "exotic-animals",
  AVIAN: "avian",
  EQUINE: "equine",
  BEHAVIOR: "behavior",
  OTHER: "other",
} as const;

export type VetSpecialization =
  (typeof VET_SPECIALIZATIONS)[keyof typeof VET_SPECIALIZATIONS];

export interface IVetProfile extends Document {
  userId: mongoose.Types.ObjectId;

  // License information (existing)
  licenseNumber: string;
  licenseCountry: string;

  // Verification (existing)
  verified: boolean;
  verifiedAt?: Date;
  verificationSource?: string;

  // Professional details (new - optional)
  displayName?: string;
  specializations?: VetSpecialization[];
  degrees?: string[];
  certifications?: string[];
  yearsOfExperience?: number;
  languagesSpoken?: string[];

  // Practice details (new - optional)
  clinicName?: string;
  clinicAddress?: string;
  clinicCity?: string;
  clinicState?: string;
  clinicCountry?: string;
  clinicPostalCode?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  clinicWebsite?: string;

  // Availability (new - optional)
  consultationFee?: number;
  currency?: string;
  availableForOnlineConsultation?: boolean;

  // Profile (new - optional)
  bio?: string;
  profileImage?: string;

  createdAt: Date;
  updatedAt: Date;
}

const VetProfileSchema = new Schema<IVetProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // License information
    licenseNumber: {
      type: String,
      required: true,
      index: true,
    },

    licenseCountry: {
      type: String,
      required: true,
      index: true,
    },

    // Verification
    verified: {
      type: Boolean,
      default: false,
    },

    verifiedAt: {
      type: Date,
    },

    verificationSource: {
      type: String,
    },

    // Professional details
    displayName: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    specializations: {
      type: [String],
      enum: Object.values(VET_SPECIALIZATIONS),
      default: [],
      index: true,
    },

    degrees: {
      type: [String],
      default: [],
    },

    certifications: {
      type: [String],
      default: [],
    },

    yearsOfExperience: {
      type: Number,
      min: 0,
      max: 70,
    },

    languagesSpoken: {
      type: [String],
      default: [],
    },

    // Practice details
    clinicName: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    clinicAddress: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    clinicCity: {
      type: String,
      trim: true,
      maxlength: 100,
      index: true,
    },

    clinicState: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    clinicCountry: {
      type: String,
      trim: true,
      maxlength: 100,
      index: true,
    },

    clinicPostalCode: {
      type: String,
      trim: true,
      maxlength: 20,
    },

    clinicPhone: {
      type: String,
      trim: true,
      maxlength: 30,
    },

    clinicEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },

    clinicWebsite: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // Availability
    consultationFee: {
      type: Number,
      min: 0,
    },

    currency: {
      type: String,
      maxlength: 10,
      default: "USD",
    },

    availableForOnlineConsultation: {
      type: Boolean,
      default: false,
    },

    // Profile
    bio: {
      type: String,
      maxlength: 2000,
    },

    profileImage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search
VetProfileSchema.index({
  displayName: "text",
  clinicName: "text",
  bio: "text",
});

// Compound indexes for common queries
VetProfileSchema.index({ specializations: 1, clinicCountry: 1 });
VetProfileSchema.index({ clinicCountry: 1, clinicCity: 1 });

export default mongoose.model<IVetProfile>("VetProfile", VetProfileSchema);
