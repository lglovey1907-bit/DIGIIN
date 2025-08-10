import { neonConfig, Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";
import * as dotenv from "dotenv";

dotenv.config(); // Load .env file

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Configure Neon WebSocket
neonConfig.webSocketConstructor = ws;

// Use Neon’s Pool for serverless connection
const pool = new NeonPool({ connectionString: process.env.DATABASE_URL });

// Initialize Drizzle ORM
export const db = drizzle({ client: pool, schema });
