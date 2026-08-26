import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.js";
import { prisma } from "../db.js";

export async function isOrganizerOrAdmin(userId: number, role: string, tournamentIdOrSlug: string | number): Promise<boolean> {
  if (role === "ADMIN") return true;

  const isNum = !isNaN(Number(tournamentIdOrSlug));
  const tournament = await prisma.tournament.findFirst({
    where: isNum ? { id: Number(tournamentIdOrSlug) } : { slug: String(tournamentIdOrSlug) },
    select: { id: true }
  });

  if (!tournament) return false;

  const organizer = await prisma.tournamentOrganizer.findUnique({
    where: {
      tournamentId_userId: {
        tournamentId: tournament.id,
        userId: userId,
      }
    }
  });

  return !!organizer;
}

export async function requireOrganizerOrAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const tournamentIdOrSlug = req.params.idOrSlug || req.params.tournamentId || req.body.tournamentId;
  if (!tournamentIdOrSlug) {
    res.status(400).json({ error: "Tournament identifier is required" });
    return;
  }

  const allowed = await isOrganizerOrAdmin(req.user.id, req.user.role, tournamentIdOrSlug);
  if (!allowed) {
    res.status(403).json({ error: "Access denied. You must be an assigned Tournament Organizer or Admin." });
    return;
  }

  next();
}
