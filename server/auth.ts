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
    saveUninitialized: true, // Allow session creation for anonymous users
    name: 'sessionId',
    cookie: {
      httpOnly: false, // Allow client-side access for debugging
      secure: false, // false for development
      maxAge: sessionTtl,
      sameSite: 'none', // Allow cross-origin cookies
      path: '/',
      domain: undefined // Let browser handle domain automatically
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

// Authentication middleware
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Role-based middleware
export const requireAdmin: RequestHandler = (req: any, res, next) => {
  if (req.isAuthenticated() && req.user?.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: "Admin access required" });
};

export const requireCMI: RequestHandler = (req: any, res, next) => {
  if (req.isAuthenticated() && (req.user?.role === 'cmi' || req.user?.role === 'admin')) {
    return next();
  }
  res.status(403).json({ message: "CMI access required" });
};