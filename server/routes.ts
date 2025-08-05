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
  type User,
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import passport from "passport";
import { generateReportLayoutSuggestions, analyzeInspectionTrends } from "./aiService";
import { convertInspectionToDocument, generateDocumentText, generateRTFDocument } from "./documentConverter";

// Extend Express types
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
    interface Session {
      userId?: string;
    }
  }
}

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
  // Setup local authentication only (disable Replit Auth to avoid conflicts)
  await setupLocalAuth(app); // Local Auth (primary system)

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

  // Debug session endpoint
  app.get('/api/debug/session', (req, res) => {
    const session = req.session as any;
    console.log('Session debug:', {
      sessionID: req.sessionID,
      session: req.session,
      cookies: req.headers.cookie,
      isAuthenticated: !!session.userId
    });
    res.json({
      sessionID: req.sessionID,
      hasSession: !!req.session,
      userId: session.userId,
      cookies: req.headers.cookie,
      isAuthenticated: !!session.userId
    });
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
          
          // Set session userId for compatibility
          (req.session as any).userId = user.id;
          
          // Generate a simple token for client-side storage
          const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
          
          res.json({
            message: "Login successful",
            token: token, // Send token to client
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
      // Clear session userId
      (req.session as any).userId = undefined;
      // Clear session completely
      req.session.destroy((err) => {
        if (err) {
          console.log('Session destroy error:', err);
        }
      });
      res.json({ message: "Logout successful" });
    });
  });

  // Auth routes (local auth only)
  app.get('/api/auth/user', async (req: any, res) => {
    console.log('Auth check - Session ID:', req.sessionID);
    console.log('Auth check - Cookies:', req.headers.cookie);
    console.log('Auth check - Authorization Header:', req.headers.authorization);
    console.log('Auth check - Is Authenticated:', req.isAuthenticated());
    console.log('Auth check - User:', req.user);
    console.log('Auth check - Session:', req.session);
    
    // First try session-based auth
    if (req.isAuthenticated() && req.user) {
      return res.json({
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        designation: req.user.designation,
        stationSection: req.user.stationSection,
      });
    }
    
    // Try token-based auth as fallback
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = Buffer.from(token, 'base64').toString();
        const [userId] = decoded.split(':');
        
        const user = await storage.getUser(userId);
        if (user && user.isApproved) {
          return res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            designation: user.designation,
            stationSection: user.stationSection,
          });
        }
      } catch (error) {
        console.log('Token decode error:', error);
      }
    }
    
    res.status(401).json({ message: "Unauthorized" });
  });

  // Admin routes for user management
  app.get('/api/admin/pending-users', isAuthenticated, requireAdmin, async (req, res) => {
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

  app.post('/api/admin/approve-user/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const user = await storage.approveUser(req.params.id, req.user.id);
      res.json({ message: "User approved successfully", user });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  app.get('/api/admin/cmis', isAuthenticated, requireAdmin, async (req, res) => {
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
      const userId = req.user.id;
      
      // Transform multi-area data to the database format
      const inspectionData = {
        ...req.body,
        userId,
        // Convert inspectionAreas to observations and primary area
        area: req.body.inspectionAreas?.[0]?.type || 'catering', // Use first area as primary
        observations: req.body.inspectionAreas?.reduce((acc: any, area: any) => {
          acc[area.type] = {
            ...area.observations,
            actionTaken: area.actionTaken
          };
          return acc;
        }, {}) || {},
        // Remove the inspectionAreas field as it's transformed
        inspectionAreas: undefined
      };
      
      const validatedData = insertInspectionSchema.parse(inspectionData);
      
      const inspection = await storage.createInspection(validatedData);
      res.json(inspection);
    } catch (error) {
      console.error("Error creating inspection:", error);
      res.status(500).json({ message: "Failed to create inspection" });
    }
  });

  app.get('/api/inspections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  // Refresh old reports endpoint
  app.post("/api/inspections/refresh", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      let allInspections;
      if (user?.role === 'admin') {
        allInspections = await storage.getAllInspections();
      } else {
        allInspections = await storage.getUserInspections(userId);
      }
      
      let refreshedCount = 0;

      for (const inspection of allInspections) {
        // Check if inspection has old format observations (not nested under area)
        const obs = inspection.observations as any;
        if (obs && !obs.catering && !obs.sanitation && !obs.parking && !obs.publicity && !obs.uts_prs) {
          console.log(`Refreshing inspection ${inspection.id} with old format`);
          
          // Convert old format to new format
          const newObservations: any = {};
          
          if (inspection.area === 'catering') {
            // Convert old catering format to new format
            if (obs.companyName || obs.vendorName || typeof obs === 'object') {
              newObservations.catering = {
                companies: [{
                  companyName: obs.companyName || 'M/s Company',
                  unitType: obs.unitType || 'SMU',
                  platformNo: obs.platformNo || '1',
                  vendorName: obs.vendorName || 'Vendor Name',
                  properUniform: obs.properUniform !== false,
                  medicalCard: obs.medicalCard !== false,
                  policeVerification: obs.policeVerification !== false,
                  foodLicense: obs.foodLicense || 'available',
                  rateListDisplay: obs.rateListDisplay || 'properly_displayed',
                  billMachine: obs.billMachine || 'available_working',
                  digitalPayment: obs.digitalPayment || 'not_accepting',
                  overchargingItems: obs.overchargingItems || [],
                  unapprovedItems: obs.unapprovedItems || []
                }],
                actionTaken: inspection.actionTaken || obs.actionTaken || 'COS Ctg'
              };
            }
          } else {
            // For other areas, wrap in area-specific structure
            newObservations[inspection.area] = {
              ...obs,
              actionTaken: inspection.actionTaken || obs.actionTaken || 'Action taken'
            };
          }

          // Update the inspection with new format
          await storage.updateInspection(inspection.id, {
            observations: newObservations
          });
          
          refreshedCount++;
        }
      }

      res.json({ 
        message: `Successfully refreshed ${refreshedCount} inspection reports with updated format`,
        refreshedCount 
      });
    } catch (error) {
      console.error("Error refreshing inspections:", error);
      res.status(500).json({ error: "Failed to refresh inspections" });
    }
  });

  app.get('/api/inspections/:id', isAuthenticated, async (req: any, res) => {
    try {
      const inspection = await storage.getInspection(req.params.id);
      if (!inspection) {
        return res.status(404).json({ message: "Inspection not found" });
      }
      
      const userId = req.user.id;
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
      
      const userId = req.user.id;
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

  // AI-powered layout suggestions routes
  app.post('/api/inspections/:id/ai-suggestions', isAuthenticated, async (req: any, res) => {
    try {
      const inspection = await storage.getInspection(req.params.id);
      if (!inspection) {
        return res.status(404).json({ message: "Inspection not found" });
      }
      
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Check if user has permission to view this inspection
      if (user?.role !== 'admin' && inspection.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const suggestions = await generateReportLayoutSuggestions({
        area: inspection.area,
        observations: inspection.observations,
        stationCode: inspection.stationCode,
        inspectionDate: inspection.inspectionDate.toISOString(),
        status: inspection.status || 'draft',
        subject: inspection.subject
      });
      
      res.json(suggestions);
    } catch (error) {
      console.error("Error generating AI suggestions:", error);
      res.status(500).json({ message: "Failed to generate suggestions" });
    }
  });

  app.post('/api/inspections/ai-trends', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      let inspections;
      if (user?.role === 'admin') {
        inspections = await storage.getAllInspections();
      } else {
        inspections = await storage.getUserInspections(userId);
      }
      
      const trends = await analyzeInspectionTrends(inspections);
      res.json(trends);
    } catch (error) {
      console.error("Error analyzing trends:", error);
      res.status(500).json({ message: "Failed to analyze trends" });
    }
  });

  // PDF to DOC conversion route
  app.post('/api/inspections/:id/convert-to-doc', async (req: any, res) => {
    try {
      const inspection = await storage.getInspection(req.params.id);
      if (!inspection) {
        return res.status(404).json({ message: "Inspection not found" });
      }
      
      // Get user from session or token
      let userId;
      if (req.session?.passport?.user) {
        userId = req.session.passport.user;
      } else if (req.headers.authorization) {
        const token = req.headers.authorization.replace('Bearer ', '');
        try {
          const decoded = Buffer.from(token, 'base64').toString('utf-8');
          const [id] = decoded.split(':');
          userId = id;
        } catch (error) {
          return res.status(401).json({ message: "Invalid token" });
        }
      } else {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Check if user has permission to view this inspection
      if (user.role !== 'admin' && inspection.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      console.log("Starting document conversion for inspection:", inspection.id);
      
      const convertedDocument = await convertInspectionToDocument({
        id: inspection.id,
        subject: inspection.subject || 'Railway Inspection',
        stationCode: inspection.stationCode || 'UNKNOWN',
        area: inspection.area || 'General',
        inspectionDate: inspection.inspectionDate ? inspection.inspectionDate.toISOString() : new Date().toISOString(),
        observations: inspection.observations || {},
        letterReference: req.body.letterReference || `Ref: (i) Letter No.23AC/Decoy Checks dated ${new Date().toLocaleDateString('en-GB')}.`
      });
      
      console.log("Document conversion completed, generating text...");
      const documentText = await generateDocumentText(convertedDocument);
      console.log("Document text generated, length:", documentText.length);
      
      // Enhanced Microsoft Office compatibility headers for latest Word versions
      res.setHeader('Content-Type', 'application/msword');
      res.setHeader('Content-Disposition', `attachment; filename="Inspection_Report_${inspection.stationCode}_${new Date(inspection.inspectionDate).toISOString().split('T')[0]}.doc"`);
      res.setHeader('Content-Transfer-Encoding', 'binary');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Generate RTF format for better Microsoft Office compatibility
      const rtfDocument = generateRTFDocument(documentText);
      res.send(rtfDocument);
    } catch (error) {
      console.error("Error converting inspection to DOC:", error);
      res.status(500).json({ message: "Failed to convert inspection to DOC format" });
    }
  });

  // Assignment routes (admin only)
  app.post('/api/assignments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      
      const userId = req.user.id;
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
          // Exclude shortlisted items search data from PDF report (it's just a reference tool)
          // Also exclude summary as it's handled separately
          if (key !== 'summary' && key !== 'shortlistedItemsSearch' && value) {
            // Handle multiple companies in catering inspections
            if (key === 'companies' && Array.isArray(value)) {
              value.forEach((company: any, companyIndex: number) => {
                doc.text(`${observationCount}. Company ${companyIndex + 1}:`);
                observationCount++;
                
                // Add company details
                if (company.vendorName) doc.text(`   - Vendor Name: ${company.vendorName}`);
                if (company.uniformCheck) doc.text(`   - Uniform Check: ${company.uniformCheck}`);
                if (company.foodLicense) doc.text(`   - Food License: ${company.foodLicense}`);
                if (company.rateList) doc.text(`   - Rate List: ${company.rateList}`);
                if (company.billingMachine) doc.text(`   - Billing Machine: ${company.billingMachine}`);
                if (company.digitalPayment) doc.text(`   - Digital Payment: ${company.digitalPayment}`);
                
                // Include unapproved items (but not shortlisted items search)
                if (company.unapprovedItems && company.unapprovedItems.length > 0) {
                  const nonEmptyItems = company.unapprovedItems.filter((item: string) => item.trim());
                  if (nonEmptyItems.length > 0) {
                    doc.text(`   - Unapproved Items Found: ${nonEmptyItems.join(', ')}`);
                  }
                }
                
                // Include overcharging items
                if (company.overchargingItems && company.overchargingItems.length > 0) {
                  const validItems = company.overchargingItems.filter((item: any) => item.name.trim());
                  if (validItems.length > 0) {
                    doc.text(`   - Overcharging Items:`);
                    validItems.forEach((item: any) => {
                      doc.text(`     * ${item.name}: MRP ₹${item.mrpPrice}, Selling ₹${item.sellingPrice}`);
                    });
                  }
                }
                doc.moveDown(0.3);
              });
            } else {
              doc.text(`${observationCount}. ${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}`);
              observationCount++;
            }
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

  // Generate custom report
  app.post('/api/reports/generate', isAuthenticated, async (req: any, res) => {
    try {
      const { 
        title, 
        dateRange, 
        stations, 
        inspectionTypes, 
        includeCharts,
        chartTypes,
        includeSummary,
        includePhotos,
        includeRecommendations,
        format,
        template 
      } = req.body;

      // Get filtered inspections based on criteria
      let inspections = await storage.getAllInspections();
      
      // Filter by date range
      if (dateRange.start && dateRange.end) {
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        inspections = inspections.filter(inspection => {
          const inspectionDate = new Date(inspection.inspectionDate);
          return inspectionDate >= startDate && inspectionDate <= endDate;
        });
      }

      // Filter by stations
      if (stations.length > 0) {
        inspections = inspections.filter(inspection => 
          stations.includes(inspection.stationCode)
        );
      }

      // Filter by inspection types (if applicable)
      if (inspectionTypes.length > 0) {
        inspections = inspections.filter(inspection => {
          if (!inspection.observations) return false;
          const inspectionAreas = Object.keys(inspection.observations);
          return inspectionTypes.some((type: string) => inspectionAreas.includes(type));
        });
      }

      const reportData = {
        title,
        dateRange,
        inspections,
        stations,
        inspectionTypes,
        options: {
          includeCharts,
          chartTypes,
          includeSummary,
          includePhotos,
          includeRecommendations,
          template
        }
      };

      if (format === 'pdf' || format === 'both') {
        const { ReportGenerator } = await import('./reportGenerator');
        const reportGenerator = new ReportGenerator();
        const pdfBuffer = await reportGenerator.generateReport(reportData);
        
        if (format === 'pdf') {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);
          return res.send(pdfBuffer);
        }
      }

      if (format === 'excel' || format === 'both') {
        // Excel generation would go here
        // For now, return JSON data
        res.json({ 
          message: 'Excel format not yet implemented',
          data: reportData,
          recordCount: inspections.length
        });
      }

      if (format === 'both') {
        // Return both formats (implementation needed)
        res.json({ 
          message: 'Both formats requested',
          pdfGenerated: true,
          excelGenerated: false
        });
      }

    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  // Assignment routes (mock data for now)
  app.get('/api/assignments', isAuthenticated, async (req: any, res) => {
    // Return mock assignments for demo purposes
    const assignments = [
      {
        id: '1',
        cmiId: req.user?.id,
        stationCode: 'NDLS',
        area: 'Catering',
        dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        cmiId: req.user?.id,
        stationCode: 'DLI',
        area: 'Sanitation',
        dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday (overdue)
        status: 'overdue',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: '3',
        cmiId: req.user?.id,
        stationCode: 'TKJ',
        area: 'UTS/PRS',
        dueDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
    ];
    res.json(assignments);
  });

  // Permission management routes
  app.get('/api/admin/permission-matrix', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const matrixData = await storage.getPermissionMatrix();
      res.json(matrixData);
    } catch (error) {
      console.error("Error fetching permission matrix:", error);
      res.status(500).json({ message: "Failed to fetch permission matrix" });
    }
  });

  app.post('/api/admin/initialize-permissions', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { permissions: permissionData } = req.body;
      const createdPermissions = [];
      
      for (const permissionInfo of permissionData) {
        const created = await storage.createPermission(permissionInfo);
        createdPermissions.push(created);
      }
      
      res.json({ 
        message: "Permissions initialized successfully", 
        permissions: createdPermissions 
      });
    } catch (error) {
      console.error("Error initializing permissions:", error);
      res.status(500).json({ message: "Failed to initialize permissions" });
    }
  });

  app.post('/api/admin/permissions/:userId/:permissionId', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { userId, permissionId } = req.params;
      const grantedBy = req.user.id;
      
      const userPermission = await storage.createUserPermission({
        userId,
        permissionId,
        granted: true,
        grantedBy
      });
      
      res.json({ message: "Permission granted successfully", userPermission });
    } catch (error) {
      console.error("Error granting permission:", error);
      res.status(500).json({ message: "Failed to grant permission" });
    }
  });

  app.delete('/api/admin/permissions/:userId/:permissionId', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { userId, permissionId } = req.params;
      
      await storage.removeUserPermission(userId, permissionId);
      
      res.json({ message: "Permission revoked successfully" });
    } catch (error) {
      console.error("Error revoking permission:", error);
      res.status(500).json({ message: "Failed to revoke permission" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
