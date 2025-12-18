/**
 * Admin User Setup Script
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/user.ts <firebase-uid> <email>
 *
 * This script creates the initial admin user in the system.
 * It should only be run once during initial system setup.
 *
 * Prerequisites:
 * - The user must already exist in Firebase Authentication
 * - MongoDB connection must be configured
 * - Firebase Admin credentials must be set
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { createInitialAdmin } from "../src/services/user";

const setupAdmin = async () => {
  const [firebaseUid, email] = process.argv.slice(2);

  if (!firebaseUid || !email) {
    console.error("Usage: npx ts-node scripts/user.ts <firebase-uid> <email>");
    console.error("Example: npx ts-node scripts/user.ts abc123xyz admin@example.com");
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI not set");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Create initial admin
    const admin = await createInitialAdmin(firebaseUid, email);
    console.log("✅ Initial admin created successfully:");
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Status: ${admin.roleStatus}`);
    console.log("\nFirebase custom claims have been set.");
    console.log("The admin user may need to log out and log back in for claims to take effect.");
  } catch (error) {
    console.error("❌ Failed to create admin:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
};

setupAdmin();