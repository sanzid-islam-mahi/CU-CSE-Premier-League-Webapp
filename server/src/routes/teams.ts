import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { isOrganizerOrAdmin } from "../middleware/organizerAuth.js";

const teamsRouter = Router();

// Helper: Check if user can manage this team (Admin, Tournament Organizer, or Team Manager)
export async function canManageTeam(userId: number, role: string, teamId: number): Promise<boolean> {
  if (role === "ADMIN") return true;

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { managerId: true, tournamentId: true }
  });
  if (!team) return false;

  // Team Manager (does NOT need to be a team member)
  if (team.managerId === userId) return true;

  // Tournament Organizer
  const isOrganizer = await prisma.tournamentOrganizer.findUnique({
    where: { tournamentId_userId: { tournamentId: team.tournamentId, userId } }
  });
  return !!isOrganizer;
}

const createTeamSchema = z.object({
  tournamentId: z.number().int().positive(),
  name: z.string().min(1, "Team name is required"),
  shortName: z.string().min(1).max(6).optional(),
  batchId: z.number().int().positive().optional().nullable(),
  groupId: z.number().int().positive().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  bannerUrl: z.string().optional().nullable(),
  captainId: z.number().int().positive().optional().nullable(),
  managerId: z.number().int().positive().optional().nullable(),
});

const updateTeamSchema = z.object({
  name: z.string().min(1).optional(),
  shortName: z.string().min(1).max(6).optional(),
  groupId: z.number().int().positive().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  bannerUrl: z.string().optional().nullable(),
  captainId: z.number().int().positive().optional().nullable(),
  viceCaptainId: z.number().int().positive().optional().nullable(),
  managerId: z.number().int().positive().optional().nullable(),
});

const addMemberSchema = z.object({
  userId: z.number().int().positive("Valid user ID required"),
  jerseyNumber: z.number().int().optional().nullable(),
  isCaptain: z.boolean().optional(),
  isViceCaptain: z.boolean().optional(),
});

// GET team by ID with full squad roster
teamsRouter.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        tournament: {
          select: { id: true, name: true, slug: true, sport: true, season: true, status: true }
        },
        batch: true,
        group: true,
        captain: {
          select: { id: true, name: true, studentId: true, email: true, phone: true, avatarUrl: true, cricketRole: true, footballPosition: true }
        },
        manager: {
          select: { id: true, name: true, studentId: true, email: true, phone: true, avatarUrl: true }
        },
        mediaAssets: {
          orderBy: { createdAt: "desc" }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                studentId: true,
                name: true,
                email: true,
                avatarUrl: true,
                cricketRole: true,
                battingStyle: true,
                bowlingStyle: true,
                footballPosition: true,
                preferredJerseyNo: true,
              }
            }
          },
          orderBy: [
            { isCaptain: "desc" },
            { isViceCaptain: "desc" },
            { id: "asc" }
          ]
        },
        homeMatches: {
          include: {
            teamA: { select: { id: true, name: true, shortName: true } },
            teamB: { select: { id: true, name: true, shortName: true } },
            winnerTeam: { select: { id: true, name: true } },
            matchSquads: { select: { userId: true, teamId: true, isPlayingXI: true } },
          },
          orderBy: { matchNumber: "asc" }
        },
        awayMatches: {
          include: {
            teamA: { select: { id: true, name: true, shortName: true } },
            teamB: { select: { id: true, name: true, shortName: true } },
            winnerTeam: { select: { id: true, name: true } },
            matchSquads: { select: { userId: true, teamId: true, isPlayingXI: true } },
          },
          orderBy: { matchNumber: "asc" }
        }
      }
    });

    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }

    res.json(team);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch team" });
  }
});

// CREATE Team in Tournament (Organizer or Admin)
teamsRouter.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = createTeamSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
      return;
    }

    const { tournamentId, name, shortName, batchId, groupId, logoUrl, captainId, managerId } = parsed.data;

    // Check organizer permission
    const allowed = await isOrganizerOrAdmin(req.user!.id, req.user!.role, tournamentId);
    if (!allowed) {
      res.status(403).json({ error: "Access denied. Only Tournament Organizers can create teams." });
      return;
    }

    const resolvedShortName = shortName || name.slice(0, 4).toUpperCase();

    const team = await prisma.team.create({
      data: {
        tournamentId,
        name,
        shortName: resolvedShortName,
        batchId: batchId || null,
        groupId: groupId || null,
        logoUrl: logoUrl || null,
        captainId: captainId || null,
        managerId: managerId || null,
      },
      include: {
        batch: true,
        group: true,
        captain: true,
        manager: { select: { id: true, name: true, studentId: true, avatarUrl: true } },
      }
    });

    // If captainId provided, add captain to team members
    if (captainId) {
      await prisma.teamMember.upsert({
        where: {
          teamId_userId: { teamId: team.id, userId: captainId }
        },
        update: { isCaptain: true },
        create: {
          teamId: team.id,
          userId: captainId,
          isCaptain: true,
        }
      });
    }

    res.status(201).json(team);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create team" });
  }
});

