import { createContext, useContext, useState, ReactNode } from 'react';
import type { AiContextValue, AiProviderType } from './types';

const AiContext = createContext<AiContextValue | undefined>(undefined);

export function AiProvider({ children }: { children: ReactNode }) {
  // Gemini is the only supported provider
  const [provider] = useState<AiProviderType>('gemini');

  const setProvider = (_p: AiProviderType) => {
    // No-op: Gemini is the only supported provider
  };

  return (
    <AiContext.Provider value={{ provider, setProvider }}>
      {children}
    </AiContext.Provider>
  );
}

export function useAi(): AiContextValue {
  const ctx = useContext(AiContext);
  if (!ctx) throw new Error('useAi must be used within an AiProvider');
  return ctx;
}
