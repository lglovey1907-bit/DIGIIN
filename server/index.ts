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
import fs from 'fs';

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

// Request logging - Enhanced for mobile debugging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  
  console.log(`🌐 ${req.method} ${path} from ${isMobile ? 'MOBILE' : 'DESKTOP'}`);
  
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
    if (isMobile) logLine += ' [MOBILE]';
    if (capturedJsonResponse) {
      logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
    }
    if (logLine.length > 80) {
      logLine = logLine.slice(0, 79) + "…";
    }
    log(logLine);
  });

  next();
});

// Import routes
import './routes.ts';

// Add this route
app.post('/api/generate-inspection-report', generateInspectionReport);

// Photo gallery routes
app.post('/api/upload-gallery', uploadGallery, createPhotoGallery);
app.get('/api/photo-gallery/:galleryId', getPhotoGallery);

// Fix the uploads route
app.use("/uploads", express.static(join(__dirname, "../uploads")));

// Debug static files path
const staticPath = join(__dirname, '../dist/public');
const indexPath = join(staticPath, 'index.html');

console.log('🔍 Debug - Current directory:', __dirname);
console.log('🔍 Debug - Static files path:', staticPath);
console.log('🔍 Debug - Index.html path:', indexPath);
console.log('🔍 Debug - Static directory exists:', fs.existsSync(staticPath));
console.log('🔍 Debug - Index.html exists:', fs.existsSync(indexPath));

if (fs.existsSync(staticPath)) {
  const files = fs.readdirSync(staticPath);
  console.log('🔍 Debug - Files in static directory:', files);
}

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
    console.log('🚧 Running in DEVELOPMENT mode');
    await setupVite(app, server);
  } else {
    console.log('🚀 Running in PRODUCTION mode');
    serveStatic(app);
    
    // Add static file serving with debugging
    app.use(express.static(staticPath, {
      dotfiles: 'ignore',
      index: ['index.html'],
      setHeaders: (res, path) => {
        console.log('📁 Serving static file:', path);
      }
    }));

    // Catch-all route for React Router with debugging
    app.get('*', (req, res) => {
      console.log(`🔄 Catch-all route hit: ${req.path}`);
      
      // Don't interfere with API routes
      if (req.path.startsWith('/api/')) {
        console.log('❌ API route not found:', req.path);
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      
      // Check if index.html exists before serving
      if (fs.existsSync(indexPath)) {
        console.log('✅ Serving index.html for:', req.path);
        res.sendFile(indexPath);
      } else {
        console.log('❌ index.html not found at:', indexPath);
        res.status(404).send('index.html not found');
      }
    });
  }

  // Add this after your API routes but before static file serving
  // Serve service worker with correct MIME type
  app.get('/sw.js', (req, res) => {
    const swPath = join(__dirname, '../dist/public/sw.js');
    
    if (fs.existsSync(swPath)) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Service-Worker-Allowed', '/');
      res.sendFile(swPath);
      console.log('✅ Served sw.js from dist/public');
    } else {
      // Fallback: serve from public folder
      const publicSwPath = join(__dirname, '../public/sw.js');
      if (fs.existsSync(publicSwPath)) {
        res.setHeader('Content-Type', 'application/javascript'); 
        res.setHeader('Service-Worker-Allowed', '/');
        res.sendFile(publicSwPath);
        console.log('✅ Served sw.js from public folder (fallback)');
      } else {
        console.log('❌ sw.js not found in either location');
        res.status(404).send('Service worker not found');
      }
    }
  });

  const port = parseInt(process.env.PORT || "10000", 10);
  server.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`🌍 Environment: ${app.get("env")}`);
  });
})();
