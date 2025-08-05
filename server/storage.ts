import {
  users,
  inspections,
  inspectionAssignments,
  shortlistedItems,
  fileUploads,
  permissions,
  userPermissions,
  inspectionActionRequests,
  type User,
  type UpsertUser,
  type RegisterUser,
  type LoginUser,
  type Inspection,
  type InsertInspection,
  type InspectionAssignment,
  type InsertInspectionAssignment,
  type ShortlistedItem,
  type InsertShortlistedItem,
  type FileUpload,
  type InsertFileUpload,
  type Permission,
  type InsertPermission,
  type UserPermission,
  type InsertUserPermission,
  type InspectionActionRequest,
  type InsertInspectionActionRequest,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, like, or, desc, ilike, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Authentication operations
  registerUser(userData: RegisterUser): Promise<User>;
  authenticateUser(email: string, password: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | undefined>;
  approveUser(userId: string, approvedBy: string): Promise<User>;
  getAllPendingUsers(): Promise<User[]>;
  getAllCMIs(): Promise<User[]>;
  
  // Inspection operations
  createInspection(inspection: InsertInspection): Promise<Inspection>;
  getInspection(id: string): Promise<Inspection | undefined>;
  updateInspection(id: string, updates: Partial<InsertInspection>): Promise<Inspection>;
  deleteInspection(id: string): Promise<void>;
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
  
  // Permission operations
  createPermission(permission: InsertPermission): Promise<Permission>;
  getAllPermissions(): Promise<Permission[]>;
  createUserPermission(userPermission: InsertUserPermission): Promise<UserPermission>;
  removeUserPermission(userId: string, permissionId: string): Promise<void>;
  getUserPermissions(userId: string): Promise<UserPermission[]>;
  getAllUserPermissions(): Promise<UserPermission[]>;
  getPermissionMatrix(): Promise<{
    users: User[];
    permissions: Permission[];
    userPermissions: UserPermission[];
  }>;

  // Inspection Action Request operations
  createInspectionActionRequest(request: InsertInspectionActionRequest): Promise<InspectionActionRequest>;
  getInspectionActionRequests(status?: string): Promise<InspectionActionRequest[]>;
  getUserActionRequests(userId: string): Promise<InspectionActionRequest[]>;
  approveActionRequest(requestId: string, reviewedBy: string, comments?: string): Promise<InspectionActionRequest>;
  rejectActionRequest(requestId: string, reviewedBy: string, comments?: string): Promise<InspectionActionRequest>;
  getActionRequest(requestId: string): Promise<InspectionActionRequest | undefined>;
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

  // Authentication operations
  async registerUser(userData: RegisterUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
        isApproved: userData.email === 'commercialcmig@gmail.com' && userData.role === 'admin',
      })
      .returning();
    return user;
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.isApproved, true)));
    
    if (!user || !user.password) return null;
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    return isPasswordValid ? user : null;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async approveUser(userId: string, approvedBy: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        isApproved: true,
        approvedBy,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getAllPendingUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isApproved, false))
      .orderBy(desc(users.createdAt));
  }

  async getAllCMIs(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.role, 'cmi'), eq(users.isApproved, true)))
      .orderBy(users.name);
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

  async deleteInspection(id: string): Promise<void> {
    await db
      .delete(inspections)
      .where(eq(inspections.id, id));
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
    const lowerQuery = query.toLowerCase().trim();
    
    // Build search conditions
    const conditions = [
      ilike(shortlistedItems.brand, searchTerm),
      ilike(shortlistedItems.item, searchTerm),
      ilike(shortlistedItems.flavour, searchTerm),
      ilike(shortlistedItems.category, searchTerm),
      ilike(shortlistedItems.quantity, searchTerm)
    ];
    
    // Add category alias searches for common terms
    if (lowerQuery.includes('can') || lowerQuery.includes('soft drink') || lowerQuery.includes('cold drink')) {
      conditions.push(ilike(shortlistedItems.category, '%Aerated Drinks%'));
    }
    if (lowerQuery.includes('packet') || lowerQuery.includes('snack')) {
      conditions.push(ilike(shortlistedItems.category, '%Namkeen%'));
    }
    if (lowerQuery.includes('biscuit') || lowerQuery.includes('cookie')) {
      conditions.push(ilike(shortlistedItems.category, '%Biscuits%'));
    }
    if (lowerQuery.includes('chocolate') || lowerQuery.includes('candy')) {
      conditions.push(ilike(shortlistedItems.category, '%Chocolates%'));
    }
    if (lowerQuery.includes('water') || lowerQuery.includes('bottle')) {
      conditions.push(ilike(shortlistedItems.category, '%Water%'));
    }
    if (lowerQuery.includes('juice') || lowerQuery.includes('fruit drink')) {
      conditions.push(ilike(shortlistedItems.category, '%Juice%'));
    }
    
    return await db
      .select()
      .from(shortlistedItems)
      .where(or(...conditions))
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

  // Permission operations
  async createPermission(permission: InsertPermission): Promise<Permission> {
    const [created] = await db.insert(permissions).values(permission).returning();
    return created;
  }

  async getAllPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions).orderBy(permissions.category, permissions.resource, permissions.action);
  }

  async createUserPermission(userPermission: InsertUserPermission): Promise<UserPermission> {
    const [created] = await db.insert(userPermissions).values(userPermission).returning();
    return created;
  }

  async removeUserPermission(userId: string, permissionId: string): Promise<void> {
    await db.delete(userPermissions)
      .where(and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.permissionId, permissionId)
      ));
  }

  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    return await db.select().from(userPermissions).where(eq(userPermissions.userId, userId));
  }

  async getAllUserPermissions(): Promise<UserPermission[]> {
    return await db.select().from(userPermissions);
  }

  async getPermissionMatrix(): Promise<{
    users: User[];
    permissions: Permission[];
    userPermissions: UserPermission[];
  }> {
    const [allUsers, allPermissions, allUserPermissions] = await Promise.all([
      db.select().from(users).where(eq(users.isApproved, true)).orderBy(users.name),
      this.getAllPermissions(),
      this.getAllUserPermissions()
    ]);

    return {
      users: allUsers,
      permissions: allPermissions,
      userPermissions: allUserPermissions
    };
  }

  // Inspection Action Request operations
  async createInspectionActionRequest(request: InsertInspectionActionRequest): Promise<InspectionActionRequest> {
    const [actionRequest] = await db
      .insert(inspectionActionRequests)
      .values(request)
      .returning();
    return actionRequest;
  }

  async getInspectionActionRequests(status?: string): Promise<InspectionActionRequest[]> {
    if (status) {
      return await db
        .select()
        .from(inspectionActionRequests)
        .where(eq(inspectionActionRequests.status, status))
        .orderBy(desc(inspectionActionRequests.createdAt));
    }
    return await db
      .select()
      .from(inspectionActionRequests)
      .orderBy(desc(inspectionActionRequests.createdAt));
  }

  async getUserActionRequests(userId: string): Promise<InspectionActionRequest[]> {
    return await db
      .select()
      .from(inspectionActionRequests)
      .where(eq(inspectionActionRequests.requestedBy, userId))
      .orderBy(desc(inspectionActionRequests.createdAt));
  }

  async approveActionRequest(requestId: string, reviewedBy: string, comments?: string): Promise<InspectionActionRequest> {
    const [actionRequest] = await db
      .update(inspectionActionRequests)
      .set({
        status: 'approved',
        reviewedBy,
        reviewedAt: new Date(),
        reviewComments: comments,
        updatedAt: new Date(),
      })
      .where(eq(inspectionActionRequests.id, requestId))
      .returning();
    return actionRequest;
  }

  async rejectActionRequest(requestId: string, reviewedBy: string, comments?: string): Promise<InspectionActionRequest> {
    const [actionRequest] = await db
      .update(inspectionActionRequests)
      .set({
        status: 'rejected',
        reviewedBy,
        reviewedAt: new Date(),
        reviewComments: comments,
        updatedAt: new Date(),
      })
      .where(eq(inspectionActionRequests.id, requestId))
      .returning();
    return actionRequest;
  }

  async getActionRequest(requestId: string): Promise<InspectionActionRequest | undefined> {
    const [actionRequest] = await db
      .select()
      .from(inspectionActionRequests)
      .where(eq(inspectionActionRequests.id, requestId));
    return actionRequest;
  }
}

export const storage = new DatabaseStorage();
