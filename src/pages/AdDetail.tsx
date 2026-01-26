import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/integrations/db/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ads/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parse } from 'date-fns';
import { toast } from 'sonner';
import {
  Loader2,
  ArrowLeft,
  Edit,
  Calendar,
  Building2,
  FileText,
  Image,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Send,
} from 'lucide-react';
import { ShareForReviewDialog } from '@/components/review/ShareForReviewDialog';
import { cn } from '@/lib/utils';
import type { Ad, Version, Publication, PublicationIssue } from '@/types/ad';
import type { ReviewToken } from '@/types/review';

interface AdDetailData {
  ad: Ad;
  publication: Publication | null;
  publicationIssue: PublicationIssue | null;
  versions: Version[];
  reviewTokens: ReviewToken[];
}

export default function AdDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<AdDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [targetDate, setTargetDate] = useState<string>('');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (id && user) {
      fetchAdDetail();
    }
  }, [id, user]);

  const fetchAdDetail = async () => {
    if (!id) return;

    try {
      // Fetch ad with relations
      const { data: adData, error: adError } = await (supabase as any)
        .from('ads')
        .select('*, publications(*), publication_issues(*)')
        .eq('id', id)
        .single();

      if (adError) throw adError;

      // Fetch versions
      const versions = await db.fetchVersionsByAdId(id);

      // Fetch review tokens
      const reviewTokens = await db.fetchReviewTokensByAdId(id);

      setData({
        ad: adData as Ad,
        publication: adData.publications || null,
        publicationIssue: adData.publication_issues || null,
        versions,
        reviewTokens,
      });
      setTargetDate(adData.target_date || '');
    } catch (error) {
      console.error('Error fetching ad detail:', error);
      toast.error('Failed to load ad details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysUntilDeadline = () => {
    if (!data?.ad.target_date) return null;
    const target = new Date(data.ad.target_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const keptVersions = data?.versions.filter(v => v.status !== 'discarded') || [];

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Ad not found</p>
        </div>
      </AppLayout>
    );
  }

  const daysUntil = getDaysUntilDeadline();

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/ads')}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{data.ad.ad_name || data.ad.client_name}</h1>
              <p className="text-muted-foreground">{data.ad.client_name}</p>
            </div>
            <StatusBadge status={data.ad.status} />
          </div>
          <Link to={`/ads/${data.ad.id}`}>
            <Button className="gap-2">
              <Edit className="w-4 h-4" />
              Open Editor
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  General Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Client</Label>
                    <p className="font-medium">{data.ad.client_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Ad Name</Label>
                    <p className="font-medium">{data.ad.ad_name || 'Untitled'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Publication</Label>
                    <p className="font-medium">{data.publication?.name || 'Not assigned'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Issue Date</Label>
                    <p className="font-medium">
                      {data.publicationIssue?.issue_date
                        ? formatDate(data.publicationIssue.issue_date)
                        : 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Size</Label>
                    <p className="font-medium font-mono">
                      {data.ad.size_spec.width}×{data.ad.size_spec.height}px @ {data.ad.dpi}dpi
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p className="font-medium">{formatDate(data.ad.created_at)}</p>
                  </div>
                </div>

                {data.ad.brief && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-muted-foreground">Brief</Label>
                      <p className="mt-1 text-sm bg-muted/50 p-3 rounded">{data.ad.brief}</p>
                    </div>
                  </>
                )}

                {data.ad.copy && (
                  <div>
                    <Label className="text-muted-foreground">Copy</Label>
                    <p className="mt-1 text-sm bg-muted/50 p-3 rounded whitespace-pre-wrap">{data.ad.copy}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Review History Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Review History
                </CardTitle>
                <CardDescription>
                  Approval requests and client feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.reviewTokens.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    No review requests sent yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {data.reviewTokens.map((token) => (
                      <div
                        key={token.id}
                        className={cn(
                          'p-4 rounded-lg border',
                          token.response === 'approved' && 'border-green-500/30 bg-green-500/5',
                          token.response === 'changes_requested' && 'border-orange-500/30 bg-orange-500/5',
                          !token.response && 'border-border bg-muted/30'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {token.response === 'approved' && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                            {token.response === 'changes_requested' && (
                              <XCircle className="w-5 h-5 text-orange-500" />
                            )}
                            {!token.response && (
                              <Clock className="w-5 h-5 text-muted-foreground" />
                            )}
                            <div>
                              <p className="font-medium">
                                {token.client_name || token.client_email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {token.client_email}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {token.response === 'approved' && 'Approved'}
                              {token.response === 'changes_requested' && 'Changes Requested'}
                              {!token.response && 'Pending'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {token.used_at
                                ? formatDateTime(token.used_at)
                                : `Sent ${formatDateTime(token.created_at)}`}
                            </p>
                          </div>
                        </div>
                        {token.feedback && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-sm text-muted-foreground">Feedback:</p>
                            <p className="text-sm mt-1">{token.feedback}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Target Date Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Target Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="cursor-pointer hover:bg-muted/50 p-3 -m-3 rounded transition-colors">
                      <p className="text-2xl font-bold">
                        {formatDate(data.ad.target_date)}
                      </p>
                      {daysUntil !== null && (
                        <p
                          className={cn(
                            'text-sm mt-1',
                            daysUntil < 0 && 'text-red-500',
                            daysUntil === 0 && 'text-orange-500',
                            daysUntil > 0 && daysUntil <= 3 && 'text-yellow-500',
                            daysUntil > 3 && 'text-green-500'
                          )}
                        >
                          {daysUntil < 0 && `${Math.abs(daysUntil)} days overdue`}
                          {daysUntil === 0 && 'Due today'}
                          {daysUntil > 0 && `${daysUntil} days remaining`}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Click to edit
                      </p>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={targetDate ? parse(targetDate, 'yyyy-MM-dd', new Date()) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const formatted = format(date, 'yyyy-MM-dd');
                          setTargetDate(formatted);
                          // Auto-save when date is selected
                          (async () => {
                            try {
                              await (supabase as any)
                                .from('ads')
                                .update({ target_date: formatted })
                                .eq('id', data.ad.id);
                              setData({
                                ...data,
                                ad: { ...data.ad, target_date: formatted },
                              });
                              toast.success('Target date updated');
                            } catch (error) {
                              console.error('Error updating target date:', error);
                              toast.error('Failed to update target date');
                            }
                          })();
                        }
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            {/* Versions Carousel Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Versions ({keptVersions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {keptVersions.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    No versions generated yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* Carousel */}
                    <div 
                      className="relative aspect-square bg-muted/50 rounded-lg overflow-hidden cursor-pointer group"
                      onClick={() => setLightboxOpen(true)}
                    >
                      <img
                        src={keptVersions[carouselIndex]?.preview_url || ''}
                        alt={`Version ${carouselIndex + 1}`}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                      {keptVersions[carouselIndex]?.is_selected && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                          Selected
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium bg-black/50 px-3 py-1 rounded">
                          Click to preview
                        </span>
                      </div>
                    </div>

                    {/* Navigation */}
                    {keptVersions.length > 1 && (
                      <div className="flex items-center justify-between">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setCarouselIndex((prev) =>
                              prev === 0 ? keptVersions.length - 1 : prev - 1
                            )
                          }
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {carouselIndex + 1} / {keptVersions.length}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setCarouselIndex((prev) =>
                              prev === keptVersions.length - 1 ? 0 : prev + 1
                            )
                          }
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {/* Thumbnails */}
                    {keptVersions.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {keptVersions.map((version, idx) => (
                          <button
                            key={version.id}
                            onClick={() => setCarouselIndex(idx)}
                            className={cn(
                              'w-12 h-12 rounded border-2 overflow-hidden flex-shrink-0 transition-colors',
                              idx === carouselIndex
                                ? 'border-primary'
                                : 'border-transparent hover:border-muted-foreground/50'
                            )}
                          >
                            <img
                              src={version.preview_url || ''}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Request Review Button */}
                    <div className="pt-2">
                      <ShareForReviewDialog
                        adId={data.ad.id}
                        adName={data.ad.ad_name || data.ad.client_name}
                        disabled={keptVersions.length === 0}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Versions</span>
                  <span className="font-medium">{keptVersions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Review Requests</span>
                  <span className="font-medium">{data.reviewTokens.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approvals</span>
                  <span className="font-medium text-green-500">
                    {data.reviewTokens.filter((t) => t.response === 'approved').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Change Requests</span>
                  <span className="font-medium text-orange-500">
                    {data.reviewTokens.filter((t) => t.response === 'changes_requested').length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {lightboxOpen && keptVersions[carouselIndex]?.preview_url && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-6 h-6" />
          </Button>
          
          {/* Navigation arrows */}
          {keptVersions.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setCarouselIndex((prev) => prev === 0 ? keptVersions.length - 1 : prev - 1);
                }}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setCarouselIndex((prev) => prev === keptVersions.length - 1 ? 0 : prev + 1);
                }}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            </>
          )}
          
          <img
            src={keptVersions[carouselIndex].preview_url}
            alt={`Version ${carouselIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Version indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded">
            Version {carouselIndex + 1} of {keptVersions.length}
            {keptVersions[carouselIndex]?.is_selected && ' (Selected)'}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
