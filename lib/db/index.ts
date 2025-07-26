import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const client = createClient({
  url: "file:./local.db",
});

export const db = drizzle(client, { schema });

// Initialize database with tables
export async function initDatabase() {
  try {
    // This will create the tables if they don't exist
    await db.run(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        model_name TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        images TEXT,
        timestamp INTEGER NOT NULL,
        \`order\` INTEGER NOT NULL,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    await db.run(
      `CREATE INDEX IF NOT EXISTS model_name_idx ON chats(model_name)`
    );
    await db.run(
      `CREATE INDEX IF NOT EXISTS created_at_idx ON chats(created_at)`
    );
    await db.run(`CREATE INDEX IF NOT EXISTS chat_id_idx ON messages(chat_id)`);
    await db.run(`CREATE INDEX IF NOT EXISTS order_idx ON messages(\`order\`)`);

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}
