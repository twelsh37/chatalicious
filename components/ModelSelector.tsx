'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLiteLLM } from '@/lib/hooks/useLiteLLM';
import { config } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Settings, RefreshCw } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  className?: string;
}

export function ModelSelector({ selectedModel, onModelChange, className }: ModelSelectorProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>('ollama');
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const {
    error,
    models,
    providerConfig,
    getModels,
    getProviders,
    getProviderConfig,
    testProvider,
    clearError
  } = useLiteLLM();

  const loadModels = useCallback(async () => {
    try {
      await getModels();
      // The models will be set internally by the hook
    } catch (error) {
      console.error('Error loading models:', error);
    }
  }, [getModels]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setMounted(true);
        await loadModels();
        await getProviders();
        await getProviderConfig();
      } catch (error) {
        console.error('Error initializing ModelSelector:', error);
      }
    };
    
    initializeData();
  }, [loadModels, getProviders, getProviderConfig]);

  useEffect(() => {
    // Set initial provider based on selected model
    if (selectedModel.includes('/')) {
      const [provider] = selectedModel.split('/');
      setSelectedProvider(provider);
    }
  }, [selectedModel, mounted]);

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    // Set default model for the provider
    const providerModels = models.filter((model: unknown) => (model as { owned_by: string }).owned_by === provider);
    if (providerModels.length > 0) {
      const firstModel = providerModels[0] as { id: string };
      onModelChange(firstModel.id);
    }
  };

  const handleModelChange = (modelId: string) => {
    onModelChange(modelId);
  };

  const handleTestProvider = async (providerName: string) => {
    setIsTesting(providerName);
    clearError();
    
    try {
      const isConnected = await testProvider(providerName);
      if (isConnected) {
        // Provider is working, you could show a success message
        console.log(`${providerName} is connected`);
      }
    } finally {
      setIsTesting(null);
    }
  };

  const getProviderStatus = (providerName: string) => {
    if (!mounted) {
      return 'loading';
    }
    
    if (isTesting === providerName) {
      return 'testing';
    }
    
    if (providerConfig[providerName]?.configured) {
      return 'configured';
    }
    
    return 'not-configured';
  };

  const getProviderIcon = (providerName: string) => {
    const status = getProviderStatus(providerName);
    
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'configured':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'not-configured':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getProviderModels = (providerName: string) => {
    if (providerName === 'ollama') {
      // For Ollama, use dynamically fetched models
      return models.filter((model: unknown) => (model as { owned_by: string }).owned_by === providerName);
    } else {
      // For external providers, use hardcoded models from config if provider is configured
      if (providerConfig[providerName]?.configured) {
        const configModels = config.models[providerName as keyof typeof config.models];
        console.log(`Provider ${providerName} is configured, using ${configModels.length} hardcoded models`);
        return configModels.map((model: { id: string; name: string; size: string; description: string }) => ({
          id: model.id, // Use the model.id directly (it already includes the provider prefix)
          root: model.name,
          owned_by: providerName,
          size: model.size,
          description: model.description
        }));
      }
      console.log(`Provider ${providerName} is not configured`);
      return [];
    }
  };

  const handleRefreshOllama = async () => {
    if (selectedProvider === 'ollama') {
      setIsRefreshing(true);
      try {
        await getModels(); // This will refresh the models via the hook
        console.log('Ollama models refreshed');
      } catch (error) {
        console.error('Error refreshing Ollama models:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Model Selection
          {mounted && error && (
            <Alert className="mt-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardTitle>
        <CardDescription>
          Choose your preferred AI model and provider
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Provider Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Provider</label>
          <div className="grid grid-cols-2 gap-2">
            {['ollama', 'anthropic', 'openai', 'perplexity'].map((provider) => (
              <Button
                key={provider}
                variant={selectedProvider === provider ? "default" : "outline"}
                className="justify-between"
                onClick={() => handleProviderChange(provider)}
                disabled={!mounted || !providerConfig[provider]?.configured}
              >
                <span className="capitalize">{provider}</span>
                {getProviderIcon(provider)}
              </Button>
            ))}
          </div>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Model</label>
            {selectedProvider === 'ollama' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefreshOllama}
                disabled={isRefreshing}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            )}
          </div>
          <Select value={selectedModel} onValueChange={handleModelChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {getProviderModels(selectedProvider).length > 0 ? (
                getProviderModels(selectedProvider).map((model: unknown) => {
                  const modelData = model as { id: string; root: string; owned_by: string };
                  return (
                    <SelectItem key={modelData.id} value={modelData.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-medium">{modelData.root}</div>
                          <div className="text-xs text-muted-foreground">
                            {modelData.owned_by} model
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })
              ) : (
                <SelectItem value="no-models" disabled>
                  No models available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Provider Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Provider Status</label>
          <div className="grid grid-cols-2 gap-2">
            {['ollama', 'anthropic', 'openai', 'perplexity'].map((provider) => {
              const status = getProviderStatus(provider);
              const isConfigured = providerConfig[provider]?.configured || false;
              
              return (
                <div
                  key={provider}
                  className={`flex items-center justify-between p-2 rounded-md border ${
                    status === 'configured' ? 'border-green-200 bg-green-50' :
                    status === 'testing' ? 'border-blue-200 bg-blue-50' :
                    'border-red-200 bg-red-50'
                  }`}
                >
                  <span className="capitalize text-sm">{provider}</span>
                  <div className="flex items-center gap-2">
                    {getProviderIcon(provider)}
                    {mounted && isConfigured && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestProvider(provider)}
                        disabled={isTesting === provider}
                      >
                        {isTesting === provider ? 'Testing...' : 'Test'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

                    {/* Configuration Help */}
            {mounted && !providerConfig.anthropic?.configured && !providerConfig.openai?.configured && !providerConfig.perplexity?.configured && (
          <Alert>
            <AlertDescription>
              To use external providers, add the following environment variables:
              <br />
              <code className="text-xs">
                ANTHROPIC_API_KEY=your_key_here
                <br />
                OPENAI_API_KEY=your_key_here
                <br />
                PERPLEXITY_API_KEY=your_key_here
              </code>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
} 
