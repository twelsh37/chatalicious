import { completion } from "litellm";

// Model provider configurations
export interface ModelProvider {
  name: string;
  type: "ollama" | "anthropic" | "openai" | "perplexity" | "custom";
  baseUrl?: string;
  apiKey?: string;
  models: string[];
  defaultModel?: string;
}

// Chat message interface
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  images?: string[]; // Base64 encoded images for vision models
}

// Chat request interface
export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
}

// Chat response interface
export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Model information interface
export interface ModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  permission: unknown[];
  root: string;
  parent: string | null;
}

// LiteLLM service class
export class LiteLLMService {
  private providers: Map<string, ModelProvider>;
  private defaultProvider: string;

  constructor() {
    this.providers = new Map();
    this.defaultProvider = "ollama";
    // Initialize providers synchronously, but fetch Ollama models asynchronously
    this.initializeProvidersSync();
    // Start the async initialization
    this.initializeProvidersAsync();
  }

  private initializeProvidersSync() {
    // Initialize Ollama provider with empty models (will be populated async)
    const ollamaProvider: ModelProvider = {
      name: "ollama",
      type: "ollama",
      baseUrl: process.env.OLLAMA_API_URL || "http://localhost:11434",
      models: [], // Will be populated dynamically
      defaultModel: process.env.OLLAMA_DEFAULT_MODEL || "llama2",
    };
    this.providers.set("ollama", ollamaProvider);

    // Initialize Anthropic provider
    if (process.env.ANTHROPIC_API_KEY) {
      const anthropicProvider: ModelProvider = {
        name: "anthropic",
        type: "anthropic",
        apiKey: process.env.ANTHROPIC_API_KEY,
        models: [
          "claude-3-opus-20240229",
          "claude-3-sonnet-20240229",
          "claude-3-haiku-20240307",
        ],
        defaultModel: "claude-3-sonnet-20240229",
      };
      this.providers.set("anthropic", anthropicProvider);
    }

    // Initialize OpenAI provider
    if (process.env.OPENAI_API_KEY) {
      const openaiProvider: ModelProvider = {
        name: "openai",
        type: "openai",
        apiKey: process.env.OPENAI_API_KEY,
        models: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
        defaultModel: "gpt-3.5-turbo",
      };
      this.providers.set("openai", openaiProvider);
    }

    // Initialize Perplexity provider
    if (process.env.PERPLEXITY_API_KEY) {
      const perplexityProvider: ModelProvider = {
        name: "perplexity",
        type: "perplexity",
        apiKey: process.env.PERPLEXITY_API_KEY,
        models: ["sonar", "sonar-pro", "sonar-reasoning"],
        defaultModel: process.env.PERPLEXITY_DEFAULT_MODEL || "sonar",
      };
      this.providers.set("perplexity", perplexityProvider);
    }
  }

  private async initializeProvidersAsync() {
    // Fetch Ollama models after initialization
    await this.refreshOllamaModels();
  }

