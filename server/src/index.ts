import express from "express";
import cors from "cors";
import tasksRouter from "./routes/tasks.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/tasks", tasksRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
