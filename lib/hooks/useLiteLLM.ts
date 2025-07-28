import { useState, useCallback, useRef } from 'react';
import { ChatMessage, ChatRequest, ChatResponse } from '@/lib/litellm';

interface UseLiteLLMOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  onResponse?: (response: ChatResponse) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onComplete?: () => void;
}

interface UseLiteLLMReturn {
  // State
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  models: unknown[];
  providers: unknown[];
  providerConfig: Record<string, { configured: boolean; hasApiKey: boolean }>;
  
  // Actions
  sendMessage: (messages: ChatMessage[], options?: Partial<ChatRequest>) => Promise<ChatResponse | null>;
  sendMessageStream: (messages: ChatMessage[], options?: Partial<ChatRequest>) => AsyncGenerator<ChatResponse>;
  getModels: () => Promise<void>;
  getProviders: () => Promise<void>;
  getProviderConfig: () => Promise<void>;
  testProvider: (providerName: string) => Promise<boolean>;
  
  // Utilities
  clearError: () => void;
  reset: () => void;
}

export function useLiteLLM(options: UseLiteLLMOptions = {}): UseLiteLLMReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<unknown[]>([]);
  const [providers, setProviders] = useState<unknown[]>([]);
  const [providerConfig, setProviderConfig] = useState<Record<string, { configured: boolean; hasApiKey: boolean }>>({});
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsStreaming(false);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(async (
    messages: ChatMessage[], 
    requestOptions: Partial<ChatRequest> = {}
  ): Promise<ChatResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);
      options.onStart?.();

      const request: ChatRequest = {
        model: requestOptions.model || options.model || 'ollama/llama2',
        messages,
        stream: false,
        temperature: requestOptions.temperature ?? options.temperature ?? 0.7,
        max_tokens: requestOptions.max_tokens ?? options.max_tokens ?? 1000,
        top_p: requestOptions.top_p ?? options.top_p ?? 1,
        frequency_penalty: requestOptions.frequency_penalty ?? options.frequency_penalty ?? 0,
        presence_penalty: requestOptions.presence_penalty ?? options.presence_penalty ?? 0,
        stop: requestOptions.stop,
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      options.onResponse?.(data);
      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      options.onError?.(err instanceof Error ? err : new Error(errorMessage));
      return null;
    } finally {
      setIsLoading(false);
      options.onComplete?.();
    }
  }, [options]);

  const sendMessageStream = useCallback(async function* (
    messages: ChatMessage[], 
    requestOptions: Partial<ChatRequest> = {}
  ): AsyncGenerator<ChatResponse> {
    try {
      setIsStreaming(true);
      setError(null);
      options.onStart?.();

      // Create abort controller for streaming
      abortControllerRef.current = new AbortController();

      const request: ChatRequest = {
        model: requestOptions.model || options.model || 'ollama/llama2',
        messages,
        stream: true,
        temperature: requestOptions.temperature ?? options.temperature ?? 0.7,
        max_tokens: requestOptions.max_tokens ?? options.max_tokens ?? 1000,
        top_p: requestOptions.top_p ?? options.top_p ?? 1,
        frequency_penalty: requestOptions.frequency_penalty ?? options.frequency_penalty ?? 0,
        presence_penalty: requestOptions.presence_penalty ?? options.presence_penalty ?? 0,
        stop: requestOptions.stop,
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: abortControllerRef.current.signal,
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
                return;
              }
              
              try {
                const parsed: ChatResponse = JSON.parse(data);
                yield parsed;
                options.onResponse?.(parsed);
              } catch (parseError) {
                console.warn('Failed to parse streaming data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      options.onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsStreaming(false);
      options.onComplete?.();
      abortControllerRef.current = null;
    }
  }, [options]);

  const getModels = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/chat?action=models');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setModels(data.models || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch models';
      setError(errorMessage);
    }
  }, []);

  const getProviders = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/chat?action=providers');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setProviders(data.providers || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch providers';
      setError(errorMessage);
    }
  }, []);

  const getProviderConfig = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/providers');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setProviderConfig(data.providers || {});
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch provider config';
      setError(errorMessage);
    }
  }, []);

  const testProvider = useCallback(async (providerName: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch(`/api/chat?action=test&provider=${providerName}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.connected || false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to test provider';
      setError(errorMessage);
      return false;
    }
  }, []);

  return {
    // State
    isLoading,
    isStreaming,
    error,
    models,
    providers,
    providerConfig,
    
    // Actions
    sendMessage,
    sendMessageStream,
    getModels,
    getProviders,
    getProviderConfig,
    testProvider,
    
    // Utilities
    clearError,
    reset,
  };
} 
 