import { NextRequest, NextResponse } from "next/server";
import { litellmService, ChatRequest } from "@/lib/litellm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    if (!body.model || !body.messages) {
      return NextResponse.json(
        { error: "Model and messages are required" },
        { status: 400 }
      );
    }

    // Prepare the chat request
    const chatRequest: ChatRequest = {
      model: body.model,
      messages: body.messages,
      stream: body.stream || false,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      top_p: body.top_p,
      frequency_penalty: body.frequency_penalty,
      presence_penalty: body.presence_penalty,
      stop: body.stop
    };

    // Handle streaming requests
    if (chatRequest.stream) {
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const encoder = new TextEncoder();
            
            // Use the streaming method for proper streaming
            for await (const chunk of litellmService.chatStream(chatRequest)) {
              const data = encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`);
              controller.enqueue(data);
            }
            
            // Send the done signal
            const doneData = encoder.encode('data: [DONE]\n\n');
            controller.enqueue(doneData);
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            const encoder = new TextEncoder();
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorData = encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
            controller.enqueue(errorData);
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Handle non-streaming requests
    const response = await litellmService.chat(chatRequest);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'models':
        const models = await litellmService.getAvailableModels();
        return NextResponse.json({ models });

      case 'providers':
        const providers = litellmService.getProviders();
        return NextResponse.json({ providers });

      case 'test':
        const providerName = searchParams.get('provider');
        if (!providerName) {
          return NextResponse.json(
            { error: "Provider parameter is required for test action" },
            { status: 400 }
          );
        }
        const isConnected = await litellmService.testProvider(providerName);
        return NextResponse.json({ connected: isConnected });

      case 'refresh-ollama':
        await litellmService.refreshOllamaModels();
        const refreshedModels = await litellmService.getAvailableModels();
        return NextResponse.json({ 
          message: "Ollama models refreshed successfully",
          models: refreshedModels 
        });

      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'models', 'providers', 'test', or 'refresh-ollama'" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Chat API GET error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 
 