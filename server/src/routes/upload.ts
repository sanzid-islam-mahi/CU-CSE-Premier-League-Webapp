import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { requireAuth } from "../middleware/auth.js";

const uploadRouter = Router();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer Disk Storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    const randomHex = crypto.randomBytes(6).toString("hex");
    const safeName = `${Date.now()}-${randomHex}${ext}`;
    cb(null, safeName);
  },
});

// Filter allowed image types
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ];
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, PNG, WEBP, GIF, SVG) are permitted."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

// POST /api/upload - Single image upload
uploadRouter.post(
  "/",
  requireAuth,
  upload.single("file"),
  (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No image file provided." });
        return;
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      res.status(201).json({
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to upload file." });
    }
  }
);

// POST /api/upload/multiple - Multiple images upload (up to 10)
uploadRouter.post(
  "/multiple",
  requireAuth,
  upload.array("files", 10),
  (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ error: "No image files provided." });
        return;
      }

      const uploaded = files.map((f) => ({
        url: `/uploads/${f.filename}`,
        filename: f.filename,
        originalName: f.originalname,
        mimeType: f.mimetype,
        size: f.size,
      }));

      res.status(201).json({
        count: uploaded.length,
        files: uploaded,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to upload files." });
    }
  }
);

export default uploadRouter;
