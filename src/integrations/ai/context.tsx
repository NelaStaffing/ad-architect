import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type { AiContextValue, AiProviderType } from './types';

const AiContext = createContext<AiContextValue | undefined>(undefined);

export function AiProvider({ children }: { children: ReactNode }) {
  const initial = useMemo<AiProviderType>(() => {
    const stored = (typeof window !== 'undefined' && localStorage.getItem('ai_provider')) as AiProviderType | null;
    const envDefault = (import.meta.env.VITE_AI_PROVIDER as AiProviderType) || 'gemini';
    return stored || envDefault || 'gemini';
  }, []);

  const [provider, setProviderState] = useState<AiProviderType>(initial);

  useEffect(() => {
    try {
      localStorage.setItem('ai_provider', provider);
    } catch {}
  }, [provider]);

  const setProvider = (p: AiProviderType) => setProviderState(p);

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
