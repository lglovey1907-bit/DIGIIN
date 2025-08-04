import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("cmi"), // 'admin' or 'cmi'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inspections table
export const inspections = pgTable("inspections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  subject: text("subject").notNull(),
  stationCode: varchar("station_code").notNull(),
  inspectionDate: timestamp("inspection_date").notNull(),
  referenceNo: text("reference_no"),
  area: varchar("area").notNull(), // 'catering', 'sanitation', 'publicity', 'uts_prs', 'parking'
  status: varchar("status").default("draft"), // 'draft', 'submitted', 'completed'
  observations: jsonb("observations").notNull(),
  actionTaken: text("action_taken"),
  inspectors: jsonb("inspectors").notNull(), // Array of {name, designation}
  qrCodeUrl: text("qr_code_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inspection assignments table
export const inspectionAssignments = pgTable("inspection_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cmiId: varchar("cmi_id").notNull(),
  stationCode: varchar("station_code").notNull(),
  area: varchar("area").notNull(),
  assignedBy: varchar("assigned_by").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: varchar("status").default("pending"), // 'pending', 'completed', 'overdue'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shortlisted items table
export const shortlistedItems = pgTable("shortlisted_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sno: integer("sno").notNull(),
  category: varchar("category").notNull(),
  brand: varchar("brand").notNull(),
  item: varchar("item").notNull(),
  flavour: varchar("flavour"),
  quantity: varchar("quantity").notNull(),
  mrp: decimal("mrp", { precision: 10, scale: 2 }).notNull(),
});

// File uploads table
export const fileUploads = pgTable("file_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectionId: varchar("inspection_id"),
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileType: varchar("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedBy: varchar("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertInspectionSchema = createInsertSchema(inspections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  inspectionDate: z.string().transform((str) => new Date(str)),
});

export const insertInspectionAssignmentSchema = createInsertSchema(inspectionAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dueDate: z.string().transform((str) => new Date(str)),
});

export const insertShortlistedItemSchema = createInsertSchema(shortlistedItems).omit({
  id: true,
});

export const insertFileUploadSchema = createInsertSchema(fileUploads).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertInspection = z.infer<typeof insertInspectionSchema>;
export type Inspection = typeof inspections.$inferSelect;
export type InsertInspectionAssignment = z.infer<typeof insertInspectionAssignmentSchema>;
export type InspectionAssignment = typeof inspectionAssignments.$inferSelect;
export type InsertShortlistedItem = z.infer<typeof insertShortlistedItemSchema>;
export type ShortlistedItem = typeof shortlistedItems.$inferSelect;
export type InsertFileUpload = z.infer<typeof insertFileUploadSchema>;
export type FileUpload = typeof fileUploads.$inferSelect;
