/**
 * Create Admin User Script
 *
 * Usage:
 *   npx ts-node scripts/create-admin.ts <email> <password>
 *
 * This script creates an admin user in both Firebase and MongoDB.
 * If the user already exists in Firebase, it will just update their role.
 *
 * Example:
 *   npx ts-node scripts/create-admin.ts admin@petcare.com SecurePassword123!
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

// Import after Firebase is initialized
import User from "../src/models/User";
import { ROLES, ROLE_STATUSES } from "@repo/shared";

interface CreateAdminResult {
  firebaseUid: string;
  email: string;
  isNewUser: boolean;
}

async function createOrGetFirebaseUser(
  email: string,
  password: string
): Promise<CreateAdminResult> {
  try {
    // Try to get existing user
    const existingUser = await admin.auth().getUserByEmail(email);
    console.log(`ℹ️  Firebase user already exists: ${existingUser.uid}`);
    return {
      firebaseUid: existingUser.uid,
      email: existingUser.email!,
      isNewUser: false,
    };
  } catch (error: unknown) {
    // User doesn't exist, create new one
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "auth/user-not-found"
    ) {
      const newUser = await admin.auth().createUser({
        email,
        password,
        emailVerified: true,
      });
      console.log(`✅ Created new Firebase user: ${newUser.uid}`);
      return {
        firebaseUid: newUser.uid,
        email: newUser.email!,
        isNewUser: true,
      };
    }
    throw error;
  }
}

async function setAdminClaims(uid: string): Promise<void> {
  await admin.auth().setCustomUserClaims(uid, {
    role: ROLES.ADMIN,
    roleStatus: ROLE_STATUSES.APPROVED,
  });
  console.log("✅ Set Firebase custom claims");
}

async function createOrUpdateMongoUser(
  firebaseUid: string,
  email: string
): Promise<void> {
  const existingUser = await User.findOne({ firebaseUid });

  if (existingUser) {
    // Update existing user to admin
    existingUser.role = ROLES.ADMIN;
    existingUser.roleStatus = ROLE_STATUSES.APPROVED;
    existingUser.requestedRole = undefined;
    await existingUser.save();
    console.log("✅ Updated existing MongoDB user to admin");
  } else {
    // Create new admin user
    await User.create({
      firebaseUid,
      email,
      role: ROLES.ADMIN,
      roleStatus: ROLE_STATUSES.APPROVED,
    });
    console.log("✅ Created new MongoDB admin user");
  }
}

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error("\n📋 Usage: npx ts-node scripts/create-admin.ts <email> <password>\n");
    console.error("Example: npx ts-node scripts/create-admin.ts admin@petcare.com SecurePassword123!\n");
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error("❌ Invalid email format");
    process.exit(1);
  }

  // Validate password strength
  if (password.length < 6) {
    console.error("❌ Password must be at least 6 characters");
    process.exit(1);
  }

  console.log("\n🔧 Creating Admin User...\n");

  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI not set in environment");
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Create or get Firebase user
    const { firebaseUid, isNewUser } = await createOrGetFirebaseUser(
      email,
      password
    );

    // Set admin claims in Firebase
    await setAdminClaims(firebaseUid);

    // Create or update MongoDB user
    await createOrUpdateMongoUser(firebaseUid, email);

    console.log("\n" + "=".repeat(50));
    console.log("🎉 Admin user created successfully!");
    console.log("=".repeat(50));
    console.log(`   Email: ${email}`);
    console.log(`   Firebase UID: ${firebaseUid}`);
    console.log(`   Role: admin`);
    console.log(`   Status: approved`);
    if (isNewUser) {
      console.log(`   Password: ${password}`);
    }
    console.log("=".repeat(50));
    console.log("\n⚠️  If the user was already logged in, they need to log out");
    console.log("   and log back in for the new role to take effect.\n");
  } catch (error) {
    console.error("\n❌ Failed to create admin:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

main();
