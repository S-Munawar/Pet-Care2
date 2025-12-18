const NEXT_PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:2000";

// ============================================
// USER API
// ============================================

interface UserResponse {
  uid: string;
  email: string;
  role: string;
  roleStatus: string;
  requestedRole?: string;
  hasPendingRequest: boolean;
  registered: boolean;
  createdAt?: string;
}

const getUser = async (token: string): Promise<UserResponse> => {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/api/user`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    // User not registered yet
    return {
      uid: "",
      email: "",
      role: "",
      roleStatus: "",
      hasPendingRequest: false,
      registered: false,
    };
  }

  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }

  return response.json();
};

// ============================================
// AUTH API
// ============================================

interface RegisterResponse {
  message: string;
  role: string;
  roleStatus: string;
  requestedRole?: string;
}

const register = async (
  token: string,
  requestedRole?: string
): Promise<RegisterResponse> => {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ requestedRole }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Registration failed");
  }

  return response.json();
};

interface RoleRequestResponse {
  message: string;
  requestedRole: string;
}

const requestRoleUpgrade = async (
  token: string,
  requestedRole: string,
  licenseNumber?: string,
  licenseCountry?: string
): Promise<RoleRequestResponse> => {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/api/auth/request-role`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ requestedRole, licenseNumber, licenseCountry }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Role request failed");
  }

  return response.json();
};

// ============================================
// ADMIN API
// ============================================

interface PendingRequest {
  _id: string;
  userId: {
    _id: string;
    email: string;
    firebaseUid: string;
  };
  requestedRole: string;
  status: string;
  reason?: string;
  createdAt: string;
}

const getPendingRoleRequests = async (
  token: string
): Promise<{ requests: PendingRequest[] }> => {
  const response = await fetch(
    `${NEXT_PUBLIC_API_URL}/api/admin/pending-requests`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch pending requests");
  }

  return response.json();
};

const approveRoleRequest = async (
  token: string,
  requestId: string
): Promise<{ message: string }> => {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/api/admin/approve-role`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ requestId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to approve request");
  }

  return response.json();
};

const rejectRoleRequest = async (
  token: string,
  requestId: string,
  reason?: string
): Promise<{ message: string }> => {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/api/admin/reject-role`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ requestId, reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to reject request");
  }

  return response.json();
};

const getAllUsers = async (token: string): Promise<{ users: unknown[] }> => {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/api/admin/users`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  return response.json();
};

export {
  getUser,
  register,
  requestRoleUpgrade,
  getPendingRoleRequests,
  approveRoleRequest,
  rejectRoleRequest,
  getAllUsers,
};