import { LayoutJSON, LayoutElement, Publication } from '@/types/ad';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Type, Image, Square, AlertTriangle, Info } from 'lucide-react';

interface PropertiesPanelProps {
  layout: LayoutJSON | null;
  selectedElement: string | null;
  publication: Publication | null;
  onLayoutChange: (layout: LayoutJSON) => void;
}

export function PropertiesPanel({
  layout,
  selectedElement,
  publication,
  onLayoutChange,
}: PropertiesPanelProps) {
  const element = layout?.elements.find(el => el.id === selectedElement);

  const updateElement = (updates: Partial<LayoutElement>) => {
    if (!layout || !selectedElement) return;

    const newElements = layout.elements.map(el =>
      el.id === selectedElement ? { ...el, ...updates } : el
    );
    onLayoutChange({ ...layout, elements: newElements });
  };

  const updateStyle = (styleUpdates: Partial<LayoutElement['style']>) => {
    if (!element) return;
    updateElement({ style: { ...element.style, ...styleUpdates } });
  };

  // Check for warnings
  const warnings: string[] = [];
  if (layout && publication) {
    layout.elements.forEach(el => {
      if (el.type === 'text' && el.style?.fontSize) {
        if (el.style.fontSize < publication.min_font_size) {
          warnings.push(`"${el.content?.substring(0, 20)}..." uses ${el.style.fontSize}pt (min: ${publication.min_font_size}pt)`);
        }
      }
    });
  }

  return (
    <div className="w-64 border-l border-border bg-card/50 flex flex-col shrink-0">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Document info */}
          {layout && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Document
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/30 p-2 rounded">
                  <span className="text-muted-foreground">Size</span>
                  <div className="font-mono-spec">{layout.document.widthPx}×{layout.document.heightPx}</div>
                </div>
                <div className="bg-muted/30 p-2 rounded">
                  <span className="text-muted-foreground">DPI</span>
                  <div className="font-mono-spec">{layout.document.dpi}</div>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-status-draft uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Warnings
              </h3>
              <div className="space-y-1">
                {warnings.map((warning, i) => (
                  <div key={i} className="text-xs text-status-draft bg-status-draft/10 p-2 rounded">
                    {warning}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Element properties */}
          {element ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {element.type === 'text' && <Type className="w-4 h-4 text-primary" />}
                {element.type === 'image' && <Image className="w-4 h-4 text-primary" />}
                {element.type === 'shape' && <Square className="w-4 h-4 text-primary" />}
                <h3 className="text-sm font-medium text-foreground capitalize">
                  {element.type} Element
                </h3>
              </div>

              {/* Position */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">Position</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">X</Label>
                    <Input
                      type="number"
                      value={element.x}
                      onChange={(e) => updateElement({ x: parseInt(e.target.value) || 0 })}
                      className="h-8 font-mono-spec"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Y</Label>
                    <Input
                      type="number"
                      value={element.y}
                      onChange={(e) => updateElement({ y: parseInt(e.target.value) || 0 })}
                      className="h-8 font-mono-spec"
                    />
                  </div>
                </div>
              </div>

              {/* Size */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">Size</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Width</Label>
                    <Input
                      type="number"
                      value={element.w}
                      onChange={(e) => updateElement({ w: parseInt(e.target.value) || 20 })}
                      className="h-8 font-mono-spec"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Height</Label>
                    <Input
                      type="number"
                      value={element.h}
                      onChange={(e) => updateElement({ h: parseInt(e.target.value) || 20 })}
                      className="h-8 font-mono-spec"
                    />
                  </div>
                </div>
              </div>

              {/* Text-specific properties */}
              {element.type === 'text' && (
                <>
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">Typography</h4>
                    <div>
                      <Label className="text-xs">Font Size (pt)</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[element.style?.fontSize || 12]}
                          onValueChange={([val]) => updateStyle({ fontSize: val })}
                          min={6}
                          max={72}
                          step={1}
                          className="flex-1"
                        />
                        <span className="w-8 text-xs font-mono-spec text-right">
                          {element.style?.fontSize || 12}
                        </span>
                      </div>
                      {publication && (element.style?.fontSize || 12) < publication.min_font_size && (
                        <p className="text-[10px] text-status-draft mt-1">
                          Below minimum ({publication.min_font_size}pt)
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs">Font Weight</Label>
                      <Select
                        value={element.style?.fontWeight || 'normal'}
                        onValueChange={(val) => updateStyle({ fontWeight: val })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Alignment</Label>
                      <Select
                        value={element.style?.alignment || 'left'}
                        onValueChange={(val) => updateStyle({ alignment: val as 'left' | 'center' | 'right' })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={element.style?.color || '#000000'}
                          onChange={(e) => updateStyle({ color: e.target.value })}
                          className="w-10 h-8 p-1 cursor-pointer"
                        />
                        <Input
                          value={element.style?.color || '#000000'}
                          onChange={(e) => updateStyle({ color: e.target.value })}
                          className="flex-1 h-8 font-mono-spec text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Content</Label>
                    <textarea
                      value={element.content || ''}
                      onChange={(e) => updateElement({ content: e.target.value })}
                      className="w-full h-20 p-2 text-xs bg-input border border-border rounded resize-none"
                    />
                  </div>
                </>
              )}

              {/* Shape properties */}
              {element.type === 'shape' && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">Style</h4>
                  <div>
                    <Label className="text-xs">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={element.style?.backgroundColor || '#cccccc'}
                        onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                        className="w-10 h-8 p-1 cursor-pointer"
                      />
                      <Input
                        value={element.style?.backgroundColor || '#cccccc'}
                        onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                        className="flex-1 h-8 font-mono-spec text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Border Radius</Label>
                    <Slider
                      value={[element.style?.borderRadius || 0]}
                      onValueChange={([val]) => updateStyle({ borderRadius: val })}
                      min={0}
                      max={50}
                      step={1}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : layout ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Select an element</p>
              <p className="text-xs mt-1">Click on the canvas to edit</p>
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}
