import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function migrateUsers() {
  console.log("Starting user migration...");

  try {
    // Get all existing users
    const existingUsers = await db.select().from(users);
    console.log(`Found ${existingUsers.length} existing users`);

    for (const user of existingUsers) {
      const updates: any = {};
      
      // Set default values for new required fields if they don't exist
      if (!user.name) {
        updates.name = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`.trim()
          : user.email?.split('@')[0] || 'Unknown User';
      }
      
      if (!user.designation) {
        updates.designation = user.role === 'admin' ? 'Administrator' : 'Chief Metropolitan Inspector';
      }
      
      if (!user.stationSection) {
        updates.stationSection = 'Delhi Division';
      }
      
      if (!user.password) {
        // Set a default password that will need to be changed
        updates.password = await bcrypt.hash('password123', 10);
      }
      
      if (!user.role) {
        updates.role = 'admin'; // Default to admin for existing users
      }
      
      if (user.isApproved === null || user.isApproved === undefined) {
        updates.isApproved = true; // Approve existing users
      }

      if (Object.keys(updates).length > 0) {
        await db
          .update(users)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
        
        console.log(`Updated user: ${user.email}`);
      }
    }

    // Create the default administrator if it doesn't exist
    const defaultAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, 'commercialcmig@gmail.com'));

    if (defaultAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash('Lg12121@', 10);
      
      await db.insert(users).values({
        email: 'commercialcmig@gmail.com',
        password: hashedPassword,
        name: 'Commercial CMI Administrator',
        designation: 'Chief Administrator',
        stationSection: 'Delhi Division',
        role: 'admin',
        isApproved: true,
      });
      
      console.log('Created default administrator account');
    }

    console.log("User migration completed successfully!");

  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
migrateUsers().then(() => {
  process.exit(0);
});