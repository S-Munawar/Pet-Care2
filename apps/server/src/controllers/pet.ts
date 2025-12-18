import { Response } from "express";
import { AuthenticatedRequest } from "@/middleware/auth.middleware";
import Pet, { IPet, PET_STATUSES, PET_SPECIES } from "@/models/Pet";
import mongoose from "mongoose";
import { ROLES } from "@repo/shared";

/**
 * Add a new pet for the authenticated user
 * POST /api/pets
 */
export const addPet = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.dbUser?._id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const {
      name,
      species,
      breed,
      gender,
      dateOfBirth,
      approximateAge,
      weight,
      color,
      medicalNotes,
      allergies,
      vaccinations,
      profileImage,
    } = req.body;

    // Validate required fields
    if (!name || !species) {
      res.status(400).json({ message: "Name and species are required" });
      return;
    }

    // Validate species
    if (!Object.values(PET_SPECIES).includes(species)) {
      res.status(400).json({
        message: "Invalid species",
        validSpecies: Object.values(PET_SPECIES),
      });
      return;
    }

    // Create pet with ownership linked to authenticated user
    const pet = await Pet.create({
      ownerId: userId,
      name,
      species,
      breed,
      gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      approximateAge,
      weight,
      color,
      medicalNotes,
      allergies: allergies || [],
      vaccinations: vaccinations || [],
      profileImage,
      status: PET_STATUSES.ACTIVE,
    });

    res.status(201).json({
      message: "Pet added successfully",
      pet,
    });
  } catch (error) {
    console.error("Add pet error:", error);
    res.status(500).json({ message: "Failed to add pet" });
  }
};

/**
 * Get all pets for the authenticated user
 * GET /api/pets
 */
export const getMyPets = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.dbUser?._id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { status, includeArchived } = req.query;

    // Build query
    const query: Record<string, unknown> = { ownerId: userId };

    if (status) {
      query.status = status;
    } else if (includeArchived !== "true") {
      // By default, exclude archived pets
      query.status = PET_STATUSES.ACTIVE;
    }

    const pets = await Pet.find(query).sort({ createdAt: -1 });

    res.json({ pets });
  } catch (error) {
    console.error("Get pets error:", error);
    res.status(500).json({ message: "Failed to get pets" });
  }
};

/**
 * Get a specific pet by ID
 * GET /api/pets/:petId
 */
export const getPetById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.dbUser?._id;
    const userRole = req.dbUser?.role;
    const { petId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!petId || !mongoose.Types.ObjectId.isValid(petId)) {
      res.status(400).json({ message: "Invalid pet ID" });
      return;
    }

    const pet = await Pet.findById(petId);

    if (!pet) {
      res.status(404).json({ message: "Pet not found" });
      return;
    }

    // Check access: owner, vet, or admin
    const isOwner = pet.ownerId.equals(userId);
    const isVetOrAdmin = userRole === ROLES.VET || userRole === ROLES.ADMIN;

    if (!isOwner && !isVetOrAdmin) {
      res.status(403).json({ message: "Forbidden: Access denied" });
      return;
    }

    res.json({ pet });
  } catch (error) {
    console.error("Get pet by ID error:", error);
    res.status(500).json({ message: "Failed to get pet" });
  }
};

/**
 * Update a pet (owner only)
 * PUT /api/pets/:petId
 */
export const updatePet = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.dbUser?._id;
    const { petId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!petId || !mongoose.Types.ObjectId.isValid(petId)) {
      res.status(400).json({ message: "Invalid pet ID" });
      return;
    }

    const pet = await Pet.findById(petId);

    if (!pet) {
      res.status(404).json({ message: "Pet not found" });
      return;
    }

    // Only owner can update
    if (!pet.ownerId.equals(userId)) {
      res.status(403).json({ message: "Forbidden: Only the owner can update this pet" });
      return;
    }

    // Allowed update fields (excluding ownerId and status)
    const allowedUpdates = [
      "name",
      "species",
      "breed",
      "gender",
      "dateOfBirth",
      "approximateAge",
      "weight",
      "color",
      "medicalNotes",
      "allergies",
      "vaccinations",
      "profileImage",
    ];

    const updates: Partial<IPet> = {};
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        if (field === "dateOfBirth" && req.body[field]) {
          updates[field as keyof IPet] = new Date(req.body[field]) as never;
        } else {
          updates[field as keyof IPet] = req.body[field];
        }
      }
    }

    // Validate species if provided
    if (updates.species && !Object.values(PET_SPECIES).includes(updates.species)) {
      res.status(400).json({
        message: "Invalid species",
        validSpecies: Object.values(PET_SPECIES),
      });
      return;
    }

    const updatedPet = await Pet.findByIdAndUpdate(
      petId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      message: "Pet updated successfully",
      pet: updatedPet,
    });
  } catch (error) {
    console.error("Update pet error:", error);
    res.status(500).json({ message: "Failed to update pet" });
  }
};

