import { supabase } from '@/integrations/supabase/client';
import type { DbAdapter, CreateAdInput, GenerateLayoutsPayload } from '../adapter';
import type { Ad, Asset, Publication, SizePreset, Version, LayoutJSON, Client, PublicationIssue, AdSize, ImageTransform } from '@/types/ad';
import type { ReviewToken, CreateReviewTokenInput, ReviewResponse } from '@/types/review';
import type { Notification, CreateNotificationInput } from '@/types/notification';

export class SupabaseDbAdapter implements DbAdapter {
  async fetchAds(): Promise<Ad[]> {
    const { data, error } = await supabase
      .from('ads')
      .select('*, publications(*), publication_issues(*)')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    
    const typed: Ad[] = await Promise.all((data || []).map(async (ad: any) => {
      let selectedVersionPreview: string | null = null;
      try {
        const { data: versions } = await supabase
          .from('versions')
          .select('preview_url')
          .eq('ad_id', ad.id)
          .eq('is_selected', true)
          .limit(1)
          .maybeSingle();
        selectedVersionPreview = versions?.preview_url || null;
      } catch {
        selectedVersionPreview = null;
      }
      
      return {
        ...ad,
        size_spec: ad.size_spec as { width: number; height: number },
        status: ad.status as Ad['status'],
        publications: ad.publications
          ? ({
              ...ad.publications,
              size_presets: ((ad.publications.size_presets as unknown) as SizePreset[]) || [],
            } as Publication)
          : undefined,
        publication_issues: ad.publication_issues || undefined,
        selected_version_preview: selectedVersionPreview,
      };
    }));
    return typed;
  }

  async fetchAdsByPublicationIssue(issueId: string): Promise<Ad[]> {
    const { data, error } = await supabase
      .from('ads')
      .select('*, publications(*), publication_issues(*)')
      .eq('publication_issue', issueId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    
    const typed: Ad[] = await Promise.all((data || []).map(async (ad: any) => {
      let selectedVersionPreview: string | null = null;
      try {
        const { data: versions } = await supabase
          .from('versions')
          .select('preview_url')
          .eq('ad_id', ad.id)
          .eq('is_selected', true)
          .limit(1)
          .maybeSingle();
        selectedVersionPreview = versions?.preview_url || null;
      } catch {
        selectedVersionPreview = null;
      }
      
      return {
        ...ad,
        size_spec: ad.size_spec as { width: number; height: number },
        status: ad.status as Ad['status'],
        publications: ad.publications
          ? ({
              ...ad.publications,
              size_presets: ((ad.publications.size_presets as unknown) as SizePreset[]) || [],
            } as Publication)
          : undefined,
        publication_issues: ad.publication_issues || undefined,
        selected_version_preview: selectedVersionPreview,
      };
    }));
    return typed;
  }

  async fetchAdSizes(): Promise<AdSize[]> {
    const { data, error } = await supabase
      .from('ad_sizes')
      .select('*')
      .order('ad_size_fraction');
    if (error) throw error;
    return (data || []) as AdSize[];
  }

  async fetchClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');
    if (error) throw error;
    return (data || []) as Client[];
  }

  async fetchPublications(): Promise<Publication[]> {
    const { data, error } = await supabase
      .from('publications')
      .select('*')
      .order('name');
    if (error) throw error;
    const pubs: Publication[] = (data || []).map((pub: any) => ({
      ...pub,
      size_presets: ((pub.size_presets as unknown) as SizePreset[]) || [],
    }));
    return pubs;
  }

  async fetchPublicationIssues(publicationId: string): Promise<PublicationIssue[]> {
    const { data, error } = await supabase
      .from('publication_issues')
      .select('*')
      .eq('publication_id', publicationId)
      .order('issue_date', { ascending: true });
    if (error) throw error;
    return (data || []) as PublicationIssue[];
  }

  async fetchAllUpcomingIssues(): Promise<(PublicationIssue & { publications?: Publication; clients?: Client })[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('publication_issues')
      .select('*, publications(*), clients(*)')
      .gte('issue_date', today)
      .order('issue_date', { ascending: true });
    if (error) throw error;
    return (data || []).map((issue: any) => ({
      ...issue,
      publications: issue.publications ? {
        ...issue.publications,
        size_presets: ((issue.publications.size_presets as unknown) as SizePreset[]) || [],
      } : undefined,
      clients: issue.clients || undefined,
    }));
  }

  async fetchPublicationsByClient(clientId: string): Promise<Publication[]> {
    const { data, error } = await supabase
      .from('publications')
      .select('*')
      .eq('client_id', clientId)
      .order('name');
    if (error) throw error;
    const pubs: Publication[] = (data || []).map((pub: any) => ({
      ...pub,
      size_presets: ((pub.size_presets as unknown) as SizePreset[]) || [],
    }));
    return pubs;
  }

