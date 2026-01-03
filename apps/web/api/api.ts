const API_URL =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_API_PROD_URL
    : process.env.NEXT_PUBLIC_API_DEV_URL;


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
  const response = await fetch(`${API_URL}/api/user`, {
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
  console.log(`${API_URL}/api/auth/register`);
  const response = await fetch(`${API_URL}/api/auth/register`, {
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
  const response = await fetch(`${API_URL}/api/auth/request-role`, {
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
    `${API_URL}/api/admin/pending-requests`,
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
  const response = await fetch(`${API_URL}/api/admin/approve-role`, {
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
  const response = await fetch(`${API_URL}/api/admin/reject-role`, {
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
  const response = await fetch(`${API_URL}/api/admin/users`, {
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

// ============================================
// PET API
// ============================================

interface Pet {
  _id: string;
  ownerId: string | { _id: string; email: string };
  name: string;
  species: string;
  breed?: string;
  gender?: "male" | "female" | "unknown";
  dateOfBirth?: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
  profileImage?: string;
}

interface PetInput {
  name: string;
  species: string;
  breed?: string;
  gender?: "male" | "female" | "unknown";
  dateOfBirth?: string;
}

interface PaginatedResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  [key: string]: T[] | PaginatedResponse<T>["pagination"];
}

const getMyPets = async (
  token: string,
  includeArchived = false
): Promise<{ pets: Pet[] }> => {
  const url = new URL(`${API_URL}/api/pets`);
  if (includeArchived) url.searchParams.set("includeArchived", "true");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch pets");
  }

  return response.json();
};

const getPetById = async (token: string, petId: string): Promise<{ pet: Pet }> => {
  const response = await fetch(`${API_URL}/api/pets/${petId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch pet");
  }

  return response.json();
};

const addPet = async (
  token: string,
  pet: PetInput
): Promise<{ message: string; pet: Pet }> => {
  const response = await fetch(`${API_URL}/api/pets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(pet),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to add pet");
  }

  return response.json();
};

const updatePet = async (
  token: string,
  petId: string,
  updates: Partial<PetInput>
): Promise<{ message: string; pet: Pet }> => {
  const response = await fetch(`${API_URL}/api/pets/${petId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update pet");
  }

  return response.json();
};

const removePet = async (
  token: string,
  petId: string
): Promise<{ message: string; pet: Pet }> => {
  const response = await fetch(`${API_URL}/api/pets/${petId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to remove pet");
  }

  return response.json();
};

const restorePet = async (
  token: string,
  petId: string
): Promise<{ message: string; pet: Pet }> => {
  const response = await fetch(
    `${API_URL}/api/pets/${petId}/restore`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to restore pet");
  }

  return response.json();
};

interface SearchPetsParams {
  name?: string;
  species?: string;
  breed?: string;
  ownerId?: string;
  status?: "active" | "archived";
  page?: number;
  limit?: number;
}

const searchPets = async (
  token: string,
  params: SearchPetsParams = {}
): Promise<{ pets: Pet[]; pagination: PaginatedResponse<Pet>["pagination"] }> => {
  const url = new URL(`${API_URL}/api/pets/search`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to search pets");
  }

  return response.json();
};

// ============================================
// VET API
// ============================================

interface VetProfile {
  _id: string;
  userId?: string;
  displayName?: string;
  specializations?: string[];
  degrees?: string[];
  certifications?: string[];
  yearsOfExperience?: number;
  languagesSpoken?: string[];
  clinicName?: string;
  clinicAddress?: string;
  clinicCity?: string;
  clinicState?: string;
  clinicCountry?: string;
  clinicPostalCode?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  clinicWebsite?: string;
  consultationFee?: number;
  currency?: string;
  availableForOnlineConsultation?: boolean;
  bio?: string;
  profileImage?: string;
  verified?: boolean;
  email?: string;
  licenseNumber?: string;
  licenseCountry?: string;
}

interface VetProfileInput {
  displayName?: string;
  specializations?: string[];
  degrees?: string[];
  certifications?: string[];
  yearsOfExperience?: number;
  languagesSpoken?: string[];
  clinicName?: string;
  clinicAddress?: string;
  clinicCity?: string;
  clinicState?: string;
  clinicCountry?: string;
  clinicPostalCode?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  clinicWebsite?: string;
  consultationFee?: number;
  currency?: string;
  availableForOnlineConsultation?: boolean;
  bio?: string;
  profileImage?: string;
}

const getMyVetProfile = async (
  token: string
): Promise<{ profile: VetProfile }> => {
  const response = await fetch(`${API_URL}/api/vet/profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch vet profile");
  }

  return response.json();
};

const updateVetProfile = async (
  token: string,
  updates: VetProfileInput
): Promise<{ message: string; profile: VetProfile }> => {
  const response = await fetch(`${API_URL}/api/vet/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update profile");
  }

  return response.json();
};

const getVetPublicProfile = async (
  token: string,
  vetId: string
): Promise<{ profile: VetProfile }> => {
  const response = await fetch(`${API_URL}/api/vets/${vetId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch vet profile");
  }

  return response.json();
};

interface SearchVetsParams {
  name?: string;
  specialization?: string | string[];
  country?: string;
  city?: string;
  language?: string;
  onlineConsultation?: boolean;
  verified?: boolean;
  page?: number;
  limit?: number;
}

const searchVets = async (
  token: string,
  params: SearchVetsParams = {}
): Promise<{ vets: VetProfile[]; pagination: PaginatedResponse<VetProfile>["pagination"] }> => {
  const url = new URL(`${API_URL}/api/vets/search`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, v));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  });

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to search vets");
  }

  return response.json();
};

interface Specialization {
  key: string;
  value: string;
  label: string;
}

const getSpecializations = async (): Promise<{ specializations: Specialization[] }> => {
  const response = await fetch(
    `${API_URL}/api/vets/specializations`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch specializations");
  }

  return response.json();
};

// Admin vet functions
const getAllVetProfiles = async (
  token: string,
  params: { status?: string; verified?: boolean; page?: number; limit?: number } = {}
): Promise<{ vets: VetProfile[]; pagination: PaginatedResponse<VetProfile>["pagination"] }> => {
  const url = new URL(`${API_URL}/api/admin/vets`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch vet profiles");
  }

  return response.json();
};

const verifyVet = async (
  token: string,
  vetId: string,
  verificationSource?: string
): Promise<{ message: string; profile: VetProfile }> => {
  const response = await fetch(
    `${API_URL}/api/admin/vets/${vetId}/verify`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ verificationSource }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to verify vet");
  }

  return response.json();
};

// ============================================
// ML ANALYSIS API
// ============================================

interface HealthAnalysisInput {
  symptoms: string;
  duration?: string;
  severity?: string;
  appetite?: string;
  energy?: string;
  temperature?: string;
  weight?: string;
  age?: string;
  breed?: string;
  additionalNotes?: string;
}

interface HealthAnalysisResponse {
  message: string;
  analysis: {
    recordId: string;
    riskCategory: string;
    confidence: number;
    flags: {
      highRisk: boolean;
      requiresAttention: boolean;
    };
    timestamp: string;
  };
  safetyNotice: string;
}

const performHealthAnalysis = async (
  token: string,
  petId: string,
  analysisData: HealthAnalysisInput
): Promise<HealthAnalysisResponse> => {
  const response = await fetch(`${API_URL}/api/ml-analysis/pet/${petId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(analysisData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Health analysis failed");
  }

  return response.json();
};

const getMLServiceStatus = async (token: string): Promise<any> => {
  const response = await fetch(`${API_URL}/api/ml-analysis/status`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get ML service status");
  }

  return response.json();
};

// ============================================
// AI CHAT API
// ============================================

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIChatResponse {
  message: string;
  petContext: { name: string; species: string } | null;
}

interface PetContextResponse {
  pet: {
    _id: string;
    name: string;
    species: string;
    breed?: string;
    gender?: string;
    approximateAge?: string;
    weight?: number;
    allergies?: string[];
    vaccinations?: string[];
  };
  healthRecordsCount: number;
}

const sendAIChatMessage = async (
  token: string,
  message: string,
  petId?: string,
  conversationHistory?: ChatMessage[]
): Promise<AIChatResponse> => {
  const response = await fetch(`${API_URL}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, petId, conversationHistory }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send message");
  }

  return response.json();
};

const getPetContextForAI = async (
  token: string,
  petId: string
): Promise<PetContextResponse> => {
  const response = await fetch(
    `${API_URL}/api/ai/pet-context/${petId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to get pet context");
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
  // Pet exports
  getMyPets,
  getPetById,
  addPet,
  updatePet,
  removePet,
  restorePet,
  searchPets,
  // Vet exports
  getMyVetProfile,
  updateVetProfile,
  getVetPublicProfile,
  searchVets,
  getSpecializations,
  getAllVetProfiles,
  verifyVet,
  // ML Analysis exports
  performHealthAnalysis,
  getMLServiceStatus,
  // AI Chat exports
  sendAIChatMessage,
  getPetContextForAI,
};

// Type exports
export type {
  Pet,
  PetInput,
  VetProfile,
  VetProfileInput,
  SearchPetsParams,
  SearchVetsParams,
  Specialization,
  UserResponse,
  PendingRequest,
  HealthAnalysisInput,
  HealthAnalysisResponse,
  ChatMessage,
  AIChatResponse,
  PetContextResponse,
};