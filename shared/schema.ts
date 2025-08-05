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
  primaryKey,
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

// User storage table with local authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"), // Hashed password (nullable for migration)
  name: varchar("name"), // Nullable for migration
  designation: varchar("designation"), // Nullable for migration
  stationSection: varchar("station_section"), // Nullable for migration
  role: varchar("role").default("cmi"), // 'admin' or 'cmi'
  isApproved: boolean("is_approved").default(false),
  approvedBy: varchar("approved_by"),
  profileImageUrl: varchar("profile_image_url"),
  // Keep for backward compatibility with Replit Auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
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

// Permissions table
export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resource: varchar("resource").notNull(), // e.g., 'inspections', 'users', 'reports'
  action: varchar("action").notNull(), // e.g., 'create', 'view', 'edit', 'delete'
  description: text("description").notNull(),
  category: varchar("category").notNull(), // e.g., 'Inspection Management', 'User Management'
  createdAt: timestamp("created_at").defaultNow(),
});

// User Permissions junction table
export const userPermissions = pgTable("user_permissions", {
  userId: varchar("user_id").notNull(),
  permissionId: varchar("permission_id").notNull(),
  granted: boolean("granted").default(true),
  grantedBy: varchar("granted_by").notNull(),
  grantedAt: timestamp("granted_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.permissionId] })
}));

// Permission schemas
export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
});
export const insertUserPermissionSchema = createInsertSchema(userPermissions);

// Authentication schemas
export const registerUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  designation: z.string().min(2, "Designation is required"),
  stationSection: z.string().min(2, "Station/Section is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "cmi"]),
});

export const loginUserSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type InsertInspection = z.infer<typeof insertInspectionSchema>;
export type Inspection = typeof inspections.$inferSelect;
export type InsertInspectionAssignment = z.infer<typeof insertInspectionAssignmentSchema>;
export type InspectionAssignment = typeof inspectionAssignments.$inferSelect;
export type InsertShortlistedItem = z.infer<typeof insertShortlistedItemSchema>;
export type ShortlistedItem = typeof shortlistedItems.$inferSelect;
export type InsertFileUpload = z.infer<typeof insertFileUploadSchema>;
export type FileUpload = typeof fileUploads.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissions.$inferSelect;
export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;
export type UserPermission = typeof userPermissions.$inferSelect;
