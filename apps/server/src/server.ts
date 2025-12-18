// server/src/server.ts
import dotenv from "dotenv";
dotenv.config(); // Load environment variables BEFORE other imports

import express from "express";
import cors from "cors";
import connectDB from "./config/db";
import userRouter from "./routes/user";
import petRouter from "./routes/pet";
import vetRouter from "./routes/vet";

const app = express();
const PORT = process.env.PORT || 2000;

// Connect to MongoDB
connectDB();

// Enable CORS for frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
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

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}!`);
});
