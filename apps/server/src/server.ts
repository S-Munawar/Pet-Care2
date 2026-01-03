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

const ML_INFERENCE_URL = process.env.NODE_ENV === "production"
const FRONTEND_URL = process.env.NODE_ENV === "production"
  ? process.env.PROD_FRONTEND_URL
  : process.env.DEV_FRONTEND_URL;

// Enable CORS for frontend
app.use(
  cors({
    origin: FRONTEND_URL,
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

app.get("/", (_req, res) => {
  res.send(`Web: ${FRONTEND_URL}`);
  res.send(`ML Inference: ${ML_INFERENCE_URL}`);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}!`);
});
