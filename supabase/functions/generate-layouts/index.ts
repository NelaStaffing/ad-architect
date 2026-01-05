import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

interface LayoutRequest {
  sizeSpec: { width: number; height: number };
  dpi: number;
  bleedPx: number;
  safePx: number;
  minFontSize: number;
  copy: string;
  brief: string;
  assets: AssetMeta[];
}

const LAYOUT_SYSTEM_PROMPT = `You are a professional print ad layout designer. Generate print-ready classified ad layouts in strict JSON format.

For each layout, you must create a complete, production-ready design that:
1. Respects bleed and safe zones
2. Uses appropriate font sizes (never below minimum)
3. Places all text content legibly
4. Integrates provided assets effectively
5. Creates visual hierarchy appropriate to the brief

Return ONLY a valid JSON array of 3-6 layout objects. Each object must follow this exact schema:

{
  "document": {
    "widthPx": number,
    "heightPx": number,
    "dpi": number,
    "bleedPx": number,
    "safePx": number
  },
  "elements": [
    {
      "type": "text" | "image" | "shape",
      "id": string (unique),
      "x": number (pixels from left),
      "y": number (pixels from top),
      "w": number (width in pixels),
      "h": number (height in pixels),
      "style": {
        "fontFamily": string (e.g., "Arial", "Georgia"),
        "fontSize": number (in points),
        "fontWeight": "normal" | "bold",
        "lineHeight": number (multiplier like 1.2),
        "color": string (hex color),
        "alignment": "left" | "center" | "right",
        "padding": number,
        "backgroundColor": string (hex color, optional),
        "borderRadius": number (optional)
      },
      "content": string (for text type),
      "assetRef": string (asset id for image type)
    }
  ],
  "metadata": {
    "templateName": string (descriptive name),
    "rationale": string (design reasoning),
    "warnings": string[] (any issues like tight spacing)
  }
}

Design variation strategies to use:
- Centered vs left-aligned layouts
- Image-dominant vs text-dominant
- Stacked vertical vs side-by-side horizontal
- Bold headline focused vs balanced
- Minimal whitespace vs generous padding

Always position elements within the safe zone (inset by safePx from edges).
Never use font sizes below the minFontSize specified.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sizeSpec, dpi, bleedPx, safePx, minFontSize, copy, brief, assets }: LayoutRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userPrompt = `Generate 3-6 different layout variations for this classified ad:

**Document Specs:**
- Size: ${sizeSpec.width}x${sizeSpec.height} pixels
- DPI: ${dpi}
- Bleed: ${bleedPx}px
- Safe zone: ${safePx}px inset from edges
- Minimum font size: ${minFontSize}pt

**Creative Brief:**
${brief || "Standard classified ad layout"}

**Ad Copy:**
${copy || "Sample headline and body text"}

**Available Assets:**
${assets.length > 0 ? assets.map(a => `- ${a.type}: ${a.id} (${a.width || 'unknown'}x${a.height || 'unknown'})`).join('\n') : 'No images provided'}

Generate diverse layouts with different hierarchy approaches. Return ONLY valid JSON array.`;

    console.log("Generating layouts for:", { sizeSpec, dpi, brief: brief?.substring(0, 50) });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: LAYOUT_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    // Parse and validate
    const layouts = JSON.parse(jsonStr.trim());
    
    if (!Array.isArray(layouts) || layouts.length === 0) {
      throw new Error("Invalid layouts array");
    }

    console.log(`Generated ${layouts.length} layout variations`);

    return new Response(
      JSON.stringify({ layouts }),
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
