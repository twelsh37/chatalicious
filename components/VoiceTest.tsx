"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSpeechRecognitionSupported, requestMicrophonePermission } from "@/lib/voice-utils";

export function VoiceTest() {
  const [browserInfo, setBrowserInfo] = useState<Record<string, unknown>>({});
  const [microphoneStatus, setMicrophoneStatus] = useState<string>("Checking...");

  useEffect(() => {
    // Check browser capabilities
    const info = {
      userAgent: navigator.userAgent,
      vendor: navigator.vendor,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      hasWebkitSpeechRecognition: 'webkitSpeechRecognition' in window,
      hasSpeechRecognition: 'SpeechRecognition' in window,
      hasMediaDevices: 'mediaDevices' in navigator,
      hasGetUserMedia: 'getUserMedia' in navigator.mediaDevices,
      isSpeechSupported: isSpeechRecognitionSupported(),
    };
    
    setBrowserInfo(info);
    
    // Test microphone access
    testMicrophone();
  }, []);

  const testMicrophone = async () => {
    try {
      const hasPermission = await requestMicrophonePermission();
      setMicrophoneStatus(hasPermission ? "✅ Microphone access granted" : "❌ Microphone access denied");
    } catch (error) {
      setMicrophoneStatus(`❌ Microphone error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Voice Recognition Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Microphone Status:</h3>
          <p className="text-sm">{microphoneStatus}</p>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Browser Capabilities:</h3>
          <div className="text-sm space-y-1">
            <p><strong>Speech Recognition Supported:</strong> {browserInfo.isSpeechSupported ? "✅ Yes" : "❌ No"}</p>
            <p><strong>Webkit Speech Recognition:</strong> {browserInfo.hasWebkitSpeechRecognition ? "✅ Available" : "❌ Not available"}</p>
            <p><strong>Standard Speech Recognition:</strong> {browserInfo.hasSpeechRecognition ? "✅ Available" : "❌ Not available"}</p>
            <p><strong>Media Devices:</strong> {browserInfo.hasMediaDevices ? "✅ Available" : "❌ Not available"}</p>
            <p><strong>Get User Media:</strong> {browserInfo.hasGetUserMedia ? "✅ Available" : "❌ Not available"}</p>
            <p><strong>Protocol:</strong> {String(browserInfo.protocol)}</p>
            <p><strong>Hostname:</strong> {String(browserInfo.hostname)}</p>
            <p><strong>Online:</strong> {Boolean(browserInfo.onLine) ? "✅ Yes" : "❌ No"}</p>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Browser Info:</h3>
          <div className="text-sm space-y-1">
            <p><strong>User Agent:</strong> {String(browserInfo.userAgent)}</p>
            <p><strong>Vendor:</strong> {String(browserInfo.vendor)}</p>
            <p><strong>Platform:</strong> {String(browserInfo.platform)}</p>
            <p><strong>Language:</strong> {String(browserInfo.language)}</p>
          </div>
        </div>
        
        <Button onClick={testMicrophone} className="w-full">
          Test Microphone Again
        </Button>
      </CardContent>
    </Card>
  );
} 
