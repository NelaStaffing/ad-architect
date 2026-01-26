export type NotificationType = 'review_approved' | 'review_changes_requested' | 'ad_generated' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  ad_id: string | null;
  metadata: Record<string, any>;
  read_at: string | null;
  created_at: string;
}

export interface CreateNotificationInput {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  ad_id?: string;
  metadata?: Record<string, any>;
}
