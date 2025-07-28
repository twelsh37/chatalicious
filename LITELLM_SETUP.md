# LiteLLM Integration Setup Guide

This guide explains how to set up and use the LiteLLM integration in your Ollama Chat application. LiteLLM provides a unified interface for interacting with various AI model providers, including local Ollama models and external services like Anthropic, OpenAI, and Perplexity.

## Overview

The LiteLLM integration consists of several components:

- **LiteLLM Service** (`lib/litellm.ts`): Core service that handles communication with different model providers
- **API Routes** (`app/api/chat/route.ts`): REST API endpoints for chat completions
- **React Hook** (`lib/hooks/useLiteLLM.ts`): React hook for easy integration in frontend components
- **UI Components** (`components/ModelSelector.tsx`, `components/LiteLLMExample.tsx`): Ready-to-use UI components

## Supported Providers

### 1. Ollama (Local)
- **Type**: Local models
- **Configuration**: Automatically configured
- **Models**: llama2, llama2:13b, llama2:70b, codellama, mistral, mixtral
- **Environment Variables**: 
  - `OLLAMA_API_URL` (optional, defaults to `http://localhost:11434`)
  - `OLLAMA_DEFAULT_MODEL` (optional, defaults to `llama2`)

### 2. Anthropic (Claude)
- **Type**: External API
- **Configuration**: Requires API key
- **Models**: claude-3-opus-20240229, claude-3-sonnet-20240229, claude-3-haiku-20240307
- **Environment Variables**:
  - `ANTHROPIC_API_KEY` (required)
  - `ANTHROPIC_DEFAULT_MODEL` (optional, defaults to `claude-3-sonnet-20240229`)

### 3. OpenAI
- **Type**: External API
- **Configuration**: Requires API key
- **Models**: gpt-4, gpt-4-turbo, gpt-3.5-turbo
- **Environment Variables**:
  - `OPENAI_API_KEY` (required)
  - `OPENAI_DEFAULT_MODEL` (optional, defaults to `gpt-3.5-turbo`)

### 4. Perplexity
- **Type**: External API
- **Configuration**: Requires API key
- **Models**: sonar, sonar-pro, sonar-reasoning
- **Environment Variables**:
  - `PERPLEXITYAI_API_KEY` (required)
  - `PERPLEXITY_DEFAULT_MODEL` (optional, defaults to `perplexity/sonar`)

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in your project root and add the necessary environment variables:

```bash
# Ollama Configuration (optional - defaults provided)
OLLAMA_API_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=llama2

# Anthropic Configuration (required for Claude models)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_DEFAULT_MODEL=claude-3-sonnet-20240229

# OpenAI Configuration (required for GPT models)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_DEFAULT_MODEL=gpt-3.5-turbo

# Perplexity Configuration (required for Perplexity models)
PERPLEXITYAI_API_KEY=your_perplexity_api_key_here
PERPLEXITY_DEFAULT_MODEL=perplexity/sonar
```

### 2. Install Dependencies

The LiteLLM package is already included in your `package.json`. If you need to install it manually:

```bash
yarn add litellm
```

### 3. Start Ollama (for local models)

If you want to use local Ollama models, make sure Ollama is running:

```bash
# Install Ollama (if not already installed)
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama
ollama serve

# Pull a model (in a separate terminal)
ollama pull llama2
```

## Usage Examples

### 1. Basic Usage with React Hook

```tsx
import { useLiteLLM } from '@/lib/hooks/useLiteLLM';
import { ChatMessage } from '@/lib/litellm';

function MyComponent() {
  const { sendMessage, isLoading, error } = useLiteLLM({
    model: 'ollama/llama2',
    temperature: 0.7,
  });

  const handleSendMessage = async () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Hello, how are you?' }
    ];

    const response = await sendMessage(messages);
    console.log(response?.choices[0]?.message?.content);
  };

  return (
    <div>
      <button onClick={handleSendMessage} disabled={isLoading}>
        Send Message
      </button>
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

### 2. Streaming Usage

```tsx
import { useLiteLLM } from '@/lib/hooks/useLiteLLM';

