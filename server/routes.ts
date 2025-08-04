import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated as replitAuth } from "./replitAuth";
import { setupLocalAuth, isAuthenticated, requireAdmin, requireCMI } from "./auth";
import { 
  insertInspectionSchema, 
  insertInspectionAssignmentSchema, 
  insertShortlistedItemSchema,
  registerUserSchema,
  loginUserSchema,
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import passport from "passport";

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
  // Setup both authentication systems
  await setupAuth(app); // Replit Auth (keep for backward compatibility)
  await setupLocalAuth(app); // Local Auth (new system)

  // Local authentication routes
  app.post('/api/register', async (req, res) => {
    try {
      const validatedData = registerUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      const user = await storage.registerUser(validatedData);
      res.json({ 
        message: user.isApproved ? "Registration successful" : "Registration successful. Waiting for admin approval.",
        user: { id: user.id, email: user.email, name: user.name, role: user.role, isApproved: user.isApproved }
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed", error: error.message });
    }
  });

  app.post('/api/login', (req, res, next) => {
    try {
      const validatedData = loginUserSchema.parse(req.body);
      
      passport.authenticate('local', (err: any, user: any, info: any) => {
        if (err) {
          return res.status(500).json({ message: "Authentication error" });
        }
        
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid credentials" });
        }
        
        req.logIn(user, (err) => {
          if (err) {
            return res.status(500).json({ message: "Login error" });
          }
          
          res.json({
            message: "Login successful",
            user: { 
              id: user.id, 
              email: user.email, 
              name: user.name, 
              role: user.role,
              designation: user.designation,
              stationSection: user.stationSection
            }
          });
        });
      })(req, res, next);
    } catch (error) {
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  app.post('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout error" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Auth routes (supports both systems)
  app.get('/api/auth/user', (req: any, res) => {
    if (req.user) {
      // Local auth user
      if (req.user.role) {
        return res.json({
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role,
          designation: req.user.designation,
          stationSection: req.user.stationSection,
        });
      }
      // Replit auth user (backward compatibility)
      else if (req.user.claims) {
        return res.json({
          id: req.user.claims.sub,
          email: req.user.claims.email,
          name: `${req.user.claims.first_name || ''} ${req.user.claims.last_name || ''}`.trim(),
          role: 'admin', // Default role for Replit auth users
        });
      }
    }
    res.status(401).json({ message: "Unauthorized" });
  });

  // Admin routes for user management
  app.get('/api/admin/pending-users', requireAdmin, async (req, res) => {
    try {
      const pendingUsers = await storage.getAllPendingUsers();
      res.json(pendingUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        designation: user.designation,
        stationSection: user.stationSection,
        role: user.role,
        createdAt: user.createdAt,
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  app.post('/api/admin/approve-user/:id', requireAdmin, async (req: any, res) => {
    try {
      const user = await storage.approveUser(req.params.id, req.user.id);
      res.json({ message: "User approved successfully", user });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  app.get('/api/admin/cmis', requireAdmin, async (req, res) => {
    try {
      const cmis = await storage.getAllCMIs();
      res.json(cmis.map(cmi => ({
        id: cmi.id,
        name: cmi.name,
        email: cmi.email,
        designation: cmi.designation,
        stationSection: cmi.stationSection,
        createdAt: cmi.createdAt,
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch CMIs" });
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

  // PDF Export route
  app.get('/api/inspections/:id/export-pdf', isAuthenticated, async (req: any, res) => {
    try {
      const inspection = await storage.getInspection(req.params.id);
      if (!inspection) {
        return res.status(404).json({ message: "Inspection not found" });
      }

      const user = await storage.getUser(inspection.userId);
      
      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="inspection-${inspection.id}.pdf"`);
      
      // Pipe the PDF to response
      doc.pipe(res);
      
      // Northern Railway Header
      doc.fontSize(20).text('Northern Railway', { align: 'center' });
      doc.fontSize(16).text('Delhi Division Digital Inspection Report', { align: 'center' });
      doc.moveDown(2);
      
      // Inspection Details
      doc.fontSize(14).text('INSPECTION DETAILS', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Inspection ID: ${inspection.id}`);
      doc.text(`Station: ${inspection.stationCode}`);
      doc.text(`Area: ${inspection.area.toUpperCase()}`);
      doc.text(`Date: ${inspection.createdAt ? new Date(inspection.createdAt).toLocaleDateString('en-IN') : 'N/A'}`);
      doc.text(`Time: ${inspection.createdAt ? new Date(inspection.createdAt).toLocaleTimeString('en-IN') : 'N/A'}`);
      doc.text(`Inspector: ${user?.firstName || ''} ${user?.lastName || ''} (${user?.email || ''})`);
      doc.text(`Status: ${inspection.status ? inspection.status.toUpperCase() : 'N/A'}`);
      doc.moveDown(1);
      
      // Observations
      if (inspection.observations && typeof inspection.observations === 'object') {
        doc.fontSize(14).text('OBSERVATIONS', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        
        const observations = inspection.observations as any;
        let observationCount = 1;
        
        Object.entries(observations).forEach(([key, value]) => {
          if (key !== 'summary' && value) {
            doc.text(`${observationCount}. ${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}`);
            observationCount++;
          }
        });
        
        if (observations.summary) {
          doc.moveDown(0.5);
          doc.text(`Summary: ${observations.summary}`);
        }
        
        doc.moveDown(1);
      }
      
      // Footer
      doc.fontSize(10);
      doc.text('This is a computer-generated report from the Northern Railway Delhi Division Digital Inspection Platform.', 
        { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
      
      // Add page numbers
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < (range.start + range.count); i++) {
        doc.switchToPage(i);
        doc.text(`Page ${i + 1} of ${range.count}`, 
          doc.page.width - 100, doc.page.height - 50, { align: 'right' });
      }
      
      doc.end();
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  const httpServer = createServer(app);
  return httpServer;
}
