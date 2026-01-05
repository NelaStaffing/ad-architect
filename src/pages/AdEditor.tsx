import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ads/StatusBadge';
import { LayoutCanvas } from '@/components/editor/LayoutCanvas';
import { VersionsPanel } from '@/components/editor/VersionsPanel';
import { PropertiesPanel } from '@/components/editor/PropertiesPanel';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Ad, Asset, Version, Publication, LayoutJSON, SizePreset, LayoutElement } from '@/types/ad';
import { toast } from 'sonner';
import {
  Loader2,
  Sparkles,
  Save,
  Download,
  ChevronLeft,
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
  const [saving, setSaving] = useState(false);
  const [showBleed, setShowBleed] = useState(true);
  const [showSafe, setShowSafe] = useState(true);

  const [currentLayout, setCurrentLayout] = useState<LayoutJSON | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
      if (selected) {
        setCurrentLayout(selected.layout_json);
      }
    } catch (error) {
      console.error('Error fetching ad:', error);
      toast.error('Failed to load ad');
      navigate('/ads');
    } finally {
      setLoading(false);
    }
  };

  const generateLayouts = async () => {
    if (!ad) return;

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-layouts', {
        body: {
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

      const layouts: LayoutJSON[] = data.layouts;
      
      // Save all generated layouts as versions
      for (const layout of layouts) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from('versions').insert({
          ad_id: ad.id,
          source: 'ai',
          layout_json: layout as any,
          is_selected: false,
        });
      }

      toast.success(`Generated ${layouts.length} layout variations!`);
      fetchAdData();
    } catch (error) {
      console.error('Error generating layouts:', error);
      toast.error('Failed to generate layouts');
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

    setCurrentLayout(version.layout_json);
    setVersions(prev =>
      prev.map(v => ({ ...v, is_selected: v.id === version.id }))
    );
    setHasUnsavedChanges(false);
    setSelectedElement(null);
  };

  const handleLayoutChange = useCallback((updatedLayout: LayoutJSON) => {
    setCurrentLayout(updatedLayout);
    setHasUnsavedChanges(true);
  }, []);

  const saveLayout = async () => {
    if (!currentLayout || !ad) return;

    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from('versions').insert({
        ad_id: ad.id,
        source: 'manual',
        layout_json: currentLayout as any,
        is_selected: true,
      });

      // Deselect others
      await supabase
        .from('versions')
        .update({ is_selected: false })
        .eq('ad_id', ad.id)
        .neq('source', 'manual');

      setHasUnsavedChanges(false);
      toast.success('Layout saved!');
      fetchAdData();
    } catch (error) {
      console.error('Error saving layout:', error);
      toast.error('Failed to save layout');
    } finally {
      setSaving(false);
    }
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

  const exportAd = async (format: 'png' | 'pdf') => {
    toast.info(`Export to ${format.toUpperCase()} coming soon!`);
    // TODO: Implement canvas export
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

            <Button
              variant="outline"
              size="sm"
              onClick={saveLayout}
              disabled={!hasUnsavedChanges || saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="ml-1 hidden sm:inline">Save</span>
            </Button>

            <Button variant="outline" size="sm" onClick={() => exportAd('png')}>
              <Download className="w-4 h-4" />
              <span className="ml-1 hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* Main editor area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Versions panel */}
          <VersionsPanel
            versions={versions}
            currentLayout={currentLayout}
            generating={generating}
            onGenerate={generateLayouts}
            onSelectVersion={selectVersion}
          />

          {/* Canvas */}
          <div className="flex-1 overflow-auto bg-muted/30 canvas-grid p-8 flex items-center justify-center">
            {currentLayout ? (
              <LayoutCanvas
                layout={currentLayout}
                assets={assets}
                showBleed={showBleed}
                showSafe={showSafe}
                selectedElement={selectedElement}
                onSelectElement={setSelectedElement}
                onLayoutChange={handleLayoutChange}
              />
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No layouts yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Generate AI layout variations to get started
                </p>
                <Button
                  onClick={generateLayouts}
                  className="btn-glow gap-2"
                  disabled={generating}
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Generate Layouts
                </Button>
              </div>
            )}
          </div>

          {/* Properties panel */}
          <PropertiesPanel
            layout={currentLayout}
            selectedElement={selectedElement}
            publication={publication}
            onLayoutChange={handleLayoutChange}
          />
        </div>
      </div>
    </AppLayout>
  );
}