function StreamingComponent() {
  const { sendMessageStream, isStreaming } = useLiteLLM();

  const handleStreamingMessage = async () => {
    const messages = [{ role: 'user', content: 'Tell me a story' }];
    
    const stream = sendMessageStream(messages, { model: 'anthropic/claude-3-sonnet-20240229' });
    
    for await (const response of stream) {
      const content = response.choices[0]?.message?.content || '';
      console.log('Streaming:', content);
    }
  };

  return (
    <button onClick={handleStreamingMessage} disabled={isStreaming}>
      {isStreaming ? 'Streaming...' : 'Start Streaming'}
    </button>
  );
}
```

### 3. Using the Model Selector Component

```tsx
import { ModelSelector } from '@/components/ModelSelector';

function ChatInterface() {
  const [selectedModel, setSelectedModel] = useState('ollama/llama2');

  return (
    <ModelSelector
      selectedModel={selectedModel}
      onModelChange={setSelectedModel}
    />
  );
}
```

### 4. Direct API Usage

```typescript
// Send a chat completion request
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'ollama/llama2',
    messages: [
      { role: 'user', content: 'Hello!' }
    ],
    temperature: 0.7,
    max_tokens: 1000,
  }),
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

## API Endpoints

### POST /api/chat
Send a chat completion request.

**Request Body:**
```json
{
  "model": "ollama/llama2",
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "stream": false,
  "temperature": 0.7,
  "max_tokens": 1000,
  "top_p": 1,
  "frequency_penalty": 0,
  "presence_penalty": 0
}
```

**Response:**
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "ollama/llama2",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 9,
    "completion_tokens": 12,
    "total_tokens": 21
  }
}
```

### GET /api/chat?action=models
Get all available models.

### GET /api/chat?action=providers
Get all configured providers.

### GET /api/chat?action=test&provider=ollama
Test connection to a specific provider.

## Model Naming Convention

Models are identified using the format: `provider/model-name`

Examples:
- `ollama/llama2` - Llama 2 model from Ollama
- `anthropic/claude-3-sonnet-20240229` - Claude 3 Sonnet from Anthropic
- `openai/gpt-4` - GPT-4 from OpenAI
- `perplexity/sonar` - Sonar from Perplexity
- `perplexity/sonar pro` - Sonar Pro from Perplexity  
- `perplexity/sonar-reasoning` - Sonar Reasoning from Perplexity

## Error Handling

The LiteLLM integration includes comprehensive error handling:

1. **Provider Configuration Errors**: When a provider is not properly configured
2. **API Key Errors**: When required API keys are missing
3. **Network Errors**: When unable to connect to external services
4. **Model Errors**: When a model is not available or fails to respond

Errors are returned in a consistent format:
```json
{
  "error": "Error description"
}
```

## Testing Your Setup

1. **Test Ollama**: Make sure Ollama is running and you have at least one model pulled
2. **Test External Providers**: Use the Model Selector component to test provider connections
3. **Test Chat**: Use the LiteLLMExample component to test chat functionality

## Troubleshooting

### Common Issues

1. **Ollama Connection Failed**
   - Ensure Ollama is running: `ollama serve`
   - Check the OLLAMA_API_URL environment variable
   - Verify the model is pulled: `ollama list`

2. **External Provider Errors**
   - Verify API keys are correctly set in environment variables
   - Check API key permissions and quotas
   - Ensure the provider is enabled in the configuration

3. **Model Not Found**
   - Check if the model name is correct
   - Verify the model is available for the selected provider
   - For Ollama models, ensure they are pulled locally

### Debug Mode

Enable debug logging by setting the environment variable:
```bash
DEBUG=litellm*
```

## Advanced Configuration

### Custom Providers

You can add custom providers by extending the LiteLLMService:

```typescript
import { litellmService } from '@/lib/litellm';

// Add a custom provider
litellmService.addProvider({
  name: 'custom-provider',
  type: 'custom',
  baseUrl: 'https://api.custom-provider.com',
  apiKey: 'your-api-key',
  models: ['model1', 'model2'],
  defaultModel: 'model1'
});
```

### Custom Model Configurations

Modify the `lib/config.ts` file to add custom model configurations or change default settings.

## Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **Environment Variables**: Use `.env.local` for local development
3. **Rate Limiting**: Implement rate limiting for production use
4. **Input Validation**: Always validate user input before sending to models

## Performance Optimization

1. **Caching**: Implement response caching for frequently asked questions
2. **Connection Pooling**: Use connection pooling for external API calls
3. **Streaming**: Use streaming for long responses to improve user experience
4. **Model Selection**: Choose appropriate models based on use case and performance requirements 
