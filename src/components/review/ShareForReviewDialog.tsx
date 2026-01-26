import { useState } from 'react';
import { db } from '@/integrations/db/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Send, Copy, Check, Loader2 } from 'lucide-react';

interface ShareForReviewDialogProps {
  adId: string;
  adName: string;
  disabled?: boolean;
}

export function ShareForReviewDialog({ adId, adName, disabled }: ShareForReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [clientEmail, setClientEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [reviewLink, setReviewLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateReviewLink = async () => {
    if (!clientEmail.trim()) {
      toast.error('Please enter a client email');
      return;
    }

    setLoading(true);
    try {
      const reviewToken = await db.createReviewToken({
        ad_id: adId,
        client_email: clientEmail.trim(),
        client_name: clientName.trim() || undefined,
      });

      const link = `${window.location.origin}/review/${reviewToken.token}`;
      setReviewLink(link);

      // Update ad status to 'in_review' - fire and forget, don't block on this
      db.updateAdStatus(adId, 'in_review')
        .then(() => {
          console.log('Ad status updated to in_review');
        })
        .catch((error) => {
          console.error('Error updating ad status:', error);
        });
      
      toast.success('Review link created!');
    } catch (error) {
      console.error('Error creating review link:', error);
      toast.error('Failed to create review link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!reviewLink) return;
    
    try {
      await navigator.clipboard.writeText(reviewLink);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset state after dialog closes
    setTimeout(() => {
      setClientEmail('');
      setClientName('');
      setReviewLink(null);
      setCopied(false);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => isOpen ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled} className="gap-1">
          <Send className="w-4 h-4" />
          Share for Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share for Client Review</DialogTitle>
          <DialogDescription>
            Create a review link for "{adName}" that you can share with your client.
          </DialogDescription>
        </DialogHeader>

        {!reviewLink ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email *</Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="client@example.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name (optional)</Label>
              <Input
                id="clientName"
                type="text"
                placeholder="John Smith"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Review Link</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={reviewLink}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Share this link with your client. They can approve or request changes directly.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {!reviewLink ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleCreateReviewLink} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Review Link'
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
