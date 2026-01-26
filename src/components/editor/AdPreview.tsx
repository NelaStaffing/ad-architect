import { Version, SizeSpec, ImageTransform } from '@/types/ad';
import { ReviewToken } from '@/types/review';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, ZoomOut, Maximize2, Save, Loader2, Check, X, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { InteractiveImageLayer } from './InteractiveImageLayer';

interface AdPreviewProps {
  version: Version | null;
  sizeSpec: SizeSpec;
  showBleed: boolean;
  showSafe: boolean;
  bleedPx: number;
  safePx: number;
  latestFeedback?: ReviewToken | null;
  onSaveTransform?: (transform: ImageTransform) => Promise<void>;
  onKeepVersion?: (versionId: string) => Promise<void>;
  onDiscardVersion?: (versionId: string) => Promise<void>;
}

export function AdPreview({
  version,
  sizeSpec,
  showBleed,
  showSafe,
  bleedPx,
  safePx,
  latestFeedback,
  onSaveTransform,
  onKeepVersion,
  onDiscardVersion,
}: AdPreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [imageTransform, setImageTransform] = useState<ImageTransform>({ x: 0, y: 0, scale: 1 });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [feedbackDismissed, setFeedbackDismissed] = useState(false);

  // Debug: log the version being rendered
  console.log('AdPreview rendering version:', version?.id, 'preview_url:', version?.preview_url);

  // Load saved transform when version changes
  useEffect(() => {
    if (version?.image_transform) {
      setImageTransform(version.image_transform);
    } else {
      setImageTransform({ x: 0, y: 0, scale: 1 });
    }
    setHasChanges(false);
  }, [version?.id]);

  const handleTransformChange = (transform: ImageTransform) => {
    setImageTransform(transform);
    setHasChanges(true);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!onSaveTransform || !hasChanges) return;
    
    setSaving(true);
    setSaveError(null);
    try {
      await onSaveTransform(imageTransform);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save transform:', error);
      setSaveError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Calculate display size with zoom (moved up for use in handleDownload)
  const maxWidth = 800;
  const maxHeight = 600;
  const scale = Math.min(maxWidth / sizeSpec.width, maxHeight / sizeSpec.height, 1);
  const displayWidth = sizeSpec.width * scale * zoom;
  const displayHeight = sizeSpec.height * scale * zoom;

  const handleDownload = async () => {
    if (!version?.preview_url) return;
    
    try {
      // Load the image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = version.preview_url!;
      });

      // === 1. Download the full canvas/ad image ===
      const canvas = document.createElement('canvas');
      canvas.width = sizeSpec.width;
      canvas.height = sizeSpec.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('Could not get canvas context');
        return;
      }

      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Scale ratio from display coordinates to actual ad coordinates
      const scaleRatio = sizeSpec.width / displayWidth;
      
      // Convert position from display to actual coordinates
      const actualX = imageTransform.x * scaleRatio;
      const actualY = imageTransform.y * scaleRatio;
      
      // The container size in actual coordinates
      const actualContainerWidth = sizeSpec.width * imageTransform.scale;
      const actualContainerHeight = sizeSpec.height * imageTransform.scale;
      
      // Calculate object-contain dimensions
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const containerAspect = actualContainerWidth / actualContainerHeight;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imgAspect > containerAspect) {
        drawWidth = actualContainerWidth;
        drawHeight = drawWidth / imgAspect;
        drawX = actualX;
        drawY = actualY + (actualContainerHeight - drawHeight) / 2;
      } else {
        drawHeight = actualContainerHeight;
        drawWidth = drawHeight * imgAspect;
        drawX = actualX + (actualContainerWidth - drawWidth) / 2;
        drawY = actualY;
      }

      // Clip to canvas bounds
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, canvas.width, canvas.height);
      ctx.clip();

      // Draw the image with object-contain behavior
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      
      ctx.restore();

      // Download full canvas image
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ad-canvas-${version.id}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/png');

      // === 2. Download the original image object alone ===
      // Small delay to avoid browser blocking multiple downloads
      setTimeout(() => {
        const imgCanvas = document.createElement('canvas');
        imgCanvas.width = img.naturalWidth;
        imgCanvas.height = img.naturalHeight;
        const imgCtx = imgCanvas.getContext('2d');
        
        if (imgCtx) {
          imgCtx.drawImage(img, 0, 0);
          
          imgCanvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `ad-image-${version.id}.png`;
            link.click();
            URL.revokeObjectURL(url);
          }, 'image/png');
        }
      }, 500);

    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Zoom controls */}
      <div className="h-12 border-b border-border bg-card/30 px-6 flex items-center justify-between shrink-0">
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
          <div className="flex items-center gap-2">
            {/* Only show save for kept versions - pending versions should Keep first */}
            {version.status === 'kept' && (
              <Button
                variant={saveError ? "destructive" : hasChanges ? "default" : "outline"}
                size="sm"
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="gap-2"
                title={saveError || (hasChanges ? 'Save changes' : 'No changes to save')}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : hasChanges ? (
                  <Save className="w-4 h-4" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : hasChanges ? 'Save' : 'Saved'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
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
            {/* Interactive image layer - use version.id for cache busting */}
            {/* hasSavedTransform is true if transform differs from database default */}
            <InteractiveImageLayer
              key={version.id}
              imageUrl={`${version.preview_url}?v=${version.id}`}
              containerWidth={displayWidth}
              containerHeight={displayHeight}
              onTransformChange={handleTransformChange}
              initialTransform={imageTransform}
              hasSavedTransform={!!version.image_transform}
            />

            {/* Bleed overlay */}
            {showBleed && bleedPx > 0 && (
              <div 
                className="absolute inset-0 border-2 border-dashed border-canvas-bleed pointer-events-none z-10"
                style={{
                  margin: `${bleedPx * scale * zoom}px`,
                }}
              />
            )}

            {/* Safe zone overlay */}
            {showSafe && safePx > 0 && (
              <div 
                className="absolute border-2 border-dashed border-canvas-safe pointer-events-none z-10"
                style={{
                  top: safePx * scale * zoom,
                  left: safePx * scale * zoom,
                  right: safePx * scale * zoom,
                  bottom: safePx * scale * zoom,
                }}
              />
            )}

            {/* Keep/Discard buttons for pending versions */}
            {version.status === 'pending' && onKeepVersion && onDiscardVersion && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                <Button
                  onClick={() => onKeepVersion(version.id)}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-lg"
                >
                  <Check className="w-4 h-4" />
                  Keep
                </Button>
                <Button
                  onClick={() => onDiscardVersion(version.id)}
                  variant="destructive"
                  className="gap-2 shadow-lg"
                >
                  <X className="w-4 h-4" />
                  Discard
                </Button>
              </div>
            )}

            {/* Floating feedback bubble - bottom left */}
            {latestFeedback?.feedback && !feedbackDismissed && (
              <div className="absolute bottom-4 left-4 max-w-xs z-20 animate-fade-in">
                <div className="bg-orange-500/90 text-white rounded-lg p-3 shadow-lg backdrop-blur-sm relative">
                  <button
                    onClick={() => setFeedbackDismissed(true)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-white text-orange-500 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-md"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium mb-1">
                        {latestFeedback.client_name || latestFeedback.client_email}
                      </p>
                      <p className="text-sm leading-relaxed">
                        "{latestFeedback.feedback}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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
