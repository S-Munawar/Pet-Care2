// server/src/server.ts
import dotenv from "dotenv";
dotenv.config(); // Load environment variables BEFORE other imports

import express from "express";
import cors from "cors";
import connectDB from "./config/db";
// // Import Firebase admin after dotenv config
// import "./config/firebaseadmin";
import userRouter from "./routes/user";
import petRouter from "./routes/pet";
import vetRouter from "./routes/vet";
import healthRecordRouter from "./routes/healthRecord";
import mlAnalysisRouter from "./routes/mlAnalysis";
import aiChatRouter from "./routes/aiChat";

const app = express();
const PORT = process.env.PORT || 2000;

// Connect to MongoDB
connectDB();

// Enable CORS for frontend
app.use(
  cors({
    origin: [
      process.env.FRONTEND_LOCAL_URL || "http://localhost:3000",
      process.env.FRONTEND_HOSTED_URL || "https://pet-care2-web.vercel.app"
      // Add other allowed origins as needed
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],

    credentials: true,
  })
);

app.use(express.json());

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api", userRouter);
app.use("/api", petRouter);
app.use("/api", vetRouter);
app.use("/api", healthRecordRouter);
app.use("/api", mlAnalysisRouter);
app.use("/api", aiChatRouter);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}!`);
});
