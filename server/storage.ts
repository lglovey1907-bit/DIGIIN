import {
  users,
  inspections,
  inspectionAssignments,
  shortlistedItems,
  fileUploads,
  type User,
  type UpsertUser,
  type Inspection,
  type InsertInspection,
  type InspectionAssignment,
  type InsertInspectionAssignment,
  type ShortlistedItem,
  type InsertShortlistedItem,
  type FileUpload,
  type InsertFileUpload,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, like, or, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Inspection operations
  createInspection(inspection: InsertInspection): Promise<Inspection>;
  getInspection(id: string): Promise<Inspection | undefined>;
  updateInspection(id: string, updates: Partial<InsertInspection>): Promise<Inspection>;
  getUserInspections(userId: string): Promise<Inspection[]>;
  getAllInspections(): Promise<Inspection[]>;
  
  // Assignment operations
  createInspectionAssignment(assignment: InsertInspectionAssignment): Promise<InspectionAssignment>;
  getInspectionAssignments(cmiId?: string): Promise<InspectionAssignment[]>;
  updateAssignmentStatus(id: string, status: string): Promise<InspectionAssignment>;
  
  // Shortlisted items operations
  createShortlistedItem(item: InsertShortlistedItem): Promise<ShortlistedItem>;
  searchShortlistedItems(query: string): Promise<ShortlistedItem[]>;
  getAllShortlistedItems(): Promise<ShortlistedItem[]>;
  
  // File upload operations
  createFileUpload(file: InsertFileUpload): Promise<FileUpload>;
  getInspectionFiles(inspectionId: string): Promise<FileUpload[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Inspection operations
  async createInspection(inspection: InsertInspection): Promise<Inspection> {
    const [created] = await db
      .insert(inspections)
      .values(inspection)
      .returning();
    return created;
  }

  async getInspection(id: string): Promise<Inspection | undefined> {
    const [inspection] = await db
      .select()
      .from(inspections)
      .where(eq(inspections.id, id));
    return inspection;
  }

  async updateInspection(id: string, updates: Partial<InsertInspection>): Promise<Inspection> {
    const [updated] = await db
      .update(inspections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(inspections.id, id))
      .returning();
    return updated;
  }

  async getUserInspections(userId: string): Promise<Inspection[]> {
    return await db
      .select()
      .from(inspections)
      .where(eq(inspections.userId, userId))
      .orderBy(desc(inspections.createdAt));
  }

  async getAllInspections(): Promise<Inspection[]> {
    return await db
      .select()
      .from(inspections)
      .orderBy(desc(inspections.createdAt));
  }

  // Assignment operations
  async createInspectionAssignment(assignment: InsertInspectionAssignment): Promise<InspectionAssignment> {
    const [created] = await db
      .insert(inspectionAssignments)
      .values(assignment)
      .returning();
    return created;
  }

  async getInspectionAssignments(cmiId?: string): Promise<InspectionAssignment[]> {
    if (cmiId) {
      return await db
        .select()
        .from(inspectionAssignments)
        .where(eq(inspectionAssignments.cmiId, cmiId))
        .orderBy(desc(inspectionAssignments.createdAt));
    }
    return await db
      .select()
      .from(inspectionAssignments)
      .orderBy(desc(inspectionAssignments.createdAt));
  }

  async updateAssignmentStatus(id: string, status: string): Promise<InspectionAssignment> {
    const [updated] = await db
      .update(inspectionAssignments)
      .set({ status, updatedAt: new Date() })
      .where(eq(inspectionAssignments.id, id))
      .returning();
    return updated;
  }

  // Shortlisted items operations
  async createShortlistedItem(item: InsertShortlistedItem): Promise<ShortlistedItem> {
    const [created] = await db
      .insert(shortlistedItems)
      .values(item)
      .returning();
    return created;
  }

  async searchShortlistedItems(query: string): Promise<ShortlistedItem[]> {
    const searchTerm = `%${query}%`;
    return await db
      .select()
      .from(shortlistedItems)
      .where(
        or(
          like(shortlistedItems.brand, searchTerm),
          like(shortlistedItems.item, searchTerm),
          like(shortlistedItems.flavour, searchTerm),
          like(shortlistedItems.category, searchTerm)
        )
      )
      .limit(20);
  }

  async getAllShortlistedItems(): Promise<ShortlistedItem[]> {
    return await db.select().from(shortlistedItems);
  }

  // File upload operations
  async createFileUpload(file: InsertFileUpload): Promise<FileUpload> {
    const [created] = await db
      .insert(fileUploads)
      .values(file)
      .returning();
    return created;
  }

  async getInspectionFiles(inspectionId: string): Promise<FileUpload[]> {
    return await db
      .select()
      .from(fileUploads)
      .where(eq(fileUploads.inspectionId, inspectionId));
  }
}

export const storage = new DatabaseStorage();
