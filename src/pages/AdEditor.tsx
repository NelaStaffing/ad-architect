import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '@/integrations/db/client';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ads/StatusBadge';
import { GeneratedAdViewer } from '@/components/editor/GeneratedAdViewer';
import { AdPreview } from '@/components/editor/AdPreview';
import { AdInfoPanel } from '@/components/editor/AdInfoPanel';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Ad, Asset, Version, Publication, LayoutJSON, SizePreset, ImageTransform } from '@/types/ad';
import { ReviewToken } from '@/types/review';
import { toast } from 'sonner';
import {
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  Send,
  CheckCircle,
  Download,
  RotateCcw,
  Info,
  Maximize2,
} from 'lucide-react';
import { useAi } from '@/integrations/ai/context';
import { AiProviderSwitch } from '@/components/ai/AiProviderSwitch';
import { ShareForReviewDialog } from '@/components/review/ShareForReviewDialog';

export default function AdEditor() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { provider } = useAi();

  const [ad, setAd] = useState<Ad | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [publication, setPublication] = useState<Publication | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingBig, setGeneratingBig] = useState(false);
  const [expandMenuOpen, setExpandMenuOpen] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [showBleed, setShowBleed] = useState(true);
  const [showSafe, setShowSafe] = useState(true);

  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [pendingVersion, setPendingVersion] = useState<{ preview_url: string; layout_json: any } | null>(null);
  const [reviewTokens, setReviewTokens] = useState<ReviewToken[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (id && user) {
      fetchAdData();
    }
  }, [id, user]);

  const fetchAdData = async () => {
    try {
      if (!id) return;
      const { ad: adRow, publication: pub } = await db.fetchAdWithPublication(id);
      setAd(adRow);
      if (pub) setPublication(pub);

      const assetsData = await db.fetchAssetsByAdId(id);
      setAssets(assetsData);

      const versionsData = await db.fetchVersionsByAdId(id);
      setVersions(versionsData);
      
      // Fetch review tokens
      const tokens = await db.fetchReviewTokensByAdId(id);
      setReviewTokens(tokens);
      
      console.log('Versions loaded:', versionsData.map(v => ({ id: v.id, status: v.status, preview_url: v.preview_url?.substring(0, 50) })));

      // Check for pending version first (newly regenerated)
      const pending = versionsData.find(v => v.status === 'pending');
      console.log('Pending version found:', pending ? { id: pending.id, preview_url: pending.preview_url } : null);
      
      if (pending) {
        setPendingVersion({ preview_url: pending.preview_url || '', layout_json: pending.layout_json });
        setSelectedVersion(pending);
      } else {
        setPendingVersion(null);
        // Load selected version or most recent
        const selected = versionsData.find(v => v.is_selected) || versionsData[0];
        setSelectedVersion(selected || null);
      }
    } catch (error) {
      console.error('Error fetching ad:', error);
      toast.error('Failed to load ad');
      navigate('/ads');
    } finally {
      setLoading(false);
    }
  };

  const generateAd = async (regenerationPrompt?: string) => {
    if (!ad) return;

    setGenerating(true);
    try {
      // If regeneration prompt is provided (including empty string), route through Edge Function
      if (regenerationPrompt !== undefined) {
        const { data, error } = await db.invokeGenerateLayouts({
          adId: ad.id,
          adName: ad.ad_name,
          clientName: ad.client_name,
          regenerationPrompt,
          referenceImageUrl: selectedVersion?.preview_url || null,
          sizeSpec: ad.size_spec,
          aspectRatio: ad.aspect_ratio,
          dpi: ad.dpi,
          bleedPx: ad.bleed_px ?? publication?.bleed_px ?? 0,
          safePx: ad.safe_px ?? publication?.safe_px ?? 0,
          minFontSize: ad.min_font_size ?? publication?.min_font_size ?? 6,
          copy: ad.copy || '',
          brief: ad.brief || '',
          assets: assets.map(a => ({
            id: a.id,
            type: a.type,
            url: a.url,
            width: a.width,
            height: a.height,
          })),
          provider,
        } as any);

        if (error) {
          throw error;
        }

        toast.success('Regeneration request sent!');
        fetchAdData();
        return;
      }

      // Original generation logic
      const { data, error } = await db.invokeGenerateLayouts({
        adId: ad.id,
        sizeSpec: ad.size_spec,
        aspectRatio: ad.aspect_ratio,
        dpi: ad.dpi,
        bleedPx: ad.bleed_px ?? publication?.bleed_px ?? 0,
        safePx: ad.safe_px ?? publication?.safe_px ?? 0,
        minFontSize: ad.min_font_size ?? publication?.min_font_size ?? 6,
        copy: ad.copy || '',
        brief: ad.brief || '',
        assets: assets.map(a => ({
          id: a.id,
          type: a.type,
          url: a.url,
          width: a.width,
          height: a.height,
        })),
        provider,
      } as any);

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success('Ad generated successfully!');
      fetchAdData();
    } catch (error: any) {
      console.error('Error generating ad:', error);
      try {
        const resp = error?.context?.response;
        if (resp) {
          const txt = await resp.text();
          console.error('Edge Function error body:', txt);
          try {
            const parsed = JSON.parse(txt);
            if (parsed?.error) {
              toast.error(parsed.error);
              return;
            }
          } catch {}
        }
      } catch {}
      toast.error('Failed to generate ad');
    } finally {
      setGenerating(false);
    }
  };

  const generateBigChanges = async (bigChangesPrompt: string) => {
    if (!ad) return;

    setGeneratingBig(true);
    try {
      const { data, error } = await db.invokeGenerateLayouts({
        adId: ad.id,
        adName: ad.ad_name,
        clientName: ad.client_name,
        bigChangesPrompt,
        referenceImageUrl: selectedVersion?.preview_url || null,
        sizeSpec: ad.size_spec,
        aspectRatio: ad.aspect_ratio,
        dpi: ad.dpi,
        bleedPx: ad.bleed_px ?? publication?.bleed_px ?? 0,
        safePx: ad.safe_px ?? publication?.safe_px ?? 0,
        minFontSize: ad.min_font_size ?? publication?.min_font_size ?? 6,
        copy: ad.copy || '',
        brief: ad.brief || '',
        assets: assets.map(a => ({
          id: a.id,
          type: a.type,
          url: a.url,
          width: a.width,
          height: a.height,
        })),
        provider,
      } as any);

      if (error) {
        throw error;
      }

      toast.success('Big changes request sent!');
      fetchAdData();
    } catch (error: any) {
      console.error('Error generating big changes:', error);
      toast.error('Failed to generate big changes');
    } finally {
      setGeneratingBig(false);
    }
  };

  const handleExpand = async () => {
    if (!ad) return;
    
    const EXPAND_WEBHOOK_URL = import.meta.env.VITE_EXPAND_WEBHOOK_URL;
    if (!EXPAND_WEBHOOK_URL) {
      toast.error('Expand webhook URL not configured');
      return;
    }
    
    setExpanding(true);
    setExpandMenuOpen(false);
    try {
      // Get image dimensions scaled to fill the canvas (maintaining aspect ratio)
      let imageSize: { width: number; height: number } | null = null;
      let imageNaturalSize: { width: number; height: number } | null = null;
      if (selectedVersion?.preview_url) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = selectedVersion.preview_url!;
        });
        
        imageNaturalSize = { 
          width: img.naturalWidth, 
          height: img.naturalHeight 
        };
        
        // Calculate object-contain dimensions (how the image actually renders in the canvas)
        // The image is scaled to fit entirely within the canvas, maintaining aspect ratio
        const scaleX = ad.size_spec.width / img.naturalWidth;
        const scaleY = ad.size_spec.height / img.naturalHeight;
        const containScale = Math.min(scaleX, scaleY);
        
        // Current rendered dimensions (object-contain behavior)
        imageSize = { 
          width: Math.round(img.naturalWidth * containScale), 
          height: Math.round(img.naturalHeight * containScale) 
        };
        
        console.log('Image natural size:', imageNaturalSize);
        console.log('Canvas size:', ad.size_spec);
        console.log('Image size (object-contain, current render):', imageSize);
      }

      const response = await fetch(EXPAND_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId: ad.id,
          adName: ad.ad_name,
          clientName: ad.client_name,
          brief: ad.brief || '',
          copy: ad.copy || '',
          assets: assets.map(a => ({ id: a.id, type: a.type, url: a.url })),
          sizeSpec: ad.size_spec,
          imageSize,
          imageNaturalSize,
          imageTransform: selectedVersion?.image_transform ?? { x: 0, y: 0, scale: 1 },
          previewUrl: selectedVersion?.preview_url,
        }),
      });
      if (!response.ok) throw new Error('Webhook failed');
      
      // Expect JSON response with imageUrl from n8n (image uploaded to Supabase by n8n)
      const data = await response.json();
      console.log('Expand webhook response:', data);
      
      if (data.imageUrl) {
        // Create version from the URL provided by n8n
        console.log('Creating version from URL:', data.imageUrl);
        const newVersion = await db.createVersionFromUrl(ad.id, data.imageUrl, 'ai');
        console.log('New version created:', newVersion);
        toast.success('Expanded image received!');
        fetchAdData();
      } else {
        console.log('No imageUrl in response');
        toast.success('Expand request sent!');
      }
    } catch (error) {
      console.error('Expand error:', error);
      toast.error('Failed to send expand request');
    } finally {
      setExpanding(false);
    }
  };

  const [isSelectingVersion, setIsSelectingVersion] = useState(false);
  
  const selectVersion = async (version: Version) => {
    if (!ad || isSelectingVersion) return;
    if (selectedVersion?.id === version.id) return; // Already selected
    
    setIsSelectingVersion(true);
    console.log('Selecting version:', version.id, 'preview_url:', version.preview_url);
    
    // Update UI immediately for responsiveness
    setSelectedVersion(version);
    setVersions(prev => prev.map(v => ({ ...v, is_selected: v.id === version.id })));
    
    try {
      await db.setSelectedVersion(ad.id, version.id);
      console.log('Version selection saved to DB');
    } catch (error) {
      console.error('Error saving version selection:', error);
    } finally {
      setIsSelectingVersion(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!ad) return;

    try {
      await db.updateAdStatus(ad.id, status);

      setAd({ ...ad, status: status as Ad['status'] });
      toast.success(`Status updated to ${status.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const keepVersion = async (versionId: string) => {
    try {
      await db.updateVersionStatus(versionId, 'kept');
      setVersions(prev => prev.map(v => 
        v.id === versionId ? { ...v, status: 'kept' as const } : v
      ));
      if (selectedVersion?.id === versionId) {
        setSelectedVersion({ ...selectedVersion, status: 'kept' });
      }
      toast.success('Version kept!');
    } catch (error) {
      console.error('Error keeping version:', error);
      toast.error('Failed to keep version');
    }
  };

  const discardVersion = async (versionId: string) => {
    try {
      await db.updateVersionStatus(versionId, 'discarded');
      setVersions(prev => prev.filter(v => v.id !== versionId));
      if (selectedVersion?.id === versionId) {
        // Select the most recent kept version or null
        const keptVersions = versions.filter(v => v.id !== versionId && v.status === 'kept');
        setSelectedVersion(keptVersions[0] || null);
      }
      toast.success('Version discarded');
    } catch (error) {
      console.error('Error discarding version:', error);
      toast.error('Failed to discard version');
    }
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!ad) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Ad not found</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-3.5rem)] flex flex-col">
        {/* Editor toolbar */}
        <div className="h-14 border-b border-border bg-card/50 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/ads')}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="h-4 w-px bg-border" />
            <h2 className="font-medium text-foreground">{ad.ad_name || ad.client_name}</h2>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              onClick={() => navigate(`/ads/${ad.id}/detail`)}
              title="View Ad Details"
            >
              <Info className="w-4 h-4" />
            </Button>
            <StatusBadge status={ad.status} />
            <span className="font-mono-spec text-muted-foreground">
              {ad.size_spec.width}×{ad.size_spec.height}px
            </span>
          </div>

          <div className="flex items-center gap-2">
            <AiProviderSwitch />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBleed(!showBleed)}
              className={showBleed ? 'text-canvas-bleed' : 'text-muted-foreground'}
              title="Toggle bleed zone visibility"
            >
              {showBleed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="ml-1 hidden sm:inline">Bleed</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSafe(!showSafe)}
              className={showSafe ? 'text-canvas-safe' : 'text-muted-foreground'}
              title="Toggle safe zone visibility"
            >
              {showSafe ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="ml-1 hidden sm:inline">Safe</span>
            </Button>

            <div className="h-4 w-px bg-border" />

            {/* Status transition buttons */}
            {ad.status === 'draft' && (
              <ShareForReviewDialog
                adId={ad.id}
                adName={ad.ad_name || ad.client_name}
                disabled={!selectedVersion}
              />
            )}
            {ad.status === 'in_review' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateStatus('draft')}
                  className="gap-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  Back to Draft
                </Button>
                <Button
                  size="sm"
                  onClick={() => updateStatus('approved')}
                  className="gap-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </Button>
              </>
            )}
            {ad.status === 'approved' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateStatus('in_review')}
                  className="gap-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  Back to Review
                </Button>
                <Button
                  size="sm"
                  onClick={() => updateStatus('exported')}
                  className="gap-1"
                >
                  <Download className="w-4 h-4" />
                  Mark Exported
                </Button>
              </>
            )}
            {ad.status === 'exported' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatus('approved')}
                className="gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                Back to Approved
              </Button>
            )}

            <Select value={ad.status} onValueChange={updateStatus}>
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="exported">Exported</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main editor area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Versions panel */}
          <GeneratedAdViewer
            versions={versions}
            generating={generating}
            generatingBig={generatingBig}
            onGenerate={generateAd}
            onGenerateBig={generateBigChanges}
            onSelectVersion={selectVersion}
            selectedVersion={selectedVersion}
          />

          {/* Preview */}
          <AdPreview
            version={selectedVersion}
            sizeSpec={ad.size_spec}
            showBleed={showBleed}
            showSafe={showSafe}
            bleedPx={ad.bleed_px ?? publication?.bleed_px ?? 0}
            safePx={ad.safe_px ?? publication?.safe_px ?? 0}
            latestFeedback={reviewTokens.find(t => t.response === 'changes_requested' && t.feedback)}
            onSaveTransform={async (transform: ImageTransform) => {
              if (!selectedVersion) return;
              try {
                await db.updateVersionTransform(selectedVersion.id, transform);
                toast.success('Changes saved!');
                fetchAdData();
              } catch (error) {
                console.error('Failed to save transform:', error);
                toast.error('Failed to save changes');
              }
            }}
            onKeepVersion={keepVersion}
            onDiscardVersion={discardVersion}
          />

          {/* Info panel */}
          <AdInfoPanel
            ad={ad}
            publication={publication}
            selectedVersion={selectedVersion}
            reviewTokens={reviewTokens}
            assets={assets}
            onUpdateSpecs={async (specs) => {
              try {
                const response = await fetch(
                  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-ad-specs`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                    },
                    body: JSON.stringify({ adId: ad.id, specs }),
                  }
                );
                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.error || 'Failed to update');
                }
                setAd({ ...ad, ...specs });
                toast.success('Specifications updated!');
              } catch (error) {
                console.error('Failed to update specs:', error);
                toast.error('Failed to update specifications');
              }
            }}
            />

          {/* Floating Action Button - Expand */}
          <div className="absolute bottom-6 right-6 z-50">
            {expandMenuOpen && (
              <div className="absolute bottom-16 right-0 bg-card border border-border rounded-lg shadow-xl p-2 min-w-[160px]">
                <button
                  onClick={handleExpand}
                  disabled={expanding}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <Maximize2 className="w-4 h-4" />
                  {expanding ? 'Sending...' : 'Expand Ad'}
                </button>
              </div>
            )}
            <button
              onClick={() => setExpandMenuOpen(!expandMenuOpen)}
              className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
                expanding 
                  ? 'bg-orange-600 animate-pulse' 
                  : expandMenuOpen 
                    ? 'bg-primary rotate-45' 
                    : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {expanding ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Maximize2 className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