  async createAd(input: CreateAdInput): Promise<Ad> {
    const { data, error } = await supabase
      .from('ads')
      .insert({
        user_id: input.user_id,
        client_name: input.client_name,
        ad_name: input.ad_name,
        publication_id: input.publication_id,
        publication_issue: input.publication_issue,
        ad_size_id: input.ad_size_id,
        aspect_ratio: input.aspect_ratio,
        size_spec: input.size_spec as unknown as Record<string, unknown>,
        dpi: input.dpi,
        brief: input.brief,
        copy: input.copy,
        status: input.status,
      } as any)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Ad;
  }

  async uploadAsset(adId: string, file: File, type: Asset['type']): Promise<Asset> {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      throw authError || new Error('Not authenticated');
    }
    const userId = authData.user.id;
    const fileName = `${userId}/${adId}/${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ad-assets')
      .upload(fileName, file, { contentType: file.type });
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage
      .from('ad-assets')
      .getPublicUrl(uploadData.path);
    const { data: assetData, error: insertError } = await supabase
      .from('assets')
      .insert({
        ad_id: adId,
        type,
        url: urlData.publicUrl,
        name: file.name,
      })
      .select()
      .single();
    if (insertError) throw insertError;
    return assetData as Asset;
  }

  async fetchAdWithPublication(id: string): Promise<{ ad: Ad; publication: Publication | null }> {
    const { data, error } = await supabase
      .from('ads')
      .select('*, publications(*), ad_sizes(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    const typedAd = data as any;
    const ad: Ad = {
      ...typedAd,
      size_spec: typedAd.size_spec,
      status: typedAd.status,
      publications: undefined,
    } as Ad;
    const publication = data.publications
      ? ({
          ...data.publications,
          size_presets: ((data.publications.size_presets as unknown) as SizePreset[]) || [],
        } as Publication)
      : null;
    return { ad, publication };
  }

  async fetchAssetsByAdId(adId: string): Promise<Asset[]> {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('ad_id', adId);
    if (error) throw error;
    return (data || []) as Asset[];
  }

  async fetchVersionsByAdId(adId: string): Promise<Version[]> {
    const { data, error } = await supabase
      .from('versions')
      .select('*')
      .eq('ad_id', adId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const typed: Version[] = (data || []).map((v: any) => ({
      ...v,
      source: v.source as 'ai' | 'manual',
      layout_json: (v.layout_json as unknown) as LayoutJSON,
      status: (v.status || 'kept') as 'pending' | 'kept' | 'discarded',
    }));
    return typed;
  }

  async setSelectedVersion(adId: string, versionId: string): Promise<void> {
    // Deselect ALL versions for this ad first (atomic operation)
    const { error: e1, data: d1 } = await supabase
      .from('versions')
      .update({ is_selected: false })
      .eq('ad_id', adId)
      .select('id, is_selected');
    console.log('Deselect all versions result:', { error: e1, data: d1, count: d1?.length });
    if (e1) throw e1;
    
    // Now select the target version (no constraint violation since all are deselected)
    const { error: e2, data: d2 } = await supabase
      .from('versions')
      .update({ is_selected: true })
      .eq('id', versionId)
      .select('id, is_selected');
    console.log('Select version result:', { error: e2, data: d2 });
    if (e2) throw e2;
    
    // Verify the update worked
    if (!d2 || d2.length === 0) {
      console.error('Failed to select version - no rows returned');
    } else if (!d2[0].is_selected) {
      console.error('Failed to select version - is_selected is still false');
    }
  }

  async updateAdStatus(adId: string, status: Ad['status'] | string): Promise<void> {
    console.log('Updating ad status:', { adId, status });
    const { error } = await supabase
      .from('ads')
      .update({ status: status as any })
      .eq('id', adId);
    console.log('Update result:', { error });
    if (error) throw error;
  }

  async updateVersionTransform(versionId: string, transform: ImageTransform): Promise<void> {
    const { error } = await supabase
      .from('versions')
      .update({ image_transform: transform } as any)
      .eq('id', versionId);
    if (error) throw error;
  }

  async updateVersionStatus(versionId: string, status: 'pending' | 'kept' | 'discarded'): Promise<void> {
    const { error } = await supabase
      .from('versions')
      .update({ status } as any)
      .eq('id', versionId);
    if (error) throw error;
  }

  async updateAdSpecs(adId: string, specs: { bleed_px?: number; safe_px?: number; min_font_size?: number }): Promise<void> {
    console.log('updateAdSpecs called:', { adId, specs });
    const { data, error } = await supabase
      .from('ads')
      .update(specs as any)
      .eq('id', adId)
      .select();
    console.log('updateAdSpecs result:', { data, error });
    if (error) throw error;
  }

  async invokeGenerateLayouts(payload: GenerateLayoutsPayload): Promise<{ data: any; error: any | null }> {
    // Always route through Edge Function to avoid CORS issues
    // The Edge Function handles both OpenAI and Gemini providers
    const { data, error } = await supabase.functions.invoke('generate-layouts', {
      body: payload,
    });
    return { data, error };
  }

  async createVersionFromBlob(adId: string, blob: Blob, source: 'ai' | 'manual' = 'ai'): Promise<Version> {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      throw authError || new Error('Not authenticated');
    }
    const userId = authData.user.id;
    
    // Upload the blob to storage
    const fileName = `${userId}/${adId}/versions/${Date.now()}-expanded.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ad-assets')
      .upload(fileName, blob, { contentType: blob.type || 'image/png' });
    if (uploadError) throw uploadError;
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('ad-assets')
      .getPublicUrl(uploadData.path);
    
