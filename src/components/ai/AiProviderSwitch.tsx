import { Badge } from '@/components/ui/badge';

export function AiProviderSwitch() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground hidden sm:inline">AI</span>
      <Badge variant="secondary" className="h-9 px-3 flex items-center">
        Gemini
      </Badge>
    </div>
  );
}
