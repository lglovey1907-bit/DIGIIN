import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import * as dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import { generateInspectionReport } from './api/generate-inspection-report';
import { uploadGallery, createPhotoGallery, getPhotoGallery } from './api/photo-gallery';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Trust proxy for session cookies
app.set("trust proxy", 1);

// ✅ Updated CORS configuration
app.use(cors({
  origin: true, // Allow all origins
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

// Handle preflight OPTIONS requests globally
app.options("*", cors());

// Parse JSON & URL encoded
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// Import routes
import './routes.ts'; // or however you import your routes

// Add this route
app.post('/api/generate-inspection-report', generateInspectionReport);

// Photo gallery routes
app.post('/api/upload-gallery', uploadGallery, createPhotoGallery);
app.get('/api/photo-gallery/:galleryId', getPhotoGallery);

// Fix the uploads route
app.use("/uploads", express.static(join(__dirname, "../uploads")));

// Start server
(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
    
    // Add the static file serving and routing INSIDE the async function
    app.use(express.static(join(__dirname, '../dist/public')));

    app.get('*', (req, res) => {
      // Don't interfere with API routes
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      
      // Serve React app for all other routes
      res.sendFile(join(__dirname, '../dist/public/index.html'));
    });
  }

  const port = parseInt(process.env.PORT || "10000", 10);
  server.listen(port, () => {
    log(`Server running on port ${port}`);
  });
})();

// REMOVE EVERYTHING BELOW THIS LINE - it was causing the duplicate server issue
