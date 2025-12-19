"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getMyPets,
  sendAIChatMessage,
  getPetContextForAI,
  type Pet,
  type ChatMessage,
  type PetContextResponse,
} from "@/api/api";

interface Message extends ChatMessage {
  id: string;
  timestamp: Date;
}

const PET_SPECIES_ICONS: Record<string, string> = {
  dog: "🐕",
  cat: "🐱",
  bird: "🐦",
  fish: "🐟",
  rabbit: "🐰",
  hamster: "🐹",
  reptile: "🦎",
  other: "🐾",
};

export default function PetEducationAgent() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [petContext, setPetContext] = useState<PetContextResponse | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPetsLoading, setIsPetsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user's pets on mount
  useEffect(() => {
    const fetchPets = async () => {
      if (!user) return;

      try {
        setIsPetsLoading(true);
        const token = await user.getIdToken();
        const response = await getMyPets(token);
        setPets(response.pets || []);
      } catch (err) {
        console.error("Failed to fetch pets:", err);
      } finally {
        setIsPetsLoading(false);
      }
    };

    fetchPets();
  }, [user]);

  // Load pet context when a pet is selected
  useEffect(() => {
    const fetchPetContext = async () => {
      if (!user || !selectedPetId) {
        setPetContext(null);
        return;
      }

      try {
        const token = await user.getIdToken();
        const context = await getPetContextForAI(token, selectedPetId);
        setPetContext(context);
      } catch (err) {
        console.error("Failed to fetch pet context:", err);
        setPetContext(null);
      }
    };

    fetchPetContext();
  }, [user, selectedPetId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add initial greeting when component mounts or pet selection changes
  useEffect(() => {
    const selectedPet = pets.find((p) => p._id === selectedPetId);
    const greeting: Message = {
      id: `greeting-${Date.now()}`,
      role: "assistant",
      content: selectedPet
        ? `Hello! I'm your pet care assistant. I can see you've selected **${selectedPet.name}** (${selectedPet.species}). I have access to ${selectedPet.name}'s health records and information, so feel free to ask me anything specific about caring for ${selectedPet.name} or general pet care questions!`
        : "Hello! I'm your pet care education assistant. I can help you with general pet care questions, nutrition advice, health concerns, and more. If you'd like personalized advice for one of your pets, select them from the dropdown above!",
      timestamp: new Date(),
    };

    setMessages([greeting]);
  }, [selectedPetId, pets]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();

      // Build conversation history (excluding the greeting and current message)
      const conversationHistory: ChatMessage[] = messages
        .filter((m) => !m.id.startsWith("greeting-"))
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await sendAIChatMessage(
        token,
        userMessage.content,
        selectedPetId || undefined,
        conversationHistory
      );

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(
        err instanceof Error ? err.message : "Failed to get response from AI"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePetSelect = (petId: string) => {
    setSelectedPetId(petId === "general" ? null : petId);
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    // Trigger re-greeting
    const selectedPet = pets.find((p) => p._id === selectedPetId);
    const greeting: Message = {
      id: `greeting-${Date.now()}`,
      role: "assistant",
      content: selectedPet
        ? `Chat cleared! I'm ready to help with any questions about **${selectedPet.name}** or general pet care.`
        : "Chat cleared! I'm ready to help with your pet care questions.",
      timestamp: new Date(),
    };
    setMessages([greeting]);
  };

  return (
    <div className="flex flex-col h-[700px] max-w-4xl mx-auto border border-border rounded-lg overflow-hidden bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🤖</div>
            <div>
              <h2 className="text-lg font-semibold">Pet Care Assistant</h2>
              <p className="text-sm text-muted-foreground">
                AI-powered pet education and advice
              </p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
          >
            Clear Chat
          </button>
        </div>

        {/* Pet Selector */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">
            Get personalized advice for:
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handlePetSelect("general")}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                selectedPetId === null
                  ? "border-blue-500 bg-blue-500/10 text-blue-500"
                  : "border-border hover:bg-accent"
              }`}
            >
              🌐 General Questions
            </button>
            {isPetsLoading ? (
              <div className="px-4 py-2 text-muted-foreground">
                Loading pets...
              </div>
            ) : (
              pets.map((pet) => (
                <button
                  key={pet._id}
                  onClick={() => handlePetSelect(pet._id)}
                  className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                    selectedPetId === pet._id
                      ? "border-blue-500 bg-blue-500/10 text-blue-500"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <span>{PET_SPECIES_ICONS[pet.species] || "🐾"}</span>
                  <span>{pet.name}</span>
                </button>
              ))
            )}
          </div>
          {petContext && selectedPetId && (
            <div className="mt-2 text-sm text-muted-foreground">
              ✓ Using {petContext.pet.name}&apos;s profile with{" "}
              {petContext.healthRecordsCount} health record
              {petContext.healthRecordsCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-accent rounded-bl-none"
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">
                {message.content.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                  part.startsWith("**") && part.endsWith("**") ? (
                    <strong key={i}>{part.slice(2, -2)}</strong>
                  ) : (
                    part
                  )
                )}
              </div>
              <div
                className={`text-xs mt-1 ${
                  message.role === "user"
                    ? "text-blue-100"
                    : "text-muted-foreground"
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-accent p-3 rounded-lg rounded-bl-none">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  Thinking...
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm">
              ⚠️ {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              selectedPetId
                ? `Ask about ${pets.find((p) => p._id === selectedPetId)?.name || "your pet"}...`
                : "Ask a pet care question..."
            }
            className="flex-1 px-4 py-2 border border-border rounded-lg bg-transparent resize-none focus:outline-none focus:border-blue-500 min-h-[44px] max-h-[120px]"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </span>
            ) : (
              "Send"
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          💡 This AI provides educational information only. Always consult a
          veterinarian for medical advice.
        </p>
      </div>
    </div>
  );
}
