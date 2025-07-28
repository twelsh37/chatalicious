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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <Card
        className="w-full max-w-md mx-auto max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
          <CardTitle className="text-lg sm:text-xl">
            No Model Selected
          </CardTitle>
          <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
            Please select a model to start your conversation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Available Models
            </label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
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
                      <Brain className="h-5 w-5 flex-shrink-0" />
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
          {models.length === 0 && (
            <div className="text-center py-6 text-slate-500 dark:text-slate-400">
              <Brain className="h-8 w-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-medium">No models found</p>
              <p className="text-xs mt-1">Make sure Ollama is running</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-3 justify-end px-4 sm:px-6 pb-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 sm:flex-none h-12 sm:h-10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedModel}
            className="flex-1 sm:flex-none h-12 sm:h-10 bg-blue-500 hover:bg-blue-600 text-white"
          >
            Start Chat
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
