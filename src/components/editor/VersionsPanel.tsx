import { Version, LayoutJSON } from '@/types/ad';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Loader2, Bot, PenTool, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VersionsPanelProps {
  versions: Version[];
  currentLayout: LayoutJSON | null;
  generating: boolean;
  onGenerate: () => void;
  onSelectVersion: (version: Version) => void;
}

export function VersionsPanel({
  versions,
  currentLayout,
  generating,
  onGenerate,
  onSelectVersion,
}: VersionsPanelProps) {
  return (
    <div className="w-64 border-r border-border bg-card/50 flex flex-col shrink-0">
      <div className="p-3 border-b border-border">
        <Button
          onClick={onGenerate}
          disabled={generating}
          className="w-full btn-glow gap-2"
          size="sm"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Layouts
            </>
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No versions yet</p>
              <p className="text-xs mt-1">Generate layouts to see options</p>
            </div>
          ) : (
            versions.map((version) => (
              <button
                key={version.id}
                onClick={() => onSelectVersion(version)}
                className={`w-full text-left p-2 rounded-lg border transition-all ${
                  version.is_selected
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    {version.source === 'ai' ? (
                      <Bot className="w-3 h-3 text-primary" />
                    ) : (
                      <PenTool className="w-3 h-3 text-accent-foreground" />
                    )}
                    <span className="text-xs font-medium text-foreground">
                      {version.layout_json.metadata?.templateName || 
                        (version.source === 'ai' ? 'AI Layout' : 'Manual Edit')}
                    </span>
                  </div>
                  {version.is_selected && (
                    <Check className="w-3 h-3 text-primary" />
                  )}
                </div>
                
                {/* Mini preview */}
                <div className="aspect-[4/3] bg-secondary rounded border border-border mb-1 overflow-hidden">
                  <div className="w-full h-full relative p-1">
                    {version.layout_json.elements?.slice(0, 5).map((el, i) => (
                      <div
                        key={i}
                        className={`absolute ${
                          el.type === 'text' 
                            ? 'bg-foreground/20' 
                            : el.type === 'image'
                            ? 'bg-primary/30'
                            : 'bg-muted-foreground/30'
                        } rounded-sm`}
                        style={{
                          left: `${(el.x / version.layout_json.document.widthPx) * 100}%`,
                          top: `${(el.y / version.layout_json.document.heightPx) * 100}%`,
                          width: `${(el.w / version.layout_json.document.widthPx) * 100}%`,
                          height: `${(el.h / version.layout_json.document.heightPx) * 100}%`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{version.layout_json.elements?.length || 0} elements</span>
                  <span>{formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}</span>
                </div>

                {version.layout_json.metadata?.warnings?.length > 0 && (
                  <div className="mt-1 text-[10px] text-status-draft truncate">
                    ⚠️ {version.layout_json.metadata.warnings[0]}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {generating && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 animate-pulse-glow">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-foreground font-medium">Generating layouts...</p>
            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
          </div>
        </div>
      )}
    </div>
  );
}
