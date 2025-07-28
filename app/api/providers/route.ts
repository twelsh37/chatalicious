import { NextResponse } from 'next/server';

export async function GET() {
  const providers = {
    ollama: {
      configured: true, // Always available locally
      hasApiKey: false, // Ollama doesn't use API keys
    },
    anthropic: {
      configured: !!process.env.ANTHROPIC_API_KEY,
      hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    },
    openai: {
      configured: !!process.env.OPENAI_API_KEY,
      hasApiKey: !!process.env.OPENAI_API_KEY,
    },
    perplexity: {
      configured: !!process.env.PERPLEXITYAI_API_KEY,
      hasApiKey: !!process.env.PERPLEXITYAI_API_KEY,
    },
  };

  return NextResponse.json({
    providers,
    timestamp: new Date().toISOString()
  });
} 