    // Deselect all existing versions for this ad
    await supabase
      .from('versions')
      .update({ is_selected: false })
      .eq('ad_id', adId);
    
    // Create version record with empty layout_json (required field)
    const { data: versionData, error: insertError } = await (supabase as any)
      .from('versions')
      .insert({
        ad_id: adId,
        source,
        preview_url: urlData.publicUrl,
        is_selected: true,
        status: 'pending',
        layout_json: { document: { widthPx: 0, heightPx: 0, bleedPx: 0, safePx: 0 }, elements: [], metadata: {} },
      })
      .select()
      .single();
    if (insertError) throw insertError;
    
    return {
      ...versionData,
      source: versionData.source as 'ai' | 'manual',
      status: (versionData.status || 'pending') as 'pending' | 'kept' | 'discarded',
      layout_json: versionData.layout_json,
    } as unknown as Version;
  }

  async createVersionFromUrl(adId: string, imageUrl: string, source: 'ai' | 'manual' = 'ai'): Promise<Version> {
    // Deselect all existing versions for this ad
    await supabase
      .from('versions')
      .update({ is_selected: false })
      .eq('ad_id', adId);
    
    // Create version record with the provided URL (already uploaded to Supabase by n8n)
    const { data: versionData, error: insertError } = await (supabase as any)
      .from('versions')
      .insert({
        ad_id: adId,
        source,
        preview_url: imageUrl,
        is_selected: true,
        status: 'pending',
        layout_json: { document: { widthPx: 0, heightPx: 0, bleedPx: 0, safePx: 0 }, elements: [], metadata: {} },
      })
      .select()
      .single();
    if (insertError) throw insertError;
    
    return {
      ...versionData,
      source: versionData.source as 'ai' | 'manual',
      status: (versionData.status || 'pending') as 'pending' | 'kept' | 'discarded',
      layout_json: versionData.layout_json,
    } as unknown as Version;
  }

  // Review token methods
  // Note: Types will be available after running migration and regenerating Supabase types
  async createReviewToken(input: CreateReviewTokenInput): Promise<ReviewToken> {
    // Generate a unique token
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    
    const { data, error } = await (supabase as any)
      .from('review_tokens')
      .insert({
        ad_id: input.ad_id,
        token,
        client_email: input.client_email,
        client_name: input.client_name || null,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as ReviewToken;
  }

  async fetchReviewTokenByToken(token: string): Promise<ReviewToken | null> {
    const { data, error } = await (supabase as any)
      .from('review_tokens')
      .select('*')
      .eq('token', token)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data as ReviewToken;
  }

  async fetchReviewTokensByAdId(adId: string): Promise<ReviewToken[]> {
    const { data, error } = await (supabase as any)
      .from('review_tokens')
      .select('*')
      .eq('ad_id', adId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as ReviewToken[];
  }

  async submitReviewResponse(token: string, response: ReviewResponse): Promise<void> {
    const { error } = await (supabase as any)
      .from('review_tokens')
      .update({
        response: response.response,
        feedback: response.feedback || null,
        used_at: new Date().toISOString(),
      })
      .eq('token', token);
    
    if (error) throw error;
  }

  // Notification methods
  async fetchNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await (supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return (data || []) as Notification[];
  }

  async fetchUnreadNotificationCount(userId: string): Promise<number> {
    const { count, error } = await (supabase as any)
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);
    
    if (error) throw error;
    return count || 0;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);
    
    if (error) throw error;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);
    
    if (error) throw error;
  }

  async createNotification(input: CreateNotificationInput): Promise<Notification> {
    const { data, error } = await (supabase as any)
      .from('notifications')
      .insert({
        user_id: input.user_id,
        type: input.type,
        title: input.title,
        message: input.message,
        ad_id: input.ad_id || null,
        metadata: input.metadata || {},
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Notification;
  }
}
