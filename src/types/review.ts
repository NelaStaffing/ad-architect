export interface ReviewToken {
  id: string;
  ad_id: string;
  token: string;
  client_email: string;
  client_name: string | null;
  expires_at: string;
  used_at: string | null;
  response: 'approved' | 'changes_requested' | null;
  feedback: string | null;
  created_at: string;
}

export interface CreateReviewTokenInput {
  ad_id: string;
  client_email: string;
  client_name?: string;
}

export interface ReviewResponse {
  response: 'approved' | 'changes_requested';
  feedback?: string;
}
