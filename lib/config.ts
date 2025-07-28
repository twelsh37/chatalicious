// Environment variables configuration
export const config = {
  // Ollama configuration
  ollama: {
    baseUrl: process.env.OLLAMA_API_URL || "http://localhost:11434",
    defaultModel: process.env.OLLAMA_DEFAULT_MODEL || "llama2",
  },

  // Anthropic configuration
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultModel:
      process.env.ANTHROPIC_DEFAULT_MODEL || "claude-3-sonnet-20240229",
  },

  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    defaultModel: process.env.OPENAI_DEFAULT_MODEL || "gpt-3.5-turbo",
  },

  // Perplexity configuration
  perplexity: {
    apiKey: process.env.PERPLEXITYAI_API_KEY,
    defaultModel: process.env.PERPLEXITY_DEFAULT_MODEL || "perplexity/sonar",
  },

  // Default chat settings
  chat: {
    defaultTemperature: 0.7,
    defaultMaxTokens: 1000,
    defaultTopP: 1,
    defaultFrequencyPenalty: 0,
    defaultPresencePenalty: 0,
  },

  // Model configurations
  models: {
    // Ollama models
    ollama: [
      {
        id: "llama2",
        name: "Llama 2",
        size: "7B",
        description: "Meta's Llama 2 model",
      },
      {
        id: "llama2:13b",
        name: "Llama 2 13B",
        size: "13B",
        description: "Meta's Llama 2 13B model",
      },
      {
        id: "llama2:70b",
        name: "Llama 2 70B",
        size: "70B",
        description: "Meta's Llama 2 70B model",
      },
      {
        id: "codellama",
        name: "Code Llama",
        size: "7B",
        description: "Code generation model",
      },
      {
        id: "mistral:7b",
        name: "Mistral 7B",
        size: "7B",
        description: "Mistral AI model",
      },
      {
        id: "mixtral:8x7b",
        name: "Mixtral 8x7B",
        size: "8x7B",
        description: "Mixture of experts model",
      },
    ],

    // Anthropic models
    anthropic: [
      {
        id: "claude-3-opus-20240229",
        name: "Claude 3 Opus",
        size: "Unknown",
        description: "Most capable Claude model",
      },
      {
        id: "claude-3-sonnet-20240229",
        name: "Claude 3 Sonnet",
        size: "Unknown",
        description: "Balanced Claude model",
      },
      {
        id: "claude-3-haiku-20240307",
        name: "Claude 3 Haiku",
        size: "Unknown",
        description: "Fastest Claude model",
      },
    ],

    // OpenAI models
    openai: [
      {
        id: "gpt-4",
        name: "GPT-4",
        size: "Unknown",
        description: "OpenAI's GPT-4 model",
      },
      {
        id: "gpt-4-turbo",
        name: "GPT-4 Turbo",
        size: "Unknown",
        description: "Faster GPT-4 variant",
      },
      {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        size: "Unknown",
        description: "Fast and efficient model",
      },
    ],

    // Perplexity models
    perplexity: [
      {
        id: "sonar",
        name: "Sonar",
        size: "Unknown",
        description: "Fast inference model",
      },
      {
        id: "sonar-pro",
        name: "Sonar Pro",
        size: "Unknown",
        description: "Advanced model with enhanced capabilities",
      },
      {
        id: "sonar-reasoning",
        name: "Sonar Reasoning",
        size: "Unknown",
        description: "Reasoning-focused model",
      },
    ],
  },
};

// Helper function to get model info
export const getModelInfo = (modelId: string) => {
  const [provider, model] = modelId.includes("/")
    ? modelId.split("/")
    : ["ollama", modelId];
  const providerModels = config.models[provider as keyof typeof config.models];

  if (providerModels) {
    return providerModels.find((m) => m.id === model);
  }

  return null;
};

// Helper function to get all available models
export const getAllModels = () => {
  const allModels = [];

  for (const [provider, models] of Object.entries(config.models)) {
    for (const model of models) {
      allModels.push({
        ...model,
        provider,
        fullId: `${provider}/${model.id}`,
      });
    }
  }

  return allModels;
};

// Helper function to check if a provider is configured (server-side only)
export const isProviderConfigured = (provider: string): boolean => {
  switch (provider) {
    case "ollama":
      return true; // Ollama is always available locally
    case "anthropic":
      return !!config.anthropic.apiKey;
    case "openai":
      return !!config.openai.apiKey;
    case "perplexity":
      return !!config.perplexity.apiKey;
    default:
      return false;
  }
};

// Helper function to get default model for a provider
export const getDefaultModel = (provider: string): string => {
  switch (provider) {
    case "ollama":
      return config.ollama.defaultModel;
    case "anthropic":
      return config.anthropic.defaultModel;
    case "openai":
      return config.openai.defaultModel;
    case "perplexity":
      return config.perplexity.defaultModel;
    default:
      return config.ollama.defaultModel;
  }
};
