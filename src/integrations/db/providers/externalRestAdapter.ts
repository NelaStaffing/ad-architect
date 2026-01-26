import type { DbAdapter, CreateAdInput, GenerateLayoutsPayload } from '../adapter';
import type { Ad, Asset, Publication, SizePreset, Version, LayoutJSON } from '@/types/ad';

function getBaseUrl() {
  const url = (import.meta as any).env?.VITE_EXTERNAL_API_BASE_URL as string | undefined;
  if (!url) throw new Error('VITE_EXTERNAL_API_BASE_URL is not set');
  return url.replace(/\/$/, '');
}

function authHeaders() {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const key = (import.meta as any).env?.VITE_EXTERNAL_API_KEY as string | undefined;
  if (key) headers['Authorization'] = `Bearer ${key}`;
  return headers;
}

async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`External API error ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export class ExternalRestDbAdapter implements DbAdapter {
  async fetchAds(): Promise<Ad[]> {
    const base = getBaseUrl();
    const data = await http<any[]>(`${base}/ads?include=publication`, {
      headers: authHeaders(),
    });
    return (data || []).map((ad: any) => ({
      ...ad,
      publications: ad.publications
        ? ({
            ...ad.publications,
            size_presets: ((ad.publications.size_presets as unknown) as SizePreset[]) || [],
          } as Publication)
        : undefined,
    }));
  }

  async fetchPublications(): Promise<Publication[]> {
    const base = getBaseUrl();
    const data = await http<any[]>(`${base}/publications`, { headers: authHeaders() });
    return (data || []).map((p: any) => ({
      ...p,
      size_presets: ((p.size_presets as unknown) as SizePreset[]) || [],
    }));
  }

  async createAd(input: CreateAdInput): Promise<Ad> {
    const base = getBaseUrl();
    const data = await http<any>(`${base}/ads`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input),
    });
    return data as Ad;
  }

  async uploadAsset(adId: string, file: File, type: Asset['type']): Promise<Asset> {
    const base = getBaseUrl();
    const form = new FormData();
    form.append('file', file);
    form.append('type', type);
    const headers: Record<string, string> = {};
    const key = (import.meta as any).env?.VITE_EXTERNAL_API_KEY as string | undefined;
    if (key) headers['Authorization'] = `Bearer ${key}`;
    const res = await fetch(`${base}/ads/${adId}/assets`, { method: 'POST', body: form, headers });
    if (!res.ok) throw new Error(`External upload failed ${res.status}`);
    const data = (await res.json()) as Asset;
    return data;
  }

  async fetchAdWithPublication(id: string): Promise<{ ad: Ad; publication: Publication | null }> {
    const base = getBaseUrl();
    const data = await http<any>(`${base}/ads/${id}?include=publication`, { headers: authHeaders() });
    const ad: Ad = {
      ...data,
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
    const base = getBaseUrl();
    const data = await http<any[]>(`${base}/ads/${adId}/assets`, { headers: authHeaders() });
    return (data || []) as Asset[];
  }

  async fetchVersionsByAdId(adId: string): Promise<Version[]> {
    const base = getBaseUrl();
    const data = await http<any[]>(`${base}/ads/${adId}/versions?sort=-created_at`, { headers: authHeaders() });
    const typed: Version[] = (data || []).map((v: any) => ({
      ...v,
      source: v.source as 'ai' | 'manual',
      layout_json: (v.layout_json as unknown) as LayoutJSON,
    }));
    return typed;
  }

  async setSelectedVersion(adId: string, versionId: string): Promise<void> {
    const base = getBaseUrl();
    await http(`${base}/ads/${adId}/versions/select`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ versionId }),
    });
  }

  async updateAdStatus(adId: string, status: Ad['status'] | string): Promise<void> {
    const base = getBaseUrl();
    await http(`${base}/ads/${adId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
  }

  async invokeGenerateLayouts(payload: GenerateLayoutsPayload): Promise<{ data: any; error: any | null }> {
    const base = getBaseUrl();
    const data = await http<any>(`${base}/ai/generate-layouts`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return { data, error: null };
  }
}
