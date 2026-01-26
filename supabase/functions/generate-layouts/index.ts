import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AssetMeta {
  id: string;
  type: 'product' | 'logo';
  url: string;
  width?: number;
  height?: number;
}

interface GenerateRequest {
  adId: string;
  adName?: string;
  clientName?: string;
  sizeSpec: { width: number; height: number };
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  dpi: number;
  bleedPx: number;
  safePx: number;
  minFontSize: number;
  copy: string;
  brief: string;
  assets: AssetMeta[];
  provider?: 'gemini' | 'openai';
  numOptions?: number;
  regenerationPrompt?: string;
  bigChangesPrompt?: string;
  referenceImageUrl?: string;
}

const timedFetch = async (input: any, init: any = {}) => {
  const { timeoutMs, ...rest } = init || {};
  if (timeoutMs && timeoutMs > 0) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(input, { ...rest, signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  }
  return await fetch(input, rest);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { adId, adName, clientName, sizeSpec, aspectRatio: inputAspectRatio, dpi, bleedPx, safePx, minFontSize, copy, brief, assets, provider, numOptions, regenerationPrompt, bigChangesPrompt, referenceImageUrl }: GenerateRequest = await req.json();

    // Use provided aspectRatio or calculate fallback
    const aspectRatio = inputAspectRatio || (sizeSpec.width > sizeSpec.height ? "4:3" : 
                        sizeSpec.width < sizeSpec.height ? "3:4" : "1:1");

    // If regenerationPrompt is provided, route to regeneration webhook
    if (regenerationPrompt !== undefined) {
      const REGENERATION_WEBHOOK_URL = Deno.env.get('N8N_REGENERATION_WEBHOOK_URL');
      if (!REGENERATION_WEBHOOK_URL) {
        return new Response(
          JSON.stringify({ error: 'N8N_REGENERATION_WEBHOOK_URL is not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const webhookPayload = {
        adId,
        adName,
        clientName,
        regenerationPrompt,
        referenceImageUrl,
        sizeSpec,
        aspectRatio,
        dpi,
        bleedPx,
        safePx,
        minFontSize,
        copy,
        brief,
        assets,
        provider,
      };

      const response = await fetch(REGENERATION_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Regeneration webhook error:', response.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Regeneration webhook failed', detail: errorText }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // n8n handles everything: image upload, version creation, deselecting old versions
      // Just return success - frontend will refresh to see the new version
      console.log('Regeneration webhook completed successfully');
      return new Response(
        JSON.stringify({ success: true, message: 'Regeneration completed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If bigChangesPrompt is provided, route to big changes webhook
    if (bigChangesPrompt !== undefined) {
      const BIG_CHANGES_WEBHOOK_URL = Deno.env.get('N8N_BIG_CHANGES_WEBHOOK_URL');
      if (!BIG_CHANGES_WEBHOOK_URL) {
        return new Response(
          JSON.stringify({ error: 'N8N_BIG_CHANGES_WEBHOOK_URL is not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const webhookPayload = {
        adId,
        adName,
        clientName,
        bigChangesPrompt,
        referenceImageUrl,
        sizeSpec,
        aspectRatio,
        dpi,
        bleedPx,
        safePx,
        minFontSize,
        copy,
        brief,
        assets,
        provider,
      };

      const response = await fetch(BIG_CHANGES_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Big changes webhook error:', response.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Big changes webhook failed', detail: errorText }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // n8n handles everything: image upload, version creation, deselecting old versions
      // Just return success - frontend will refresh to see the new version
      console.log('Big changes webhook completed successfully');
      return new Response(
        JSON.stringify({ success: true, message: 'Big changes completed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use non-reserved env names for function secrets
    const SUPABASE_URL = Deno.env.get("PROJECT_URL") ?? Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("Missing PROJECT_URL or SERVICE_ROLE_KEY function secret");
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Get asset URLs for the prompt
    const productAssets = assets.filter(a => a.type === 'product');
    const logoAssets = assets.filter(a => a.type === 'logo');

    const imagePrompt = `
You are a professional print advertising designer.

Create a **print-ready, full-color advertisement image** with the following specifications. 
The final output must be suitable for **newspaper or magazine printing**.

---
BASIC SPECS
---
- Ad size: ${sizeSpec.width} x ${sizeSpec.height} pixels
- Aspect ratio: ${aspectRatio}
- Resolution: ${dpi} DPI
- Bleed: ${bleedPx}px on all sides
- Safe margin: ${safePx}px on all sides

---
CREATIVE BRIEF
---
${brief || "Professional, clean, and trustworthy advertisement layout."}

---
REQUIRED AD COPY
---
The following text **must appear legibly in the ad** and be easy to read in print:
"${copy || "Contact us for more information"}"

---
DESIGN & PRINT REQUIREMENTS
---
- Full-color design only - **NO grayscale or monochrome**
- Preserve natural product and brand colors; do not desaturate
- Use a **CMYK-safe color palette** appropriate for print production
- High contrast for reliable print reproduction
- Minimum text size: **${minFontSize}pt equivalent**
- All critical content must stay within safe margins
- Clear visual hierarchy:
  1. Headline
  2. Supporting/body text
  3. Contact or call-to-action (only if included in the copy)
- Clean, professional, editorial-quality layout
- No decorative clutter or excessive effects

---
ASSETS & CONTENT RULES
---
${productAssets.length > 0
  ? `- Product image(s) are provided as binary attachments - feature the product prominently as the main visual element` 
  : `- No product imagery provided`}
  
${logoAssets.length > 0
  ? `- Logo image is provided as a binary attachment - include it clearly but unobtrusively` 
  : `- No logo is provided - do NOT add any logo, icon, or placeholder`}

---
FINAL OUTPUT
---
Generate **one complete, print-ready classified advertisement image**.
No mockups. No frames. No watermarks.
`;

    console.log("Generating ad image for:", { adId, sizeSpec, brief: brief?.substring(0, 50) });

    // Note: OpenAI Images generation endpoint does not currently accept reference images.
    // We embed public asset URLs in the textual prompt for guidance, and will use direct
    // reference inputs for providers that support it (e.g., Gemini/Vertex in a future branch).

    // Provider-specific image generation (direct APIs)
    let aiDescription = "";
    const uploadedUrls: string[] = [];
    const count = Math.min(Math.max(numOptions ?? 1, 1), 4);
    let chosenTargetSize: string | null = null;
    let genWidth: number | null = null;
    let genHeight: number | null = null;
    let modelId = "";
    
    if (!provider || provider === 'openai') {
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
      if (!OPENAI_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'OPENAI_API_KEY is not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // Map requested size to OpenAI-supported sizes based on aspect ratio
      // Supported sizes: '1024x1024', '1024x1536', '1536x1024', and 'auto'
      const aspect = sizeSpec.width / sizeSpec.height;
      let targetSize = '1024x1024';
      if (aspect > 1.2) {
        targetSize = '1536x1024'; // landscape
      } else if (aspect < 0.8) {
        targetSize = '1024x1536'; // portrait
      }
      chosenTargetSize = targetSize;
      modelId = 'chatgpt-image-latest';
      const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'chatgpt-image-latest',
          prompt: imagePrompt,
          size: targetSize,
          n: count
        })
      });
      if (!openaiRes.ok) {
        const t = await openaiRes.text();
        console.error('OpenAI error:', openaiRes.status, t);
        return new Response(
          JSON.stringify({ error: 'OpenAI image generation failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const oj = await openaiRes.json();
      const items = Array.isArray(oj?.data) ? oj.data : [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        let bytes: Uint8Array | null = null;
        if (it?.b64_json) {
          bytes = Uint8Array.from(atob(it.b64_json), c => c.charCodeAt(0));
        } else if (it?.url) {
          const imgRes = await fetch(it.url);
          if (!imgRes.ok) {
            const tt = await imgRes.text();
            console.error('OpenAI image download failed:', imgRes.status, tt);
            return new Response(
              JSON.stringify({ error: 'OpenAI image download failed' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          const ab = await imgRes.arrayBuffer();
          bytes = new Uint8Array(ab);
        }

        if (!bytes) continue;

        const fileName = `generated/${adId}/${Date.now()}-${i}.png`;
        const { error: uploadError } = await supabase.storage
          .from('ad-assets')
          .upload(fileName, bytes, {
            contentType: 'image/png',
            upsert: true
          });
        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          return new Response(
            JSON.stringify({ error: 'Failed to save generated image' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: urlData } = supabase.storage
          .from('ad-assets')
          .getPublicUrl(fileName);
        uploadedUrls.push(urlData.publicUrl);
      }
      aiDescription = 'Generated with OpenAI gpt-image-1';
    } else if (provider === 'gemini') {
      // Route Gemini generation to external webhook (n8n) which returns generated images
      const WEBHOOK_URL = Deno.env.get('N8N_GEMINI_WEBHOOK_URL');
      if (!WEBHOOK_URL) {
        return new Response(
          JSON.stringify({ error: 'N8N_GEMINI_WEBHOOK_URL is not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const webhookPayload = {
        adId,
        sizeSpec,
        aspectRatio,
        dpi,
        bleedPx,
        safePx,
        minFontSize,
        copy,
        brief,
        assets,
        numOptions: count,
        prompt: imagePrompt,
        provider: 'gemini'
      };

      let whRes: Response;
      try {
        whRes = await timedFetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
          timeoutMs: 55000
        });
      } catch (e) {
        console.error('Webhook request error:', e);
        return new Response(
          JSON.stringify({ error: 'Gemini webhook request failed' }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!whRes.ok) {
        const t = await whRes.text();
        console.error('Webhook error:', whRes.status, t);
        return new Response(
          JSON.stringify({ error: 'Gemini webhook responded with error', detail: t }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const urls: string[] = [];
      const b64s: Array<{ data: string; mime?: string }> = [];

      const maybePushUrl = (u: any) => {
        if (typeof u === 'string' && /^https?:\/\//.test(u)) urls.push(u);
      };
      const maybePushB64 = (d: any, mime?: string) => {
        if (typeof d === 'string') b64s.push({ data: d, mime });
      };

      // Check content type to determine how to handle response
      const contentType = (whRes.headers.get('content-type') || '').toLowerCase();
      console.log('Webhook response content-type:', contentType);

      if (contentType.startsWith('image/') || contentType.includes('octet-stream')) {
        // Binary image response - convert to base64
        console.log('Processing binary image response');
        const arrayBuffer = await whRes.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        // Convert to base64
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const b64 = btoa(binary);
        const mime = contentType.startsWith('image/') ? contentType.split(';')[0] : 'image/png';
        b64s.push({ data: b64, mime });
        console.log('Binary image converted to base64, size:', bytes.byteLength);
      } else {
        // Try to parse as JSON
        let wr: any;
        try { 
          wr = await whRes.json(); 
          console.log('Webhook returned JSON response');
        } catch { 
          wr = null; 
          console.error('Failed to parse webhook response as JSON');
        }
        
        if (!wr) {
          return new Response(
            JSON.stringify({ error: 'Gemini webhook returned non-JSON/non-image response' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Normalize common shapes from webhook response
        maybePushUrl(wr.imageUrl);
        if (Array.isArray(wr.imageUrls)) wr.imageUrls.forEach(maybePushUrl);
        if (typeof wr.image === 'string') {
          if (wr.image.startsWith('data:')) maybePushB64(wr.image);
          else maybePushUrl(wr.image);
        }
        if (typeof wr.data === 'string') {
          if (wr.data.startsWith('data:')) maybePushB64(wr.data);
        }
        if (Array.isArray(wr.urls)) wr.urls.forEach(maybePushUrl);
        if (Array.isArray(wr.images)) {
          for (const im of wr.images) {
            if (typeof im === 'string') {
              if (im.startsWith('data:')) maybePushB64(im);
              else maybePushUrl(im);
            } else if (im && typeof im === 'object') {
              if (typeof (im as any).url === 'string') maybePushUrl((im as any).url);
              const d = (im as any).b64 || (im as any).base64 || (im as any).data;
              if (typeof d === 'string') maybePushB64(d, (im as any).mime || (im as any).contentType);
            }
          }
        }
      }

      if (urls.length === 0 && b64s.length === 0) {
        console.error('Webhook returned no images');
        return new Response(
          JSON.stringify({ error: 'Gemini webhook returned no images' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Upload base64 images
      for (let i = 0; i < Math.min(b64s.length, count); i++) {
        let { data: b64, mime } = b64s[i];
        if (typeof b64 === 'string' && b64.startsWith('data:')) {
          const idx = b64.indexOf('base64,');
          if (idx >= 0) b64 = b64.slice(idx + 'base64,'.length);
        }
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const ext = mime?.includes('jpeg') ? 'jpg' : 'png';
        const fileName = `generated/${adId}/${Date.now()}-gem-webhook-${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('ad-assets')
          .upload(fileName, bytes, {
            contentType: mime || 'image/png',
            upsert: true
          });
        if (uploadError) {
          console.error('Storage upload error (webhook b64):', uploadError);
          return new Response(
            JSON.stringify({ error: 'Failed to save generated image (webhook b64)' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const { data: urlData } = supabase.storage
          .from('ad-assets')
          .getPublicUrl(fileName);
        uploadedUrls.push(urlData.publicUrl);
      }

      // Download and upload URL images
      for (let i = 0; i < Math.min(urls.length, count); i++) {
        const u = urls[i];
        let imgRes: Response;
        try {
          imgRes = await timedFetch(u, { timeoutMs: 15000 });
        } catch (e) {
          console.error('Webhook image download error:', e);
          return new Response(
            JSON.stringify({ error: 'Webhook image download timed out' }),
            { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (!imgRes.ok) {
          const tt = await imgRes.text();
          console.error('Webhook image download failed:', imgRes.status, tt);
          return new Response(
            JSON.stringify({ error: 'Webhook image download failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const contentType = imgRes.headers.get('content-type') || 'image/png';
        const ab = await imgRes.arrayBuffer();
        const bytes = new Uint8Array(ab);
        const ext = contentType.includes('png') ? 'png' : contentType.includes('jpeg') ? 'jpg' : 'png';
        const fileName = `generated/${adId}/${Date.now()}-gem-webhook-url-${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('ad-assets')
          .upload(fileName, bytes, {
            contentType,
            upsert: true
          });
        if (uploadError) {
          console.error('Storage upload error (webhook url):', uploadError);
          return new Response(
            JSON.stringify({ error: 'Failed to save generated image (webhook url)' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const { data: urlData } = supabase.storage
          .from('ad-assets')
          .getPublicUrl(fileName);
        uploadedUrls.push(urlData.publicUrl);
      }
      aiDescription = 'Generated via Gemini webhook';
    }

    if (uploadedUrls.length === 0) {
      console.error('No image payload in response from provider');
      throw new Error('No image generated by AI');
    }
    console.log('Images uploaded:', uploadedUrls);

    // Create a version entry with the generated image
    const firstUrl = uploadedUrls[0];
    for (let i = 0; i < uploadedUrls.length; i++) {
      const imageUrl = uploadedUrls[i];
      const { error: versionError } = await supabase
        .from('versions')
        .insert({
          ad_id: adId,
          source: 'ai',
          status: 'pending',
          layout_json: {
            document: { widthPx: sizeSpec.width, heightPx: sizeSpec.height, dpi, bleedPx, safePx },
            elements: [],
            metadata: { 
              templateName: "AI Generated Ad",
              rationale: aiDescription,
              warnings: [],
              provider: provider || 'openai',
              prompt: imagePrompt,
              targetSize: chosenTargetSize,
              model: modelId || (provider === 'openai' ? 'gpt-image-1' : ''),
              outputSize: chosenTargetSize ?? (genWidth && genHeight ? `${genWidth}x${genHeight}` : undefined),
              assetsUsed: {
                products: productAssets.map(a => a.url),
                logos: logoAssets.map(a => a.url)
              }
            }
          },
          preview_url: imageUrl,
          is_selected: i === 0
        });
      if (versionError) {
        console.error('Version insert error:', versionError);
      }
    }

    // Deselect other versions
    await supabase
      .from('versions')
      .update({ is_selected: false })
      .eq('ad_id', adId)
      .neq('preview_url', firstUrl);

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl: firstUrl,
        imageUrls: uploadedUrls,
        count: uploadedUrls.length,
        description: aiDescription
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-layouts error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
