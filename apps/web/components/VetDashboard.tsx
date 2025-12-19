"use client";

import { useState } from "react";
import VetProfileEditor from "./VetProfileEditor";
import VetSearch from "./VetSearch";
import VetPatients from "./VetPatients";

type Tab = "profile" | "patients" | "colleagues" | "appointments";

export default function VetDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">🩺 Veterinarian Dashboard</h2>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === "profile"
              ? "border-b-2 border-foreground text-foreground"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          👤 My Profile
        </button>
        <button
          onClick={() => setActiveTab("patients")}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === "patients"
              ? "border-b-2 border-foreground text-foreground"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          🐾 Patients
        </button>
        <button
          onClick={() => setActiveTab("colleagues")}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === "colleagues"
              ? "border-b-2 border-foreground text-foreground"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          🔍 Find Colleagues
        </button>
        <button
          onClick={() => setActiveTab("appointments")}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === "appointments"
              ? "border-b-2 border-foreground text-foreground"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          📅 Appointments
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "profile" && <VetProfileEditor />}
      {activeTab === "patients" && <VetPatients />}
      {activeTab === "colleagues" && <VetSearch />}
      {activeTab === "appointments" && (
        <div className="text-center py-12 opacity-70">
          <p className="text-lg mb-2">📅 Appointments</p>
          <p className="text-sm">Coming soon...</p>
        </div>
      )}
    </div>
  );
}
