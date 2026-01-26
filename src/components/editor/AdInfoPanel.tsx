import { useState } from 'react';
import { Ad, Publication, Version, Asset } from '@/types/ad';
import { ReviewToken } from '@/types/review';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { FileImage, Ruler, MessageSquare, Pencil, Check, X, CheckCircle, AlertCircle, Clock, Package, ChevronDown } from 'lucide-react';

interface AdInfoPanelProps {
  ad: Ad;
  publication: Publication | null;
  selectedVersion: Version | null;
  reviewTokens?: ReviewToken[];
  assets?: Asset[];
  onUpdateSpecs?: (specs: { bleed_px?: number; safe_px?: number; min_font_size?: number }) => Promise<void>;
}

export function AdInfoPanel({
  ad,
  publication,
  selectedVersion,
  reviewTokens = [],
  assets = [],
  onUpdateSpecs,
}: AdInfoPanelProps) {
  const [briefOpen, setBriefOpen] = useState(true);
  const [copyOpen, setCopyOpen] = useState(true);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [editingSpecs, setEditingSpecs] = useState(false);
  const [bleedPx, setBleedPx] = useState(ad.bleed_px ?? publication?.bleed_px ?? 0);
  const [safePx, setSafePx] = useState(ad.safe_px ?? publication?.safe_px ?? 0);
  const [minFontSize, setMinFontSize] = useState(ad.min_font_size ?? publication?.min_font_size ?? 6);
  const [saving, setSaving] = useState(false);

  const handleSaveSpecs = async () => {
    if (!onUpdateSpecs) return;
    setSaving(true);
    try {
      await onUpdateSpecs({ bleed_px: bleedPx, safe_px: safePx, min_font_size: minFontSize });
      setEditingSpecs(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setBleedPx(ad.bleed_px ?? publication?.bleed_px ?? 0);
    setSafePx(ad.safe_px ?? publication?.safe_px ?? 0);
    setMinFontSize(ad.min_font_size ?? publication?.min_font_size ?? 6);
    setEditingSpecs(false);
  };

  const displayBleed = ad.bleed_px ?? publication?.bleed_px ?? 0;
  const displaySafe = ad.safe_px ?? publication?.safe_px ?? 0;
  const displayMinFont = ad.min_font_size ?? publication?.min_font_size ?? 6;
  return (
    <div className="w-72 border-l border-border bg-card/50 flex flex-col shrink-0">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Ad Details</h3>
        <div className="mt-2 space-y-1">
          <p className="text-xs text-muted-foreground">
            Client: <span className="text-foreground">{ad.client_name}</span>
          </p>
          {publication && (
            <p className="text-xs text-muted-foreground">
              Publication: <span className="text-foreground">{publication.name}</span>
            </p>
          )}
          {ad.publication_issues && (
            <p className="text-xs text-muted-foreground">
              Issue: <span className="text-foreground">{new Date(ad.publication_issues.issue_date).toLocaleDateString()}</span>
            </p>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Document specs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Ruler className="w-4 h-4 text-primary" />
                Specifications
              </h4>
              {onUpdateSpecs && !editingSpecs && (
                <Button variant="ghost" size="sm" onClick={() => setEditingSpecs(true)} className="h-6 w-6 p-0">
                  <Pencil className="w-3 h-3" />
                </Button>
              )}
              {editingSpecs && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={handleSaveSpecs} disabled={saving} className="h-6 w-6 p-0 text-green-500 hover:text-green-400">
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={saving} className="h-6 w-6 p-0 text-red-500 hover:text-red-400">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size</span>
                <span className="text-foreground font-mono">
                  {ad.size_spec.width} × {ad.size_spec.height}px
                </span>
              </div>
              {ad.ad_sizes && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size (in)</span>
                  <span className="text-foreground font-mono">
                    {ad.ad_sizes.width_in}" × {ad.ad_sizes.height_in}"
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">DPI</span>
                <span className="text-foreground font-mono">{ad.dpi}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Bleed</span>
                {editingSpecs ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={bleedPx}
                      onChange={(e) => setBleedPx(parseInt(e.target.value) || 0)}
                      className="w-16 h-6 text-xs font-mono text-right"
                      min={0}
                    />
                    <span className="text-xs text-muted-foreground">px</span>
                  </div>
                ) : (
                  <span className="text-foreground font-mono">{displayBleed}px</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Safe Zone</span>
                {editingSpecs ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={safePx}
                      onChange={(e) => setSafePx(parseInt(e.target.value) || 0)}
                      className="w-16 h-6 text-xs font-mono text-right"
                      min={0}
                    />
                    <span className="text-xs text-muted-foreground">px</span>
                  </div>
                ) : (
                  <span className="text-foreground font-mono">{displaySafe}px</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Min Font</span>
                {editingSpecs ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={minFontSize}
                      onChange={(e) => setMinFontSize(parseInt(e.target.value) || 6)}
                      className="w-16 h-6 text-xs font-mono text-right"
                      min={1}
                    />
                    <span className="text-xs text-muted-foreground">pt</span>
                  </div>
                ) : (
                  <span className="text-foreground font-mono">{displayMinFont}pt</span>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Assets */}
          {assets.length > 0 && (
            <>
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Assets
                </h4>
                <div className="grid grid-cols-4 gap-1">
                  {assets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => setPreviewAsset(asset)}
                      className="rounded border border-border overflow-hidden bg-muted/30 hover:border-primary/50 transition-colors"
                    >
                      <div className="aspect-square relative">
                        <img
                          src={asset.url}
                          alt={asset.type}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Brief - Collapsible */}
          {ad.brief && (
            <>
              <Collapsible open={briefOpen} onOpenChange={setBriefOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full group">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Brief
                  </h4>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${briefOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <p className="text-sm text-muted-foreground leading-relaxed p-2 bg-muted/30 rounded-lg">
                    {ad.brief}
                  </p>
                </CollapsibleContent>
              </Collapsible>
              <Separator />
            </>
          )}

          {/* Ad Copy - Collapsible */}
          {ad.copy && (
            <Collapsible open={copyOpen} onOpenChange={setCopyOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full group">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileImage className="w-4 h-4 text-primary" />
                  Ad Copy
                </h4>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${copyOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap p-2 bg-muted/30 rounded-lg">
                  {ad.copy}
                </p>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* AI Description */}
          {(selectedVersion?.layout_json?.metadata as any)?.regenerationPrompt || selectedVersion?.layout_json?.metadata?.rationale ? (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">
                  AI Notes
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {(selectedVersion?.layout_json?.metadata as any)?.regenerationPrompt || selectedVersion?.layout_json?.metadata?.rationale}
                </p>
              </div>
            </>
          ) : null}

          {/* Review History */}
          {reviewTokens.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Review History
                </h4>
                <div className="space-y-3">
                  {reviewTokens.map((token) => (
                    <div 
                      key={token.id}
                      className="p-2 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {token.response === 'approved' ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        ) : token.response === 'changes_requested' ? (
                          <AlertCircle className="w-3.5 h-3.5 text-orange-500" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                        <span className="text-xs font-medium">
                          {token.client_name || token.client_email}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {token.response === 'approved' && 'Approved'}
                        {token.response === 'changes_requested' && 'Changes Requested'}
                        {!token.response && 'Pending review'}
                      </p>
                      {token.feedback && (
                        <p className="text-xs text-foreground mt-2 p-2 bg-background rounded border-l-2 border-orange-500">
                          "{token.feedback}"
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {token.used_at 
                          ? new Date(token.used_at).toLocaleDateString()
                          : `Expires ${new Date(token.expires_at).toLocaleDateString()}`
                        }
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Asset Preview Dialog */}
      <Dialog open={!!previewAsset} onOpenChange={() => setPreviewAsset(null)}>
        <DialogContent className="max-w-3xl p-2">
          {previewAsset && (
            <img
              src={previewAsset.url}
              alt={previewAsset.type}
              className="w-full h-auto max-h-[80vh] object-contain rounded"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
