"use client";

import { useState, useEffect, useRef } from "react";
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
import { Plus, User, Brain, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { ollamaAPI, type Model, type Message as APIMessage } from "@/lib/api";
import { ModelInfo } from "@/components/ModelInfo";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ChatHistory } from "@/components/ChatHistory";
import { ModelSelectionModal } from "@/components/ModelSelectionModal";
import { NewChatDialog } from "@/components/NewChatDialog";
import type { Chat as DBChat, Message as DBMessage } from "@/lib/db/schema";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  // Fetch available models
  const fetchModels = async () => {
    try {
      const data = await ollamaAPI.getModels();
      setModels(data.models || []);
      setIsConnected(true);
    } catch (error) {
      console.error("Error fetching models:", error);
      setIsConnected(false);
    }
  };

  // Fetch chats from database
  const fetchChats = async () => {
    try {
      const response = await fetch("/api/chats");
      if (response.ok) {
        const data = await response.json();
        setChats(data);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
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
    } else {
      setSelectedModelData(null);
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
        const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
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

    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelName: selectedModel,
          title: title || undefined,
          firstMessage: firstMessage || undefined,
        }),
      });

      if (response.ok) {
        const newChat = await response.json();
        setCurrentChatId(newChat.id);
        setCurrentChat(newChat);
        setMessages([]);
        setInputMessage("");
        setChatRefreshTrigger((prev) => prev + 1); // Trigger chat list refresh

        // If a first message was provided, send it and get the response
        if (firstMessage) {
          const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: firstMessage,
            timestamp: new Date(),
          };

          setMessages([userMessage]);
          setIsLoading(true);

          try {
            // Save user message to database
            const userResponse = await fetch(
              `/api/chats/${newChat.id}/messages`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  role: "user",
                  content: firstMessage,
                }),
              }
            );

            if (!userResponse.ok) {
              throw new Error(
                `Failed to save user message: ${userResponse.status}`
              );
            }

            // Send to Ollama API
            const apiMessages: APIMessage[] = [
              {
                role: "user",
                content: firstMessage,
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
            const assistantResponse = await fetch(
              `/api/chats/${newChat.id}/messages`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  role: "assistant",
                  content: data.message.content,
                }),
              }
            );

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
        }

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
    }
    return null;
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
          })
        );
        setMessages(convertedMessages);
      }

      setCurrentChatId(chatId);
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
      // If no model is selected, store the data and show the model selection modal
      if (!modelName) {
        setPendingChatData({ title, firstMessage });
        setShowNewChatDialog(false);
        setShowModelModal(true);
        setIsCreatingChat(false);
        return;
      }

      // Set the selected model if it's different from current
      if (modelName !== selectedModel) {
        setSelectedModel(modelName);
      }

      // Create a new chat
      await createNewChat(title, firstMessage);

      if (title && title.trim()) {
        toast.success("New chat created", {
          description: `Created "${title}" with ${modelName}`,
        });
      } else {
        toast.success("New chat created", {
          description: "A new chat has been started.",
        });
      }
    } catch (error) {
      console.error("Error saving chat:", error);
      toast.error("Failed to save chat", {
        description: "There was an error saving your chat. Please try again.",
      });
    } finally {
      setIsCreatingChat(false);
      setShowNewChatDialog(false);
    }
  };

  // Send message to Ollama
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    if (!selectedModel) {
      setShowModelModal(true);
      return;
    }

    console.log("Sending message:", {
      inputMessage,
      selectedModel,
      currentChatId,
    });

    // Create new chat if none exists
    if (!currentChatId) {
      console.log("No current chat, creating new one...");
      const newChat = await createNewChat(undefined, inputMessage);
      if (newChat) {
        // Set the current chat ID and continue with sending the message
        setCurrentChatId(newChat.id);
        // Continue with the message sending process
      } else {
        console.error("Failed to create new chat");
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Get the current chat ID (might have been just created)
      const chatId =
        currentChatId || (await createNewChat(undefined, undefined))?.id;
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
          content: inputMessage,
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
          content: inputMessage,
        },
      ];

      console.log("Sending to Ollama API:", {
        model: selectedModel,
        messages: apiMessages,
      });
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

  // Fetch models and chats on component mount
  useEffect(() => {
    fetchModels();
    fetchChats();
    const interval = setInterval(fetchModels, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch chats when refresh trigger changes
  useEffect(() => {
    fetchChats();
  }, [chatRefreshTrigger]);

  return (
    <ErrorBoundary>
      <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-2 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Ollama Chat
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchModels}
                disabled={isLoading}
              >
                Refresh Models
              </Button>
            </div>
          </div>

          <div className="flex-1 flex gap-2 min-h-0 overflow-hidden">
            {/* Left Sidebar - Model Selection & Chat History */}
            <Card className="w-72 flex-shrink-0 flex flex-col bg-blue-25/30 dark:bg-blue-950/20 border-2 border-slate-300 dark:border-slate-600">
              <CardHeader>
                <CardTitle className="text-lg">Models & Chats</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden min-h-0">
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
                              {new Date(model.modified_at).toLocaleDateString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <ModelInfo model={selectedModelData} />

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

            {/* Main Chat Area */}
            <Card className="flex-1 flex flex-col min-w-0 min-h-0 max-h-full overflow-hidden chat-container bg-blue-25/30 dark:bg-blue-950/20 border-2 border-slate-300 dark:border-slate-600">
              <CardHeader className="border-b-2 border-slate-300 dark:border-slate-600 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {currentChat ? currentChat.title : "Chat"}
                    </CardTitle>
                    {currentChat && (
                      <p className="text-sm text-slate-500">
                        Using {currentChat.modelName} •{" "}
                        {new Date(currentChat.updatedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveAndStartNewChat}
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    New Chat
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Messages */}
                <ScrollArea
                  className="flex-1 mb-4 scrollbar-visible border-2 border-slate-300 dark:border-slate-600 rounded-md min-h-0 max-h-full chat-messages"
                  ref={scrollAreaRef}
                  type="always"
                >
                  <div className="space-y-4 p-4 min-h-0">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 text-slate-500">
                        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                          <span className="text-2xl">💬</span>
                        </div>
                        <h3 className="text-lg font-medium mb-2">
                          Start a conversation
                        </h3>
                        <p className="text-sm">
                          Select a model and send your first message to begin
                          chatting with Ollama.
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
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                <Brain className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              message.role === "user"
                                ? "bg-blue-500 text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </p>
                            <p className="text-xs mt-1 opacity-70">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                          {message.role === "user" && (
                            <Avatar className="w-8 h-8">
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
                        <Avatar className="w-8 h-8">
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

                {/* Input Area */}
                <div className="flex gap-2 flex-shrink-0">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
                    className="flex-1 resize-none border-2 border-slate-300 dark:border-slate-600"
                    rows={3}
                    disabled={!selectedModel || isLoading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={
                      !inputMessage.trim() || !selectedModel || isLoading
                    }
                    className="self-end"
                  >
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
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
    </ErrorBoundary>
  );
}
