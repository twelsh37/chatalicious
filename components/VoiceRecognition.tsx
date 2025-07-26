"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  isSpeechRecognitionSupported,
  createSpeechRecognition,
  requestMicrophonePermission,
  isMicrophoneAvailable,
  formatSpeechRecognitionError,
  cleanTranscript,
  validateTranscript,
  type VoiceRecognitionOptions,
} from "@/lib/voice-utils";

interface VoiceRecognitionProps {
  onTranscript: (transcript: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  options?: VoiceRecognitionOptions;
}

export function VoiceRecognition({
  onTranscript,
  onError,
  disabled = false,
  className = "",
  options = {},
}: VoiceRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [transcript, setTranscript] = useState("");

  
  const recognitionRef = useRef<unknown | null>(null);
  const transcriptRef = useRef<string>("");

  // Check browser support on mount
  useEffect(() => {
    const supported = isSpeechRecognitionSupported();
    setIsSupported(supported);
    
    if (!supported) {
      console.warn("Speech recognition is not supported in this browser");
      console.log("Browser info:", {
        userAgent: navigator.userAgent,
        vendor: navigator.vendor,
        platform: navigator.platform
      });
    }
  }, []);

  // Check microphone permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const available = await isMicrophoneAvailable();
        if (available) {
          const permitted = await requestMicrophonePermission();
          setHasPermission(permitted);
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        console.error("Error checking microphone permission:", error);
        setHasPermission(false);
      }
    };

