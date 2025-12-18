import { Response } from "express";
import { AuthenticatedRequest } from "@/middleware/auth.middleware";
import VetProfile, { IVetProfile, VET_SPECIALIZATIONS } from "@/models/vet";
import User from "@/models/User";
import mongoose from "mongoose";
import { ROLES, ROLE_STATUSES } from "@repo/shared";

/**
 * Get current vet's profile
 * GET /api/vet/profile
 */
export const getMyVetProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.dbUser?._id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const profile = await VetProfile.findOne({ userId });

    if (!profile) {
      res.status(404).json({ message: "Vet profile not found" });
      return;
    }

    res.json({ profile });
  } catch (error) {
    console.error("Get vet profile error:", error);
    res.status(500).json({ message: "Failed to get vet profile" });
  }
};

/**
 * Update current vet's profile
 * PUT /api/vet/profile
 */
export const updateVetProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.dbUser?._id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const profile = await VetProfile.findOne({ userId });

    if (!profile) {
      res.status(404).json({ message: "Vet profile not found" });
      return;
    }

    // Allowed update fields (excluding license info and verification)
    const allowedUpdates = [
      "displayName",
      "specializations",
      "degrees",
      "certifications",
      "yearsOfExperience",
      "languagesSpoken",
      "clinicName",
      "clinicAddress",
      "clinicCity",
      "clinicState",
      "clinicCountry",
      "clinicPostalCode",
      "clinicPhone",
      "clinicEmail",
      "clinicWebsite",
      "consultationFee",
      "currency",
      "availableForOnlineConsultation",
      "bio",
      "profileImage",
    ];

    const updates: Partial<IVetProfile> = {};
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field as keyof IVetProfile] = req.body[field];
      }
    }

    // Validate specializations if provided
    if (updates.specializations) {
      const validSpecializations = updates.specializations.filter((s) =>
        Object.values(VET_SPECIALIZATIONS).includes(s)
      );
      updates.specializations = validSpecializations;
    }

    const updatedProfile = await VetProfile.findByIdAndUpdate(
      profile._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Update vet profile error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

/**
 * Get a vet's public profile by ID
 * GET /api/vets/:vetId
 */
export const getVetPublicProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { vetId } = req.params;

    if (!vetId || !mongoose.Types.ObjectId.isValid(vetId)) {
      res.status(400).json({ message: "Invalid vet ID" });
      return;
    }

    // Find vet profile and ensure the user is an approved vet
    const profile = await VetProfile.findById(vetId);

    if (!profile) {
      res.status(404).json({ message: "Vet not found" });
      return;
    }

    // Check if the associated user is an approved vet
    const user = await User.findById(profile.userId);

    if (!user || user.role !== ROLES.VET || user.roleStatus !== ROLE_STATUSES.APPROVED) {
      res.status(404).json({ message: "Vet not found or not approved" });
      return;
    }

    // Return public profile (exclude sensitive data)
    const publicProfile = {
      _id: profile._id,
      displayName: profile.displayName,
      specializations: profile.specializations,
      degrees: profile.degrees,
      certifications: profile.certifications,
      yearsOfExperience: profile.yearsOfExperience,
      languagesSpoken: profile.languagesSpoken,
      clinicName: profile.clinicName,
      clinicCity: profile.clinicCity,
      clinicState: profile.clinicState,
      clinicCountry: profile.clinicCountry,
      consultationFee: profile.consultationFee,
      currency: profile.currency,
      availableForOnlineConsultation: profile.availableForOnlineConsultation,
      bio: profile.bio,
      profileImage: profile.profileImage,
      verified: profile.verified,
      // Include email from user for contact
      email: user.email,
    };

    res.json({ profile: publicProfile });
  } catch (error) {
    console.error("Get vet public profile error:", error);
    res.status(500).json({ message: "Failed to get vet profile" });
  }
};

/**
 * Search for vets
 * GET /api/vets/search
 * Only returns approved vets
 */
