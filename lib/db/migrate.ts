import { db } from "./index";

export async function migrateDatabase() {
  try {
    console.log("Starting database migration...");
    
    // Check if images column exists using a more reliable method
    const tableInfo = await db.run("PRAGMA table_info(messages)");
    const columns = tableInfo.rows || [];
          const hasImagesColumn = columns.some((row: unknown) => (row as { name: string }).name === 'images');
    
    if (!hasImagesColumn) {
      console.log("Adding images column to messages table...");
      await db.run("ALTER TABLE messages ADD COLUMN images TEXT");
      console.log("Images column added successfully");
    } else {
      console.log("Images column already exists, skipping...");
    }
    
    console.log("Database migration completed successfully");
  } catch (error) {
    // If the error is about duplicate column, that's fine - it means the column already exists
    if (error instanceof Error && error.message.includes('duplicate column name: images')) {
      console.log("Images column already exists (detected via error), migration completed");
      return;
    }
    
    console.error("Migration failed:", error);
    throw error;
  }
} 
