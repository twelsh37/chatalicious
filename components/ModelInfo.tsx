import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Model } from "@/lib/api";

interface ModelInfoProps {
  model: Model | null;
}

export function ModelInfo({ model }: ModelInfoProps) {
  if (!model) {
    return (
      <Card className="bg-blue-25/30 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-lg">Model Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            Select a model to view details
          </p>
        </CardContent>
      </Card>
    );
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
    <Card className="bg-blue-25/30 dark:bg-blue-950/20">
      <CardHeader>
        <CardTitle className="text-lg">Model Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium text-sm mb-2">Name</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {model.name}
          </p>
        </div>

        <div>
          <h3 className="font-medium text-sm mb-2">Size</h3>
          <Badge variant="secondary">{formatFileSize(model.size)}</Badge>
        </div>

        <div>
          <h3 className="font-medium text-sm mb-2">Last Modified</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {formatDate(model.modified_at)}
          </p>
        </div>

        <div>
          <h3 className="font-medium text-sm mb-2">Digest</h3>
          <p className="text-xs font-mono text-slate-500 break-all">
            {model.digest}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
