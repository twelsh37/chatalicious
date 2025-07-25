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
    if (title.trim() && selectedModelLocal) {
      onSubmit(
        title.trim(),
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-96 max-w-[90vw] mx-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Create New Chat</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
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
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
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
                placeholder="Enter a title for this chat"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
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
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!title.trim() || !selectedModelLocal || isLoading}
                className="flex-1"
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
