"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Pet } from "@/api/api";

interface HealthRecord {
  _id: string;
  recordType: string;
  title: string;
  description?: string;
  petInfo?: {
    name: string;
    species: string;
    breed?: string;
    age?: string;
    gender?: string;
  };
  data: Record<string, any>;
  vitals?: Record<string, any>;
  mlAnalysis?: {
    riskLevel: string;
    confidence: number;
    recommendations: string[];
    possibleConditions: { name: string; probability: number; severity?: string }[];
    inputSymptoms: string[];
    modelVersion?: string;
    analysisDate: string;
  };
  veterinarianId?: string;
  clinicName?: string;
  recordDate: string;
  createdAt: string;
}

interface HealthHistoryProps {
  pet: Pet;
  onClose: () => void;
}

export default function HealthHistory({ pet, onClose }: HealthHistoryProps) {
  const { getToken } = useAuth();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchHealthRecords();
  }, []);

  const fetchHealthRecords = async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health-records/pet/${pet._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch health records");
      
      const data = await response.json();
      setRecords(data.records);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load health records");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecords = async () => {
    if (selectedRecords.size === 0) return;
    
    if (!confirm(`Delete ${selectedRecords.size} selected record(s)?`)) return;

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      await Promise.all(
        Array.from(selectedRecords).map(recordId =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health-records/${recordId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        )
      );

      setSelectedRecords(new Set());
      await fetchHealthRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete records");
    }
  };

  const toggleRecordSelection = (recordId: string) => {
    const newSelection = new Set(selectedRecords);
    if (newSelection.has(recordId)) {
      newSelection.delete(recordId);
    } else {
      newSelection.add(recordId);
    }
    setSelectedRecords(newSelection);
  };

  const formatRecordType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Health History - {pet.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {selectedRecords.size > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
              <span className="text-red-700">
                {selectedRecords.size} record(s) selected
              </span>
              <button
                onClick={handleDeleteRecords}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Delete Selected
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 opacity-70">
              <p className="text-lg mb-2">No health records found</p>
              <p className="text-sm">Health records will appear here once created</p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div
                  key={record._id}
                  className={`border rounded-lg p-4 ${
                    selectedRecords.has(record._id) ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedRecords.has(record._id)}
                      onChange={() => toggleRecordSelection(record._id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{record.title}</h3>
                          <div className="flex gap-4 text-sm text-gray-600">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              {formatRecordType(record.recordType)}
                            </span>
                            <span>{formatDate(record.recordDate)}</span>
                            {record.clinicName && <span>{record.clinicName}</span>}
                          </div>
                          {record.petInfo && (
                            <div className="flex gap-4 text-xs text-gray-500 mt-1">
                              {record.petInfo.age && <span>Age: {record.petInfo.age}</span>}
                              {record.petInfo.breed && <span>Breed: {record.petInfo.breed}</span>}
                              {record.petInfo.gender && <span>Gender: {record.petInfo.gender}</span>}
                            </div>
                          )}
                        </div>
                      </div>

                      {record.description && (
                        <p className="text-gray-700 mb-3">{record.description}</p>
                      )}

                      {record.vitals && Object.keys(record.vitals).length > 0 && (
                        <div className="mb-3 p-2 bg-green-50 rounded">
                          <h4 className="font-medium text-green-800 mb-1">Vitals</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            {Object.entries(record.vitals).map(([key, value]) => (
                              <div key={key}>
                                <span className="text-green-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}: </span>
                                <span>{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {record.mlAnalysis && (
                        <div className="mb-3 p-3 bg-purple-50 rounded border border-purple-200">
                          <h4 className="font-medium text-purple-800 mb-2">🤖 AI Analysis Results</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Risk Level:</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                record.mlAnalysis.riskLevel === 'Low' ? 'bg-green-100 text-green-700' :
                                record.mlAnalysis.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                record.mlAnalysis.riskLevel === 'High' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {record.mlAnalysis.riskLevel}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">Confidence: </span>
                              <span>{record.mlAnalysis.confidence}%</span>
                            </div>
                            <div>
                              <span className="font-medium">Recommendations:</span>
                              <ul className="mt-1 ml-4 space-y-1">
                                {record.mlAnalysis.recommendations.map((rec, idx) => (
                                  <li key={idx} className="text-xs">• {rec}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <span className="font-medium">Possible Conditions:</span>
                              <div className="mt-1 space-y-1">
                                {record.mlAnalysis.possibleConditions.map((condition, idx) => (
                                  <div key={idx} className="flex justify-between text-xs">
                                    <span>{condition.name}</span>
                                    <span>{condition.probability}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {record.data && Object.keys(record.data).length > 0 && (
                        <div className="mb-3 p-2 bg-gray-50 rounded">
                          <h4 className="font-medium text-gray-800 mb-1">Additional Data</h4>
                          <div className="text-sm space-y-1">
                            {Object.entries(record.data).map(([key, value]) => (
                              <div key={key}>
                                <span className="text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}: </span>
                                <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        Created: {formatDate(record.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4 mt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}