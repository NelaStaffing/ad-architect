import { Version, SizeSpec } from '@/types/ad';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useState } from 'react';

interface AdPreviewProps {
  version: Version | null;
  sizeSpec: SizeSpec;
  showBleed: boolean;
  showSafe: boolean;
  bleedPx: number;
  safePx: number;
}

export function AdPreview({
  version,
  sizeSpec,
  showBleed,
  showSafe,
  bleedPx,
  safePx,
}: AdPreviewProps) {
  const [zoom, setZoom] = useState(1);

  const handleDownload = async () => {
    if (!version?.preview_url) return;
    
    try {
      const response = await fetch(version.preview_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ad-${version.id}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Calculate display size with zoom
  const maxWidth = 800;
  const maxHeight = 600;
  const scale = Math.min(maxWidth / sizeSpec.width, maxHeight / sizeSpec.height, 1);
  const displayWidth = sizeSpec.width * scale * zoom;
  const displayHeight = sizeSpec.height * scale * zoom;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Zoom controls */}
      <div className="h-10 border-b border-border bg-card/30 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
            disabled={zoom <= 0.25}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            disabled={zoom >= 3}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setZoom(1)}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>

        {version?.preview_url && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        )}
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto bg-muted/30 canvas-grid p-8 flex items-center justify-center">
        {version?.preview_url ? (
          <div 
            className="relative bg-white shadow-2xl transition-all duration-200"
            style={{
              width: displayWidth,
              height: displayHeight,
            }}
          >
            {/* Generated ad image */}
            <img
              src={version.preview_url}
              alt="Generated ad"
              className="w-full h-full object-contain"
            />

            {/* Bleed overlay */}
            {showBleed && bleedPx > 0 && (
              <div 
                className="absolute inset-0 border-2 border-dashed border-canvas-bleed pointer-events-none"
                style={{
                  margin: `${bleedPx * scale * zoom}px`,
                }}
              />
            )}

            {/* Safe zone overlay */}
            {showSafe && safePx > 0 && (
              <div 
                className="absolute border-2 border-dashed border-canvas-safe pointer-events-none"
                style={{
                  top: safePx * scale * zoom,
                  left: safePx * scale * zoom,
                  right: safePx * scale * zoom,
                  bottom: safePx * scale * zoom,
                }}
              />
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <div className="w-24 h-24 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Maximize2 className="w-12 h-12 opacity-30" />
            </div>
            <p className="font-medium">No preview available</p>
            <p className="text-sm mt-1">Generate an ad to see it here</p>
          </div>
        )}
      </div>
    </div>
  );
}
