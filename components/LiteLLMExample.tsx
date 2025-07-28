'use client';

import { useState } from 'react';
import { useLiteLLM } from '@/lib/hooks/useLiteLLM';
import { ModelSelector } from '@/components/ModelSelector';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, Bot, User } from 'lucide-react';
import { ChatMessage } from '@/lib/litellm';

export function LiteLLMExample() {
  const [selectedModel, setSelectedModel] = useState('ollama/llama2');
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [testError, setTestError] = useState<string | null>(null);
  const [isTestStreaming, setIsTestStreaming] = useState(false);

  const {
    isLoading,
    isStreaming,
    error,
    sendMessageStream,
    clearError
  } = useLiteLLM({
    model: selectedModel,
    onError: (error) => {
      console.error('LiteLLM error:', error);
    }
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setStreamingResponse('');

    try {
      // For demonstration, we'll use streaming
      const stream = sendMessageStream(newMessages, { model: selectedModel });
      
      let accumulatedContent = '';
      
      for await (const response of stream) {
        // Handle different response structures safely
        let content = '';
        if (response.choices && response.choices.length > 0 && response.choices[0]?.message?.content) {
          content = response.choices[0].message.content;
        } else if (typeof response === 'string') {
          content = response;
        }
        
        if (content) {
          accumulatedContent += content;
          setStreamingResponse(accumulatedContent);
        }
      }

      // Add the complete response to messages
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: accumulatedContent
      };
      setMessages(prev => [...prev, assistantMessage]);
      setStreamingResponse('');

    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setStreamingResponse('');
    clearError();
  };

  const testPerplexityDirect = async () => {
    try {
      setTestError(null);
      setIsTestStreaming(true);
      setStreamingResponse('');

      // Test direct Perplexity API call (equivalent to the Python code)
      const response = await fetch('/api/test-perplexity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Tell me about kites' }],
          model: 'perplexity/sonar-pro',
          stream: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body available for streaming');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data.trim() === '[DONE]') {
                // Add the complete response to messages
                const assistantMessage: ChatMessage = {
                  role: 'assistant',
                  content: accumulatedContent
                };
                setMessages(prev => [...prev, assistantMessage]);
                setStreamingResponse('');
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices && parsed.choices[0]?.delta?.content) {
                  const content = parsed.choices[0].delta.content;
                  accumulatedContent += content;
                  setStreamingResponse(accumulatedContent);
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Test Perplexity failed:', error);
      setTestError(error instanceof Error ? error.message : 'Test failed');
    } finally {
      setIsTestStreaming(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">LiteLLM Chat Example</h1>
        <p className="text-muted-foreground">
          Test different AI models and providers with a unified interface
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Selector */}
        <div className="lg:col-span-1">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Chat
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {selectedModel}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearChat}
                    disabled={isLoading || isStreaming}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testPerplexityDirect}
                    disabled={isLoading || isStreaming || isTestStreaming}
                  >
                    Test Perplexity
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Send messages to test the selected model
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`flex gap-2 max-w-[80%] ${
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-500 text-white'
                      }`}>
                        {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div
                        className={`p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Streaming Response */}
                {isStreaming && streamingResponse && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex gap-2 max-w-[80%]">
                      <div className="w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="p-3 rounded-lg bg-gray-100 text-gray-900">
                        {streamingResponse}
                        <Loader2 className="w-4 h-4 animate-spin inline ml-2" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <Alert>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Input */}
              <div className="flex gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  className="flex-1"
                  rows={3}
                  disabled={isLoading || isStreaming}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading || isStreaming}
                  className="self-end"
                >
                  {isLoading || isStreaming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
 