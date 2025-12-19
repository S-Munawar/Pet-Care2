import { Response } from "express";
import { AuthenticatedRequest } from "@/middleware/auth.middleware";
import PetHealthRecord from "@/models/PetHealthRecord";
import Pet from "@/models/Pet";
import mongoose from "mongoose";

/**
 * Get health records for a specific pet
 * GET /api/health-records/pet/:petId
 */
export const getPetHealthRecords = async (
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

    // Check if pet exists and user has access
    const pet = await Pet.findById(petId);
    if (!pet) {
      res.status(404).json({ message: "Pet not found" });
      return;
    }

    // Pet owners can only access their own pets
    // Vets can access all pets
    if (req.dbUser?.role === "pet-owner" && pet.ownerId.toString() !== userId.toString()) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const records = await PetHealthRecord.find({ petId })
      .sort({ recordDate: -1 })
      .populate("veterinarianId", "email");

    res.json({ records });
  } catch (error) {
    console.error("Get pet health records error:", error);
    res.status(500).json({ message: "Failed to get health records" });
  }
};

/**
 * Create a new health record
 * POST /api/health-records
 */
export const createHealthRecord = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.dbUser?._id;
    const {
      petId,
      recordType,
      title,
      description,
      data,
      vitals,
      clinicName,
      recordDate,
    } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!petId || !recordType || !title) {
      res.status(400).json({ message: "Pet ID, record type, and title are required" });
      return;
    }

    // Check if pet exists and user has access
    const pet = await Pet.findById(petId);
    if (!pet) {
      res.status(404).json({ message: "Pet not found" });
      return;
    }

    // Pet owners can only create records for their own pets
    // Vets can create records for any pet
    if (req.dbUser?.role === "pet-owner" && pet.ownerId.toString() !== userId.toString()) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const healthRecord = await PetHealthRecord.create({
      petId,
      recordType,
      title,
      description,
      data: data ? new Map(Object.entries(data)) : new Map(),
      vitals,
      veterinarianId: req.dbUser?.role === "vet" ? userId : undefined,
      clinicName,
      recordDate: recordDate ? new Date(recordDate) : new Date(),
    });

    res.status(201).json({
      message: "Health record created successfully",
      record: healthRecord,
    });
  } catch (error) {
    console.error("Create health record error:", error);
    res.status(500).json({ message: "Failed to create health record" });
  }
};

/**
 * Update a health record
 * PUT /api/health-records/:recordId
 */
export const updateHealthRecord = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { recordId } = req.params;
    const userId = req.dbUser?._id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      res.status(400).json({ message: "Invalid record ID" });
      return;
    }

    const record = await PetHealthRecord.findById(recordId).populate("petId");
    if (!record) {
      res.status(404).json({ message: "Health record not found" });
      return;
    }

    // Check access permissions
    const pet = record.petId as any;
    if (req.dbUser?.role === "pet-owner" && pet.ownerId.toString() !== userId.toString()) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const allowedUpdates = [
      "recordType",
      "title",
      "description",
      "data",
      "vitals",
      "clinicName",
      "recordDate",
    ];

    const updates: any = {};
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        if (field === "data" && req.body[field]) {
          updates[field] = new Map(Object.entries(req.body[field]));
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    const updatedRecord = await PetHealthRecord.findByIdAndUpdate(
      recordId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      message: "Health record updated successfully",
      record: updatedRecord,
    });
  } catch (error) {
    console.error("Update health record error:", error);
    res.status(500).json({ message: "Failed to update health record" });
  }
};

/**
 * Delete a health record
 * DELETE /api/health-records/:recordId
 */
export const deleteHealthRecord = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { recordId } = req.params;
    const userId = req.dbUser?._id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      res.status(400).json({ message: "Invalid record ID" });
      return;
    }

    const record = await PetHealthRecord.findById(recordId).populate("petId");
    if (!record) {
      res.status(404).json({ message: "Health record not found" });
      return;
    }

    // Check access permissions
    const pet = record.petId as any;
    if (req.dbUser?.role === "pet-owner" && pet.ownerId.toString() !== userId.toString()) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    await PetHealthRecord.findByIdAndDelete(recordId);

    res.json({ message: "Health record deleted successfully" });
  } catch (error) {
    console.error("Delete health record error:", error);
    res.status(500).json({ message: "Failed to delete health record" });
  }
};

/**
 * Get health records by type
 * GET /api/health-records/pet/:petId/type/:recordType
 */
export const getHealthRecordsByType = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { petId, recordType } = req.params;
    const userId = req.dbUser?._id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(petId)) {
      res.status(400).json({ message: "Invalid pet ID" });
      return;
    }

    // Check if pet exists and user has access
    const pet = await Pet.findById(petId);
    if (!pet) {
      res.status(404).json({ message: "Pet not found" });
      return;
    }

    if (req.dbUser?.role === "pet-owner" && pet.ownerId.toString() !== userId.toString()) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const records = await PetHealthRecord.find({ petId, recordType })
      .sort({ recordDate: -1 })
      .populate("veterinarianId", "email");

    res.json({ records });
  } catch (error) {
    console.error("Get health records by type error:", error);
    res.status(500).json({ message: "Failed to get health records" });
  }
};