import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StatusBadge } from '@/components/ads/StatusBadge';
import { Ad, Publication, PublicationIssue, Client } from '@/types/ad';
import type { UserProfile } from '@/types/user';
import { 
  Loader2, 
  Users, 
  LayoutGrid, 
  Clock, 
  CheckCircle2, 
  FileText,
  Calendar as CalendarIcon,
  Building2,
  ArrowRight,
  TrendingUp,
  Newspaper,
  Filter,
  Search,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

type UpcomingIssue = PublicationIssue & { publications?: Publication; clients?: Client };

interface AdWithUser extends Ad {
  user_email?: string;
  user_name?: string;
}

interface TeamMember {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  ad_count: number;
  recent_ads: Ad[];
}

export default function ManagerDashboard() {
  const { user, loading: authLoading, isManager } = useAuth();
  const navigate = useNavigate();
  
  const [ads, setAds] = useState<AdWithUser[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [upcomingIssues, setUpcomingIssues] = useState<UpcomingIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('in_progress');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && !isManager) {
      navigate('/dashboard');
      toast.error('Access denied. Manager role required.');
    }
  }, [user, authLoading, isManager, navigate]);

  useEffect(() => {
    if (user && isManager) {
      fetchData();
    }
  }, [user, isManager]);

  const fetchData = async () => {
    try {
      // Fetch all ads (managers can see all)
      const { data: adsData, error: adsError } = await supabase
        .from('ads')
        .select('*, publications(*), publication_issues(*)')
        .order('updated_at', { ascending: false });
      
      if (adsError) throw adsError;

      // Fetch all user profiles
      const { data: usersData, error: usersError } = await (supabase as any)
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (usersError) {
        console.warn('Could not fetch user profiles:', usersError.message);
      }

      // Fetch upcoming issues
      const today = new Date().toISOString().split('T')[0];
      const { data: issuesData, error: issuesError } = await supabase
        .from('publication_issues')
        .select('*, publications(*), clients(*)')
        .gte('issue_date', today)
        .order('issue_date', { ascending: true });
      
      if (issuesError) throw issuesError;

      // Map user info to ads
      const userMap = new Map((usersData || []).map((u: UserProfile) => [u.id, u]));
      const adsWithUsers: AdWithUser[] = (adsData || []).map((ad: any) => {
        const userProfile = userMap.get(ad.user_id);
        return {
          ...ad,
          size_spec: ad.size_spec as { width: number; height: number },
          status: ad.status as Ad['status'],
          publications: ad.publications || undefined,
          publication_issues: ad.publication_issues || undefined,
          user_email: userProfile?.email || 'Unknown',
          user_name: userProfile?.full_name || userProfile?.email || 'Unknown User',
        };
      });

      setAds(adsWithUsers);
      setUsers(usersData || []);
      setUpcomingIssues((issuesData || []).map((issue: any) => ({
        ...issue,
        publications: issue.publications || undefined,
        clients: issue.clients || undefined,
      })));
    } catch (error) {
      console.error('Error fetching manager data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Filter ads by date range
  const filteredByDate = useMemo(() => {
    if (!dateRange.from && !dateRange.to) return ads;
    
    return ads.filter(ad => {
      const adDate = parseISO(ad.updated_at);
      const from = dateRange.from ? startOfDay(dateRange.from) : new Date(0);
      const to = dateRange.to ? endOfDay(dateRange.to) : new Date();
      return isWithinInterval(adDate, { start: from, end: to });
    });
  }, [ads, dateRange]);

  // Filter by search query
  const filteredAds = useMemo(() => {
    if (!searchQuery.trim()) return filteredByDate;
    
    const query = searchQuery.toLowerCase();
    return filteredByDate.filter(ad => 
      ad.ad_name?.toLowerCase().includes(query) ||
      ad.client_name.toLowerCase().includes(query) ||
      ad.user_name?.toLowerCase().includes(query) ||
      ad.user_email?.toLowerCase().includes(query)
    );
  }, [filteredByDate, searchQuery]);

  // Group ads by status
  const inProgressAds = filteredAds.filter(a => a.status === 'draft');
  const inReviewAds = filteredAds.filter(a => a.status === 'in_review');
  const doneAds = filteredAds.filter(a => a.status === 'approved' || a.status === 'exported');

  // Calculate team stats
  const teamMembers: TeamMember[] = useMemo(() => {
    const memberMap = new Map<string, TeamMember>();
    
    users.forEach(u => {
      memberMap.set(u.id, {
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        ad_count: 0,
        recent_ads: [],
      });
    });

    ads.forEach(ad => {
      const member = memberMap.get(ad.user_id);
      if (member) {
        member.ad_count++;
        if (member.recent_ads.length < 3) {
          member.recent_ads.push(ad);
        }
      }
    });

    return Array.from(memberMap.values())
      .filter(m => m.role === 'user')
      .sort((a, b) => b.ad_count - a.ad_count);
  }, [users, ads]);

  // Stats
  const stats = {
    totalUsers: users.filter(u => u.role === 'user').length,
    totalAds: ads.length,
    inProgress: ads.filter(a => a.status === 'draft').length,
    inReview: ads.filter(a => a.status === 'in_review').length,
    approved: ads.filter(a => a.status === 'approved').length,
    exported: ads.filter(a => a.status === 'exported').length,
  };

  const renderAdCard = (ad: AdWithUser) => (
    <Link 
      key={ad.id} 
      to={`/ads/${ad.id}`}
      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
          {ad.selected_version_preview ? (
            <img 
              src={ad.selected_version_preview} 
              alt="" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {ad.ad_name || ad.client_name}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {ad.publications?.name || 'No publication'} • {ad.client_name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Avatar className="w-4 h-4">
              <AvatarFallback className="text-[8px]">
                {(ad.user_name || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {ad.user_name}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusBadge status={ad.status} />
        <span className="text-xs text-muted-foreground">
          {format(parseISO(ad.updated_at), 'MMM d')}
        </span>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </Link>
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

  return (
    <AppLayout>
      <div className="max-w-screen-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-xs">Manager</Badge>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Team Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of team activity and ad projects
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Team Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

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
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - Issues by Status */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search ads, clients, users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                            </>
                          ) : (
                            format(dateRange.from, 'MMM d, yyyy')
                          )
                        ) : (
                          'Pick date range'
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="range"
                        selected={{ from: dateRange.from, to: dateRange.to }}
                        onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setDateRange({ from: undefined, to: undefined });
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Status Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="in_progress" className="gap-2">
                  <FileText className="w-4 h-4" />
                  In Progress
                  <Badge variant="secondary" className="ml-1">{inProgressAds.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="in_review" className="gap-2">
                  <Clock className="w-4 h-4" />
                  In Review
                  <Badge variant="secondary" className="ml-1">{inReviewAds.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="done" className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Done
                  <Badge variant="secondary" className="ml-1">{doneAds.length}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="in_progress" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Drafts & Work in Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {inProgressAds.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No ads in progress
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {inProgressAds.map(renderAdCard)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="in_review" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Awaiting Client Review</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {inReviewAds.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No ads awaiting review
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {inReviewAds.map(renderAdCard)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="done" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Approved & Exported</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {doneAds.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No completed ads
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {doneAds.map(renderAdCard)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team Members */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" />
                    Team Activity
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {teamMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No team members yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {teamMembers.slice(0, 8).map(member => (
                      <div 
                        key={member.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {(member.full_name || member.email || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {member.full_name || member.email || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.ad_count} ads
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {member.recent_ads.filter(a => a.status === 'draft' || a.status === 'in_review').length} active
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Issues */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-primary" />
                    Upcoming Issues
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">{upcomingIssues.length}</span>
                </div>
              </CardHeader>
              <CardContent>
                {upcomingIssues.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No upcoming issues
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
                              {issue.publications?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {issue.clients?.name || 'Unknown Client'}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-primary flex-shrink-0">
                          {format(parseISO(issue.issue_date), 'MMM d')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
