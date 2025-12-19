import { Response } from "express";
import { AuthenticatedRequest } from "@/middleware/auth.middleware";
import Pet from "@/models/Pet";
import PetHealthRecord from "@/models/PetHealthRecord";
import { mlInferenceClient } from "@/services/mlInferenceClient";
import mongoose from "mongoose";

/**
 * Perform ML health analysis for a pet
 * POST /api/ml-analysis/pet/:petId
 */
export const performHealthAnalysis = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { petId } = req.params;
    const userId = req.dbUser?._id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(petId)) {
      res.status(400).json({ message: "Invalid pet ID" });
      return;
    }

    // Phase 3: Input Validation & Ownership Enforcement
    const pet = await Pet.findById(petId);
    if (!pet) {
      res.status(404).json({ message: "Pet not found" });
      return;
    }

    // Ensure pet ownership (pet owners can only analyze their own pets)
    if (req.dbUser?.role === "pet-owner" && pet.ownerId.toString() !== userId.toString()) {
      res.status(403).json({ message: "Access denied - pet ownership required" });
      return;
    }

    // Validate required health input fields
    const {
      symptoms,
      duration,
      severity,
      appetite,
      energy,
      temperature,
      weight,
      age,
      breed,
      additionalNotes
    } = req.body;

    if (!symptoms) {
      res.status(400).json({ message: "Symptoms description is required" });
      return;
    }

    // Validate numeric ranges
    if (temperature && (temperature < 30 || temperature > 45)) {
      res.status(400).json({ message: "Invalid temperature range" });
      return;
    }

    if (weight && (weight < 0 || weight > 200)) {
      res.status(400).json({ message: "Invalid weight range" });
      return;
    }

    // Calculate age from pet's date of birth if not provided
    let calculatedAge = age;
    if (!calculatedAge && pet.dateOfBirth) {
      const birthDate = new Date(pet.dateOfBirth);
      const today = new Date();
      const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                         (today.getMonth() - birthDate.getMonth());
      calculatedAge = `${Math.floor(ageInMonths / 12)} years ${ageInMonths % 12} months`;
    }

    // Phase 4: ML Service Invocation
    console.log(`Performing ML analysis for pet ${petId} by user ${userId}`);

    // Transform data into ML inference input format
    const mlInput = {
      species: pet.species,
      breed: breed || pet.breed || "Unknown",
      age_months: pet.dateOfBirth ? 
        ((new Date().getTime() - new Date(pet.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 30.44)) : 
        undefined,
      weight_kg: weight ? parseFloat(weight) : undefined,
      gender: pet.gender || "unknown",
      is_senior: pet.dateOfBirth ? 
        ((new Date().getTime() - new Date(pet.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)) > 7 : 
        false,
      is_young: pet.dateOfBirth ? 
        ((new Date().getTime() - new Date(pet.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)) < 1 : 
        false,
      temperature_c: temperature ? parseFloat(temperature) : undefined,
      heart_rate_bpm: undefined, // Not provided in current form
      respiratory_rate_bpm: undefined, // Not provided in current form
      symptoms_present: symptoms === "none" ? "none" : symptoms,
      symptom_count: symptoms === "none" ? 0 : symptoms.split(",").length,
      max_symptom_severity: severity || "none",
      symptom_duration: duration || "none",
      appetite_level: appetite || "normal",
      energy_level: energy || "normal",
      hydration_normal: true, // Default safe value
      gait_normal: true, // Default safe value
      coat_condition: "good" // Default safe value
    };

    let mlResponse;
    try {
      mlResponse = await mlInferenceClient.predict(mlInput);
    } catch (error: any) {
      console.error("ML inference failed:", error.message);
      res.status(503).json({ 
        message: "Health analysis service temporarily unavailable",
        error: "ML_SERVICE_ERROR"
      });
      return;
    }

    // Phase 5: PetHealthRecord Persistence
    const healthRecord = await PetHealthRecord.create({
      petId: pet._id,
      recordType: "ml_analysis",
      title: `Health Analysis - ${new Date().toLocaleDateString()}`,
      description: `AI-powered health analysis based on reported symptoms: ${symptoms}`,
      
      // Pet info snapshot at time of analysis
      petInfo: {
        name: pet.name,
        species: pet.species,
        breed: breed || pet.breed,
        age: calculatedAge,
        gender: pet.gender
      },
      
      // ML Analysis results
      mlAnalysis: {
        riskLevel: mlResponse.risk_assessment.category as "Low" | "Medium" | "High" | "Critical",
        confidence: mlResponse.risk_assessment.confidence * 100, // Convert to percentage
        recommendations: [], // Will be populated by AI explanation service
        possibleConditions: [], // Will be populated by AI explanation service
        inputSymptoms: symptoms === "none" ? [] : symptoms.split(",").map(s => s.trim()),
        modelVersion: mlResponse.metadata.model_version,
        analysisDate: new Date(mlResponse.metadata.prediction_timestamp)
      },
      
      // Store input data for audit
      data: new Map(Object.entries({
        symptoms,
        duration,
        severity,
        appetite,
        energy,
        age: calculatedAge,
        breed: breed || pet.breed,
        additionalNotes,
        mlServiceVersion: mlResponse.metadata.service_version
      })),
      
      // Vitals if provided
      vitals: {
        weight: weight ? parseFloat(weight) : undefined,
        temperature: temperature ? parseFloat(temperature) : undefined
      },
      
      recordDate: new Date()
    });

    console.log(`Health analysis completed for pet ${petId}, record ${healthRecord._id}`);

    // Phase 6: Response Construction
    res.status(201).json({
      message: "Health analysis completed successfully",
      analysis: {
        recordId: healthRecord._id,
        riskCategory: mlResponse.risk_assessment.category,
        confidence: Math.round(mlResponse.risk_assessment.confidence * 100), // Percentage
        flags: {
          highRisk: mlResponse.flags.high_risk,
          requiresAttention: mlResponse.flags.requires_attention
        },
        timestamp: mlResponse.metadata.prediction_timestamp
      },
      safetyNotice: mlResponse.safety_notice
    });

  } catch (error: any) {
    console.error("Health analysis error:", error);
    
    // Phase 7: Error Handling & Safety
    if (error.name === "ValidationError") {
      res.status(400).json({ message: "Invalid input data" });
    } else if (error.message?.includes("ML service")) {
      res.status(503).json({ message: "Analysis service temporarily unavailable" });
    } else {
      res.status(500).json({ message: "Health analysis failed" });
    }
  }
};

/**
 * Get ML service status
 * GET /api/ml-analysis/status
 */
export const getMLServiceStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const isHealthy = await mlInferenceClient.healthCheck();
    const modelInfo = await mlInferenceClient.getModelInfo();
    
    res.json({
      status: isHealthy ? "healthy" : "unavailable",
      modelInfo: modelInfo || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("ML service status check failed:", error);
    res.status(500).json({ 
      status: "error",
      message: "Failed to check ML service status"
    });
  }
};