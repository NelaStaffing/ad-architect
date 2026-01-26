import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/integrations/db/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Client } from '@/types/ad';
import { Loader2, Users, ArrowRight } from 'lucide-react';

export default function Clients() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const run = async () => {
      try {
        const data = await db.fetchClients();
        setClients(data);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const filtered = clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground text-sm mt-1">{filtered.length} showing</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[260px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <Card key={client.id} className="hover:border-primary/40 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-4 h-4 text-primary" />
                  {client.name}
                </CardTitle>
                <CardDescription>Click to view publications and ads</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  <div>Created {new Date(client.created_at).toLocaleDateString()}</div>
                  <div>Updated {new Date(client.updated_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => navigate(`/clients/${client.id}`)} className="gap-2">
                    View Details <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" onClick={() => navigate(`/ads/new?clientId=${client.id}`)}>
                    New Ad
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
