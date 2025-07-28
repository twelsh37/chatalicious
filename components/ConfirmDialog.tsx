import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger",
}: ConfirmDialogProps) {
  // Handle escape key to close dialog
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

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: "text-red-500",
          confirmButton: "bg-red-500 hover:bg-red-600 text-white",
          border: "border-red-200",
        };
      case "warning":
        return {
          icon: "text-yellow-500",
          confirmButton: "bg-yellow-500 hover:bg-yellow-600 text-white",
          border: "border-yellow-200",
        };
      case "info":
        return {
          icon: "text-blue-500",
          confirmButton: "bg-blue-500 hover:bg-blue-600 text-white",
          border: "border-blue-200",
        };
      default:
        return {
          icon: "text-red-500",
          confirmButton: "bg-red-500 hover:bg-red-600 text-white",
          border: "border-red-200",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <Card
        className="w-full max-w-md mx-auto max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="text-center pb-4 px-4 sm:px-6">
          <div className="flex justify-center mb-3">
            <AlertTriangle className={`h-8 w-8 ${styles.icon}`} />
          </div>
          <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
          <CardDescription className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {description}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex gap-3 justify-end px-4 sm:px-6 pb-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-12 sm:h-10"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={`flex-1 h-12 sm:h-10 ${styles.confirmButton}`}
          >
            {confirmText}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
