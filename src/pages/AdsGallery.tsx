import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdCard } from '@/components/ads/AdCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Ad, Publication, SizePreset } from '@/types/ad';
import { Plus, Search, Loader2, LayoutGrid, List, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function AdsGallery() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [ads, setAds] = useState<Ad[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [publicationFilter, setPublicationFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAds();
      fetchPublications();
    }
  }, [user]);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*, publications(*)')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our types
      const typedAds: Ad[] = (data || []).map(ad => ({
        ...ad,
        size_spec: ad.size_spec as { width: number; height: number },
        status: ad.status as 'draft' | 'in_review' | 'approved' | 'exported',
        publications: ad.publications ? {
          ...ad.publications,
          size_presets: (ad.publications.size_presets as unknown) as SizePreset[] || [],
        } as Publication : undefined,
      }));
      
      setAds(typedAds);
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast.error('Failed to load ads');
    } finally {
      setLoading(false);
    }
  };

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

  const filteredAds = ads.filter((ad) => {
    const matchesSearch =
      ad.client_name.toLowerCase().includes(search.toLowerCase()) ||
      ad.brief?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ad.status === statusFilter;
    const matchesPublication =
      publicationFilter === 'all' || ad.publication_id === publicationFilter;
    return matchesSearch && matchesStatus && matchesPublication;
  });

  if (authLoading || loading) {
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
      <div className="max-w-screen-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ads Gallery</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {ads.length} total ads • {filteredAds.length} showing
            </p>
          </div>
          <Button onClick={() => navigate('/ads/new')} className="btn-glow gap-2">
            <Plus className="w-4 h-4" />
            New Ad
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by client or brief..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="exported">Exported</SelectItem>
              </SelectContent>
            </Select>

            <Select value={publicationFilter} onValueChange={setPublicationFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Publication" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Publications</SelectItem>
                {publications.map((pub) => (
                  <SelectItem key={pub.id} value={pub.id}>
                    {pub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex border border-border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-r-none h-9 w-9"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-l-none h-9 w-9"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Ads Grid */}
        {filteredAds.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <LayoutGrid className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">No ads found</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {ads.length === 0
                ? 'Get started by creating your first ad'
                : 'Try adjusting your filters'}
            </p>
            {ads.length === 0 && (
              <Button onClick={() => navigate('/ads/new')} className="btn-glow">
                Create Your First Ad
              </Button>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                : 'space-y-3'
            }
          >
            {filteredAds.map((ad, index) => (
              <div
                key={ad.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <AdCard ad={ad} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
