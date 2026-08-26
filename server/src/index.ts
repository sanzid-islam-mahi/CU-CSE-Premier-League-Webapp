import express from "express";
import cors from "cors";
import path from "path";
import authRouter from "./routes/auth.js";
import batchesRouter from "./routes/batches.js";
import usersRouter from "./routes/users.js";
import tournamentsRouter from "./routes/tournaments.js";
import teamsRouter from "./routes/teams.js";
import matchesRouter from "./routes/matches.js";
import { scoringRouter } from "./routes/scoring.js";
import uploadRouter from "./routes/upload.js";
import mediaRouter from "./routes/media.js";

import fs from "fs";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

// Serve uploaded media files statically
const baseUploadsDir = fs.existsSync(path.join(process.cwd(), "server", "uploads"))
  ? path.join(process.cwd(), "server", "uploads")
  : path.join(process.cwd(), "uploads");

if (!fs.existsSync(baseUploadsDir)) {
  fs.mkdirSync(baseUploadsDir, { recursive: true });
}

app.use("/uploads", express.static(baseUploadsDir));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/batches", batchesRouter);
app.use("/api/users", usersRouter);
app.use("/api/tournaments", tournamentsRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/matches", matchesRouter);
app.use("/api/scoring", scoringRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/media", mediaRouter);

app.listen(PORT, () => {
  console.log(`CSEPL Server running on http://localhost:${PORT}`);
});


