import axios, { AxiosInstance } from "axios";

/**
 * ML Inference Service Client
 * Handles communication with the ML inference service
 */

interface MLInferenceInput {
  species: string;
  breed?: string;
  age_months?: number;
  weight_kg?: number;
  gender?: string;
  is_senior?: boolean;
  is_young?: boolean;
  temperature_c?: number;
  heart_rate_bpm?: number;
  respiratory_rate_bpm?: number;
  symptoms_present: string;
  symptom_count: number;
  max_symptom_severity?: string;
  symptom_duration?: string;
  appetite_level?: string;
  energy_level?: string;
  hydration_normal?: boolean;
  gait_normal?: boolean;
  coat_condition?: string;
}

interface MLInferenceResponse {
  risk_assessment: {
    category: string;
    confidence: number;
    probability_distribution: Record<string, number>;
  };
  flags: {
    high_risk: boolean;
    requires_attention: boolean;
    confidence_threshold_met: boolean;
  };
  metadata: {
    model_version: string;
    prediction_timestamp: string;
    service_version: string;
  };
  safety_notice: string;
}

export class MLInferenceClient {
  private client: AxiosInstance;
  private serviceUrl: string;

  constructor() {
    this.serviceUrl = process.env.ML_INFERENCE_URL || "http://localhost:5000";
    
    this.client = axios.create({
      baseURL: this.serviceUrl,
      timeout: 10000, // 10 second timeout
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Check if ML service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get("/health");
      return response.status === 200 && response.data.status === "healthy";
    } catch (error) {
      console.error("ML service health check failed:", error);
      return false;
    }
  }

  /**
   * Call ML inference service for prediction
   */
  async predict(input: MLInferenceInput): Promise<MLInferenceResponse> {
    try {
      const response = await this.client.post<MLInferenceResponse>("/predict", input);
      
      if (response.status !== 200) {
        throw new Error(`ML service returned status ${response.status}`);
      }

      return response.data;
    } catch (error: any) {
      if (error.response) {
        // ML service returned an error response
        const errorMsg = error.response.data?.error || "ML inference failed";
        throw new Error(`ML service error: ${errorMsg}`);
      } else if (error.request) {
        // Request made but no response received
        throw new Error("ML service unavailable");
      } else {
        // Error setting up the request
        throw new Error(`ML service request failed: ${error.message}`);
      }
    }
  }

  /**
   * Get ML service model information
   */
  async getModelInfo(): Promise<any> {
    try {
      const response = await this.client.get("/model/info");
      return response.data;
    } catch (error) {
      console.error("Failed to get ML model info:", error);
      return null;
    }
  }
}

// Singleton instance
export const mlInferenceClient = new MLInferenceClient();