import mongoose, { Schema, Document } from "mongoose";
import {Role, ROLES, RoleStatus, ROLE_STATUSES} from '@repo/shared';

export interface IRoleRequest extends Document {
  userId: mongoose.Types.ObjectId;

  requestedRole: Role;
  status: RoleStatus;

  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reason?: string;

  createdAt: Date;
}

const RoleRequestSchema = new Schema<IRoleRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    requestedRole: {
      type: String,
      enum: [ROLES.VET, ROLES.ADMIN],
      required: true,
    },

    status: {
      type: String,
      enum: [ROLE_STATUSES.PENDING, ROLE_STATUSES.APPROVED, ROLE_STATUSES.REJECTED],
      default: ROLE_STATUSES.PENDING,
    },

    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedAt: {
      type: Date,
    },

    reason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IRoleRequest>(
  "RoleRequest",
  RoleRequestSchema
);
