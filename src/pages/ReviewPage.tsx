import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/integrations/db/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import type { ReviewToken } from '@/types/review';
import type { Ad, Version } from '@/types/ad';

interface ReviewData {
  token: ReviewToken;
  ad: Ad;
  version: Version | null;
}

export default function ReviewPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedResponse, setSubmittedResponse] = useState<'approved' | 'changes_requested' | null>(null);

  useEffect(() => {
    if (token) {
      fetchReviewData();
    }
  }, [token]);

  const fetchReviewData = async () => {
    try {
      // Fetch review token
      const { data: tokenData, error: tokenError } = await (supabase as any)
        .from('review_tokens')
        .select('*')
        .eq('token', token)
        .single();

      if (tokenError || !tokenData) {
        setError('Invalid or expired review link');
        setLoading(false);
        return;
      }

      const reviewToken = tokenData as ReviewToken;

      // Check if already used
      if (reviewToken.used_at) {
        setSubmitted(true);
        setReviewData({ token: reviewToken, ad: {} as Ad, version: null });
        setLoading(false);
        return;
      }

      // Check if expired
      if (new Date(reviewToken.expires_at) < new Date()) {
        setError('This review link has expired');
        setLoading(false);
        return;
      }

      // Fetch ad data
      const { data: adData, error: adError } = await (supabase as any)
        .from('ads')
        .select('*')
        .eq('id', reviewToken.ad_id)
        .single();

      if (adError || !adData) {
        setError('Ad not found');
        setLoading(false);
        return;
      }

      // Fetch selected version
      const { data: versionData } = await (supabase as any)
        .from('versions')
        .select('*')
        .eq('ad_id', reviewToken.ad_id)
        .eq('is_selected', true)
        .single();

      setReviewData({
        token: reviewToken,
        ad: adData as Ad,
        version: versionData as Version || null,
      });
    } catch (err) {
      console.error('Error fetching review data:', err);
      setError('Failed to load review data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!token) return;
    
    setSubmitting(true);
    try {
      await db.submitReviewResponse(token, {
        response: 'approved',
      });

      // Update ad status to approved and create notification
      if (reviewData?.ad.id) {
        // Get ad owner user_id
        const { data: adData } = await (supabase as any)
          .from('ads')
          .select('user_id')
          .eq('id', reviewData.ad.id)
          .single();

        await (supabase as any)
          .from('ads')
          .update({ status: 'approved' })
          .eq('id', reviewData.ad.id);

        // Create notification for ad owner
        if (adData?.user_id) {
          await (supabase as any)
            .from('notifications')
            .insert({
              user_id: adData.user_id,
              type: 'review_approved',
              title: 'Ad Approved!',
              message: `${reviewData.token.client_name || reviewData.token.client_email} approved "${reviewData.ad.ad_name || reviewData.ad.client_name}"`,
              ad_id: reviewData.ad.id,
              metadata: { client_email: reviewData.token.client_email },
            });
        }
      }

      setSubmittedResponse('approved');
      setSubmitted(true);
      toast.success('Thank you! The ad has been approved.');
    } catch (err) {
      console.error('Error submitting approval:', err);
      toast.error('Failed to submit approval');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!token || !feedback.trim()) {
      toast.error('Please provide feedback on what changes are needed');
      return;
    }
    
    setSubmitting(true);
    try {
      await db.submitReviewResponse(token, {
        response: 'changes_requested',
        feedback: feedback.trim(),
      });

      // Update ad status back to draft and create notification
      if (reviewData?.ad.id) {
        // Get ad owner user_id
        const { data: adData } = await (supabase as any)
          .from('ads')
          .select('user_id')
          .eq('id', reviewData.ad.id)
          .single();

        await (supabase as any)
          .from('ads')
          .update({ status: 'draft' })
          .eq('id', reviewData.ad.id);

        // Create notification for ad owner
        if (adData?.user_id) {
          await (supabase as any)
            .from('notifications')
            .insert({
              user_id: adData.user_id,
              type: 'review_changes_requested',
              title: 'Changes Requested',
              message: `${reviewData.token.client_name || reviewData.token.client_email} requested changes on "${reviewData.ad.ad_name || reviewData.ad.client_name}"`,
              ad_id: reviewData.ad.id,
              metadata: { 
                client_email: reviewData.token.client_email,
                feedback: feedback.trim(),
              },
            });
        }
      }

      setSubmittedResponse('changes_requested');
      setSubmitted(true);
      toast.success('Thank you! Your feedback has been submitted.');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle>Review Unavailable</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (submitted) {
    const wasApproved = submittedResponse === 'approved' || reviewData?.token.response === 'approved';
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            {/* Small ad preview thumbnail */}
            {reviewData?.version?.preview_url && (
              <div className="mx-auto mb-4 w-32 h-32 rounded-lg overflow-hidden bg-muted/50 border border-border">
                <img
                  src={reviewData.version.preview_url}
                  alt="Ad Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            {wasApproved ? (
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            ) : (
              <XCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            )}
            <CardTitle>
              {wasApproved ? 'Ad Approved!' : 'Feedback Submitted'}
            </CardTitle>
            <CardDescription>
              {wasApproved
                ? 'Thank you for approving this ad. The team has been notified.'
                : 'Thank you for your feedback. The team will review your comments and make the necessary changes.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-semibold">Ad Review</h1>
          <p className="text-sm text-muted-foreground">
            {reviewData?.ad.client_name} - {reviewData?.ad.ad_name || 'Untitled Ad'}
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Ad Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Ad Preview</CardTitle>
            <CardDescription>
              Review the ad below and approve or request changes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reviewData?.version?.preview_url ? (
              <div className="flex justify-center bg-muted/50 rounded-lg p-4">
                <img
                  src={reviewData.version.preview_url}
                  alt="Ad Preview"
                  className="max-w-full max-h-[600px] object-contain rounded shadow-lg"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">No preview available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ad Details */}
        <Card>
          <CardHeader>
            <CardTitle>Ad Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Size:</span>{' '}
                <span className="font-mono">
                  {reviewData?.ad.size_spec?.width}×{reviewData?.ad.size_spec?.height}px
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">DPI:</span>{' '}
                <span>{reviewData?.ad.dpi}</span>
              </div>
            </div>
            {reviewData?.ad.copy && (
              <div className="pt-2">
                <span className="text-muted-foreground text-sm">Copy:</span>
                <p className="mt-1 text-sm bg-muted/50 p-3 rounded">{reviewData.ad.copy}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feedback Form (shown when requesting changes) */}
        {showFeedbackForm && (
          <Card>
            <CardHeader>
              <CardTitle>Request Changes</CardTitle>
              <CardDescription>
                Please describe what changes you'd like to see.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feedback">Your Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Please describe the changes needed..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  disabled={submitting}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFeedbackForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRequestChanges}
                  disabled={submitting || !feedback.trim()}
                  variant="destructive"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Feedback'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {!showFeedbackForm && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="gap-2 bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  Approve Ad
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowFeedbackForm(true)}
                  disabled={submitting}
                >
                  <XCircle className="w-5 h-5" />
                  Request Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-8 py-4 text-center text-sm text-muted-foreground">
        <p>This review link expires on {reviewData?.token.expires_at ? new Date(reviewData.token.expires_at).toLocaleDateString() : 'N/A'}</p>
      </footer>
    </div>
  );
}
