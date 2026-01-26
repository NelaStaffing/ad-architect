import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAi } from '@/integrations/ai/context';
import type { AiProviderType } from '@/integrations/ai/types';

export function AiProviderSwitch() {
  const { provider, setProvider } = useAi();
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground hidden sm:inline">AI</span>
      <Select value={provider} onValueChange={(v) => setProvider(v as AiProviderType)}>
        <SelectTrigger className="h-9 w-[170px]">
          <SelectValue placeholder="Select AI" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gemini">Gemini</SelectItem>
          <SelectItem value="openai">ChatGPT Image</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
