import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY ? 'SET' : 'NOT SET',
    OLLAMA_API_URL: process.env.OLLAMA_API_URL || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
  };

  return NextResponse.json({
    message: 'Environment variables status',
    envVars,
    timestamp: new Date().toISOString()
  });
} 
 