    checkPermission();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = useCallback(async () => {
    console.log("startListening called with:", { isSupported, hasPermission, disabled });
    if (!isSupported || !hasPermission || disabled) {
      if (!isSupported) {
        const isLocalhost = window.location.hostname === 'localhost';
        const isHttps = window.location.protocol === 'https:';
        
        let description = "Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.";
        
        if (!isHttps && !isLocalhost) {
          description = "Speech recognition requires HTTPS. Please use a secure connection or localhost.";
        }
        
        toast.error("Voice input not supported", {
          description,
        });
      } else if (!hasPermission) {
        toast.error("Microphone access required", {
          description: "Please allow microphone access to use voice input.",
        });
      }
      return;
    }

    console.log("Starting voice recognition...", {
      isSupported,
      hasPermission,
      disabled,
      userAgent: navigator.userAgent
    });

                    try {
                  setIsChecking(true);
                  
                  // Test microphone access first
                  console.log("Testing microphone access...");
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    console.log("Microphone access granted:", stream);
                    stream.getTracks().forEach(track => {
                      console.log("Audio track:", track.label, track.enabled);
                    });
                    // Stop the test stream
                    stream.getTracks().forEach(track => track.stop());
                  } catch (micError) {
                    console.error("Microphone access failed:", micError);
                  }
      
      // Create new recognition instance
      const recognition = createSpeechRecognition({
        continuous: false, // Use single-shot for more reliable detection
        interimResults: false, // Only get final results
        lang: "en-US",
        maxAlternatives: 1, // Use single alternative for simplicity
        ...options,
      });

      recognitionRef.current = recognition;

      // Set up event handlers
      recognition.onstart = () => {
        console.log("Speech recognition started - microphone should be active");
        setIsListening(true);
        setTranscript("");
        setIsChecking(false);
        toast.success("Listening...", {
          description: "Speak your question now. Speak clearly and at a normal volume. Click the microphone again when done.",
        });
      };

      recognition.onresult = (event: unknown) => {
        const eventObj = event as {
          resultIndex: number;
          results: Array<{
            isFinal: boolean;
            [0]: { transcript: string };
          }>;
        };
        
        console.log("Speech recognition result:", eventObj);
        
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = eventObj.resultIndex; i < eventObj.results.length; i++) {
          const transcript = eventObj.results[i][0].transcript;
          if (eventObj.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        console.log("Setting transcript:", { finalTranscript, interimTranscript, currentTranscript });
        setTranscript(currentTranscript);
        transcriptRef.current = currentTranscript; // Store in ref for reliable access
        
        // Log successful recognition
        if (currentTranscript) {
          console.log("Speech recognized:", currentTranscript);
        }
      };

      recognition.onerror = (event: unknown) => {
        const errorEvent = event as { error: string };
        
        // Don't log no-speech errors as they're expected
        if (errorEvent.error !== 'no-speech') {
          console.error("Speech recognition error:", errorEvent.error);
        }
        
        const errorMessage = formatSpeechRecognitionError(event);
        
        setIsListening(false);
        setIsChecking(false);
        setTranscript("");
        
                            // Handle different error types
                    if (errorEvent.error === 'no-speech') {
                      // For no-speech, just inform the user but don't stop
                      console.log("No speech detected - this is normal, keep speaking");
                      // Don't show toast for no-speech as it's expected
                      // Don't stop listening for no-speech errors
                    } else if (errorEvent.error === 'network') {
          toast.error("Network error", {
            description: "Please check your internet connection and try again.",
          });
        } else if (onError) {
          onError(errorMessage);
        } else {
          toast.error("Voice recognition error", {
            description: errorMessage,
          });
        }
      };

      recognition.onend = () => {
        console.log("Speech recognition ended, current transcript:", transcript);
        console.log("Transcript ref value:", transcriptRef.current);
        setIsListening(false);
        setIsChecking(false);
        
        // Use the ref value which is more reliable
        const finalTranscript = transcriptRef.current;
        
        // If we have a final transcript, send it
        if (finalTranscript.trim()) {
          const cleaned = cleanTranscript(finalTranscript);
          const validation = validateTranscript(cleaned);
          
          console.log("Processing transcript:", { finalTranscript, cleaned, validation });
          
          if (validation.isValid) {
            console.log("Calling onTranscript with:", cleaned);
            onTranscript(cleaned);
            toast.success("Voice input processed", {
              description: `"${cleaned}"`,
            });
          } else {
            toast.error("Invalid voice input", {
              description: validation.error,
            });
          }
        } else {
          // No transcript - might be a no-speech error
          console.log("No transcript available when recognition ended");
        }
        
        // Clear both state and ref
        setTranscript("");
        transcriptRef.current = "";
      };

                        // Start recognition with a small delay to ensure microphone is ready
                  setTimeout(() => {
                    console.log("Starting recognition after delay...");
                    try {
                      recognition.start();
                      console.log("Recognition started successfully");
                    } catch (error) {
                      console.error("Error starting recognition:", error);
                    }
                  }, 500); // Increased delay to 500ms
      
                        

    } catch (error) {
      console.error("Error starting speech recognition:", error);
      setIsChecking(false);
      toast.error("Failed to start voice recognition", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [isSupported, hasPermission, disabled, transcript, onTranscript, onError, options]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setIsChecking(false);
  }, []);

  const handleClick = () => {
    console.log("Microphone button clicked, isListening:", isListening);
    if (isListening) {
      console.log("Stopping listening, current transcript:", transcript);
      // If we have some transcript, process it
      if (transcript.trim()) {
        const cleaned = cleanTranscript(transcript);
        const validation = validateTranscript(cleaned);
        
        if (validation.isValid) {
          onTranscript(cleaned);
          toast.success("Voice input processed", {
            description: `"${cleaned}"`,
          });
        } else {
          toast.error("Invalid voice input", {
            description: validation.error,
          });
        }
      }
      stopListening();
    } else {
      console.log("Starting listening...");
      startListening();
    }
  };

  const handleStopClick = () => {
    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        const cleaned = cleanTranscript(transcript);
        const validation = validateTranscript(cleaned);
        
        if (validation.isValid) {
          onTranscript(cleaned);
          toast.success("Voice input processed", {
            description: `"${cleaned}"`,
          });
        }
      }
    }
  };

  const isDisabled = disabled || !isSupported || !hasPermission || isChecking;

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isDisabled}
        className={`h-10 w-10 p-0 transition-all duration-300 ${
          isListening 
            ? "bg-red-500 text-white border-red-500 hover:bg-red-600 shadow-lg animate-pulse" 
            : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600"
        } ${className}`}
        title={
          !isSupported 
            ? "Voice input not supported in this browser"
            : !hasPermission 
            ? "Microphone access required"
            : isListening 
            ? "Click to stop listening"
            : "Click to start voice input (speak clearly when prompted)"
        }
      >
        {isChecking ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isListening ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      {/* Show transcript preview when listening */}
      {isListening && (
        <div className="text-xs text-slate-600 dark:text-slate-400 max-w-32 truncate">
          {transcript ? `"${transcript}"` : "Listening..."}
        </div>
      )}
    </div>
  );
} 
