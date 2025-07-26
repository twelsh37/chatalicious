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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <Card
        className="w-96 max-w-[90vw] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <AlertTriangle className={`h-8 w-8 ${styles.icon}`} />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription className="text-sm text-slate-600">
            {description}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={`flex-1 ${styles.confirmButton}`}
          >
            {confirmText}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
