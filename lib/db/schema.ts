import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const chats = sqliteTable(
  "chats",
  {
    id: text("id").primaryKey(),
    modelName: text("model_name").notNull(),
    title: text("title").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    modelNameIdx: index("model_name_idx").on(table.modelName),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
  })
);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    content: text("content").notNull(),
    images: text("images"), // JSON string of base64 images
    timestamp: integer("timestamp", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    order: integer("order").notNull(),
  },
  (table) => ({
    chatIdIdx: index("chat_id_idx").on(table.chatId),
    orderIdx: index("order_idx").on(table.order),
  })
);

export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
