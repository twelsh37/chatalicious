"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  User,
  Brain,
  MessageSquare,
  Paperclip,
  Eye,
  Menu,
  X,
} from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { toast } from "sonner";
import { ollamaAPI, type Model, type Message as APIMessage } from "@/lib/api";
import { ModelInfoTooltip } from "@/components/ModelInfoTooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ChatHistory } from "@/components/ChatHistory";
import { ModelSelectionModal } from "@/components/ModelSelectionModal";
import { NewChatDialog } from "@/components/NewChatDialog";
import { VoiceRecognition } from "@/components/VoiceRecognition";
import type { Chat as DBChat, Message as DBMessage } from "@/lib/db/schema";
import {
  checkVisionCapability,
  isSupportedImageFile,
  fileToBase64,
} from "@/lib/vision-utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  images?: string[]; // Base64 encoded images
}

export default function Home() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedModelData, setSelectedModelData] = useState<Model | null>(
    null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAPIAvailable, setIsAPIAvailable] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentChat, setCurrentChat] = useState<DBChat | null>(null);
  const [chatRefreshTrigger, setChatRefreshTrigger] = useState(0);
  const [, setChats] = useState<DBChat[]>([]);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [pendingChatData, setPendingChatData] = useState<{
    title: string;
    firstMessage?: string;
  } | null>(null);
  const [isVisionModel, setIsVisionModel] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  // Fetch available models
  const fetchModels = useCallback(async () => {
    try {
      const data = await ollamaAPI.getModels();
      const availableModels = data.models || [];
      setModels(availableModels);
      setIsConnected(true);

      // Auto-select a default model if none is selected and models are available
      if (!selectedModel && availableModels.length > 0) {
        // Try to find deepseek-r1:8b first, otherwise use the first available model
        const defaultModel =
          availableModels.find((model) => model.name === "deepseek-r1:8b") ||
          availableModels[0];
        console.log("Auto-selecting default model:", defaultModel.name);
        setSelectedModel(defaultModel.name);
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      setIsConnected(false);
    }
  }, [selectedModel]);

  // Fetch chats from database
  const fetchChats = async () => {
    try {
      console.log("Fetching chats...");
      const response = await fetch("/api/chats");
      console.log("Chats response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Chats fetched:", data.length);
        setChats(data);
      } else {
        console.error(
          "Failed to fetch chats:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
      toast.error("Failed to fetch chats", {
        description: error instanceof Error ? error.message : "Network error",
      });
    }
  };

  // Update selected model data when selection changes
  useEffect(() => {
    console.log("Model selection changed:", {
      selectedModel,
      modelsCount: models.length,
    });
    if (selectedModel) {
      const modelData = models.find((model) => model.name === selectedModel);
      setSelectedModelData(modelData || null);
      console.log("Selected model data:", modelData);

      // Check if the selected model has vision capabilities
      checkVisionCapability(selectedModel).then((hasVision) => {
        setIsVisionModel(hasVision);
        console.log(`Model ${selectedModel} vision capability:`, hasVision);
      });
    } else {
      setSelectedModelData(null);
      setIsVisionModel(false);
    }
  }, [selectedModel, models]);

  // Auto-scroll to bottom when messages change or loading state changes
  useEffect(() => {
    const scrollToBottom = () => {
      if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      } else if (scrollAreaRef.current) {
        // Fallback: scroll the scroll area to bottom
        const scrollElement = scrollAreaRef.current.querySelector(
          "[data-radix-scroll-area-viewport]"
        );
        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }
      }
    };

    // Use a small delay to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, isLoading]);

  // Chat management functions
  const createNewChat = async (title?: string, firstMessage?: string) => {
    if (!selectedModel) {
      setShowModelModal(true);
      return null;
    }

    // Check if API is available
    if (!isAPIAvailable) {
      toast.error("API not available", {
        description: "Please check if the development server is running.",
      });
      return null;
    }

    try {
      console.log("Creating new chat with:", {
        selectedModel,
        title,
        firstMessage,
      });

      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelName: selectedModel,
          title: title || undefined,
          firstMessage: firstMessage || undefined,
        }),
      });

      console.log("Chat creation response status:", response.status);

      if (response.ok) {
        const newChat = await response.json();
        console.log("New chat created:", newChat);
        setCurrentChatId(newChat.id);
        setCurrentChat(newChat);
        setMessages([]);
        setInputMessage("");
        setChatRefreshTrigger((prev) => prev + 1); // Trigger chat list refresh

        if (title || firstMessage) {
          toast.success("New chat created", {
            description: title
              ? `Created "${title}" with ${selectedModel}`
              : `Started a new conversation with ${selectedModel}`,
          });
        }

        return newChat;
      }
    } catch (error) {
      console.error("Error creating new chat:", error);
      toast.error("Failed to create chat", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    }
    return null;
  };

  // Send first message to a newly created chat
  const sendFirstMessage = async (chatId: string, message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages([userMessage]);
    setIsLoading(true);

    try {
      // Save user message to database
      const userResponse = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "user",
          content: message,
        }),
      });

      if (!userResponse.ok) {
        throw new Error(`Failed to save user message: ${userResponse.status}`);
      }

      // Send to Ollama API
      const apiMessages: APIMessage[] = [
        {
          role: "user",
          content: message,
        },
      ];

      const data = await ollamaAPI.chat({
        model: selectedModel,
        messages: apiMessages,
        stream: false,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message.content,
        timestamp: new Date(),
      };

      // Save assistant message to database
      const assistantResponse = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "assistant",
          content: data.message.content,
        }),
      });

      if (!assistantResponse.ok) {
        throw new Error(
          `Failed to save assistant message: ${assistantResponse.status}`
        );
      }

      setMessages([userMessage, assistantMessage]);
    } catch (error) {
      console.error("Error sending first message:", error);
      toast.error("Failed to send first message", {
        description:
          "The chat was created but there was an error sending your first message.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectChat = async (chatId: string) => {
    try {
      // Fetch chat details
      const chatResponse = await fetch(`/api/chats/${chatId}`);
      if (chatResponse.ok) {
        const chat = await chatResponse.json();
        setCurrentChat(chat);
        setSelectedModel(chat.modelName);
      }

      // Fetch messages
      const messagesResponse = await fetch(`/api/chats/${chatId}/messages`);
      if (messagesResponse.ok) {
        const dbMessages = await messagesResponse.json();
        const convertedMessages: Message[] = dbMessages.map(
          (msg: DBMessage) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            images: msg.images ? JSON.parse(msg.images) : undefined,
          })
        );
        setMessages(convertedMessages);
      }

      setCurrentChatId(chatId);
      // Close sidebar on mobile after selecting a chat
      setSidebarOpen(false);
    } catch (error) {
      console.error("Error selecting chat:", error);
    }
  };

  const deleteChat = (chatId: string) => {
    if (currentChatId === chatId) {
      setCurrentChatId(null);
      setCurrentChat(null);
      setMessages([]);
      setInputMessage("");
    }
    setChatRefreshTrigger((prev) => prev + 1); // Trigger chat list refresh
  };

  const updateChatTitle = (chatId: string, title: string) => {
    if (currentChatId === chatId) {
      setCurrentChat((prev) => (prev ? { ...prev, title } : null));
    }
  };

  const handleModelSelect = (modelName: string) => {
    setSelectedModel(modelName);
    setShowModelModal(false);

    // If we have pending chat data, create the chat immediately
    if (pendingChatData) {
      handleNewChatSubmit(
        pendingChatData.title,
        pendingChatData.firstMessage,
        modelName
      );
      setPendingChatData(null);
    } else {
      toast.success("Model selected", {
        description: `You can now start chatting with ${modelName}.`,
      });
    }
  };

  const handleModelModalCancel = () => {
    setShowModelModal(false);
    setPendingChatData(null);
  };

  const saveAndStartNewChat = async () => {
    if (!currentChatId || !currentChat) {
      // No current chat to save, just create a new one
      setShowNewChatDialog(true);
      return;
    }

    // Show the new chat dialog
    setShowNewChatDialog(true);
  };

  const handleNewChatSubmit = async (
    title: string,
    firstMessage?: string,
    modelName?: string
  ) => {
    setIsCreatingChat(true);

    try {
      // Use the provided modelName or fall back to the currently selected model
      const modelToUse = modelName || selectedModel;

      // If no model is available, store the data and show the model selection modal
      if (!modelToUse) {
        setPendingChatData({ title, firstMessage });
        setShowNewChatDialog(false);
        setShowModelModal(true);
        setIsCreatingChat(false);
        return;
      }

      // Set the selected model if it's different from current
      if (modelToUse !== selectedModel) {
        setSelectedModel(modelToUse);
      }

      // Create a new chat (without first message)
      const newChat = await createNewChat(title, undefined);

      if (newChat && firstMessage) {
        // Close the dialog immediately after chat creation
        setShowNewChatDialog(false);
        setIsCreatingChat(false);

        // Send the first message asynchronously
        sendFirstMessage(newChat.id, firstMessage);
      } else {
        // No first message, just close the dialog
        setShowNewChatDialog(false);
        setIsCreatingChat(false);
      }
    } catch (error) {
      console.error("Error saving chat:", error);
      toast.error("Failed to save chat", {
        description: "There was an error saving your chat. Please try again.",
      });
      setIsCreatingChat(false);
      setShowNewChatDialog(false);
    }
  };

  // Send message to Ollama
  const sendMessage = async () => {
    if ((!inputMessage.trim() && selectedFiles.length === 0) || isLoading)
      return;

    if (!selectedModel) {
      setShowModelModal(true);
      return;
    }

    console.log("Sending message:", {
      inputMessage,
      selectedFiles: selectedFiles.length,
      selectedModel,
      currentChatId,
    });

    // Determine the chat ID to use
    let chatId = currentChatId;

    // Create new chat if none exists
    if (!chatId) {
      console.log("No current chat, creating new one...");
      const newChat = await createNewChat(undefined, undefined);
      if (newChat) {
        // Use the new chat ID directly and update state
        chatId = newChat.id;
        setCurrentChatId(newChat.id);
        setCurrentChat(newChat);
      } else {
        console.error("Failed to create new chat");
        return;
      }
    }

    // Prepare message content and images
    const messageContent = inputMessage;
    let messageImages: string[] = [];

    if (selectedFiles.length > 0) {
      // Convert images to base64
      try {
        messageImages = await Promise.all(
          selectedFiles.map((file) => fileToBase64(file))
        );
        console.log(`Converted ${selectedFiles.length} images to base64`);
      } catch (error) {
        console.error("Error converting images to base64:", error);
        toast.error("Failed to process images", {
          description:
            "There was an error processing your images. Please try again.",
        });
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setSelectedFiles([]);
    setIsLoading(true);

    try {
      console.log("Using chat ID:", chatId);
      if (!chatId) {
        throw new Error("No chat ID available");
      }

      console.log("Saving user message to database...");
      // Save user message to database
      const userResponse = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "user",
          content: messageContent,
          ...(messageImages.length > 0 && { images: messageImages }),
        }),
      });

      if (!userResponse.ok) {
        throw new Error(`Failed to save user message: ${userResponse.status}`);
      }

      const apiMessages: APIMessage[] = [
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: "user",
          content: messageContent,
          ...(messageImages.length > 0 && { images: messageImages }),
        },
      ];

      console.log("Sending to Ollama API:", {
        model: selectedModel,
        messages: apiMessages,
        hasImages: messageImages.length > 0,
        imageCount: messageImages.length,
        messageContent: messageContent,
      });

      console.log("Making Ollama API call...");
      const data = await ollamaAPI.chat({
        model: selectedModel,
        messages: apiMessages,
        stream: false,
      });

      console.log("Received response from Ollama:", data);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message.content,
        timestamp: new Date(),
      };

      console.log("Saving assistant message to database...");
      // Save assistant message to database
      const assistantResponse = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "assistant",
          content: data.message.content,
        }),
      });

      if (!assistantResponse.ok) {
        throw new Error(
          `Failed to save assistant message: ${assistantResponse.status}`
        );
      }

      setMessages((prev) => [...prev, assistantMessage]);
      console.log("Message flow completed successfully");

      toast.success("Message sent", {
        description: "Your message has been sent and the response received.",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      // Add user-friendly error handling
      toast.error("Failed to send message", {
        description:
          error instanceof Error
            ? error.message
            : "There was an error sending your message. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => isSupportedImageFile(file));

    if (validFiles.length !== files.length) {
      toast.error("Some files were not supported", {
        description:
          "Only image files (JPG, PNG, GIF, BMP, WebP, TIFF) are supported.",
      });
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      toast.success("Images added", {
        description: `${validFiles.length} image(s) added to your message.`,
      });
    }

    // Reset the input
    if (event.target) {
      event.target.value = "";
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePaperclipClick = () => {
    fileInputRef.current?.click();
  };

  // Handle voice input
  const handleVoiceInput = (transcript: string) => {
    console.log("Voice input received:", transcript);
    console.log("Setting input message to:", transcript);
    setInputMessage(transcript);
    console.log("Input message should now be:", transcript);
    // Optionally auto-send the message after voice input
    // Uncomment the next line if you want to auto-send voice messages
    // sendMessage();
  };

  // Debug: Monitor inputMessage changes
  useEffect(() => {
    console.log("Input message changed to:", inputMessage);
  }, [inputMessage]);

  // Handle voice input error
  const handleVoiceError = (error: string) => {
    console.error("Voice recognition error:", error);
    // Error is already handled by the VoiceRecognition component with toast
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Health check function
  const checkAPIHealth = async () => {
    try {
      const response = await fetch("/api/health");
      if (response.ok) {
        const data = await response.json();
        console.log("API health check:", data);
        setIsAPIAvailable(true);
      } else {
        console.error("API health check failed:", response.status);
        setIsAPIAvailable(false);
      }
    } catch (error) {
      console.error("API health check error:", error);
      setIsAPIAvailable(false);
    }
  };

  // Fetch models and chats on component mount
  useEffect(() => {
    checkAPIHealth(); // Check API health first
    fetchModels();
    fetchChats();
    const interval = setInterval(fetchModels, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchModels]);

  // Fetch chats when refresh trigger changes
  useEffect(() => {
    fetchChats();
  }, [chatRefreshTrigger]);

  return (
    <ErrorBoundary>
      <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                Chat With The Brain
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex items-center space-x-2">
                <Badge
                  variant={isConnected ? "default" : "destructive"}
                  className="text-xs"
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
                <Badge
                  variant={isAPIAvailable ? "default" : "destructive"}
                  className="text-xs"
                >
                  {isAPIAvailable ? "API OK" : "API Error"}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchModels}
                disabled={isLoading}
                className="hidden sm:flex"
              >
                Refresh
              </Button>
              <ThemeSwitcher />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex min-h-0 overflow-hidden main-content-area">
            {/* Sidebar - Mobile Overlay / Desktop Sidebar */}
            <div
              className={`
              fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-background border-r transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-auto sidebar-laptop
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            `}
            >
              <Card className="h-full flex flex-col bg-blue-25/30 dark:bg-blue-950/20 border-2 border-slate-300 dark:border-slate-600 rounded-none lg:rounded-lg lg:m-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Models & Chats</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-3 overflow-hidden min-h-0">
                  {/* Model Selection */}
                  <div className="space-y-3 flex-shrink-0">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Model Selection
                    </h3>
                    <Select
                      value={selectedModel}
                      onValueChange={setSelectedModel}
                    >
                      <SelectTrigger className="w-full border-2 border-slate-300 dark:border-slate-600">
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((model) => (
                          <SelectItem key={model.name} value={model.name}>
                            <div className="flex flex-col">
                              <span className="font-medium">{model.name}</span>
                              <span className="text-xs text-slate-500">
                                {model.size} •{" "}
                                {new Date(
                                  model.modified_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Model Info (Hover for details)
                      </h4>
                      <ModelInfoTooltip
                        model={selectedModelData}
                        isVisionModel={isVisionModel}
                      >
                        <div className="flex items-center gap-2 p-2 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-help">
                          <Brain className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                            {selectedModelData
                              ? selectedModelData.name
                              : "Select a model"}
                          </span>
                          {isVisionModel && (
                            <Eye className="h-3 w-3 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                      </ModelInfoTooltip>
                    </div>

                    {models.length === 0 && (
                      <div className="text-center py-4 text-slate-500">
                        <p className="text-sm">No models found</p>
                        <p className="text-xs mt-1">
                          Make sure Ollama is running
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t-2 border-slate-300 dark:border-slate-600 flex-shrink-0"></div>

                  {/* Chat History */}
                  <div className="flex-1 flex flex-col space-y-3 min-h-0 overflow-hidden">
                    <div className="flex items-center justify-between flex-shrink-0">
                      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Chat History
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewChatDialog(true)}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-hidden max-h-full">
                      <ChatHistory
                        selectedChatId={currentChatId}
                        onSelectChat={selectChat}
                        onDeleteChat={deleteChat}
                        onUpdateChatTitle={updateChatTitle}
                        refreshTrigger={chatRefreshTrigger}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden main-content-laptop">
              <Card className="h-full flex flex-col min-w-0 min-h-0 overflow-hidden chat-container bg-blue-25/30 dark:bg-blue-950/20 border-2 border-slate-300 dark:border-slate-600 rounded-none lg:rounded-lg lg:m-2">
                <CardHeader className="border-b-2 border-slate-300 dark:border-slate-600 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {currentChat ? currentChat.title : "Chatalicious"}
                      </CardTitle>
                      {currentChat && (
                        <p className="text-sm text-slate-500 truncate">
                          Using {currentChat.modelName} •{" "}
                          {new Date(currentChat.updatedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={saveAndStartNewChat}
                      className="flex items-center gap-2 ml-2 flex-shrink-0"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="hidden sm:inline">New Chat</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden p-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-hidden min-h-0">
                    <ScrollArea
                      className="h-full scrollbar-visible border-2 border-slate-300 dark:border-slate-600 rounded-md chat-messages"
                      ref={scrollAreaRef}
                      type="always"
                    >
                      <div className="space-y-4 p-4">
                        {messages.length === 0 ? (
                          <div className="text-center py-12 text-slate-500">
                            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                              <span className="text-2xl">💬</span>
                            </div>
                            <h3 className="text-lg font-medium mb-2">
                              Start a conversation
                            </h3>
                            <p className="text-sm px-4">
                              Select a model and send your first message to
                              begin chatting with Ollama.
                            </p>
                          </div>
                        ) : (
                          messages.map((message, index) => (
                            <div
                              key={message.id}
                              ref={
                                index === messages.length - 1
                                  ? lastMessageRef
                                  : null
                              }
                              className={`flex gap-3 ${
                                message.role === "user"
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                              {message.role === "assistant" && (
                                <Avatar className="w-8 h-8 flex-shrink-0">
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                    <Brain className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div
                                className={`max-w-[85%] sm:max-w-[70%] rounded-lg px-4 py-2 ${
                                  message.role === "user"
                                    ? "bg-blue-500 text-white"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {message.content}
                                </p>
                                {message.images &&
                                  message.images.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                      <div className="text-xs text-slate-500">
                                        📎 {message.images.length} image
                                        {message.images.length > 1
                                          ? "s"
                                          : ""}{" "}
                                        attached
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {message.images.map((image, index) => (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img
                                            key={index}
                                            src={`data:image/jpeg;base64,${image}`}
                                            alt={`Attached image ${index + 1}`}
                                            className="w-16 h-16 object-cover rounded border"
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                <p className="text-xs mt-1 opacity-70">
                                  {message.timestamp.toLocaleTimeString()}
                                </p>
                              </div>
                              {message.role === "user" && (
                                <Avatar className="w-8 h-8 flex-shrink-0">
                                  <AvatarFallback className="bg-slate-500 text-white">
                                    <User className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          ))
                        )}
                        {isLoading && (
                          <div
                            ref={lastMessageRef}
                            className="flex gap-3 justify-start"
                          >
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                <Brain className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <div
                                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.1s" }}
                                ></div>
                                <div
                                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.2s" }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Input Area */}
                  <div className="flex-shrink-0 p-4 border-t-2 border-slate-300 dark:border-slate-600">
                    <div className="flex gap-2">
                      <div className="flex-1 flex flex-col gap-2">
                        {/* File attachments display */}
                        {selectedFiles.length > 0 && (
                          <div className="flex flex-wrap gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                            {selectedFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 bg-white dark:bg-slate-700 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600"
                              >
                                <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-20">
                                  {file.name}
                                </span>
                                <button
                                  onClick={() => removeFile(index)}
                                  className="text-red-500 hover:text-red-700 text-xs flex-shrink-0"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Text input and buttons */}
                        <div className="flex gap-2">
                          <Textarea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
                            className="flex-1 resize-none border-2 border-slate-300 dark:border-slate-600"
                            rows={3}
                            disabled={!selectedModel || isLoading}
                          />
                          <div className="flex flex-col gap-2">
                            <VoiceRecognition
                              onTranscript={handleVoiceInput}
                              onError={handleVoiceError}
                              disabled={!selectedModel || isLoading}
                            />
                            {isVisionModel && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePaperclipClick}
                                disabled={!selectedModel || isLoading}
                                className="h-10 w-10 p-0"
                                title="Attach image"
                              >
                                <Paperclip className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              onClick={sendMessage}
                              disabled={
                                (!inputMessage.trim() &&
                                  selectedFiles.length === 0) ||
                                !selectedModel ||
                                isLoading
                              }
                              className="self-end"
                            >
                              <span className="hidden sm:inline">
                                {selectedFiles.length > 0
                                  ? `Send with ${selectedFiles.length} image${
                                      selectedFiles.length > 1 ? "s" : ""
                                    }`
                                  : "Send"}
                              </span>
                              <span className="sm:hidden">Send</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <NewChatDialog
        isOpen={showNewChatDialog}
        onClose={() => setShowNewChatDialog(false)}
        onSubmit={handleNewChatSubmit}
        isLoading={isCreatingChat}
        models={models}
        selectedModel={selectedModel}
      />

      <ModelSelectionModal
        isOpen={showModelModal}
        models={models}
        onModelSelect={handleModelSelect}
        onCancel={handleModelModalCancel}
      />

      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </ErrorBoundary>
  );
}
