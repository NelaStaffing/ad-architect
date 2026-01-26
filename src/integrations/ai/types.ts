export type AiProviderType = 'gemini' | 'openai';

export interface AiContextValue {
  provider: AiProviderType;
  setProvider: (p: AiProviderType) => void;
}
