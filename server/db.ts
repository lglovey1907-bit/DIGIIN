import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

console.log("Connecting to database...");

// Use postgres-js instead of Neon serverless
const client = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 1
});

export const db = drizzle(client, { schema });