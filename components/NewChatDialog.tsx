"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { X } from "lucide-react";

interface Model {
  name: string;
  size: string;
  modified_at: string;
}

interface NewChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, firstMessage?: string, modelName?: string) => void;
  isLoading?: boolean;
  models: Model[];
  selectedModel?: string;
}

export function NewChatDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  models,
  selectedModel,
}: NewChatDialogProps) {
  const [title, setTitle] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [selectedModelLocal, setSelectedModelLocal] = useState("");

  // Initialize with selected model when dialog opens
  useEffect(() => {
    if (isOpen && selectedModel) {
      setSelectedModelLocal(selectedModel);
    }
  }, [isOpen, selectedModel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedModelLocal && (title.trim() || firstMessage.trim())) {
      onSubmit(
        title?.trim() || "",
        firstMessage.trim() || undefined,
        selectedModelLocal
      );
      // Reset form
      setTitle("");
      setFirstMessage("");
      setSelectedModelLocal("");
    }
  };

  const handleCancel = () => {
    setTitle("");
    setFirstMessage("");
    setSelectedModelLocal("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Create New Chat</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-8 w-8 p-0 touch-manipulation"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <label
                htmlFor="model"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Model
              </label>
              <Select
                value={selectedModelLocal}
                onValueChange={setSelectedModelLocal}
                disabled={isLoading}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {models.map((model) => (
                    <SelectItem
                      key={model.name}
                      value={model.name}
                      className="py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-medium truncate">
                            {model.name}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {model.size} •{" "}
                            {new Date(model.modified_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label
                htmlFor="title"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Chat Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for this chat (optional)"
                disabled={isLoading}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-3">
              <label
                htmlFor="firstMessage"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                First Message (Optional)
              </label>
              <Textarea
                id="firstMessage"
                value={firstMessage}
                onChange={(e) => setFirstMessage(e.target.value)}
                placeholder="Enter your first message to start the conversation..."
                rows={4}
                disabled={isLoading}
                className="text-base resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 h-12 sm:h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !selectedModelLocal ||
                  (!title.trim() && !firstMessage.trim()) ||
                  isLoading
                }
                className="flex-1 h-12 sm:h-10"
              >
                {isLoading ? "Creating..." : "Create Chat"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
