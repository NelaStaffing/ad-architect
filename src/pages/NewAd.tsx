import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Publication, SizePreset } from '@/types/ad';
import { toast } from 'sonner';
import { Loader2, Upload, X, Image as ImageIcon, Building2, FileText, Ruler, ArrowRight } from 'lucide-react';

interface UploadedAsset {
  file: File;
  preview: string;
  type: 'product' | 'logo';
}

export default function NewAd() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [publications, setPublications] = useState<Publication[]>([]);

  // Form state
  const [clientName, setClientName] = useState('');
  const [publicationId, setPublicationId] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customWidth, setCustomWidth] = useState(600);
  const [customHeight, setCustomHeight] = useState(600);
  const [brief, setBrief] = useState('');
  const [copy, setCopy] = useState('');
  const [assets, setAssets] = useState<UploadedAsset[]>([]);

  const selectedPublication = publications.find((p) => p.id === publicationId);
  const presets = selectedPublication?.size_presets || [];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchPublications();
  }, []);

  const fetchPublications = async () => {
    try {
      const { data, error } = await supabase
        .from('publications')
        .select('*')
        .order('name');

      if (error) throw error;
      
      const typedPubs: Publication[] = (data || []).map(pub => ({
        ...pub,
        size_presets: (pub.size_presets as unknown) as SizePreset[] || [],
      }));
      
      setPublications(typedPubs);
    } catch (error) {
      console.error('Error fetching publications:', error);
    }
  };

  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName);
    if (presetName !== 'custom') {
      const preset = presets.find((p) => p.name === presetName);
      if (preset) {
        setCustomWidth(preset.width);
        setCustomHeight(preset.height);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'logo') => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload image files only');
        return;
      }
      const preview = URL.createObjectURL(file);
      setAssets((prev) => [...prev, { file, preview, type }]);
    });
    e.target.value = '';
  };

  const removeAsset = (index: number) => {
    setAssets((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!clientName.trim()) {
      toast.error('Please enter a client name');
      return;
    }

    setLoading(true);

    try {
      // Create the ad
      const { data: adData, error: adError } = await supabase
        .from('ads')
        .insert({
          user_id: user.id,
          client_name: clientName.trim(),
          publication_id: publicationId || null,
          size_spec: { width: customWidth, height: customHeight },
          dpi: selectedPublication?.dpi_default || 300,
          brief: brief.trim() || null,
          copy: copy.trim() || null,
          status: 'draft',
        })
        .select()
        .single();

      if (adError) throw adError;

      // Upload assets
      for (const asset of assets) {
        const fileName = `${adData.id}/${Date.now()}-${asset.file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('ad-assets')
          .upload(fileName, asset.file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('ad-assets')
          .getPublicUrl(uploadData.path);

        // Create asset record
        await supabase.from('assets').insert({
          ad_id: adData.id,
          type: asset.type,
          url: urlData.publicUrl,
          name: asset.file.name,
        });
      }

      toast.success('Ad created successfully!');
      navigate(`/ads/${adData.id}`);
    } catch (error) {
      console.error('Error creating ad:', error);
      toast.error('Failed to create ad');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Create New Ad</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Fill in the details to generate AI layout options
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client & Publication */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Client & Publication
              </CardTitle>
              <CardDescription>Basic information about the ad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client Name *</Label>
                <Input
                  id="client"
                  placeholder="e.g., Acme Corp"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publication">Publication</Label>
                <Select value={publicationId} onValueChange={setPublicationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a publication" />
                  </SelectTrigger>
                  <SelectContent>
                    {publications.map((pub) => (
                      <SelectItem key={pub.id} value={pub.id}>
                        {pub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPublication && (
                  <p className="text-xs text-muted-foreground">
                    {selectedPublication.dpi_default} DPI • Min font: {selectedPublication.min_font_size}pt
                    • Bleed: {selectedPublication.bleed_px}px
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Size */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Ruler className="w-4 h-4 text-primary" />
                Ad Size
              </CardTitle>
              <CardDescription>Select a preset or enter custom dimensions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {presets.length > 0 && (
                <div className="space-y-2">
                  <Label>Size Preset</Label>
                  <Select value={selectedPreset} onValueChange={handlePresetChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a preset" />
                    </SelectTrigger>
                    <SelectContent>
                      {presets.map((preset) => (
                        <SelectItem key={preset.name} value={preset.name}>
                          {preset.name} ({preset.width}×{preset.height}px)
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom size</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Width (px)</Label>
                  <Input
                    id="width"
                    type="number"
                    min={100}
                    max={10000}
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value) || 600)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (px)</Label>
                  <Input
                    id="height"
                    type="number"
                    min={100}
                    max={10000}
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseInt(e.target.value) || 600)}
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg">
                <div
                  className="bg-secondary border border-border rounded flex items-center justify-center font-mono-spec text-muted-foreground"
                  style={{
                    width: `${Math.min(200, (customWidth / Math.max(customWidth, customHeight)) * 200)}px`,
                    height: `${Math.min(200, (customHeight / Math.max(customWidth, customHeight)) * 200)}px`,
                  }}
                >
                  {customWidth}×{customHeight}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Brief & Copy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Brief & Copy
              </CardTitle>
              <CardDescription>Content for the AI to work with</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brief">Creative Brief</Label>
                <Textarea
                  id="brief"
                  placeholder="Describe the ad's purpose, tone, target audience..."
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="copy">Ad Copy</Label>
                <Textarea
                  id="copy"
                  placeholder="Headline, body text, call to action, contact info..."
                  value={copy}
                  onChange={(e) => setCopy(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Assets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                Assets
              </CardTitle>
              <CardDescription>Upload product images and logos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Product Images</Label>
                  <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                    <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Click to upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'product')}
                    />
                  </label>
                </div>
                <div>
                  <Label className="mb-2 block">Logos</Label>
                  <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                    <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Click to upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                    />
                  </label>
                </div>
              </div>

              {assets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {assets.map((asset, index) => (
                    <div
                      key={index}
                      className="relative group w-16 h-16 rounded-lg overflow-hidden border border-border"
                    >
                      <img
                        src={asset.preview}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeAsset(index)}
                          className="p-1 rounded-full bg-destructive text-destructive-foreground"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="absolute bottom-0 left-0 right-0 text-[10px] text-center bg-background/80 py-0.5">
                        {asset.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/ads')}>
              Cancel
            </Button>
            <Button type="submit" className="btn-glow gap-2" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              Create Ad
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
