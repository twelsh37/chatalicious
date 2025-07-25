import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Edit2, MessageSquare, Plus } from "lucide-react";
import type { Chat } from "@/lib/db/schema";

interface ChatListProps {
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onUpdateChatTitle: (chatId: string, title: string) => void;
}

export function ChatList({
  selectedChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onUpdateChatTitle,
}: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const fetchChats = async () => {
    try {
      const response = await fetch("/api/chats");
      if (response.ok) {
        const data = await response.json();
        setChats(data);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const handleEditClick = (chat: Chat) => {
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const handleSaveTitle = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle }),
      });

      if (response.ok) {
        onUpdateChatTitle(chatId, editTitle);
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === chatId ? { ...chat, title: editTitle } : chat
          )
        );
        setEditingChatId(null);
      }
    } catch (error) {
      console.error("Error updating chat title:", error);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm("Are you sure you want to delete this chat?")) return;

    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDeleteChat(chatId);
        setChats((prev) => prev.filter((chat) => chat.id !== chatId));
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card className="w-80 flex-shrink-0">
        <CardHeader>
          <CardTitle className="text-lg">Chat History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm mt-2">Loading chats...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80 flex-shrink-0">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Chat History</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onNewChat}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-2">
            {chats.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm">No chats yet</p>
                <p className="text-xs mt-1">Start a new conversation</p>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedChatId === chat.id
                      ? "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {editingChatId === chat.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1 text-sm bg-transparent border-b border-blue-500 focus:outline-none"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                handleSaveTitle(chat.id);
                              }
                            }}
                            onBlur={() => handleSaveTitle(chat.id)}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <h3 className="text-sm font-medium truncate">
                          {chat.title}
                        </h3>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDate(chat.updatedAt)}
                      </p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {chat.modelName}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(chat);
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChat(chat.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