// UPDATE Team (Organizer, Admin, or Team Manager)
teamsRouter.put("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }

    const allowed = await canManageTeam(req.user!.id, req.user!.role, id);
    if (!allowed) {
      res.status(403).json({ error: "Access denied. Only Team Manager, Organizers, or Admin can edit this team." });
      return;
    }

    const parsed = updateTeamSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
      return;
    }

    const { name, shortName, groupId, logoUrl, bannerUrl, captainId, viceCaptainId, managerId } = parsed.data;

    const updated = await prisma.team.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        shortName: shortName !== undefined ? shortName : undefined,
        groupId: groupId !== undefined ? groupId : undefined,
        logoUrl: logoUrl !== undefined ? logoUrl : undefined,
        bannerUrl: bannerUrl !== undefined ? bannerUrl : undefined,
        captainId: captainId !== undefined ? captainId : undefined,
        viceCaptainId: viceCaptainId !== undefined ? viceCaptainId : undefined,
        managerId: managerId !== undefined ? managerId : undefined,
      },
      include: {
        captain: true,
        manager: { select: { id: true, name: true, studentId: true, avatarUrl: true } },
        group: true,
        batch: true,
      }
    });

    // Update isCaptain flag in team members
    if (captainId) {
      // Clear previous captain flags
      await prisma.teamMember.updateMany({
        where: { teamId: id, isCaptain: true },
        data: { isCaptain: false }
      });
      // Set new captain
      await prisma.teamMember.upsert({
        where: { teamId_userId: { teamId: id, userId: captainId } },
        update: { isCaptain: true },
        create: { teamId: id, userId: captainId, isCaptain: true }
      });
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update team" });
  }
});

// DELETE Team (Organizer or Admin)
teamsRouter.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }

    const allowed = await isOrganizerOrAdmin(req.user!.id, req.user!.role, team.tournamentId);
    if (!allowed) {
      res.status(403).json({ error: "Access denied. Only Organizers or Admin can delete teams." });
      return;
    }

    await prisma.team.delete({ where: { id } });
    res.json({ message: `Team ${team.name} deleted successfully.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete team" });
  }
});

// ADD Squad Member to Team
teamsRouter.post("/:id/members", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const teamId = Number(req.params.id);
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }

    const allowed = await canManageTeam(req.user!.id, req.user!.role, teamId);
    if (!allowed) {
      res.status(403).json({ error: "Access denied. Only Team Manager, Organizers, or Admin can add members." });
      return;
    }

    const parsed = addMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
      return;
    }

    const { userId, jerseyNumber, isCaptain, isViceCaptain } = parsed.data;

    const member = await prisma.teamMember.upsert({
      where: {
        teamId_userId: { teamId, userId }
      },
      update: {
        jerseyNumber: jerseyNumber !== undefined ? jerseyNumber : undefined,
        isCaptain: isCaptain !== undefined ? isCaptain : undefined,
        isViceCaptain: isViceCaptain !== undefined ? isViceCaptain : undefined,
        isActiveInSquad: true,
      },
      create: {
        teamId,
        userId,
        jerseyNumber: jerseyNumber || null,
        isCaptain: isCaptain || false,
        isViceCaptain: isViceCaptain || false,
      },
      include: {
        user: {
          select: {
            id: true,
            studentId: true,
            name: true,
            email: true,
            cricketRole: true,
            footballPosition: true,
          }
        }
      }
    });

    res.status(201).json(member);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to add member to team" });
  }
});

// REMOVE Squad Member from Team
teamsRouter.delete("/:id/members/:userId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const teamId = Number(req.params.id);
    const userId = Number(req.params.userId);

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }

    const isOrg = await canManageTeam(req.user!.id, req.user!.role, teamId);
    if (!isOrg) {
      res.status(403).json({ error: "Access denied. Only Team Manager, Organizers, or Admin can remove members." });
      return;
    }

    await prisma.teamMember.delete({
      where: {
        teamId_userId: { teamId, userId }
      }
    });

    res.json({ message: "Player removed from squad." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to remove player from squad" });
  }
});

export default teamsRouter;
