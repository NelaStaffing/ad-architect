import { useCallback, useRef, useState, useEffect } from 'react';
import { LayoutJSON, LayoutElement, Asset } from '@/types/ad';

interface LayoutCanvasProps {
  layout: LayoutJSON;
  assets: Asset[];
  showBleed: boolean;
  showSafe: boolean;
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  onLayoutChange: (layout: LayoutJSON) => void;
}

export function LayoutCanvas({
  layout,
  assets,
  showBleed,
  showSafe,
  selectedElement,
  onSelectElement,
  onLayoutChange,
}: LayoutCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; elX: number; elY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; startX: number; startY: number; elW: number; elH: number } | null>(null);

  const { document: doc, elements } = layout;

  // Auto-scale to fit
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current.parentElement;
      if (container) {
        const maxW = container.clientWidth - 64;
        const maxH = container.clientHeight - 64;
        const scaleX = maxW / doc.widthPx;
        const scaleY = maxH / doc.heightPx;
        setScale(Math.min(scaleX, scaleY, 1));
      }
    }
  }, [doc.widthPx, doc.heightPx]);

  const handleMouseDown = useCallback((e: React.MouseEvent, element: LayoutElement) => {
    e.stopPropagation();
    onSelectElement(element.id);
    setDragging({
      id: element.id,
      startX: e.clientX,
      startY: e.clientY,
      elX: element.x,
      elY: element.y,
    });
  }, [onSelectElement]);

  const handleResizeStart = useCallback((e: React.MouseEvent, element: LayoutElement) => {
    e.stopPropagation();
    setResizing({
      id: element.id,
      startX: e.clientX,
      startY: e.clientY,
      elW: element.w,
      elH: element.h,
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      const dx = (e.clientX - dragging.startX) / scale;
      const dy = (e.clientY - dragging.startY) / scale;
      
      const newElements = elements.map(el => 
        el.id === dragging.id 
          ? { ...el, x: Math.round(dragging.elX + dx), y: Math.round(dragging.elY + dy) }
          : el
      );
      
      onLayoutChange({ ...layout, elements: newElements });
    }
    
    if (resizing) {
      const dx = (e.clientX - resizing.startX) / scale;
      const dy = (e.clientY - resizing.startY) / scale;
      
      const newElements = elements.map(el => 
        el.id === resizing.id 
          ? { ...el, w: Math.max(20, Math.round(resizing.elW + dx)), h: Math.max(20, Math.round(resizing.elH + dy)) }
          : el
      );
      
      onLayoutChange({ ...layout, elements: newElements });
    }
  }, [dragging, resizing, elements, layout, onLayoutChange, scale]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
  }, []);

  const handleCanvasClick = useCallback(() => {
    onSelectElement(null);
  }, [onSelectElement]);

  const getAssetUrl = (assetRef: string) => {
    const asset = assets.find(a => a.id === assetRef);
    return asset?.url || '';
  };

  return (
    <div
      ref={containerRef}
      className="relative shadow-card rounded-lg overflow-hidden"
      style={{
        width: doc.widthPx * scale,
        height: doc.heightPx * scale,
      }}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Canvas background */}
      <div
        className="absolute inset-0 bg-white"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        {/* Bleed overlay */}
        {showBleed && doc.bleedPx > 0 && (
          <div
            className="absolute border-2 border-dashed overlay-bleed pointer-events-none z-10"
            style={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
        )}

        {/* Safe zone overlay */}
        {showSafe && doc.safePx > 0 && (
          <div
            className="absolute border-2 border-dashed overlay-safe pointer-events-none z-10"
            style={{
              top: doc.safePx,
              left: doc.safePx,
              right: doc.safePx,
              bottom: doc.safePx,
            }}
          />
        )}

        {/* Elements */}
        {elements.map((element) => (
          <div
            key={element.id}
            className={`absolute cursor-move transition-shadow ${
              selectedElement === element.id
                ? 'ring-2 ring-primary ring-offset-1'
                : 'hover:ring-1 hover:ring-primary/50'
            }`}
            style={{
              left: element.x,
              top: element.y,
              width: element.w,
              height: element.h,
              backgroundColor: element.style?.backgroundColor || 'transparent',
              borderRadius: element.style?.borderRadius || 0,
            }}
            onMouseDown={(e) => handleMouseDown(e, element)}
          >
            {element.type === 'text' && (
              <div
                className="w-full h-full overflow-hidden"
                style={{
                  fontFamily: element.style?.fontFamily || 'Arial',
                  fontSize: element.style?.fontSize || 12,
                  fontWeight: element.style?.fontWeight || 'normal',
                  lineHeight: element.style?.lineHeight || 1.2,
                  color: element.style?.color || '#000000',
                  textAlign: element.style?.alignment || 'left',
                  padding: element.style?.padding || 0,
                }}
              >
                {element.content}
              </div>
            )}

            {element.type === 'image' && (
              <div className="w-full h-full bg-muted flex items-center justify-center overflow-hidden">
                {element.assetRef ? (
                  <img
                    src={getAssetUrl(element.assetRef)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">No image</span>
                )}
              </div>
            )}

            {element.type === 'shape' && (
              <div
                className="w-full h-full"
                style={{
                  backgroundColor: element.style?.backgroundColor || '#cccccc',
                  borderRadius: element.style?.borderRadius || 0,
                }}
              />
            )}

            {/* Resize handle */}
            {selectedElement === element.id && (
              <div
                className="absolute bottom-0 right-0 w-3 h-3 bg-primary cursor-se-resize"
                onMouseDown={(e) => handleResizeStart(e, element)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono-spec text-muted-foreground">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
}