/**
 * Remove (archive) a pet (owner only)
 * DELETE /api/pets/:petId
 * Uses soft delete (archives the pet)
 */
export const removePet = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.dbUser?._id;
    const { petId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!petId || !mongoose.Types.ObjectId.isValid(petId)) {
      res.status(400).json({ message: "Invalid pet ID" });
      return;
    }

    const pet = await Pet.findById(petId);

    if (!pet) {
      res.status(404).json({ message: "Pet not found" });
      return;
    }

    // Only owner can delete
    if (!pet.ownerId.equals(userId)) {
      res.status(403).json({ message: "Forbidden: Only the owner can remove this pet" });
      return;
    }

    // Soft delete - archive the pet
    pet.status = PET_STATUSES.ARCHIVED;
    await pet.save();

    res.json({
      message: "Pet archived successfully",
      pet,
    });
  } catch (error) {
    console.error("Remove pet error:", error);
    res.status(500).json({ message: "Failed to remove pet" });
  }
};

/**
 * Restore an archived pet (owner only)
 * POST /api/pets/:petId/restore
 */
export const restorePet = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.dbUser?._id;
    const { petId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!petId || !mongoose.Types.ObjectId.isValid(petId)) {
      res.status(400).json({ message: "Invalid pet ID" });
      return;
    }

    const pet = await Pet.findById(petId);

    if (!pet) {
      res.status(404).json({ message: "Pet not found" });
      return;
    }

    // Only owner can restore
    if (!pet.ownerId.equals(userId)) {
      res.status(403).json({ message: "Forbidden: Only the owner can restore this pet" });
      return;
    }

    if (pet.status === PET_STATUSES.ACTIVE) {
      res.status(400).json({ message: "Pet is already active" });
      return;
    }

    pet.status = PET_STATUSES.ACTIVE;
    await pet.save();

    res.json({
      message: "Pet restored successfully",
      pet,
    });
  } catch (error) {
    console.error("Restore pet error:", error);
    res.status(500).json({ message: "Failed to restore pet" });
  }
};

/**
 * Search pets (role-based access)
 * GET /api/pets/search
 * - Pet owners: search only their own pets
 * - Vets: search pets they are allowed to view (all active pets for now)
 * - Admins: unrestricted search
 */
export const searchPets = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.dbUser?._id;
    const userRole = req.dbUser?.role;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const {
      name,
      species,
      breed,
      ownerId,
      status,
      page = "1",
      limit = "20",
    } = req.query;

    // Build base query based on role
    const query: Record<string, unknown> = {};

    // Role-based visibility
    if (userRole === ROLES.PET_OWNER) {
      // Pet owners can only search their own pets
      query.ownerId = userId;
    } else if (userRole === ROLES.VET) {
      // Vets can search all active pets
      query.status = PET_STATUSES.ACTIVE;
      // If ownerId filter provided by vet, apply it
      if (ownerId && mongoose.Types.ObjectId.isValid(ownerId as string)) {
        query.ownerId = new mongoose.Types.ObjectId(ownerId as string);
      }
    } else if (userRole === ROLES.ADMIN) {
      // Admins can filter by owner if specified
      if (ownerId && mongoose.Types.ObjectId.isValid(ownerId as string)) {
        query.ownerId = new mongoose.Types.ObjectId(ownerId as string);
      }
    }

    // Apply filters
    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    if (species && Object.values(PET_SPECIES).includes(species as typeof PET_SPECIES[keyof typeof PET_SPECIES])) {
      query.species = species;
    }

    if (breed) {
      query.breed = { $regex: breed, $options: "i" };
    }

    // Status filter (admins and owners can filter by status)
    if (status && (userRole === ROLES.ADMIN || userRole === ROLES.PET_OWNER)) {
      if (Object.values(PET_STATUSES).includes(status as typeof PET_STATUSES[keyof typeof PET_STATUSES])) {
        query.status = status;
      }
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [pets, total] = await Promise.all([
      Pet.find(query)
        .populate("ownerId", "email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Pet.countDocuments(query),
    ]);

    res.json({
      pets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Search pets error:", error);
    res.status(500).json({ message: "Failed to search pets" });
  }
};

/**
 * Get pets by owner ID (vets and admins only)
 * GET /api/pets/owner/:ownerId
 */
export const getPetsByOwner = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { ownerId } = req.params;

    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      res.status(400).json({ message: "Invalid owner ID" });
      return;
    }

    const pets = await Pet.find({
      ownerId: new mongoose.Types.ObjectId(ownerId),
      status: PET_STATUSES.ACTIVE,
    }).sort({ createdAt: -1 });

    res.json({ pets });
  } catch (error) {
    console.error("Get pets by owner error:", error);
    res.status(500).json({ message: "Failed to get pets" });
  }
};
