"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Pet, performHealthAnalysis } from "@/api/api";

interface HealthAnalysisProps {
  pet: Pet;
  onClose: () => void;
}

export default function HealthAnalysis({ pet, onClose }: HealthAnalysisProps) {
  const { getToken } = useAuth();
  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                       (today.getMonth() - birthDate.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} months`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      return months > 0 ? `${years} years ${months} months` : `${years} years`;
    }
  };

  const [formData, setFormData] = useState({
    symptoms: "",
    duration: "",
    severity: "mild",
    appetite: "normal",
    energy: "normal",
    temperature: "",
    weight: "",
    age: pet.dateOfBirth ? calculateAge(pet.dateOfBirth) : "",
    breed: pet.breed || "",
    additionalNotes: "",
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      // Call backend ML analysis endpoint
      const analysisData = {
        symptoms: formData.symptoms,
        duration: formData.duration,
        severity: formData.severity,
        appetite: formData.appetite,
        energy: formData.energy,
        temperature: formData.temperature,
        weight: formData.weight,
        age: formData.age,
        breed: formData.breed,
        additionalNotes: formData.additionalNotes,
      };
      
      const analysisResponse = await performHealthAnalysis(token, pet._id, analysisData);
      
      // Transform backend response for display
      const analysisResults = {
        riskLevel: analysisResponse.analysis.riskCategory,
        confidence: analysisResponse.analysis.confidence,
        recommendations: [
          "Monitor symptoms for 24-48 hours",
          "Ensure adequate hydration", 
          "Contact vet if symptoms worsen"
        ],
        possibleConditions: [
          { name: "Assessment completed", probability: analysisResponse.analysis.confidence }
        ],
        recordId: analysisResponse.analysis.recordId,
        flags: analysisResponse.analysis.flags
      };
      
      setResults(analysisResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Health Analysis - {pet.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {!results ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Pet Name</label>
                  <input
                    type="text"
                    value={pet.name}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Species</label>
                  <input
                    type="text"
                    value={pet.species}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Breed</label>
                  <input
                    type="text"
                    value={pet.breed}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Age</label>
                  <input
                    type="text"
                    value={pet.dateOfBirth ? calculateAge(pet.dateOfBirth) : ""}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Symptoms *</label>
                <textarea
                  required
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  placeholder="Describe the symptoms you've observed..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Duration</label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select duration</option>
                    <option value="less-than-day">Less than a day</option>
                    <option value="1-3-days">1-3 days</option>
                    <option value="4-7-days">4-7 days</option>
                    <option value="more-than-week">More than a week</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Current Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Appetite</label>
                  <select
                    value={formData.appetite}
                    onChange={(e) => setFormData({ ...formData, appetite: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="normal">Normal</option>
                    <option value="increased">Increased</option>
                    <option value="decreased">Decreased</option>
                    <option value="none">No appetite</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Energy Level</label>
                  <select
                    value={formData.energy}
                    onChange={(e) => setFormData({ ...formData, energy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="low">Low</option>
                    <option value="lethargic">Lethargic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    placeholder="e.g., 38.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Additional Notes</label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                  placeholder="Any other observations or relevant information..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                  rows={2}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze Health"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Analysis Complete</h3>
                <p className="text-green-700">Risk Level: <span className="font-medium">{results.riskLevel}</span></p>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Recommendations</h3>
                <ul className="space-y-2">
                  {results.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Possible Conditions</h3>
                <div className="space-y-2">
                  {results.possibleConditions.map((condition: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{condition.name}</span>
                      <span className="text-sm text-gray-600">{condition.probability}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setResults(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  New Analysis
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}