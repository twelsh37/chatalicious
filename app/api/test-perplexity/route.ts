import { NextResponse } from 'next/server';
import { completion } from 'litellm';

export async function POST(request: Request) {
  try {
    // Implement the Python code verbatim with our values
    // from litellm import completion
    // import os
    // os.environ['PERPLEXITYAI_API_KEY'] = ""
    // response = completion(
    //     model="perplexity/sonar-pro", 
    //     messages=messages,
    //     stream=True
    // )
    // for chunk in response:
    //     print(chunk)

    console.log('Test Perplexity API called with verbatim implementation');

    // Use the exact values from the Python code
    const messages = [{ role: 'user', content: 'Tell me about kites' }];
    const model = "perplexity/sonar-pro";
    const stream = true;

    console.log('Using values:', { model, stream, messages });
    console.log('Environment variable PERPLEXITYAI_API_KEY:', process.env.PERPLEXITYAI_API_KEY ? 'SET' : 'NOT SET');
    console.log('About to call completion() with:', {
      model,
      messages,
      stream,
      api_key: process.env.PERPLEXITYAI_API_KEY ? 'SET' : 'NOT SET'
    });

    if (stream) {
      // Handle streaming response - verbatim implementation
      try {
        console.log('🚀 About to call completion() - this is where it hangs...');
        const startTime = Date.now();
        
        const streamResponse = completion({
          model: model,
          messages: messages,
          stream: true,
          api_key: process.env.PERPLEXITYAI_API_KEY
        });
        
        console.log('✅ completion() returned after', Date.now() - startTime, 'ms');
        console.log('📦 streamResponse type:', typeof streamResponse);
        console.log('📦 streamResponse constructor:', streamResponse?.constructor?.name);
        console.log('📦 streamResponse keys:', Object.keys(streamResponse || {}));
        console.log('📦 Is async iterator?', typeof streamResponse?.[Symbol.asyncIterator] === 'function');

        const encoder = new TextEncoder();
        
        return new Response(
          new ReadableStream({
            async start(controller) {
              try {
                console.log('🔄 Starting to process streamResponse...');
                
                // Since streamResponse is a Promise, we need to await it first
                const resolvedResponse = await streamResponse;
                console.log('✅ Resolved response type:', typeof resolvedResponse);
                console.log('✅ Resolved response:', resolvedResponse);
                
                // Handle the resolved response
                if (resolvedResponse && typeof resolvedResponse[Symbol.asyncIterator] === 'function') {
                  // It's an async iterator
                  console.log('🔄 Processing as async iterator...');
                  for await (const chunk of resolvedResponse) {
                    console.log('📦 Chunk:', chunk);
                    const data = encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`);
                    controller.enqueue(data);
                  }
                } else {
                  // It's a single response
                  console.log('🔄 Processing as single response...');
                  const data = encoder.encode(`data: ${JSON.stringify(resolvedResponse)}\n\n`);
                  controller.enqueue(data);
                }
                const doneData = encoder.encode('data: [DONE]\n\n');
                controller.enqueue(doneData);
                controller.close();
              } catch (error) {
                console.error('Streaming error:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                const errorData = encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
                controller.enqueue(errorData);
                controller.close();
              }
            }
          }),
          {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          }
        );
      } catch (error) {
        console.error('Completion error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        );
      }
    } else {
      // Handle non-streaming response
      const response = await completion({
        model: model,
        messages: messages,
        api_key: process.env.PERPLEXITYAI_API_KEY
      });

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error('Test Perplexity API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
