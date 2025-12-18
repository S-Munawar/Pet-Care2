import mongoose, { Schema, Document } from "mongoose";
import {Role, ROLES, RoleStatus, ROLE_STATUSES} from '@repo/shared';

export interface IUser extends Document {
  firebaseUid: string;
  email: string;

  role: Role;
  roleStatus: RoleStatus;
  requestedRole?: Role;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },

    role: {
      type: String,
      enum: [ROLES.PET_OWNER, ROLES.VET, ROLES.ADMIN],
      default: ROLES.PET_OWNER,
    },

    roleStatus: {
      type: String,
      enum: [ROLE_STATUSES.APPROVED, ROLE_STATUSES.PENDING, ROLE_STATUSES.REJECTED],
      default: ROLE_STATUSES.APPROVED,
    },

    requestedRole: {
      type: String,
      enum: [ROLES.VET, ROLES.ADMIN],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>("User", UserSchema);
