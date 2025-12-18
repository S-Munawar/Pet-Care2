import mongoose, { Schema, Document } from "mongoose";

export interface IVetProfile extends Document {
  userId: mongoose.Types.ObjectId;

  licenseNumber: string;
  licenseCountry: string;

  verified: boolean;
  verifiedAt?: Date;
  verificationSource?: string;

  createdAt: Date;
}

const VetProfileSchema = new Schema<IVetProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    licenseNumber: {
      type: String,
      required: true,
      index: true,
    },

    licenseCountry: {
      type: String,
      required: true,
    },

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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IVetProfile>(
  "VetProfile",
  VetProfileSchema
);
