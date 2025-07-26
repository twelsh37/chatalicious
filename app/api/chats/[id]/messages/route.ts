import { NextRequest, NextResponse } from "next/server";
import { initDatabase } from "@/lib/db";
import {
  getMessagesByChatId,
  createMessage,
  getLastMessageOrder,
  generateMessageId,
} from "@/lib/db/queries";

// Initialize database on first request
let dbInitialized = false;
async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized();
    const { id } = await params;
    const messages = await getMessagesByChatId(id);
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized();
    const { role, content, images } = await request.json();

    if (!role || !content) {
      return NextResponse.json(
        { error: "Role and content are required" },
        { status: 400 }
      );
    }

    if (!["user", "assistant"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be 'user' or 'assistant'" },
        { status: 400 }
      );
    }

    const { id } = await params;
    const lastOrder = await getLastMessageOrder(id);
    const newOrder = lastOrder + 1;

    const message = await createMessage({
      id: generateMessageId(),
      chatId: id,
      role,
      content,
      images: images || undefined,
      timestamp: new Date(),
      order: newOrder,
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}
