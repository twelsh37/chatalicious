"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Brain, Zap } from "lucide-react";

export function Navigation() {
  return (
    <nav className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center space-x-4">
        <Link href="/" className="flex items-center space-x-2">
          <Brain className="h-6 w-6" />
          <span className="font-bold text-xl hidden sm:inline">
            Ollama Chat
          </span>
          <span className="font-bold text-lg sm:hidden">Chat</span>
        </Link>
      </div>

      <div className="flex items-center space-x-2">
        <Link href="/litellm-demo">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">LiteLLM Demo</span>
            <span className="sm:hidden">Demo</span>
          </Button>
        </Link>
      </div>
    </nav>
  );
}
