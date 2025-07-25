import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Brain } from "lucide-react";
import type { Model } from "@/lib/api";

interface ModelSelectionModalProps {
  isOpen: boolean;
  models: Model[];
  onModelSelect: (modelName: string) => void;
  onCancel: () => void;
}

export function ModelSelectionModal({
  isOpen,
  models,
  onModelSelect,
  onCancel,
}: ModelSelectionModalProps) {
  const [selectedModel, setSelectedModel] = useState<string>("");

  const handleConfirm = () => {
    if (selectedModel) {
      onModelSelect(selectedModel);
    }
  };

  // Handle escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <Card
        className="w-96 max-w-[90vw] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
          <CardTitle className="text-lg">No Model Selected</CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Please select a model to start your conversation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Available Models
            </label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.name} value={model.name}>
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs text-slate-500">
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
          {models.length === 0 && (
            <div className="text-center py-4 text-slate-500">
              <p className="text-sm">No models found</p>
              <p className="text-xs mt-1">Make sure Ollama is running</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedModel}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Start Chat
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
