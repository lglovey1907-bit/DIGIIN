import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Configure session
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || 'railway-inspection-secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',
    cookie: {
      httpOnly: true,
      secure: false, // false for development
      maxAge: sessionTtl,
      sameSite: 'lax', // More permissive for localhost
      path: '/'
      // No domain specified for localhost compatibility
    },
  });
}

// Setup local authentication
export async function setupLocalAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for email/password authentication
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email: string, password: string, done) => {
      try {
        const user = await storage.authenticateUser(email, password);
        if (user) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Invalid credentials or account not approved' });
        }
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

// Authentication middleware with hybrid support
export const isAuthenticated = async (req: any, res: any, next: any) => {
  // First try session-based auth
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  
  // Try token-based auth as fallback
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [userId] = decoded.split(':');
      
      const { storage } = await import('./storage');
      const user = await storage.getUser(userId);
      if (user && user.isApproved) {
        req.user = user; // Set user for downstream middleware
        return next();
      }
    } catch (error) {
      console.log('Token decode error:', error);
    }
  }
  
  res.status(401).json({ message: "Unauthorized" });
};

// Role-based middleware with hybrid support
export const requireAdmin = async (req: any, res: any, next: any) => {
  // Check if user is already authenticated and is admin
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  
  // If not authenticated yet, try token-based auth
  if (!req.user) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = Buffer.from(token, 'base64').toString();
        const [userId] = decoded.split(':');
        
        const { storage } = await import('./storage');
        const user = await storage.getUser(userId);
        if (user && user.isApproved && user.role === 'admin') {
          req.user = user;
          return next();
        }
      } catch (error) {
        console.log('Token decode error:', error);
      }
    }
  }
  
  res.status(403).json({ message: "Admin access required" });
};

export const requireCMI: RequestHandler = (req: any, res, next) => {
  if (req.isAuthenticated() && (req.user?.role === 'cmi' || req.user?.role === 'admin')) {
    return next();
  }
  res.status(403).json({ message: "CMI access required" });
};