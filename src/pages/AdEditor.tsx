import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Ad, Asset, Version, Publication, LayoutJSON, SizePreset } from '@/types/ad';
import { toast } from 'sonner';
import {
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';

export default function AdEditor() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [ad, setAd] = useState<Ad | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [publication, setPublication] = useState<Publication | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showBleed, setShowBleed] = useState(true);
  const [showSafe, setShowSafe] = useState(true);

  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

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
      // Fetch ad
      const { data: adData, error: adError } = await supabase
        .from('ads')
        .select('*, publications(*)')
        .eq('id', id)
        .single();

      if (adError) throw adError;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const typedAd = adData as any;
      setAd({
        ...typedAd,
        size_spec: typedAd.size_spec,
        status: typedAd.status,
        publications: undefined,
      } as Ad);

      if (adData.publications) {
        setPublication({
          ...adData.publications,
          size_presets: (adData.publications.size_presets as unknown) as SizePreset[] || [],
        });
      }

      // Fetch assets
      const { data: assetsData } = await supabase
        .from('assets')
        .select('*')
        .eq('ad_id', id);

      setAssets((assetsData || []) as Asset[]);

      // Fetch versions
      const { data: versionsData } = await supabase
        .from('versions')
        .select('*')
        .eq('ad_id', id)
        .order('created_at', { ascending: false });

      const typedVersions: Version[] = (versionsData || []).map(v => ({
        ...v,
        source: v.source as 'ai' | 'manual',
        layout_json: (v.layout_json as unknown) as LayoutJSON,
      }));
      setVersions(typedVersions);

      // Load selected version or most recent
      const selected = typedVersions.find(v => v.is_selected) || typedVersions[0];
      setSelectedVersion(selected || null);
    } catch (error) {
      console.error('Error fetching ad:', error);
      toast.error('Failed to load ad');
      navigate('/ads');
    } finally {
      setLoading(false);
    }
  };

  const generateAd = async () => {
    if (!ad) return;

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-layouts', {
        body: {
          adId: ad.id,
          sizeSpec: ad.size_spec,
          dpi: ad.dpi,
          bleedPx: publication?.bleed_px || 0,
          safePx: publication?.safe_px || 0,
          minFontSize: publication?.min_font_size || 6,
          copy: ad.copy || '',
          brief: ad.brief || '',
          assets: assets.map(a => ({
            id: a.id,
            type: a.type,
            url: a.url,
            width: a.width,
            height: a.height,
          })),
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success('Ad generated successfully!');
      fetchAdData();
    } catch (error) {
      console.error('Error generating ad:', error);
      toast.error('Failed to generate ad');
    } finally {
      setGenerating(false);
    }
  };

  const selectVersion = async (version: Version) => {
    // Update selection in database
    await supabase
      .from('versions')
      .update({ is_selected: false })
      .eq('ad_id', ad?.id);

    await supabase
      .from('versions')
      .update({ is_selected: true })
      .eq('id', version.id);

    setSelectedVersion(version);
    setVersions(prev =>
      prev.map(v => ({ ...v, is_selected: v.id === version.id }))
    );
  };

  const updateStatus = async (status: string) => {
    if (!ad) return;

    try {
      await supabase
        .from('ads')
        .update({ status })
        .eq('id', ad.id);

      setAd({ ...ad, status: status as Ad['status'] });
      toast.success(`Status updated to ${status.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
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
        <div className="h-12 border-b border-border bg-card/50 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/ads')}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="h-4 w-px bg-border" />
            <h2 className="font-medium text-foreground">{ad.client_name}</h2>
            <StatusBadge status={ad.status} />
            <span className="font-mono-spec text-muted-foreground">
              {ad.size_spec.width}×{ad.size_spec.height}px
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBleed(!showBleed)}
              className={showBleed ? 'text-canvas-bleed' : 'text-muted-foreground'}
            >
              {showBleed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="ml-1 hidden sm:inline">Bleed</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSafe(!showSafe)}
              className={showSafe ? 'text-canvas-safe' : 'text-muted-foreground'}
            >
              {showSafe ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="ml-1 hidden sm:inline">Safe</span>
            </Button>

            <div className="h-4 w-px bg-border" />

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
            onGenerate={generateAd}
            onSelectVersion={selectVersion}
            selectedVersion={selectedVersion}
          />

          {/* Preview */}
          <AdPreview
            version={selectedVersion}
            sizeSpec={ad.size_spec}
            showBleed={showBleed}
            showSafe={showSafe}
            bleedPx={publication?.bleed_px || 0}
            safePx={publication?.safe_px || 0}
          />

          {/* Info panel */}
          <AdInfoPanel
            ad={ad}
            publication={publication}
            selectedVersion={selectedVersion}
          />
        </div>
      </div>
    </AppLayout>
  );
}