export const searchVets = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      specialization,
      country,
      city,
      language,
      onlineConsultation,
      verified,
      page = "1",
      limit = "20",
    } = req.query;

    // Get all approved vet user IDs
    const approvedVetUsers = await User.find({
      role: ROLES.VET,
      roleStatus: ROLE_STATUSES.APPROVED,
    }).select("_id");

    const approvedVetUserIds = approvedVetUsers.map((u) => u._id);

    // Build query - only search among approved vets
    const query: Record<string, unknown> = {
      userId: { $in: approvedVetUserIds },
    };

    // Name search (display name or clinic name)
    if (name) {
      query.$or = [
        { displayName: { $regex: name, $options: "i" } },
        { clinicName: { $regex: name, $options: "i" } },
      ];
    }

    // Specialization filter
    if (specialization) {
      const specs = Array.isArray(specialization)
        ? specialization
        : [specialization];
      const validSpecs = specs.filter((s) =>
        Object.values(VET_SPECIALIZATIONS).includes(s as typeof VET_SPECIALIZATIONS[keyof typeof VET_SPECIALIZATIONS])
      );
      if (validSpecs.length > 0) {
        query.specializations = { $in: validSpecs };
      }
    }

    // Location filters
    if (country) {
      query.clinicCountry = { $regex: country, $options: "i" };
    }

    if (city) {
      query.clinicCity = { $regex: city, $options: "i" };
    }

    // Language filter
    if (language) {
      query.languagesSpoken = { $regex: language, $options: "i" };
    }

    // Online consultation filter
    if (onlineConsultation === "true") {
      query.availableForOnlineConsultation = true;
    }

    // Verified filter
    if (verified === "true") {
      query.verified = true;
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [profiles, total] = await Promise.all([
      VetProfile.find(query)
        .select(
          "displayName specializations degrees yearsOfExperience clinicName clinicCity clinicState clinicCountry consultationFee currency availableForOnlineConsultation bio profileImage verified"
        )
        .sort({ verified: -1, yearsOfExperience: -1 })
        .skip(skip)
        .limit(limitNum),
      VetProfile.countDocuments(query),
    ]);

    res.json({
      vets: profiles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Search vets error:", error);
    res.status(500).json({ message: "Failed to search vets" });
  }
};

/**
 * Get all specializations
 * GET /api/vets/specializations
 */
export const getSpecializations = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    res.json({
      specializations: Object.entries(VET_SPECIALIZATIONS).map(([key, value]) => ({
        key,
        value,
        label: key
          .split("_")
          .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
          .join(" "),
      })),
    });
  } catch (error) {
    console.error("Get specializations error:", error);
    res.status(500).json({ message: "Failed to get specializations" });
  }
};

/**
 * Admin: Get all vet profiles (including pending/rejected)
 * GET /api/admin/vets
 */
export const getAllVetProfiles = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { status, verified, page = "1", limit = "20" } = req.query;

    // Build user query for filtering by status
    const userQuery: Record<string, unknown> = { role: ROLES.VET };
    if (status && Object.values(ROLE_STATUSES).includes(status as typeof ROLE_STATUSES[keyof typeof ROLE_STATUSES])) {
      userQuery.roleStatus = status;
    }

    const users = await User.find(userQuery).select("_id email roleStatus");
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    const userIds = users.map((u) => u._id);

    // Build profile query
    const profileQuery: Record<string, unknown> = { userId: { $in: userIds } };
    if (verified !== undefined) {
      profileQuery.verified = verified === "true";
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [profiles, total] = await Promise.all([
      VetProfile.find(profileQuery).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      VetProfile.countDocuments(profileQuery),
    ]);

    // Enrich profiles with user data
    const enrichedProfiles = profiles.map((profile) => {
      const user = userMap.get(profile.userId.toString());
      return {
        ...profile.toObject(),
        userEmail: user?.email,
        userRoleStatus: user?.roleStatus,
      };
    });

    res.json({
      vets: enrichedProfiles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get all vet profiles error:", error);
    res.status(500).json({ message: "Failed to get vet profiles" });
  }
};

/**
 * Admin: Verify a vet's credentials
 * POST /api/admin/vets/:vetId/verify
 */
export const verifyVet = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { vetId } = req.params;
    const { verificationSource } = req.body;

    if (!vetId || !mongoose.Types.ObjectId.isValid(vetId)) {
      res.status(400).json({ message: "Invalid vet ID" });
      return;
    }

    const profile = await VetProfile.findById(vetId);

    if (!profile) {
      res.status(404).json({ message: "Vet profile not found" });
      return;
    }

    profile.verified = true;
    profile.verifiedAt = new Date();
    profile.verificationSource = verificationSource || "Admin verification";
    await profile.save();

    res.json({
      message: "Vet verified successfully",
      profile,
    });
  } catch (error) {
    console.error("Verify vet error:", error);
    res.status(500).json({ message: "Failed to verify vet" });
  }
};
