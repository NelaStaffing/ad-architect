import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '@/integrations/db/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
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
import { Publication, SizePreset, Client, PublicationIssue, AdSize, AspectRatio } from '@/types/ad';

// Helper function to calculate aspect ratio from dimensions
function calculateAspectRatio(width: number, height: number): AspectRatio {
  const ratio = width / height;
  
  // Define aspect ratios with their numeric values
  const ratios: { value: number; label: AspectRatio }[] = [
    { value: 1, label: '1:1' },
    { value: 3/4, label: '3:4' },
    { value: 4/3, label: '4:3' },
    { value: 9/16, label: '9:16' },
    { value: 16/9, label: '16:9' },
  ];
  
  // Find the closest matching ratio
  let closest = ratios[0];
  let minDiff = Math.abs(ratio - ratios[0].value);
  
  for (const r of ratios) {
    const diff = Math.abs(ratio - r.value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = r;
    }
  }
  
  return closest.label;
}
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
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [publicationId, setPublicationId] = useState<string>('');
  const [issues, setIssues] = useState<PublicationIssue[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string>('');
  const [adSizes, setAdSizes] = useState<AdSize[]>([]);
  const [selectedAdSizeId, setSelectedAdSizeId] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customWidth, setCustomWidth] = useState(600);
  const [customHeight, setCustomHeight] = useState(600);
  const [selectedRatio, setSelectedRatio] = useState<string>('1:1');
  const [brief, setBrief] = useState('');
  const [copy, setCopy] = useState('');
  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [searchParams] = useSearchParams();

  const selectedPublication = publications.find((p) => p.id === publicationId);
  const presets = selectedPublication?.size_presets || [];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchClients();
    fetchAdSizes();
  }, []);

  // Apply query params for initial selection
  useEffect(() => {
    const cid = searchParams.get('clientId');
    if (cid) {
      setSelectedClientId(cid);
    }
  }, [searchParams]);

  useEffect(() => {
    const cid = searchParams.get('clientId');
    if (cid && !selectedClientId && clients.some((c) => c.id === cid)) {
      setSelectedClientId(cid);
    }
  }, [clients, searchParams, selectedClientId]);

  const fetchClients = async () => {
    try {
      const cs = await db.fetchClients();
      setClients(cs);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchAdSizes = async () => {
    try {
      const sizes = await db.fetchAdSizes();
      setAdSizes(sizes);
    } catch (error) {
      console.error('Error fetching ad sizes:', error);
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!selectedClientId) {
        setPublications([]);
        setPublicationId('');
        return;
      }
      try {
        const pubs = await db.fetchPublicationsByClient(selectedClientId);
        setPublications(pubs);
        const pid = searchParams.get('publicationId');
        if (pid && pubs.some((p) => p.id === pid)) {
          setPublicationId(pid);
        } else {
          setPublicationId('');
        }
      } catch (error) {
        console.error('Error fetching publications by client:', error);
      }
    };
    run();
  }, [selectedClientId]);

  // After publications load, apply publicationId param if valid
  useEffect(() => {
    const pid = searchParams.get('publicationId');
    const cid = searchParams.get('clientId');
    if (pid && cid && cid === selectedClientId && publications.some((p) => p.id === pid)) {
      setPublicationId(pid);
    }
  }, [publications, searchParams, selectedClientId]);

  useEffect(() => {
    const run = async () => {
      if (!publicationId) {
        setIssues([]);
        setSelectedIssueId('');
        return;
      }
      try {
        const is = await db.fetchPublicationIssues(publicationId);
        setIssues(is);
        const qs = searchParams.get('issueDate');
        if (qs) {
          const match = is.find((i) => i.issue_date.startsWith(qs));
          if (match) {
            setSelectedIssueId(match.id);
            return;
          }
        }
        if (is.length > 0) {
          const today = new Date().toISOString().slice(0, 10);
          const next = is.find((i) => i.issue_date >= today) || is[is.length - 1];
          setSelectedIssueId(next.id);
        } else {
          setSelectedIssueId('');
        }
      } catch (error) {
        console.error('Error fetching publication issues:', error);
      }
    };
    run();
  }, [publicationId, searchParams]);

  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName);
    if (presetName !== 'custom') {
      const preset = presets.find((p) => p.name === presetName);
      if (preset) {
        setCustomWidth(preset.width);
        setCustomHeight(preset.height);
      }
      setSelectedRatio('');
    }
  };

  const ratioOptions = [
    { label: '1:1', w: 1, h: 1 },
    { label: '3:4', w: 3, h: 4 },
    { label: '4:3', w: 4, h: 3 },
    { label: '9:16', w: 9, h: 16 },
    { label: '16:9', w: 16, h: 9 },
  ];

  const applyRatio = (label: string) => {
    const opt = ratioOptions.find((o) => o.label === label);
    if (!opt) return;
    const base = 600;
    let w = base;
    let h = base;
    if (opt.w >= opt.h) {
      h = base;
      w = Math.round((base * opt.w) / opt.h);
    } else {
      w = base;
      h = Math.round((base * opt.h) / opt.w);
    }
    setSelectedPreset('custom');
    setSelectedRatio(label);
    setCustomWidth(w);
    setCustomHeight(h);
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

    if (!selectedClientId) {
      toast.error('Please select a client');
      return;
    }

    setLoading(true);

    try {
      // Create the ad
      const clientName = (clients.find(c => c.id === selectedClientId)?.name || '').trim();
      const selectedAdSize = adSizes.find(s => s.id === selectedAdSizeId);
      const selectedIssue = issues.find(i => i.id === selectedIssueId);
      
      // Generate ad_name: ClientName-SizeID-IssueDate-SeqNum
      let adNameBase = clientName;
      if (selectedAdSize) {
        adNameBase += `-${selectedAdSize.size_id}`;
      }
      if (selectedIssue) {
        adNameBase += `-${selectedIssue.issue_date}`;
      }
      
      // Query existing ads with the same base name to get next sequence number
      const allAds = await db.fetchAds();
      const existingAdsWithSameName = allAds.filter(ad => 
        ad.ad_name && ad.ad_name.startsWith(adNameBase)
      );
      
      // Extract sequence numbers from existing ads
      const sequenceNumbers = existingAdsWithSameName
        .map(ad => {
          const match = ad.ad_name?.match(/-(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => !isNaN(num));
      
      // Get next sequence number
      const nextSeqNum = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) + 1 : 1;
      const adName = `${adNameBase}-${nextSeqNum}`;
      
      // Calculate dimensions and aspect ratio
      const adWidth = selectedAdSize ? selectedAdSize.width_px : customWidth;
      const adHeight = selectedAdSize ? selectedAdSize.height_px : customHeight;
      const aspectRatio = calculateAspectRatio(adWidth, adHeight);
      
      const ad = await db.createAd({
        user_id: user.id,
        client_name: clientName,
        ad_name: adName,
        publication_id: publicationId || null,
        publication_issue: selectedIssueId || null,
        ad_size_id: selectedAdSizeId || null,
        aspect_ratio: aspectRatio,
        size_spec: { width: adWidth, height: adHeight },
        dpi: selectedAdSize?.dpi || selectedPublication?.dpi_default || 300,
        brief: brief.trim() || null,
        copy: copy.trim() || null,
        status: 'draft',
      });

      // Upload assets
      for (const asset of assets) {
        try {
          await db.uploadAsset(ad.id, asset.file, asset.type);
        } catch (e) {
          console.error('Upload error:', e);
          // continue uploading remaining assets
        }
      }

      toast.success('Ad created successfully!');
      navigate(`/ads/${ad.id}`);
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
                <Label htmlFor="client">Client *</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              {issues.length > 0 && (
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="issue">Issue</Label>
                  <Select value={selectedIssueId} onValueChange={setSelectedIssueId}>
                    <SelectTrigger id="issue">
                      <SelectValue placeholder="Select issue" />
                    </SelectTrigger>
                    <SelectContent>
                      {issues.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {new Date(i.issue_date).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Size */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Ruler className="w-4 h-4 text-primary" />
                Ad Size
              </CardTitle>
              <CardDescription>Select a standard ad size</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adSize">Ad Size *</Label>
                <Select value={selectedAdSizeId} onValueChange={setSelectedAdSizeId}>
                  <SelectTrigger id="adSize">
                    <SelectValue placeholder="Select an ad size" />
                  </SelectTrigger>
                  <SelectContent>
                    {adSizes.map((size) => (
                      <SelectItem key={size.id} value={size.id}>
                        {size.ad_size_fraction} - {size.ad_size_words} ({size.width_px}×{size.height_px}px / {size.width_in}×{size.height_in}in)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ad Size Preview */}
              {selectedAdSizeId && (() => {
                const selectedSize = adSizes.find(s => s.id === selectedAdSizeId);
                if (!selectedSize) return null;
                const maxPreviewSize = 150;
                const aspectRatio = selectedSize.width_px / selectedSize.height_px;
                const previewWidth = aspectRatio >= 1 
                  ? maxPreviewSize 
                  : maxPreviewSize * aspectRatio;
                const previewHeight = aspectRatio >= 1 
                  ? maxPreviewSize / aspectRatio 
                  : maxPreviewSize;
                return (
                  <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg">
                    <div
                      className="bg-primary/20 border-2 border-primary/50 rounded flex flex-col items-center justify-center text-xs text-muted-foreground"
                      style={{ width: `${previewWidth}px`, height: `${previewHeight}px` }}
                    >
                      <span className="font-medium text-foreground">{selectedSize.ad_size_fraction}</span>
                      <span>{selectedSize.width_px}×{selectedSize.height_px}px</span>
                      <span>{selectedSize.width_in}×{selectedSize.height_in}in</span>
                    </div>
                  </div>
                );
              })()}

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

              <div className="flex flex-wrap gap-2">
                {ratioOptions.map((r) => (
                  <Button
                    key={r.label}
                    type="button"
                    variant={selectedRatio === r.label ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => applyRatio(r.label)}
                  >
                    {r.label}
                  </Button>
                ))}
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
