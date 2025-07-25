# Ollama Chat - Web Interface

A modern, responsive web-based chat interface for local Ollama models built with Next.js, TypeScript, and Shadcn UI.

## 🚀 Features

- **Model Selection**: Browse and select from all available local Ollama models
- **Real-time Chat**: Interactive chat interface with message history
- **Chat History**: Persistent conversation storage using SQLite database
- **Context Preservation**: Maintain conversation context across sessions
- **Chat Management**: Create, rename, and delete conversations
- **Connection Status**: Visual indicator showing connection to Ollama server
- **Responsive Design**: Beautiful, modern UI that works on desktop and mobile
- **Dark Mode Support**: Automatic dark/light mode based on system preferences
- **Auto-scroll**: Messages automatically scroll to the latest conversation
- **Loading States**: Visual feedback during message processing
- **Keyboard Shortcuts**: Press Enter to send, Shift+Enter for new lines

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **State Management**: React Hooks
- **Database**: SQLite with Drizzle ORM
- **API**: Ollama REST API

## 📋 Prerequisites

Before running this application, make sure you have:

1. **Node.js** (version 18 or higher)
2. **Ollama** installed and running locally
3. **Yarn** package manager

## 🚀 Getting Started

### 1. Install Ollama

First, install Ollama on your system:

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai/download
```

### 2. Start Ollama

```bash
ollama serve
```

### 3. Pull a Model

Download a model to test with:

```bash
# Example: Pull Llama 2
ollama pull llama2

# Or pull a smaller model for testing
ollama pull llama2:7b
```

### 4. Clone and Setup the Project

```bash
# Clone the repository
git clone <your-repo-url>
cd ollama-chat

# Install dependencies
yarn install

# Start the development server
yarn dev
```

### 5. Open the Application

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 Usage

1. **Select a Model**: Choose from the dropdown in the middle sidebar to select an available Ollama model
2. **Start a New Chat**: Click the "+" button in the chat history sidebar to create a new conversation
3. **Chat with Context**: Type your message and press Enter - the conversation will be saved automatically
4. **Manage Chats**: Use the chat history sidebar to switch between conversations, rename, or delete chats
5. **View History**: All messages are displayed in the chat area with timestamps and conversation context
6. **Monitor Connection**: The connection status badge shows if Ollama is reachable

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Ollama API URL (default: http://localhost:11434)
NEXT_PUBLIC_OLLAMA_API_URL=http://localhost:11434

# Optional: Custom port for Ollama
OLLAMA_PORT=11434
```

### Customizing the API Endpoint

If your Ollama instance is running on a different host or port, you can modify the API calls in `app/page.tsx`:

```typescript
const OLLAMA_API_URL = process.env.NEXT_PUBLIC_OLLAMA_API_URL || 'http://localhost:11434';
```

## 🏗️ Project Structure

```
ollama-chat/
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Main chat interface
│   └── api/                 # API routes
│       ├── chats/           # Chat management endpoints
│       ├── ollama/          # Ollama API proxy
│       └── ...
├── components/
│   ├── ui/                  # Shadcn UI components
│   ├── ChatList.tsx         # Chat history sidebar
│   ├── ModelInfo.tsx        # Model information display
│   ├── LoadingSpinner.tsx   # Loading component
│   └── ErrorBoundary.tsx    # Error handling
├── lib/
│   ├── api.ts               # Ollama API utilities
│   ├── utils.ts             # Utility functions
│   └── db/                  # Database layer
│       ├── index.ts         # Database connection
│       ├── schema.ts        # Database schema
│       └── queries.ts       # Database queries
├── drizzle/                 # Database migrations
├── public/                  # Static assets
└── package.json
```

## 🎨 Customization

### Styling

The application uses Tailwind CSS for styling. You can customize the appearance by modifying:

- `app/globals.css` - Global styles and CSS variables
- Component-specific classes in `app/page.tsx`
- Shadcn UI theme configuration in `components.json`

### Database Management

The application uses SQLite with Drizzle ORM for data persistence:

```bash
# Generate database migrations
yarn db:generate

# Apply migrations
yarn db:migrate

# Open database studio (optional)
yarn db:studio
```

### Adding New Features

To extend the application, consider adding:

- **Model Management**: Pull, delete, and manage models directly from the UI
- **Export Conversations**: Save chat history as markdown or JSON
- **System Prompts**: Configure custom system prompts for different models
- **Streaming Responses**: Implement real-time streaming for faster responses
- **Chat Search**: Search through conversation history
- **Chat Categories**: Organize conversations with tags or folders

## 🔍 API Reference

The application uses the following Ollama API endpoints:

- `GET /api/tags` - List available models
- `POST /api/chat` - Send chat messages

For more information, see the [Ollama API documentation](https://github.com/ollama/ollama/blob/main/docs/api.md).

## 🐛 Troubleshooting

### Common Issues

1. **"No models found"**
   - Ensure Ollama is running: `ollama serve`
   - Check if you have models installed: `ollama list`
   - Pull a model: `ollama pull llama2`

2. **Connection refused**
   - Verify Ollama is running on port 11434
   - Check firewall settings
   - Ensure no other service is using the port

3. **CORS errors**
   - Ollama should handle CORS automatically
   - If issues persist, check browser console for specific errors

### Debug Mode

Enable debug logging by adding this to your browser console:

```javascript
localStorage.setItem('debug', 'ollama-chat:*');
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai) for the amazing local LLM platform
- [Shadcn UI](https://ui.shadcn.com) for the beautiful component library
- [Next.js](https://nextjs.org) for the powerful React framework
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework

## 📞 Support

If you encounter any issues or have questions:

1. Check the [troubleshooting section](#troubleshooting)
2. Search existing [issues](../../issues)
3. Create a new issue with detailed information

---

**Happy chatting with your local AI models! 🤖💬**
