import { Version } from '@/types/ad';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Loader2, Bot, Download, Check, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GeneratedAdViewerProps {
  versions: Version[];
  generating: boolean;
  onGenerate: () => void;
  onSelectVersion: (version: Version) => void;
  selectedVersion: Version | null;
}

export function GeneratedAdViewer({
  versions,
  generating,
  onGenerate,
  onSelectVersion,
  selectedVersion,
}: GeneratedAdViewerProps) {
  return (
    <div className="w-72 border-r border-border bg-card/50 flex flex-col shrink-0">
      <div className="p-4 border-b border-border">
        <Button
          onClick={onGenerate}
          disabled={generating}
          className="w-full btn-glow gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Ad...
            </>
          ) : versions.length > 0 ? (
            <>
              <RefreshCw className="w-4 h-4" />
              Regenerate Ad
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Ad
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI will create a complete print-ready ad
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {versions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-primary/50" />
              </div>
              <p className="font-medium">No ads generated yet</p>
              <p className="text-xs mt-1">Click Generate to create your ad</p>
            </div>
          ) : (
            versions.map((version) => (
              <button
                key={version.id}
                onClick={() => onSelectVersion(version)}
                className={`w-full text-left rounded-lg border transition-all overflow-hidden ${
                  version.is_selected
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {/* Thumbnail */}
                <div className="aspect-[4/3] bg-muted relative">
                  {version.preview_url ? (
                    <img
                      src={version.preview_url}
                      alt="Generated ad"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Bot className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  )}
                  {version.is_selected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2 bg-card">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Bot className="w-3 h-3" />
                      AI Generated
                    </span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {generating && (
        <div className="absolute inset-0 bg-background/90 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <p className="text-foreground font-medium">Creating your ad...</p>
            <p className="text-sm text-muted-foreground mt-1">This may take a moment</p>
          </div>
        </div>
      )}
    </div>
  );
}
