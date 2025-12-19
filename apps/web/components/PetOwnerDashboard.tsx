"use client";

import { useState } from "react";
import PetManagement from "./PetManagement";
import VetSearch from "./VetSearch";
import PetEducationAgent from "./PetEducationAgent";

type Tab = "pets" | "find-vet" | "ai-assistant" | "appointments";

export default function PetOwnerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("pets");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">🐕 Pet Owner Dashboard</h2>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab("pets")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "pets"
              ? "border-b-2 border-foreground text-foreground"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          🐾 My Pets
        </button>
        <button
          onClick={() => setActiveTab("find-vet")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "find-vet"
              ? "border-b-2 border-foreground text-foreground"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          🔍 Find a Vet
        </button>
        <button
          onClick={() => setActiveTab("ai-assistant")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "ai-assistant"
              ? "border-b-2 border-foreground text-foreground"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          🤖 AI Assistant
        </button>
        <button
          onClick={() => setActiveTab("appointments")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "appointments"
              ? "border-b-2 border-foreground text-foreground"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          📅 Appointments
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "pets" && <PetManagement />}
      {activeTab === "find-vet" && <VetSearch />}
      {activeTab === "ai-assistant" && <PetEducationAgent />}
      {activeTab === "appointments" && (
        <div className="text-center py-12 opacity-70">
          <p className="text-lg mb-2">📅 Appointments</p>
          <p className="text-sm">Coming soon...</p>
        </div>
      )}
    </div>
  );
}
