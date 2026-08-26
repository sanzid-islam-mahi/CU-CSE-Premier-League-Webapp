import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { hashPassword, comparePassword, signToken } from "../lib/auth.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

const authRouter = Router();

const loginSchema = z.object({
  identifier: z.string().min(1, "Roll number or email is required"),
  password: z.string().min(1, "Password is required"),
});

const adminLoginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

// Regular Student / Player Login (by Roll or Email)
authRouter.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
      return;
    }

    const { identifier, password } = parsed.data;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { studentId: identifier },
          { email: identifier.toLowerCase() }
        ]
      },
      include: {
        batch: true,
      }
    });

    if (!user) {
      res.status(401).json({ error: "Invalid Student ID / Email or Password." });
      return;
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid Student ID / Email or Password." });
      return;
    }

    const token = signToken({
      userId: user.id,
      studentId: user.studentId,
      email: user.email,
      role: user.role,
      isTemporaryPassword: user.isTemporaryPassword,
    });

    res.json({
      token,
      user: {
        id: user.id,
        studentId: user.studentId,
        name: user.name,
        email: user.email,
        role: user.role,
        isTemporaryPassword: user.isTemporaryPassword,
        batch: user.batch,
        cricketRole: user.cricketRole,
        footballPosition: user.footballPosition,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Admin Dedicated Login
authRouter.post("/admin-login", async (req, res) => {
  try {
    const parsed = adminLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid credentials format" });
      return;
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        batch: true,
      }
    });

    if (!user || user.role !== "ADMIN") {
      res.status(401).json({ error: "Invalid Administrator credentials or unauthorized role." });
      return;
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid Administrator credentials." });
      return;
    }

    const token = signToken({
      userId: user.id,
      studentId: user.studentId,
      email: user.email,
      role: user.role,
      isTemporaryPassword: user.isTemporaryPassword,
    });

    res.json({
      token,
      user: {
        id: user.id,
        studentId: user.studentId,
        name: user.name,
        email: user.email,
        role: user.role,
        isTemporaryPassword: user.isTemporaryPassword,
        batch: user.batch,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Current User Profile & Permissions
authRouter.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        batch: true,
        organizerTournaments: {
          include: {
            tournament: {
              select: { id: true, name: true, slug: true, sport: true, status: true }
            }
          }
        },
        captainTeams: {
          select: { id: true, name: true, tournamentId: true }
        },
        scoredMatches: {
          select: { matchId: true }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      studentId: user.studentId,
      name: user.name,
      email: user.email,
      role: user.role,
      isTemporaryPassword: user.isTemporaryPassword,
      batch: user.batch,
      phone: user.phone,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      cricketRole: user.cricketRole,
      battingStyle: user.battingStyle,
      bowlingStyle: user.bowlingStyle,
      footballPosition: user.footballPosition,
      preferredJerseyNo: user.preferredJerseyNo,
      organizerTournaments: user.organizerTournaments.map(ot => ot.tournament),
      captainTeams: user.captainTeams,
      scoredMatchIds: user.scoredMatches.map(sm => sm.matchId),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Please provide a valid email").optional(),
  phone: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  cricketRole: z.string().optional().nullable(),
  battingStyle: z.string().optional().nullable(),
  bowlingStyle: z.string().optional().nullable(),
  footballPosition: z.string().optional().nullable(),
  preferredJerseyNo: z.number().int().optional().nullable(),
});

// Update Profile
authRouter.put("/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid profile input" });
      return;
    }

    const {
      name,
      email,
      phone,
      bio,
      avatarUrl,
      cricketRole,
      battingStyle,
      bowlingStyle,
      footballPosition,
      preferredJerseyNo,
    } = parsed.data;

    // Validate email uniqueness if changing email
    if (email && email.toLowerCase().trim() !== req.user!.email.toLowerCase()) {
      const targetEmail = email.toLowerCase().trim();
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: targetEmail,
          NOT: { id: req.user!.id }
        }
      });
      if (existingEmail) {
        res.status(400).json({ error: `The email ${email} is already registered by another student or admin.` });
        return;
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        name: name !== undefined ? name : undefined,
        email: email !== undefined ? email.toLowerCase().trim() : undefined,
        phone: phone !== undefined ? phone : undefined,
        bio: bio !== undefined ? bio : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
        cricketRole: cricketRole !== undefined ? cricketRole : undefined,
        battingStyle: battingStyle !== undefined ? battingStyle : undefined,
        bowlingStyle: bowlingStyle !== undefined ? bowlingStyle : undefined,
        footballPosition: footballPosition !== undefined ? footballPosition : undefined,
        preferredJerseyNo: preferredJerseyNo !== undefined ? preferredJerseyNo : undefined,
      },
      include: {
        batch: true,
      }
    });

    res.json({
      message: "Profile updated successfully.",
      user: {
        id: updated.id,
        studentId: updated.studentId,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        isTemporaryPassword: updated.isTemporaryPassword,
        batch: updated.batch,
        phone: updated.phone,
        bio: updated.bio,
        avatarUrl: updated.avatarUrl,
        cricketRole: updated.cricketRole,
        battingStyle: updated.battingStyle,
        bowlingStyle: updated.bowlingStyle,
        footballPosition: updated.footballPosition,
        preferredJerseyNo: updated.preferredJerseyNo,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update profile" });
  }
});

// Change Password (Used for first-time reset of temporary passwords or general update)
authRouter.post("/change-password", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
      return;
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ error: "Current password does not match." });
      return;
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        isTemporaryPassword: false, // Mark temporary pass as resolved!
        temporaryPlainPassword: null, // Clear plain temporary password
      },
    });

    res.json({ message: "Password updated successfully. Account unlocked." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default authRouter;

