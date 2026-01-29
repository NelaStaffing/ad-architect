export type AiProviderType = 'gemini';

export interface AiContextValue {
  provider: AiProviderType;
  setProvider: (p: AiProviderType) => void;
}
