import { NextResponse } from 'next/server';
import { completion } from 'litellm';

export async function GET() {
  try {
    // Check environment variables
    const envVars = {
      PERPLEXITYAI_API_KEY: process.env.PERPLEXITYAI_API_KEY ? 'SET' : 'NOT SET',
      PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY ? 'SET' : 'NOT SET',
    };

    // Test LiteLLM with Perplexity - try different approaches
    let testResults = {};
    let errors = {};

    // Test 1: With perplexity/ prefix
    try {
      const response1 = await completion({
        model: 'perplexity/sonar',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      });
      testResults['perplexity/sonar'] = response1;
    } catch (err) {
      errors['perplexity/sonar'] = err instanceof Error ? err.message : String(err);
    }

    // Test 2: Without prefix
    try {
      const response2 = await completion({
        model: 'sonar',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      });
      testResults['sonar'] = response2;
    } catch (err) {
      errors['sonar'] = err instanceof Error ? err.message : String(err);
    }

    // Test 3: With explicit API key
    try {
      const response3 = await completion({
        model: 'sonar',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
        api_key: process.env.PERPLEXITYAI_API_KEY,
      });
      testResults['sonar_with_api_key'] = response3;
    } catch (err) {
      errors['sonar_with_api_key'] = err instanceof Error ? err.message : String(err);
    }

    return NextResponse.json({
      environment: envVars,
      testResults,
      errors,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 