  // Fetch models from Ollama API
  private async fetchOllamaModels(): Promise<string[]> {
    try {
      const ollamaProvider = this.providers.get("ollama");
      if (!ollamaProvider?.baseUrl) {
        console.error("Ollama base URL not configured");
        return [];
      }

      const response = await fetch(`${ollamaProvider.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch Ollama models: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const models = data.models || [];

      // Extract model names from the response
      return models.map((model: { name: string }) => model.name);
    } catch (error) {
      console.error("Error fetching Ollama models:", error);
      return [];
    }
  }

  // Refresh Ollama models
  async refreshOllamaModels(): Promise<void> {
    try {
      const ollamaProvider = this.providers.get("ollama");
      if (ollamaProvider) {
        const models = await this.fetchOllamaModels();
        ollamaProvider.models = models;
        console.log("Ollama models refreshed:", models);
      }
    } catch (error) {
      console.error("Error refreshing Ollama models:", error);
    }
  }

  // Get all available providers
  getProviders(): ModelProvider[] {
    return Array.from(this.providers.values());
  }

  // Get a specific provider
  getProvider(name: string): ModelProvider | undefined {
    return this.providers.get(name);
  }

  // Find provider by model name
  private findProviderByModel(modelName: string): string {
    for (const [providerName, provider] of this.providers) {
      // Check if the model name matches directly
      if (provider.models.includes(modelName)) {
        return providerName;
      }
      // Check if the model name includes the provider prefix
      if (provider.models.includes(`${providerName}/${modelName}`)) {
        return providerName;
      }
      // Check if the model name is a full path that matches any of our models
      for (const providerModel of provider.models) {
        if (
          providerModel === modelName ||
          providerModel.endsWith(`/${modelName}`)
        ) {
          return providerName;
        }
      }
    }
    // If not found, return default provider
    return this.defaultProvider;
  }

  // Get all available models across all providers
  async getAvailableModels(): Promise<ModelInfo[]> {
    const models: ModelInfo[] = [];

    for (const provider of this.providers.values()) {
      try {
        if (provider.type === "ollama") {
          // For Ollama, use the dynamically fetched models
          provider.models.forEach((modelName) => {
            models.push({
              id: `${provider.name}/${modelName}`,
              object: "model",
              created: Date.now(),
              owned_by: provider.name,
              permission: [],
              root: modelName,
              parent: null,
            });
          });
        } else {
          // For other providers, we can fetch models from their API
          // This would require additional implementation based on each provider's API
          provider.models.forEach((modelName) => {
            // Check if the model name already includes the provider prefix
            const modelId = modelName.includes("/")
              ? modelName
              : `${provider.name}/${modelName}`;
            const rootName = modelName.includes("/")
              ? modelName.split("/")[1]
              : modelName;

            models.push({
              id: modelId,
              object: "model",
              created: Date.now(),
              owned_by: provider.name,
              permission: [],
              root: rootName,
              parent: null,
            });
          });
        }
      } catch (error) {
        console.error(
          `Error fetching models for provider ${provider.name}:`,
          error
        );
      }
    }

    return models;
  }

  // Send a chat completion request
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      // Determine the provider from the model name
      let providerName: string;
      let modelName: string;

      if (request.model.includes("/")) {
        [providerName, modelName] = request.model.split("/");
      } else {
        // If no provider prefix, try to find the provider by model name
        providerName = this.findProviderByModel(request.model);
        modelName = request.model;
      }

      const provider = this.providers.get(providerName);
      if (!provider) {
        throw new Error(`Provider '${providerName}' not found`);
      }

      console.log("LiteLLM Debug:", {
        originalModel: request.model,
        providerName,
        modelName,
        providerType: provider.type,
      });

      // Prepare the request for LiteLLM
      // LiteLLM expects different formats for different providers
      let litellmModelName: string;
      if (provider.type === "ollama") {
        litellmModelName = `ollama/${modelName}`;
      } else if (provider.type === "perplexity") {
        // For Perplexity, use just the model name (no prefix)
        litellmModelName = modelName;
      } else {
        // For other external providers, use the model name directly without prefix
        litellmModelName = modelName;
      }

      const litellmRequest = {
        model: litellmModelName,
        messages: request.messages,
        stream: request.stream || false,
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || 1000,
        top_p: request.top_p || 1,
        frequency_penalty: request.frequency_penalty || 0,
        presence_penalty: request.presence_penalty || 0,
        stop: request.stop,
        api_key: provider.apiKey, // Explicitly pass the API key
        api_base:
          provider.type === "perplexity"
            ? "https://api.perplexity.ai"
            : undefined,
      };

      console.log("🔍 LiteLLM Request Details:");
      console.log("  - Provider type:", provider.type);
      console.log("  - Original model name:", modelName);
      console.log("  - LiteLLM model name:", litellmModelName);
      console.log("  - API key present:", !!provider.apiKey);
      console.log("  - Stream:", request.stream || false);
      console.log("  - Messages count:", request.messages.length);
      console.log("  - Full request:", JSON.stringify(litellmRequest, null, 2));

      // Make the request through LiteLLM for all providers
      console.log("🚀 About to call completion() - this is where it hangs...");
      const startTime = Date.now();

      const response = await completion(litellmRequest);

      console.log(
        "✅ completion() returned after",
        Date.now() - startTime,
        "ms"
      );
      console.log("📦 Response type:", typeof response);
      console.log("📦 Response constructor:", response?.constructor?.name);
      console.log("📦 Response keys:", Object.keys(response || {}));

      return response as ChatResponse;
    } catch (error) {
      console.error("Error in chat completion:", error);
      throw error;
    }
  }

  // Stream chat completion
  async *chatStream(request: ChatRequest): AsyncGenerator<ChatResponse> {
    try {
      // Determine the provider from the model name
      let providerName: string;
      let modelName: string;

      if (request.model.includes("/")) {
        [providerName, modelName] = request.model.split("/");
      } else {
        providerName = this.findProviderByModel(request.model);
        modelName = request.model;
      }

      const provider = this.providers.get(providerName);
      if (!provider) {
        throw new Error(`Provider '${providerName}' not found`);
      }

      // Prepare the request for LiteLLM
      let litellmModelName: string;
      if (provider.type === "ollama") {
        litellmModelName = `ollama/${modelName}`;
      } else if (provider.type === "perplexity") {
        // For Perplexity, use just the model name (no prefix)
        litellmModelName = modelName;
      } else {
        // For other external providers, use the model name directly without prefix
        litellmModelName = modelName;
      }

      const litellmRequest = {
        model: litellmModelName,
        messages: request.messages,
        stream: true,
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || 1000,
        top_p: request.top_p || 1,
        frequency_penalty: request.frequency_penalty || 0,
        presence_penalty: request.presence_penalty || 0,
        stop: request.stop,
        api_key: provider.apiKey, // Explicitly pass the API key
        api_base:
          provider.type === "perplexity"
            ? "https://api.perplexity.ai"
            : undefined,
      };

      console.log("🔍 LiteLLM Streaming Request Details:");
      console.log("  - Provider type:", provider.type);
      console.log("  - Original model name:", modelName);
      console.log("  - LiteLLM model name:", litellmModelName);
      console.log("  - API key present:", !!provider.apiKey);
      console.log("  - Stream: true");
      console.log("  - Messages count:", request.messages.length);
      console.log("  - Full request:", JSON.stringify(litellmRequest, null, 2));

      // Use LiteLLM for all providers including Perplexity
      console.log(
        "🚀 About to call completion() for streaming - this is where it hangs..."
      );
      const startTime = Date.now();

      const response = await completion(litellmRequest);

      console.log(
        "✅ completion() for streaming returned after",
        Date.now() - startTime,
        "ms"
      );
      console.log("📦 Streaming response type:", typeof response);
      console.log(
        "📦 Streaming response constructor:",
        response?.constructor?.name
      );
      console.log("📦 Streaming response keys:", Object.keys(response || {}));
      console.log(
        "📦 Is async iterator?",
        typeof (response as any)?.[Symbol.asyncIterator] === "function"
      );

      // Since response might be a Promise, we need to await it
      if (response && typeof (response as any).then === "function") {
        console.log("🔄 Response is a Promise, awaiting it...");
        const resolvedResponse = await (response as any);
        console.log("✅ Resolved streaming response:", resolvedResponse);
        yield resolvedResponse as ChatResponse;
      } else {
        console.log("🔄 Response is not a Promise, yielding directly...");
        yield response as ChatResponse;
      }
    } catch (error) {
      console.error("Error in chat stream:", error);
      throw error;
    }
  }

  // Add a custom provider
  addProvider(provider: ModelProvider): void {
    this.providers.set(provider.name, provider);
  }

  // Remove a provider
  removeProvider(name: string): boolean {
    return this.providers.delete(name);
  }

  // Set the default provider
  setDefaultProvider(name: string): void {
    if (this.providers.has(name)) {
      this.defaultProvider = name;
    } else {
      throw new Error(`Provider '${name}' not found`);
    }
  }

  // Get the default provider
  getDefaultProvider(): string {
    return this.defaultProvider;
  }

  // Test connection to a provider
  async testProvider(name: string): Promise<boolean> {
    const provider = this.providers.get(name);
    if (!provider) {
      return false;
    }

    try {
      // Send a simple test message
      const testRequest: ChatRequest = {
        model: `${name}/${provider.defaultModel || provider.models[0]}`,
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 10,
      };

      await this.chat(testRequest);
      return true;
    } catch (error) {
      console.error(`Provider test failed for ${name}:`, error);
      return false;
    }
  }
}

// Export a singleton instance
export const litellmService = new LiteLLMService();

// Export utility functions
export const getModelDisplayName = (modelId: string): string => {
  const [provider, model] = modelId.includes("/")
    ? modelId.split("/")
    : ["ollama", modelId];
  return `${provider}/${model}`;
};

export const getProviderFromModel = (modelId: string): string => {
  return modelId.includes("/") ? modelId.split("/")[0] : "ollama";
};

export const getModelNameFromId = (modelId: string): string => {
  return modelId.includes("/") ? modelId.split("/")[1] : modelId;
};
