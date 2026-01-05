import { Ad, Publication, Version } from '@/types/ad';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileImage, Ruler, Printer, MessageSquare } from 'lucide-react';

interface AdInfoPanelProps {
  ad: Ad;
  publication: Publication | null;
  selectedVersion: Version | null;
}

export function AdInfoPanel({
  ad,
  publication,
  selectedVersion,
}: AdInfoPanelProps) {
  return (
    <div className="w-72 border-l border-border bg-card/50 flex flex-col shrink-0">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Ad Details</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Document specs */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Ruler className="w-4 h-4 text-primary" />
              Specifications
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size</span>
                <span className="text-foreground font-mono">
                  {ad.size_spec.width} × {ad.size_spec.height}px
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">DPI</span>
                <span className="text-foreground font-mono">{ad.dpi}</span>
              </div>
              {publication && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bleed</span>
                    <span className="text-foreground font-mono">{publication.bleed_px}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Safe Zone</span>
                    <span className="text-foreground font-mono">{publication.safe_px}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Font</span>
                    <span className="text-foreground font-mono">{publication.min_font_size}pt</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Publication */}
          {publication && (
            <>
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-primary" />
                  Publication
                </h4>
                <p className="text-sm text-muted-foreground">{publication.name}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Brief */}
          {ad.brief && (
            <>
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Brief
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {ad.brief}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Copy */}
          {ad.copy && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <FileImage className="w-4 h-4 text-primary" />
                Ad Copy
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {ad.copy}
              </p>
            </div>
          )}

          {/* AI Description */}
          {selectedVersion?.layout_json?.metadata?.rationale && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">
                  AI Notes
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedVersion.layout_json.metadata.rationale}
                </p>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
