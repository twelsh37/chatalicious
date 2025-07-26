/**
 * Voice utilities for speech recognition and audio recording
 */

// Import global types
declare global {
  interface Window {
    SpeechRecognition: unknown;
    webkitSpeechRecognition: unknown;
  }
}

export interface VoiceRecognitionState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
}

export interface VoiceRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  maxAlternatives?: number;
}

/**
 * Check if speech recognition is supported in the browser
 */
export function isSpeechRecognitionSupported(): boolean {
  const hasWebkit = 'webkitSpeechRecognition' in window;
  const hasStandard = 'SpeechRecognition' in window;
  const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  
  console.log("Speech recognition check:", {
    hasWebkit,
    hasStandard,
    isSecure,
    protocol: window.location.protocol,
    hostname: window.location.hostname
  });
  
  return (hasWebkit || hasStandard) && isSecure;
}

/**
 * Get the SpeechRecognition constructor for the current browser
 */
export function getSpeechRecognition(): unknown {
  if ('SpeechRecognition' in window) {
    return (window as { SpeechRecognition: unknown }).SpeechRecognition;
  } else if ('webkitSpeechRecognition' in window) {
    return (window as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition;
  }
  return null;
}

/**
 * Create a speech recognition instance with the given options
 */
export function createSpeechRecognition(options: VoiceRecognitionOptions = {}) {
  const SpeechRecognition = getSpeechRecognition();
  
  if (!SpeechRecognition) {
    throw new Error('Speech recognition is not supported in this browser');
  }

  const recognition = new (SpeechRecognition as new () => unknown)() as {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onstart: ((event: Event) => void) | null;
    onend: ((event: Event) => void) | null;
    onresult: ((event: unknown) => void) | null;
    onerror: ((event: unknown) => void) | null;
  };
  
  // Set default options
  recognition.continuous = options.continuous ?? false;
  recognition.interimResults = options.interimResults ?? true;
  recognition.lang = options.lang ?? 'en-US';
  recognition.maxAlternatives = options.maxAlternatives ?? 1;

  return recognition;
}

/**
 * Request microphone permission
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
}

/**
 * Check if microphone access is available
 */
export async function isMicrophoneAvailable(): Promise<boolean> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices = devices.filter(device => device.kind === 'audioinput');
    return audioDevices.length > 0;
  } catch (error) {
    console.error('Error checking microphone availability:', error);
    return false;
  }
}

/**
 * Get available audio input devices
 */
export async function getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audioinput');
  } catch (error) {
    console.error('Error getting audio input devices:', error);
    return [];
  }
}

/**
 * Format speech recognition error messages
 */
export function formatSpeechRecognitionError(error: unknown): string {
  const errorObj = error as { error: string };
  switch (errorObj.error) {
    case 'no-speech':
      return 'No speech was detected. Please try speaking again.';
    case 'audio-capture':
      return 'Audio capture failed. Please check your microphone.';
    case 'not-allowed':
      return 'Microphone access was denied. Please allow microphone access and try again.';
    case 'network':
      return 'Network error occurred. Please check your internet connection.';
    case 'service-not-allowed':
      return 'Speech recognition service is not allowed.';
    case 'bad-grammar':
      return 'Speech recognition grammar error.';
    case 'language-not-supported':
      return 'Language not supported.';
          default:
        return `Speech recognition error: ${errorObj.error}`;
  }
}

/**
 * Clean up transcript text
 */
export function cleanTranscript(transcript: string): string {
  return transcript
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/^\s+|\s+$/g, ''); // Trim whitespace
}

/**
 * Validate transcript before sending
 */
export function validateTranscript(transcript: string): { isValid: boolean; error?: string } {
  const cleaned = cleanTranscript(transcript);
  
  if (!cleaned) {
    return { isValid: false, error: 'No speech detected' };
  }
  
  if (cleaned.length < 2) {
    return { isValid: false, error: 'Speech too short' };
  }
  
  if (cleaned.length > 1000) {
    return { isValid: false, error: 'Speech too long' };
  }
  
  return { isValid: true };
} 
