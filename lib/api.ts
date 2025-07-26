export interface Model {
  name: string;
  size: string;
  modified_at: string;
  digest: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  images?: string[]; // Base64 encoded images for vision models
}

export interface ChatRequest {
  model: string;
  messages: Message[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
  };
}

export interface ChatResponse {
  model: string;
  created_at: string;
  message: {
    role: "assistant";
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface ModelsResponse {
  models: Model[];
}

const OLLAMA_API_URL =
  process.env.NEXT_PUBLIC_OLLAMA_API_URL || "http://localhost:11434";

class OllamaAPI {
  private baseUrl: string;

  constructor(baseUrl: string = OLLAMA_API_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async getModels(): Promise<ModelsResponse> {
    return this.request<ModelsResponse>("/api/tags");
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async generate(
    request: Omit<ChatRequest, "messages"> & { prompt: string }
  ): Promise<ChatResponse> {
    return this.request<ChatResponse>("/api/generate", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async pullModel(name: string): Promise<{ status: string }> {
    return this.request<{ status: string }>("/api/pull", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async deleteModel(name: string): Promise<{ status: string }> {
    return this.request<{ status: string }>("/api/delete", {
      method: "DELETE",
      body: JSON.stringify({ name }),
    });
  }

  async showModel(
    name: string
  ): Promise<{
    modelfile: string;
    parameters: string;
    template: string;
    system: string;
  }> {
    return this.request<{
      modelfile: string;
      parameters: string;
      template: string;
      system: string;
    }>(`/api/show`, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }
}

// Export a singleton instance
export const ollamaAPI = new OllamaAPI();

// Export the class for testing or custom instances
export { OllamaAPI };
