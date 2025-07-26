import { eq, desc, asc } from "drizzle-orm";
import { db } from "./index";
import {
  chats,
  messages,
  type Chat,
  type NewChat,
  type Message,
  type NewMessage,
} from "./schema";

// Chat operations
export async function createChat(chat: NewChat): Promise<Chat> {
  const [newChat] = await db.insert(chats).values(chat).returning();
  return newChat;
}

export async function getChats(): Promise<Chat[]> {
  return await db.select().from(chats).orderBy(desc(chats.updatedAt));
}

export async function getChatById(id: string): Promise<Chat | undefined> {
  const [chat] = await db.select().from(chats).where(eq(chats.id, id));
  return chat;
}

export async function updateChatTitle(
  id: string,
  title: string
): Promise<void> {
  await db
    .update(chats)
    .set({ title, updatedAt: new Date() })
    .where(eq(chats.id, id));
}

export async function deleteChat(id: string): Promise<void> {
  await db.delete(chats).where(eq(chats.id, id));
}

// Message operations
export async function createMessage(message: NewMessage): Promise<Message> {
  // Convert images array to JSON string if present
  const messageData = {
    ...message,
    images: message.images ? JSON.stringify(message.images) : null,
  };

  const [newMessage] = await db.insert(messages).values(messageData).returning();

  // Update chat's updatedAt timestamp
  await db
    .update(chats)
    .set({ updatedAt: new Date() })
    .where(eq(chats.id, message.chatId));

  return newMessage;
}

export async function getMessagesByChatId(chatId: string): Promise<Message[]> {
  const dbMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.order));

  // Parse images JSON string back to array
  return dbMessages.map(msg => ({
    ...msg,
    images: msg.images ? JSON.parse(msg.images) : undefined,
  }));
}

export async function getLastMessageOrder(chatId: string): Promise<number> {
  const [lastMessage] = await db
    .select({ order: messages.order })
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(desc(messages.order))
    .limit(1);

  return lastMessage?.order ?? -1;
}

export async function deleteMessagesByChatId(chatId: string): Promise<void> {
  await db.delete(messages).where(eq(messages.chatId, chatId));
}

// Utility functions
export function generateChatId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateChatTitle(firstMessage: string): string {
  // Create a title from the first user message
  const words = firstMessage.trim().split(/\s+/);
  const title = words.slice(0, 6).join(" ");
  return title.length > 50 ? title.substring(0, 47) + "..." : title;
}
