# Troubleshooting Guide

## Common Issues and Solutions

### 1. "Failed to fetch" Error when Creating Chats

**Symptoms:**
- Error: `TypeError: Failed to fetch` when trying to create a new chat
- API health check shows "API Error" badge
- Console shows network errors

**Causes:**
- Development server not running
- Port conflicts
- Database initialization issues
- Network connectivity problems

**Solutions:**

#### A. Check if Development Server is Running
```bash
# Make sure you're in the project directory
cd /path/to/ollama-chat

# Start the development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

#### B. Check Port Availability
The default port is 3000. If it's in use, try:
```bash
# Kill any process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

#### C. Check Database
```bash
# Check if the database file exists
ls -la local.db

# If it doesn't exist, the app will create it automatically
# If it's corrupted, delete it and restart:
rm local.db
npm run dev
```

#### D. Check API Health
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for "API health check" messages
4. If you see "API health check error", the server isn't running

#### E. Manual API Test
Try accessing the health endpoint directly:
```
http://localhost:3000/api/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "API is running"
}
```

### 2. "No models found" Error

**Symptoms:**
- Empty model dropdown
- "No models found" message
- "Disconnected" badge

**Solutions:**

#### A. Check if Ollama is Running
```bash
# Start Ollama
ollama serve

# In another terminal, check if it's responding
curl http://localhost:11434/api/tags
```

#### B. Pull a Model
```bash
# Pull a basic model
ollama pull llama2

# Or pull a vision model
ollama pull llava
```

#### C. Check Ollama API
```bash
# Test Ollama API directly
curl http://localhost:11434/api/tags
```

### 3. Voice Input Issues

**Symptoms:**
- Microphone button is disabled
- "Voice input not supported" error
- "Microphone access denied" error
- Speech recognition not working

**Solutions:**

#### A. Check Browser Support
Voice input requires a modern browser:
- **Chrome** (recommended)
- **Edge**
- **Safari**
- **Firefox** (limited support)

#### B. Check Microphone Permission
1. Click the microphone button
2. Allow microphone access when prompted
3. If denied, click the microphone icon in the address bar and allow access

#### C. Check Console Logs
Look for voice-related messages in browser console:
```
Speech recognition is not supported in this browser
Microphone permission denied
```

#### D. Manual Permission Check
```javascript
// In browser console
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => console.log('Microphone access granted'))
  .catch(err => console.log('Microphone access denied:', err));
```

### 4. Vision Model Detection Issues

**Symptoms:**
- Paperclip icon doesn't appear for vision models
- Vision capability not detected

**Solutions:**

#### A. Check Model Name
Make sure you're using a vision model:
- `llava`
- `bakllava`
- `qwen-vl`
- `gemini`
- etc.

#### B. Check Console Logs
Look for vision detection messages in browser console:
```
Model llava vision capability: true
```

#### C. Manual Vision Check
The app checks for vision models by:
1. Name patterns (e.g., "llava", "vision")
2. Modelfile content analysis

### 4. Database Issues

**Symptoms:**
- Chats not saving
- Database errors in console
- Permission errors

**Solutions:**

#### A. Check File Permissions
```bash
# Make sure the app can write to the database
chmod 644 local.db
```

#### B. Reset Database
```bash
# Delete and recreate database
rm local.db
npm run dev
```

### 5. Development Environment Issues

**Symptoms:**
- Node.js/npm not found
- Package installation errors
- Build failures

**Solutions:**

#### A. Install Node.js
```bash
# Using Homebrew (macOS)
brew install node

# Using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node
nvm use node
```

#### B. Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

#### C. Clear Cache
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### 6. Browser Issues

**Symptoms:**
- CORS errors
- JavaScript errors
- Stale cache

**Solutions:**

#### A. Clear Browser Cache
- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (macOS)
- Clear browser cache and cookies
- Try incognito/private mode

#### B. Check Console Errors
1. Open Developer Tools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests

### 7. Network Issues

**Symptoms:**
- Connection refused errors
- Timeout errors
- CORS errors

**Solutions:**

#### A. Check Firewall
Make sure ports 3000 and 11434 are not blocked

#### B. Check Localhost
Try accessing:
- `http://localhost:3000` (app)
- `http://localhost:11434` (Ollama)

#### C. Use Different Ports
```bash
# Start app on different port
npm run dev -- -p 3001

# Update Ollama URL in .env.local
NEXT_PUBLIC_OLLAMA_API_URL=http://localhost:11434
```

## Getting Help

If you're still experiencing issues:

1. **Check the console logs** in browser developer tools
2. **Check the terminal** where you're running the dev server
3. **Try the health check**: `http://localhost:3000/api/health`
4. **Restart everything**: Stop all servers, clear cache, restart
5. **Check this troubleshooting guide** for your specific error

## Debug Mode

Enable debug logging by adding this to your browser console:
```javascript
localStorage.setItem('debug', 'ollama-chat:*');
```

This will show detailed logs for debugging. 
