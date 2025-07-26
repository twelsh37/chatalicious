import { ollamaAPI } from "./api";

// Common vision model name patterns
const VISION_MODEL_PATTERNS = [
  /vision/i,
  /multimodal/i,
  /llava/i,
  /bakllava/i,
  /qwen-vl/i,
  /gemini/i,
  /claude-3/i,
  /gpt-4v/i,
  /gpt4-vision/i,
  /llama-vision/i,
  /llama2-vision/i,
  /codellama-vision/i,
  /phi-vision/i,
  /phi3-vision/i,
  /mistral-vision/i,
  /mixtral-vision/i,
  /yi-vision/i,
  /deepseek-vision/i,
  /chatglm-vision/i,
  /qwen-vl/i,
  /internlm-vision/i,
  /cogvlm/i,
  /minicpm-vision/i,
  /openflamingo/i,
  /idefics/i,
  /llava-llama/i,
  /llava-mistral/i,
  /llava-phi/i,
  /llava-qwen/i,
  /llava-yi/i,
  /llava-deepseek/i,
  /llava-chatglm/i,
  /llava-internlm/i,
  /llava-cogvlm/i,
  /llava-minicpm/i,
  /llava-openflamingo/i,
  /llava-idefics/i,
];

// Cache for model vision capabilities
const visionCapabilityCache = new Map<string, boolean>();

/**
 * Check if a model name matches common vision model patterns
 */
export function isVisionModelByName(modelName: string): boolean {
  return VISION_MODEL_PATTERNS.some(pattern => pattern.test(modelName));
}

/**
 * Check if a model has vision capabilities by examining its modelfile
 */
export async function checkVisionCapability(modelName: string): Promise<boolean> {
  // Check cache first
  if (visionCapabilityCache.has(modelName)) {
    return visionCapabilityCache.get(modelName)!;
  }

  try {
    // Check by name pattern first (faster)
    if (isVisionModelByName(modelName)) {
      visionCapabilityCache.set(modelName, true);
      return true;
    }

    // If not detected by name, check modelfile
    const modelInfo = await ollamaAPI.showModel(modelName);
    const modelfile = modelInfo.modelfile.toLowerCase();
    
    // Look for vision-related keywords in modelfile
    const visionKeywords = [
      'vision',
      'multimodal',
      'image',
      'llava',
      'bakllava',
      'qwen-vl',
      'gemini',
      'claude-3',
      'gpt-4v',
      'gpt4-vision',
      'llama-vision',
      'llama2-vision',
      'codellama-vision',
      'phi-vision',
      'phi3-vision',
      'mistral-vision',
      'mixtral-vision',
      'yi-vision',
      'deepseek-vision',
      'chatglm-vision',
      'qwen-vl',
      'internlm-vision',
      'cogvlm',
      'minicpm-vision',
      'openflamingo',
      'idefics',
    ];

    const hasVisionCapability = visionKeywords.some(keyword => 
      modelfile.includes(keyword)
    );

    visionCapabilityCache.set(modelName, hasVisionCapability);
    return hasVisionCapability;
  } catch (error) {
    console.error(`Error checking vision capability for ${modelName}:`, error);
    // Fallback to name-based detection
    const fallbackResult = isVisionModelByName(modelName);
    visionCapabilityCache.set(modelName, fallbackResult);
    return fallbackResult;
  }
}

/**
 * Clear the vision capability cache
 */
export function clearVisionCapabilityCache(): void {
  visionCapabilityCache.clear();
}

/**
 * Get supported image file extensions
 */
export function getSupportedImageExtensions(): string[] {
  return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif'];
}

/**
 * Check if a file is a supported image
 */
export function isSupportedImageFile(file: File): boolean {
  const supportedExtensions = getSupportedImageExtensions();
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  return supportedExtensions.includes(fileExtension);
}

/**
 * Convert file to base64 for API transmission
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
} 
