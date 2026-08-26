import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";
import batchesRouter from "./routes/batches.js";
import usersRouter from "./routes/users.js";
import tournamentsRouter from "./routes/tournaments.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/batches", batchesRouter);
app.use("/api/users", usersRouter);
app.use("/api/tournaments", tournamentsRouter);

app.listen(PORT, () => {
  console.log(`CSEPL Server running on http://localhost:${PORT}`);
});

