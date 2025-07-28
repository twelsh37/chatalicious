# Environment Variables Configuration

Create a `.env.local` file in your project root with the following variables:

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

# Database Configuration (if using SQLite)
DATABASE_URL=file:./local.db

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

## Getting API Keys

### Anthropic (Claude)
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env.local` file

### OpenAI
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env.local` file

### Perplexity
1. Visit [Perplexity AI](https://www.perplexity.ai/)
2. Sign up for an account
3. Navigate to API section
4. Generate an API key
5. Copy the key to your `.env.local` file

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your API keys secure and don't share them
- Consider using environment variable management services in production
- Regularly rotate your API keys for security 
