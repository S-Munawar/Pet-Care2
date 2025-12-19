import mongoose, { Schema, Document } from "mongoose";

/**
 * Health record types for categorization
 */
export const HEALTH_RECORD_TYPES = {
  VACCINATION: "vaccination",
  LAB_RESULT: "lab_result",
  CHECKUP: "checkup",
  TREATMENT: "treatment",
  MEDICATION: "medication",
  SURGERY: "surgery",
  EMERGENCY: "emergency",
  DENTAL: "dental",
  BEHAVIORAL: "behavioral",
  ML_ANALYSIS: "ml_analysis",
  OTHER: "other",
} as const;

export type HealthRecordType = (typeof HEALTH_RECORD_TYPES)[keyof typeof HEALTH_RECORD_TYPES];

/**
 * ML Analysis Results interface
 */
interface IMLAnalysis {
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  confidence: number; // 0-100
  recommendations: string[];
  possibleConditions: {
    name: string;
    probability: number;
    severity?: string;
  }[];
  inputSymptoms: string[];
  modelVersion?: string;
  analysisDate: Date;
}

/**
 * Attachment interface for files/images
 */
interface IAttachment {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

/**
 * Pet Health Record interface
 */
export interface IPetHealthRecord extends Document {
  petId: mongoose.Types.ObjectId;
  recordType: HealthRecordType;
  title: string;
  description?: string;
  
  // Pet basic info at time of record (for analysis context)
  petInfo?: {
    name: string;
    species: string;
    breed?: string;
    age?: string;
    gender?: string;
  };
  
  // Flexible data storage for any health information
  data: Map<string, any>;
  
  // Common structured fields (optional)
  vitals?: {
    weight?: number;
    temperature?: number;
    heartRate?: number;
    respiratoryRate?: number;
    bloodPressure?: string;
    [key: string]: any; // Allow additional vitals
  };
  
  // ML Analysis results (for ML_ANALYSIS record type)
  mlAnalysis?: IMLAnalysis;
  
  // Attachments (images, PDFs, etc.)
  attachments?: IAttachment[];
  
  // Metadata
  veterinarianId?: mongoose.Types.ObjectId;
  clinicName?: string;
  recordDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MLAnalysisSchema = new Schema<IMLAnalysis>({
  riskLevel: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    required: true,
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  recommendations: [{ type: String, required: true }],
  possibleConditions: [{
    name: { type: String, required: true },
    probability: { type: Number, min: 0, max: 100, required: true },
    severity: { type: String },
  }],
  inputSymptoms: [{ type: String, required: true }],
  modelVersion: { type: String },
  analysisDate: { type: Date, default: Date.now },
});

const AttachmentSchema = new Schema<IAttachment>({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const PetHealthRecordSchema = new Schema<IPetHealthRecord>(
  {
    petId: {
      type: Schema.Types.ObjectId,
      ref: "Pet",
      required: true,
      index: true,
    },
    
    recordType: {
      type: String,
      enum: Object.values(HEALTH_RECORD_TYPES),
      required: true,
      index: true,
    },
    
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    
    // Flexible data storage using Map for dynamic key-value pairs
    data: {
      type: Map,
      of: Schema.Types.Mixed,
      default: new Map(),
    },
    
    // Optional structured vitals
    vitals: {
      weight: { type: Number, min: 0 },
      temperature: { type: Number, min: 0 },
      heartRate: { type: Number, min: 0 },
      respiratoryRate: { type: Number, min: 0 },
      bloodPressure: { type: String, trim: true },
      // Allow additional fields
      type: Map,
      of: Schema.Types.Mixed,
    },
    
    petInfo: {
      name: { type: String, trim: true },
      species: { type: String, trim: true },
      breed: { type: String, trim: true },
      age: { type: String, trim: true },
      gender: { type: String, enum: ["male", "female", "unknown"] },
    },
    
    mlAnalysis: MLAnalysisSchema,
    
    attachments: [AttachmentSchema],
    
    veterinarianId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    
    clinicName: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    
    recordDate: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
PetHealthRecordSchema.index({ petId: 1, recordDate: -1 });
PetHealthRecordSchema.index({ petId: 1, recordType: 1 });
PetHealthRecordSchema.index({ veterinarianId: 1, recordDate: -1 });

// Text index for search
PetHealthRecordSchema.index({
  title: "text",
  description: "text",
  clinicName: "text",
});

export default mongoose.model<IPetHealthRecord>("PetHealthRecord", PetHealthRecordSchema);