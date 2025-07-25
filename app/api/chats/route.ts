import { NextRequest, NextResponse } from "next/server";
import { initDatabase } from "@/lib/db";
import {
  getChats,
  createChat,
  generateChatId,
  generateChatTitle,
} from "@/lib/db/queries";

// Initialize database on first request
let dbInitialized = false;
async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

export async function GET() {
  try {
    await ensureDbInitialized();
    const chats = await getChats();
    return NextResponse.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized();
    const {
      modelName,
      firstMessage,
      title: customTitle,
    } = await request.json();

    if (!modelName) {
      return NextResponse.json(
        { error: "Model name is required" },
        { status: 400 }
      );
    }

    const chatId = generateChatId();
    const title =
      customTitle ||
      (firstMessage ? generateChatTitle(firstMessage) : "New Chat");

    const chat = await createChat({
      id: chatId,
      modelName,
      title,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(chat);
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    );
  }
}
