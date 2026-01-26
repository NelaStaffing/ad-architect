import { useState } from 'react';
import { Version } from '@/types/ad';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Loader2, Bot, Download, Check, RefreshCw, History, Wand2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GeneratedAdViewerProps {
  versions: Version[];
  generating: boolean;
  generatingBig?: boolean;
  onGenerate: (prompt?: string) => void;
  onGenerateBig?: (prompt: string) => void;
  onSelectVersion: (version: Version) => void;
  selectedVersion: Version | null;
}

export function GeneratedAdViewer({
  versions,
  generating,
  generatingBig = false,
  onGenerate,
  onGenerateBig,
  onSelectVersion,
  selectedVersion,
}: GeneratedAdViewerProps) {
  const [regenerationPrompt, setRegenerationPrompt] = useState('');
  const [bigChangesPrompt, setBigChangesPrompt] = useState('');

  const handleGenerate = () => {
    // If there are existing versions, this is a regeneration - pass the prompt
    // If no versions exist, this is first-time generation - don't pass prompt
    if (versions.length > 0) {
      onGenerate(regenerationPrompt.trim());
    } else {
      onGenerate(); // First-time generation - no regenerationPrompt
    }
    setRegenerationPrompt('');
  };

  const handleBigChanges = () => {
    if (onGenerateBig && bigChangesPrompt.trim()) {
      onGenerateBig(bigChangesPrompt.trim());
      setBigChangesPrompt('');
    }
  };

  return (
    <div className="w-72 border-r border-border bg-card/50 flex flex-col shrink-0">
      <Tabs defaultValue="simple" className="flex flex-col">
        <div className="px-4 pt-4 pb-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple" className="text-xs">Simple Changes</TabsTrigger>
            <TabsTrigger value="big" className="text-xs">Big Changes</TabsTrigger>
          </TabsList>
        </div>

        {/* Simple Changes Input */}
        <TabsContent value="simple" className="m-0 px-4 pb-4 border-b border-border">
          <div className="space-y-3">
            <Textarea
              placeholder="Enter regeneration instructions (optional)..."
              value={regenerationPrompt}
              onChange={(e) => setRegenerationPrompt(e.target.value)}
              disabled={generating}
              className="min-h-[80px] resize-none text-sm"
            />
            <Button
              onClick={handleGenerate}
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
            <p className="text-xs text-muted-foreground text-center">
              AI will create a complete print-ready ad
            </p>
          </div>
        </TabsContent>

        {/* Big Changes Input */}
        <TabsContent value="big" className="m-0 px-4 pb-4 border-b border-border">
          <div className="space-y-3">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
              <p className="text-xs text-orange-400 text-center">
                Major revision - creates a completely new design
              </p>
            </div>
            <Textarea
              placeholder="Describe the major changes you want..."
              value={bigChangesPrompt}
              onChange={(e) => setBigChangesPrompt(e.target.value)}
              disabled={generatingBig}
              className="min-h-[80px] resize-none text-sm border-orange-500/30 focus:border-orange-500"
            />
            <Button
              onClick={handleBigChanges}
              disabled={generatingBig || !bigChangesPrompt.trim()}
              className="w-full gap-2 bg-orange-600 hover:bg-orange-700"
            >
              {generatingBig ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating New Design...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Create New Design
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              AI will generate a fresh layout from scratch
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="px-4 py-2 border-b border-border">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          Version History
        </h3>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {versions.filter(v => v.status === 'kept').length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-primary/50" />
              </div>
              <p className="font-medium">No ads generated yet</p>
              <p className="text-xs mt-1">Click Generate to create your ad</p>
            </div>
          ) : (
            versions.filter(v => v.status === 'kept').map((version, index) => (
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
                    <span className="text-foreground font-medium flex items-center gap-1">
                      Version {index}
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
