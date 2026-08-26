import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";

const taskCreateSchema = z.object({
  title: z.string().min(1).max(255),
});

const router: Router = Router();

router.get("/", async (_req, res) => {
  const tasks = await prisma.task.findMany({ orderBy: { createdAt: "desc" } });
  res.json(tasks);
});

router.post("/", async (req, res) => {
  const parsed = taskCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: z.treeifyError(parsed.error) });
    return;
  }
  const task = await prisma.task.create({ data: { title: parsed.data.title } });
  res.status(201).json(task);
});

export default router;
