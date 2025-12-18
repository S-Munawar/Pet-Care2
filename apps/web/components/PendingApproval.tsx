import React from "react";
import { useAuth } from "@/context/AuthContext";

const PendingApproval = () => {
  const { requestedRole, role, refreshUserData } = useAuth();

  const handleRefresh = async () => {
    await refreshUserData();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="max-w-md text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4">Pending Approval</h2>

        <p className="text-gray-600 mb-4">
          Your request to become a{" "}
          <span className="font-semibold capitalize">{requestedRole}</span> is
          currently under review.
        </p>

        <p className="text-sm text-gray-500 mb-6">
          You can continue using the platform as a{" "}
          <span className="font-medium capitalize">{role}</span> while your
          request is being processed.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleRefresh}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Check Status
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          An administrator will review your request and you&apos;ll be notified
          once a decision is made.
        </p>
      </div>
    </div>
  );
};

export default PendingApproval;
