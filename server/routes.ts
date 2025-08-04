import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertInspectionSchema, insertInspectionAssignmentSchema, insertShortlistedItemSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Inspection routes
  app.post('/api/inspections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertInspectionSchema.parse({
        ...req.body,
        userId,
      });
      
      const inspection = await storage.createInspection(validatedData);
      res.json(inspection);
    } catch (error) {
      console.error("Error creating inspection:", error);
      res.status(500).json({ message: "Failed to create inspection" });
    }
  });

  app.get('/api/inspections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      let inspections;
      if (user?.role === 'admin') {
        inspections = await storage.getAllInspections();
      } else {
        inspections = await storage.getUserInspections(userId);
      }
      
      res.json(inspections);
    } catch (error) {
      console.error("Error fetching inspections:", error);
      res.status(500).json({ message: "Failed to fetch inspections" });
    }
  });

  app.get('/api/inspections/:id', isAuthenticated, async (req: any, res) => {
    try {
      const inspection = await storage.getInspection(req.params.id);
      if (!inspection) {
        return res.status(404).json({ message: "Inspection not found" });
      }
      
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user has permission to view this inspection
      if (user?.role !== 'admin' && inspection.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(inspection);
    } catch (error) {
      console.error("Error fetching inspection:", error);
      res.status(500).json({ message: "Failed to fetch inspection" });
    }
  });

  app.put('/api/inspections/:id', isAuthenticated, async (req: any, res) => {
    try {
      const inspection = await storage.getInspection(req.params.id);
      if (!inspection) {
        return res.status(404).json({ message: "Inspection not found" });
      }
      
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user has permission to update this inspection
      if (user?.role !== 'admin' && inspection.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updates = insertInspectionSchema.partial().parse(req.body);
      const updated = await storage.updateInspection(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      console.error("Error updating inspection:", error);
      res.status(500).json({ message: "Failed to update inspection" });
    }
  });

  // Assignment routes (admin only)
  app.post('/api/assignments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const validatedData = insertInspectionAssignmentSchema.parse({
        ...req.body,
        assignedBy: userId,
      });
      
      const assignment = await storage.createInspectionAssignment(validatedData);
      res.json(assignment);
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  app.get('/api/assignments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      let assignments;
      if (user?.role === 'admin') {
        assignments = await storage.getInspectionAssignments();
      } else {
        assignments = await storage.getInspectionAssignments(userId);
      }
      
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  // Shortlisted items routes
  app.get('/api/shortlisted-items/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      const items = await storage.searchShortlistedItems(query);
      res.json(items);
    } catch (error) {
      console.error("Error searching items:", error);
      res.status(500).json({ message: "Failed to search items" });
    }
  });

  app.get('/api/shortlisted-items', async (req, res) => {
    try {
      const items = await storage.getAllShortlistedItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.post('/api/shortlisted-items', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const validatedData = insertShortlistedItemSchema.parse(req.body);
      const item = await storage.createShortlistedItem(validatedData);
      res.json(item);
    } catch (error) {
      console.error("Error creating item:", error);
      res.status(500).json({ message: "Failed to create item" });
    }
  });

  // File upload routes
  app.post('/api/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const userId = req.user.claims.sub;
      const fileUpload = await storage.createFileUpload({
        inspectionId: req.body.inspectionId || null,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedBy: userId,
      });
      
      res.json(fileUpload);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.get('/api/inspections/:id/files', isAuthenticated, async (req: any, res) => {
    try {
      const files = await storage.getInspectionFiles(req.params.id);
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  const httpServer = createServer(app);
  return httpServer;
}
