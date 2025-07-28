import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Edit2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "./ConfirmDialog";
import type { Chat } from "@/lib/db/schema";

interface ChatHistoryProps {
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onUpdateChatTitle: (chatId: string, title: string) => void;
  refreshTrigger?: number; // Add this to trigger refreshes
}

export function ChatHistory({
  selectedChatId,
  onSelectChat,
  onDeleteChat,
  onUpdateChatTitle,
  refreshTrigger = 0,
}: ChatHistoryProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    chatId: string | null;
    chatTitle: string;
  }>({
    isOpen: false,
    chatId: null,
    chatTitle: "",
  });

  const fetchChats = async () => {
    try {
      console.log("Fetching chats...");
      const response = await fetch("/api/chats");
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched chats:", data);
        setChats(data);
      } else {
        console.error("Failed to fetch chats:", response.status);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("ChatHistory refresh trigger changed:", refreshTrigger);
    fetchChats();
  }, [refreshTrigger]);

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
        toast.success("Chat title updated", {
          description: "The conversation title has been updated successfully.",
        });
      } else {
        throw new Error(`Failed to update title: ${response.status}`);
      }
    } catch (error) {
      console.error("Error updating chat title:", error);
      toast.error("Failed to update title", {
        description:
          "There was an error updating the conversation title. Please try again.",
      });
    }
  };

  const handleDeleteClick = (chat: Chat) => {
    setDeleteDialog({
      isOpen: true,
      chatId: chat.id,
      chatTitle: chat.title,
    });
  };

  const handleDeleteConfirm = async () => {
    const { chatId } = deleteDialog;
    if (!chatId) return;

    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDeleteChat(chatId);
        setChats((prev) => prev.filter((chat) => chat.id !== chatId));
        toast.success("Chat deleted successfully", {
          description: "The conversation has been permanently removed.",
        });
      } else {
        throw new Error(`Failed to delete chat: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat", {
        description:
          "There was an error deleting the conversation. Please try again.",
      });
    } finally {
      setDeleteDialog({ isOpen: false, chatId: null, chatTitle: "" });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, chatId: null, chatTitle: "" });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="text-center py-4 text-slate-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-xs mt-2">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col min-h-0 max-h-full">
        <ScrollArea
          className="flex-1 scrollbar-visible border-2 border-slate-300 dark:border-slate-600 rounded-md min-h-0 max-h-full"
          type="always"
        >
          <div className="space-y-1.5 px-2 py-2">
            {chats.length === 0 ? (
              <div className="text-center py-4 text-slate-500">
                <MessageSquare className="h-6 w-6 mx-auto mb-2 text-slate-400" />
                <p className="text-xs">No chats yet</p>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group p-2 rounded-md cursor-pointer transition-colors text-xs border-2 ${
                    selectedChatId === chat.id
                      ? "bg-blue-100 border-blue-300 dark:bg-blue-900 dark:border-blue-600"
                      : "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900"
                  }`}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0 overflow-hidden">
                      {editingChatId === chat.id ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full text-xs bg-transparent border-b border-blue-500 focus:outline-none"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              handleSaveTitle(chat.id);
                            }
                          }}
                          onBlur={() => handleSaveTitle(chat.id)}
                          autoFocus
                        />
                      ) : (
                        <h4 className="font-medium truncate text-xs leading-tight">
                          {chat.title}
                        </h4>
                      )}
                      <div className="flex items-center gap-1 mt-0.5 min-w-0">
                        <span className="text-xs text-slate-500 truncate flex-shrink-0">
                          {formatDate(chat.updatedAt)}
                        </span>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          •
                        </span>
                        <span className="text-xs text-slate-500 truncate min-w-0 break-all">
                          {chat.modelName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 touch-manipulation"
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
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 touch-manipulation"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(chat);
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
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Chat"
        description={`Are you sure you want to delete "${deleteDialog.chatTitle}"? This action cannot be undone and will permanently remove the conversation.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        variant="danger"
      />
    </>
  );
}
