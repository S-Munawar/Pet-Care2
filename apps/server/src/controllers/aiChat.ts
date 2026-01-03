import { Response } from "express";
import { AuthenticatedRequest } from "@/middleware/auth.middleware";
import Pet from "@/models/Pet";
import PetHealthRecord from "@/models/PetHealthRecord";

const API_URL = process.env.API_URL || "http://localhost:11434";
const AI_MODEL = process.env.AI_MODEL;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface PetContext {
  pet: {
    name: string;
    species: string;
    breed?: string;
    gender?: string;
    dateOfBirth?: Date;
    approximateAge?: string;
    weight?: number;
    color?: string;
    medicalNotes?: string;
    allergies?: string[];
    vaccinations?: string[];
  };
  healthRecords: {
    recordType: string;
    title: string;
    description?: string;
    recordDate: Date;
    vitals?: Record<string, unknown>;
    data?: Record<string, unknown>;
  }[];
}

/**
 * Build system prompt for the AI agent
 */
const buildSystemPrompt = (petContext?: PetContext): string => {
  let systemPrompt = `You are a knowledgeable and friendly pet care education assistant. Your role is to help pet owners understand:
- General pet care, nutrition, and wellness
- Common health concerns and when to seek veterinary care
- Behavioral training and enrichment
- Preventive care and vaccination schedules
- Emergency first aid basics

Important guidelines:
- Always recommend consulting a veterinarian for medical concerns
- Provide evidence-based information when possible
- Be empathetic and supportive
- Never diagnose conditions or prescribe treatments
- Encourage regular veterinary check-ups`;

  if (petContext) {
    const { pet, healthRecords } = petContext;

    systemPrompt += `\n\n--- PET CONTEXT ---
You are helping with a specific pet. Here are the details:

Pet Information:
- Name: ${pet.name}
- Species: ${pet.species}
- Breed: ${pet.breed || "Unknown"}
- Gender: ${pet.gender || "Unknown"}
- Age: ${pet.approximateAge || (pet.dateOfBirth ? `Born: ${pet.dateOfBirth}` : "Unknown")}
- Weight: ${pet.weight ? `${pet.weight} kg` : "Unknown"}
- Color: ${pet.color || "Unknown"}
- Known Allergies: ${pet.allergies?.length ? pet.allergies.join(", ") : "None recorded"}
- Vaccinations: ${pet.vaccinations?.length ? pet.vaccinations.join(", ") : "None recorded"}
- Medical Notes: ${pet.medicalNotes || "None"}`;

    if (healthRecords.length > 0) {
      systemPrompt += `\n\nRecent Health Records:`;
      healthRecords.slice(0, 10).forEach((record, index) => {
        systemPrompt += `\n${index + 1}. ${record.title} (${record.recordType}) - ${new Date(record.recordDate).toLocaleDateString()}`;
        if (record.description) {
          systemPrompt += `\n   Description: ${record.description}`;
        }
        if (record.vitals) {
          const vitalsStr = Object.entries(record.vitals)
            .filter(([_, v]) => v !== undefined && v !== null)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");
          if (vitalsStr) {
            systemPrompt += `\n   Vitals: ${vitalsStr}`;
          }
        }
      });
    }

    systemPrompt += `\n\nUse this pet's specific information to provide personalized advice. Reference the pet by name and consider their specific needs based on species, breed, age, and health history.`;
  }

  return systemPrompt;
};

/**
 * Chat with AI agent for pet education
 * POST /api/ai/chat
 */
export const chatWithAgent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.dbUser?._id;
    const { message, petId, conversationHistory } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!message || typeof message !== "string") {
      res.status(400).json({ message: "Message is required" });
      return;
    }

    let petContext: PetContext | undefined;

    // If a petId is provided, fetch pet details and health records
    if (petId) {
      const pet = await Pet.findById(petId);

      if (!pet) {
        res.status(404).json({ message: "Pet not found" });
        return;
      }

      // Verify ownership - pet owners can only access their own pets
      if (
        req.dbUser?.role === "pet-owner" &&
        pet.ownerId.toString() !== userId.toString()
      ) {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      // Fetch health records for the pet
      const healthRecords = await PetHealthRecord.find({ petId })
        .sort({ recordDate: -1 })
        .limit(20)
        .lean();

      petContext = {
        pet: {
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
          gender: pet.gender,
          dateOfBirth: pet.dateOfBirth
        },
        healthRecords: healthRecords.map((r) => ({
          recordType: r.recordType,
          title: r.title,
          description: r.description,
          recordDate: r.recordDate,
          vitals: r.vitals,
          data: r.data && r.data instanceof Map ? Object.fromEntries(r.data) : r.data,
        })),
      };
    }

    // Build messages array
    const messages: ChatMessage[] = [
      { role: "system", content: buildSystemPrompt(petContext) },
    ];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg: { role: string; content: string }) => {
        if (
          (msg.role === "user" || msg.role === "assistant") &&
          typeof msg.content === "string"
        ) {
          messages.push({ role: msg.role, content: msg.content });
        }
      });
    }

    // Add current message
    messages.push({ role: "user", content: message });

    // // Call Gemini API
    // const response = await fetch(
    //   `${process.env.API_URL}/models/${process.env.AI_MODEL}:generateContent?key=${process.env.API_KEY}`,
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       contents: [
    //         {
    //           role: "user",
    //           parts: [
    //             { text: "ping" }
    //           ]
    //         }
    //       ],
    //       generationConfig: {
    //         maxOutputTokens: 256,
    //         temperature: 0.3
    //       }
    //     }),
    //   }
    // );

    // Call Ollama API
    const response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: messages,
        stream: false,
      }),
    });


    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API error:", errorData);
      res.status(500).json({ message: "AI service error" });
      return;
    }

    const data: any = await response.json();
    const assistantMessage = data.message?.content;

    if (!assistantMessage) {
      console.error("No response from AI, data:", JSON.stringify(data));
      res.status(500).json({ message: "No response from AI" });
      return;
    }

    res.json({
      message: assistantMessage,
      petContext: petContext
        ? { name: petContext.pet.name, species: petContext.pet.species }
        : null,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    res.status(500).json({ message: "Failed to process chat request" });
  }
};

/**
 * Get pet details with health records for AI context
 * GET /api/ai/pet-context/:petId
 */
export const getPetContext = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.dbUser?._id;
    const { petId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const pet = await Pet.findById(petId);

    if (!pet) {
      res.status(404).json({ message: "Pet not found" });
      return;
    }

    // Verify ownership
    if (
      req.dbUser?.role === "pet-owner" &&
      pet.ownerId.toString() !== userId.toString()
    ) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const healthRecords = await PetHealthRecord.find({ petId })
      .sort({ recordDate: -1 })
      .limit(20);

    res.json({
      pet: {
        _id: pet._id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        gender: pet.gender
      },
      healthRecordsCount: healthRecords.length,
    });
  } catch (error) {
    console.error("Get pet context error:", error);
    res.status(500).json({ message: "Failed to get pet context" });
  }
};
