import type { Ad, Asset, Publication, SizeSpec, Version, Client, PublicationIssue, AdSize, ImageTransform, AspectRatio } from '@/types/ad';
import type { ReviewToken, CreateReviewTokenInput, ReviewResponse } from '@/types/review';
import type { Notification, CreateNotificationInput } from '@/types/notification';

export interface CreateAdInput {
  user_id: string;
  client_name: string;
  ad_name: string;
  publication_id: string | null;
  publication_issue: string | null;
  ad_size_id: string | null;
  aspect_ratio: AspectRatio | null;
  size_spec: SizeSpec;
  dpi: number;
  brief: string | null;
  copy: string | null;
  status: Ad['status'];
}

export interface GenerateLayoutsPayload {
  adId: string;
  sizeSpec: SizeSpec;
  dpi: number;
  bleedPx: number;
  safePx: number;
  minFontSize: number;
  copy: string;
  brief: string;
  assets: Array<{
    id: string;
    type: Asset['type'];
    url: string;
    width: number | null;
    height: number | null;
  }>;
  provider?: 'gemini';
}

export interface UpdateAdSpecsInput {
  bleed_px?: number;
  safe_px?: number;
  min_font_size?: number;
}

export interface DbAdapter {
  fetchAds(): Promise<Ad[]>;
  fetchAdsByPublicationIssue(issueId: string): Promise<Ad[]>;
  fetchAdSizes(): Promise<AdSize[]>;
  fetchClients(): Promise<Client[]>;
  fetchPublications(): Promise<Publication[]>;
  fetchPublicationsByClient(clientId: string): Promise<Publication[]>;
  fetchPublicationIssues(publicationId: string): Promise<PublicationIssue[]>;
  fetchAllUpcomingIssues(): Promise<(PublicationIssue & { publications?: Publication; clients?: Client })[]>;
  createAd(input: CreateAdInput): Promise<Ad>;
  uploadAsset(adId: string, file: File, type: Asset['type']): Promise<Asset>;
  fetchAdWithPublication(id: string): Promise<{ ad: Ad; publication: Publication | null }>;
  fetchAssetsByAdId(adId: string): Promise<Asset[]>;
  fetchVersionsByAdId(adId: string): Promise<Version[]>;
  setSelectedVersion(adId: string, versionId: string): Promise<void>;
  updateAdStatus(adId: string, status: Ad['status'] | string): Promise<void>;
  updateAdSpecs(adId: string, specs: UpdateAdSpecsInput): Promise<void>;
  updateVersionTransform(versionId: string, transform: ImageTransform): Promise<void>;
  updateVersionStatus(versionId: string, status: 'pending' | 'kept' | 'discarded'): Promise<void>;
  invokeGenerateLayouts(payload: GenerateLayoutsPayload): Promise<{ data: any; error: any | null }>;
  createVersionFromBlob(adId: string, blob: Blob, source?: 'ai' | 'manual'): Promise<Version>;
  createVersionFromUrl(adId: string, imageUrl: string, source?: 'ai' | 'manual'): Promise<Version>;
  
  // Review token methods
  createReviewToken(input: CreateReviewTokenInput): Promise<ReviewToken>;
  fetchReviewTokenByToken(token: string): Promise<ReviewToken | null>;
  fetchReviewTokensByAdId(adId: string): Promise<ReviewToken[]>;
  submitReviewResponse(token: string, response: ReviewResponse): Promise<void>;
  
  // Notification methods
  fetchNotifications(userId: string): Promise<Notification[]>;
  fetchUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  createNotification(input: CreateNotificationInput): Promise<Notification>;
}

export type { Ad, Asset, Publication, SizeSpec, Version };
