import { Badge } from "@/components/ui/badge";
import { type Model } from "@/lib/api";
import { Eye, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModelInfoTooltipProps {
  model: Model | null;
  isVisionModel?: boolean;
  children: React.ReactNode;
}

export function ModelInfoTooltip({ 
  model, 
  isVisionModel = false, 
  children 
}: ModelInfoTooltipProps) {
  if (!model) {
    return <>{children}</>;
  }

  const formatFileSize = (size: string) => {
    const bytes = parseInt(size);
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side="right" 
          sideOffset={16}
          className="w-80 p-4 space-y-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              <h3 className="font-semibold text-sm">Model Information</h3>
            </div>
            
            <div className="space-y-2">
              <div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Name:</span>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {model.name}
                </p>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Size:</span>
                <div className="mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {formatFileSize(model.size)}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Last Modified:</span>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {formatDate(model.modified_at)}
                </p>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Digest:</span>
                <p className="text-xs font-mono text-slate-500 break-all">
                  {model.digest}
                </p>
              </div>

              {isVisionModel && (
                <div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Capabilities:</span>
                  <div className="mt-1">
                    <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                      <Eye className="h-3 w-3" />
                      Vision & Images
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 
