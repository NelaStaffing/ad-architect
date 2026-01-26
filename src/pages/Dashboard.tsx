import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '@/integrations/db/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ads/StatusBadge';
import { Ad, Client, Publication, PublicationIssue } from '@/types/ad';
import { 
  Loader2, 
  LayoutGrid, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  FileText,
  Calendar,
  Building2,
  ArrowRight,
  TrendingUp,
  Newspaper
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isAfter, isBefore, addDays, subDays, parseISO } from 'date-fns';

type UpcomingIssue = PublicationIssue & { publications?: Publication; clients?: Client };

interface DashboardStats {
  totalAds: number;
  drafts: number;
  inReview: number;
  approved: number;
  exported: number;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [ads, setAds] = useState<Ad[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [upcomingIssues, setUpcomingIssues] = useState<UpcomingIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [adsData, clientsData, pubsData, issuesData] = await Promise.all([
        db.fetchAds(),
        db.fetchClients(),
        db.fetchPublications(),
        db.fetchAllUpcomingIssues(),
      ]);
      setAds(adsData);
      setClients(clientsData);
      setPublications(pubsData);
      setUpcomingIssues(issuesData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats: DashboardStats = {
    totalAds: ads.length,
    drafts: ads.filter(a => a.status === 'draft').length,
    inReview: ads.filter(a => a.status === 'in_review').length,
    approved: ads.filter(a => a.status === 'approved').length,
    exported: ads.filter(a => a.status === 'exported').length,
  };

  // Get ads awaiting review
  const adsInReview = ads.filter(a => a.status === 'in_review');

  // Get draft ads (in progress)
  const draftAds = ads.filter(a => a.status === 'draft');

  // Calculate deadlines from publication issues (2 days before issue date)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = addDays(today, 7);
  
  // Create deadline entries from upcoming issues
  const upcomingDeadlines = upcomingIssues
    .map(issue => {
      const issueDate = parseISO(issue.issue_date);
      const deadlineDate = subDays(issueDate, 2);
      return {
        ...issue,
        deadlineDate,
        issueDate,
      };
    })
    .filter(item => {
      // Show deadlines that are today or in the future, within next 7 days
      return isAfter(item.deadlineDate, subDays(today, 1)) && isBefore(item.deadlineDate, nextWeek);
    })
    .sort((a, b) => a.deadlineDate.getTime() - b.deadlineDate.getTime());

  // Get recent ads (last 5 updated)
  const recentAds = [...ads]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  // Group ads by client
  const adsByClient = ads.reduce((acc, ad) => {
    const clientName = ad.client_name;
    if (!acc[clientName]) {
      acc[clientName] = [];
    }
    acc[clientName].push(ad);
    return acc;
  }, {} as Record<string, Ad[]>);

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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of your ad projects and deadlines
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <LayoutGrid className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalAds}</p>
                  <p className="text-xs text-muted-foreground">Total Ads</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.drafts}</p>
                  <p className="text-xs text-muted-foreground">Drafts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inReview}</p>
                  <p className="text-xs text-muted-foreground">In Review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.exported}</p>
                  <p className="text-xs text-muted-foreground">Exported</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upcoming Publication Issues */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-primary" />
                  Upcoming Issues
                </CardTitle>
                <span className="text-xs text-muted-foreground">{upcomingIssues.length} issues</span>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingIssues.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming publication issues
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingIssues.slice(0, 6).map(issue => (
                    <div 
                      key={issue.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Newspaper className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {issue.publications?.name || 'Unknown Publication'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {issue.clients?.name || 'Unknown Client'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-primary flex-shrink-0">
                        {format(parseISO(issue.issue_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  Upcoming Deadlines
                </CardTitle>
                <span className="text-xs text-muted-foreground">2 days before issue</span>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming deadlines
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingDeadlines.slice(0, 6).map(item => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {item.publications?.name || 'Unknown Publication'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.clients?.name || 'Unknown Client'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="text-xs font-medium text-orange-500">
                          {format(item.deadlineDate, 'MMM d')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Issue: {format(item.issueDate, 'MMM d')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ads Awaiting Review */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Awaiting Review
                </CardTitle>
                <span className="text-xs text-muted-foreground">{adsInReview.length} ads</span>
              </div>
            </CardHeader>
            <CardContent>
              {adsInReview.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No ads awaiting review
                </p>
              ) : (
                <div className="space-y-3">
                  {adsInReview.slice(0, 5).map(ad => (
                    <Link 
                      key={ad.id} 
                      to={`/ads/${ad.id}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded bg-muted overflow-hidden flex-shrink-0">
                          {ad.selected_version_preview ? (
                            <img 
                              src={ad.selected_version_preview} 
                              alt="" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                            {ad.ad_name || ad.client_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {ad.publications?.name || 'No publication'}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* In Progress (Drafts) */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-yellow-500" />
                  In Progress
                </CardTitle>
                <span className="text-xs text-muted-foreground">{draftAds.length} drafts</span>
              </div>
            </CardHeader>
            <CardContent>
              {draftAds.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No ads in progress
                </p>
              ) : (
                <div className="space-y-3">
                  {draftAds.slice(0, 5).map(ad => (
                    <Link 
                      key={ad.id} 
                      to={`/ads/${ad.id}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded bg-muted overflow-hidden flex-shrink-0">
                          {ad.selected_version_preview ? (
                            <img 
                              src={ad.selected_version_preview} 
                              alt="" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                            {ad.ad_name || ad.client_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {ad.client_name}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ads by Client */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  By Client
                </CardTitle>
                <span className="text-xs text-muted-foreground">{Object.keys(adsByClient).length} clients</span>
              </div>
            </CardHeader>
            <CardContent>
              {Object.keys(adsByClient).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No clients yet
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(adsByClient)
                    .sort((a, b) => b[1].length - a[1].length)
                    .slice(0, 6)
                    .map(([clientName, clientAds]) => {
                      const inProgress = clientAds.filter(a => a.status === 'draft' || a.status === 'in_review').length;
                      return (
                        <div 
                          key={clientName}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-primary">
                                {clientName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">
                                {clientName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {clientAds.length} ads
                              </p>
                            </div>
                          </div>
                          {inProgress > 0 && (
                            <span className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded-full">
                              {inProgress} active
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button onClick={() => navigate('/ads/new')} className="btn-glow">
            Create New Ad
          </Button>
          <Button variant="outline" onClick={() => navigate('/ads')}>
            View All Ads
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
