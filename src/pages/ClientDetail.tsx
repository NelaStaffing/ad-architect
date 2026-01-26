import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '@/integrations/db/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Client, Publication, Ad, PublicationIssue } from '@/types/ad';
import { toast } from 'sonner';
import { Loader2, Users, Newspaper, Plus, ExternalLink } from 'lucide-react';

export default function ClientDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [selectedPublicationId, setSelectedPublicationId] = useState<string>('');
  const [issues, setIssues] = useState<PublicationIssue[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      try {
        // Fetch client list and pick the one matching id
        const clients = await db.fetchClients();
        const found = clients.find((c) => c.id === id) || null;
        setClient(found);
        if (!found) {
          toast.error('Client not found');
          return;
        }

        // Fetch publications for this client
        const pubs = await db.fetchPublicationsByClient(id);
        setPublications(pubs);
        if (pubs.length > 0) setSelectedPublicationId(pubs[0].id);

        // Ads will be fetched when selectedIssueId changes
      } catch (e) {
        console.error(e);
        toast.error('Failed to load client details');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const selectedPublication = useMemo(
    () => publications.find((p) => p.id === selectedPublicationId) || null,
    [publications, selectedPublicationId]
  );

  useEffect(() => {
    const run = async () => {
      if (!selectedPublicationId) {
        setIssues([]);
        setSelectedIssueId('');
        return;
      }
      try {
        const data = await db.fetchPublicationIssues(selectedPublicationId);
        setIssues(data);
        if (data.length > 0) {
          const today = new Date();
          const next = data.find((i) => new Date(i.issue_date) >= new Date(today.toDateString()));
          setSelectedIssueId((next || data[data.length - 1]).id);
        } else {
          setSelectedIssueId('');
        }
      } catch (e) {
        setIssues([]);
        setSelectedIssueId('');
      }
    };
    run();
  }, [selectedPublicationId]);

  useEffect(() => {
    const run = async () => {
      if (!selectedIssueId) {
        setAds([]);
        return;
      }
      try {
        const issueAds = await db.fetchAdsByPublicationIssue(selectedIssueId);
        setAds(issueAds);
      } catch (e) {
        console.error('Error fetching ads by issue:', e);
        setAds([]);
      }
    };
    run();
  }, [selectedIssueId]);

  const selectedIssue = useMemo(
    () => issues.find((i) => i.id === selectedIssueId) || null,
    [issues, selectedIssueId]
  );

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-6">
          <p className="text-sm text-muted-foreground">Client not found.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> {client.name}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Client overview, publications, and ads</p>
          </div>
          <div className="flex gap-2">
            <Button
              className="gap-2"
              disabled={!selectedPublication}
              onClick={() =>
                selectedPublication &&
                navigate(`/ads/new?clientId=${client.id}&publicationId=${selectedPublication.id}`)
              }
            >
              <Plus className="w-4 h-4" /> New Ad
            </Button>
          </div>
        </div>

        {/* Publication */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-primary" /> Publication Details
            </CardTitle>
            <CardDescription>Select a publication and issue to view specs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-sm">
              <Select value={selectedPublicationId} onValueChange={setSelectedPublicationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a publication" />
                </SelectTrigger>
                <SelectContent>
                  {publications.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {issues.length > 0 && (
              <div className="max-w-sm">
                <Select value={selectedIssueId} onValueChange={setSelectedIssueId}>
                  <SelectTrigger>
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

            {selectedPublication && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="text-muted-foreground">DPI</div>
                  <div className="font-medium">{selectedPublication.dpi_default}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Min Font Size</div>
                  <div className="font-medium">{selectedPublication.min_font_size} pt</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Bleed</div>
                  <div className="font-medium">{selectedPublication.bleed_px} px</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Safe Area</div>
                  <div className="font-medium">{selectedPublication.safe_px} px</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Issue Date</div>
                  <div className="font-medium">{selectedIssue ? new Date(selectedIssue.issue_date).toLocaleDateString() : '—'}</div>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <div className="text-muted-foreground">Size Presets</div>
                  <div className="font-medium">
                    {selectedPublication.size_presets.length > 0
                      ? selectedPublication.size_presets
                          .map((sp) => `${sp.name} (${sp.width}×${sp.height}px)`)
                          .join(' • ')
                      : 'None'}
                  </div>
                </div>
              </div>
            )}

            <Separator />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={!selectedPublication}
                onClick={() =>
                  selectedPublication &&
                  navigate(`/ads/new?clientId=${client.id}&publicationId=${selectedPublication.id}${selectedIssue ? `&issueDate=${encodeURIComponent(selectedIssue.issue_date)}` : ''}`)
                }
              >
                <Plus className="w-4 h-4" /> Create Ad for this Publication
              </Button>
              {selectedPublication && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/ads/new?clientId=${client.id}`)}
                >
                  Choose Different Size
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Previous Ads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Previous Ads</CardTitle>
            <CardDescription>
              {selectedIssue
                ? `Ads for ${selectedPublication?.name || ''} — ${new Date(selectedIssue.issue_date).toLocaleDateString()}`
                : `Select an issue to view ads`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No ads for this issue yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ads.map((ad) => (
                  <div key={ad.id} className="border rounded-lg p-3 hover:border-primary/40 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{ad.client_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {ad.publications?.name || '—'}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/ads/${ad.id}`)} className="gap-1">
                        Open <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Updated {ad.updated_at ? new Date(ad.updated_at).toLocaleString() : '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
