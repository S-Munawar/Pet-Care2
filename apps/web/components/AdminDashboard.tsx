"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getPendingRoleRequests,
  approveRoleRequest,
  rejectRoleRequest,
} from "@/api/api";

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

export default function AdminDashboard() {
  const { getToken } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPendingRequests = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const data = await getPendingRoleRequests(token);
      setPendingRequests(data.requests);
    } catch (err) {
      setError("Failed to load pending requests");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const token = await getToken();
      if (!token) return;

      await approveRoleRequest(token, requestId);
      // Refresh the list
      await fetchPendingRequests();
    } catch (err) {
      setError("Failed to approve request");
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const token = await getToken();
      if (!token) return;

      await rejectRoleRequest(token, requestId, "Request rejected by admin");
      // Refresh the list
      await fetchPendingRequests();
    } catch (err) {
      setError("Failed to reject request");
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">⚙️ Admin Dashboard</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">User Management</h3>
          <p className="text-sm opacity-70">Manage all users</p>
        </div>
        <div className="p-4 border rounded-lg bg-yellow-50">
          <h3 className="font-semibold mb-2">Pending Approvals</h3>
          <p className="text-sm opacity-70">
            {pendingRequests.length} request(s) pending
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">System Settings</h3>
          <p className="text-sm opacity-70">Configure system settings</p>
        </div>
      </div>

      {/* Pending Role Requests Section */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Pending Role Requests</h3>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : pendingRequests.length === 0 ? (
          <p className="text-gray-500">No pending requests</p>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div
                key={request._id}
                className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
              >
                <div>
                  <p className="font-medium">{request.userId.email}</p>
                  <p className="text-sm text-gray-600">
                    Requesting:{" "}
                    <span className="font-semibold capitalize">
                      {request.requestedRole}
                    </span>
                  </p>
                  {request.reason && (
                    <p className="text-xs text-gray-500 mt-1">
                      {request.reason}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(request._id)}
                    disabled={processingId === request._id}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {processingId === request._id ? "..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleReject(request._id)}
                    disabled={processingId === request._id}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {processingId === request._id ? "..." : "Reject"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
