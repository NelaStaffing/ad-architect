import { useState, useRef, useEffect } from 'react';
import { Move, Maximize2 } from 'lucide-react';

interface ImageTransform {
  x: number;
  y: number;
  scale: number;
}

interface InteractiveImageLayerProps {
  imageUrl: string;
  containerWidth: number;
  containerHeight: number;
  onTransformChange?: (transform: ImageTransform) => void;
  initialTransform?: ImageTransform;
  hasSavedTransform?: boolean;
}

export function InteractiveImageLayer({
  imageUrl,
  containerWidth,
  containerHeight,
  onTransformChange,
  initialTransform = { x: 0, y: 0, scale: 1 },
  hasSavedTransform = false,
}: InteractiveImageLayerProps) {
  const [transform, setTransform] = useState<ImageTransform>(initialTransform);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [initialized, setInitialized] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Calculate fit-to-contain transform when image loads (only for new images without saved transform)
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    setNaturalSize({ width: imgWidth, height: imgHeight });
    console.log('Image loaded:', imageUrl, 'natural size:', imgWidth, 'x', imgHeight);

    // Only auto-fit if no saved transform
    if (!initialized && !hasSavedTransform) {
      // Calculate scale to cover the entire container (cover behavior)
      const scaleX = containerWidth / imgWidth;
      const scaleY = containerHeight / imgHeight;
      const fitScale = Math.max(scaleX, scaleY);
      
      // Position at origin (0,0) to fill from top-left, covering the canvas
      const fitTransform = { x: 0, y: 0, scale: fitScale };
      console.log('Auto-fit transform:', fitTransform);
      setTransform(fitTransform);
    }
    setInitialized(true);
  };

  useEffect(() => {
    if (onTransformChange) {
      onTransformChange(transform);
    }
  }, [transform, onTransformChange]);

  const handleMouseDown = (e: React.MouseEvent, handle?: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }

    setDragStart({
      x: e.clientX - transform.x,
      y: e.clientY - transform.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      setTransform(prev => ({
        ...prev,
        x: newX,
        y: newY,
      }));
    } else if (isResizing && resizeHandle) {
      const deltaX = e.clientX - dragStart.x - transform.x;
      const deltaY = e.clientY - dragStart.y - transform.y;

      let newScale = transform.scale;

      // Calculate scale based on resize handle
      if (resizeHandle.includes('e')) {
        newScale = Math.max(0.1, transform.scale + deltaX / containerWidth);
      } else if (resizeHandle.includes('w')) {
        newScale = Math.max(0.1, transform.scale - deltaX / containerWidth);
      }

      if (resizeHandle.includes('s')) {
        newScale = Math.max(0.1, transform.scale + deltaY / containerHeight);
      } else if (resizeHandle.includes('n')) {
        newScale = Math.max(0.1, transform.scale - deltaY / containerHeight);
      }

      setTransform(prev => ({
        ...prev,
        scale: Math.min(3, newScale),
      }));

      setDragStart({
        x: e.clientX - transform.x,
        y: e.clientY - transform.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, transform]);

  const imageWidth = containerWidth * transform.scale;
  const imageHeight = containerHeight * transform.scale;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Interactive image container */}
      <div
        ref={imageRef}
        className={`absolute ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} group`}
        style={{
          left: transform.x,
          top: transform.y,
          width: imageWidth,
          height: imageHeight,
        }}
        onMouseDown={(e) => handleMouseDown(e)}
      >
        {/* Image with unique key to force re-render on URL change */}
        <img
          key={imageUrl}
          src={imageUrl}
          alt="Ad preview"
          className="w-full h-full object-contain pointer-events-none select-none"
          draggable={false}
          onError={(e) => console.error('Image failed to load:', imageUrl, e)}
          onLoad={handleImageLoad}
        />

        {/* Resize handles */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {/* Corner handles */}
          {['nw', 'ne', 'sw', 'se'].map((handle) => (
            <div
              key={handle}
              className={`absolute w-3 h-3 bg-primary border-2 border-white rounded-full pointer-events-auto ${
                handle.includes('n') ? 'top-0' : 'bottom-0'
              } ${handle.includes('w') ? 'left-0' : 'right-0'} ${
                handle === 'nw' ? 'cursor-nw-resize' :
                handle === 'ne' ? 'cursor-ne-resize' :
                handle === 'sw' ? 'cursor-sw-resize' :
                'cursor-se-resize'
              } -translate-x-1/2 -translate-y-1/2`}
              onMouseDown={(e) => handleMouseDown(e, handle)}
            />
          ))}

          {/* Edge handles */}
          {['n', 'e', 's', 'w'].map((handle) => (
            <div
              key={handle}
              className={`absolute w-3 h-3 bg-primary border-2 border-white rounded-full pointer-events-auto ${
                handle === 'n' ? 'top-0 left-1/2 cursor-n-resize' :
                handle === 's' ? 'bottom-0 left-1/2 cursor-s-resize' :
                handle === 'e' ? 'right-0 top-1/2 cursor-e-resize' :
                'left-0 top-1/2 cursor-w-resize'
              } -translate-x-1/2 -translate-y-1/2`}
              onMouseDown={(e) => handleMouseDown(e, handle)}
            />
          ))}
        </div>

        {/* Move indicator */}
        <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pointer-events-none">
          <Move className="w-3 h-3" />
          Drag to move
        </div>

        {/* Scale indicator */}
        <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pointer-events-none">
          <Maximize2 className="w-3 h-3" />
          {Math.round(transform.scale * 100)}%
        </div>
      </div>
    </div>
  );
}
