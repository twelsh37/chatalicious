# Favicon Setup for Ollama Chat

The application now uses a brain icon as the favicon, matching the design used in the chat interface.

## What's Been Set Up

1. **Brain Icon SVG** (`public/brain-icon.svg`): A custom brain icon with the same blue-to-purple gradient background as used in the chat interface
2. **Layout Configuration** (`app/layout.tsx`): Updated to use the brain icon as the favicon
3. **Multiple Formats**: Support for SVG, PNG, and ICO formats for maximum browser compatibility

## Files Created/Modified

- `public/brain-icon.svg` - The main brain icon
- `app/layout.tsx` - Updated with favicon configuration
- `scripts/generate-favicons.js` - Script to generate PNG versions
- `package.json` - Added favicon generation script

## How to Generate PNG Favicons

To create the PNG versions of the favicon for better browser compatibility:

1. **Install Sharp** (if not already installed):
   ```bash
   npm install sharp
   # or
   yarn add sharp
   ```

2. **Generate the favicons**:
   ```bash
   npm run generate-favicons
   # or
   yarn generate-favicons
   ```

This will create:
- `public/favicon-16x16.png`
- `public/favicon-32x32.png`

## Manual Alternative

If you prefer not to install Sharp, you can:

1. Open `public/brain-icon.svg` in a web browser
2. Take a screenshot or use browser dev tools to save as PNG
3. Resize to 16x16 and 32x32 pixels
4. Save as `favicon-16x16.png` and `favicon-32x32.png` in the `public` directory

## Browser Support

The favicon setup includes:
- **SVG favicon** (primary) - Modern browsers
- **PNG favicons** (16x16, 32x32) - Better compatibility
- **ICO favicon** (fallback) - Legacy support
- **Apple touch icon** - iOS devices

## Design Details

The brain icon features:
- Blue-to-purple gradient background (`#3B82F6` to `#9333EA`)
- White brain icon with simplified design
- 32x32 viewport for optimal favicon display
- Matches the avatar design used in the chat interface

The icon represents the AI/ML nature of the Ollama chat application and provides a consistent visual identity across the interface. 
