import type { Request, Response, NextFunction } from "express";
import { verifyToken, type AuthTokenPayload } from "../lib/auth.js";
import { prisma } from "../db.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    studentId: string;
    email: string;
    name: string;
    role: "ADMIN" | "USER";
    isTemporaryPassword: boolean;
    batchId?: number | null;
  };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required. Missing token." });
    return;
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: "Invalid or expired authentication token." });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      studentId: true,
      email: true,
      name: true,
      role: true,
      isTemporaryPassword: true,
      batchId: true,
    },
  });

  if (!user) {
    res.status(401).json({ error: "User account not found." });
    return;
  }

  req.user = user;
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== "ADMIN") {
    res.status(403).json({ error: "Access denied. Administrator permission required." });
    return;
  }
  next();
}
