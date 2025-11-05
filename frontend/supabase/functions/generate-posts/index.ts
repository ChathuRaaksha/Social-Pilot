import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLATFORM_PROMPTS = {
  linkedin: (idea: string, audience: string, tone: string) => 
    `Turn the idea into a professional LinkedIn post of 2 to 4 lines. Add exactly 3 relevant hashtags. Keep it succinct and helpful.${audience ? ` Audience: ${audience}.` : ''}${tone ? ` Tone: ${tone}.` : ''} Idea: ${idea}`,
  
  x: (idea: string, audience: string, tone: string) =>
    `Turn the idea into a concise X post under 220 chars. Add 2 relevant hashtags and a single emoji.${audience ? ` Audience: ${audience}.` : ''}${tone ? ` Tone: ${tone}.` : ''} Idea: ${idea}`,
  
  instagram: (idea: string, audience: string, tone: string) =>
    `Create a friendly Instagram caption with short lines, 4 to 6 relevant hashtags, and a simple CTA.${audience ? ` Audience: ${audience}.` : ''}${tone ? ` Tone: ${tone}.` : ''} Idea: ${idea}`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { idea, audience, tone, platforms } = await req.json();
    
    // Enhanced server-side validation
    if (!idea || typeof idea !== 'string') {
      return new Response(
        JSON.stringify({ error: "Idea is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (idea.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Idea cannot be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (idea.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Idea must be less than 2000 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (audience && typeof audience === 'string' && audience.length > 500) {
      return new Response(
        JSON.stringify({ error: "Audience must be less than 500 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (tone && typeof tone === 'string' && tone.length > 200) {
      return new Response(
        JSON.stringify({ error: "Tone must be less than 200 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const platformsToGenerate = platforms || ["linkedin", "x", "instagram"];
    const posts = [];

    // Generate posts for each platform
    for (const platform of platformsToGenerate) {
      console.log(`Generating ${platform} post...`);
      
      const prompt = PLATFORM_PROMPTS[platform as keyof typeof PLATFORM_PROMPTS](
        idea,
        audience || "",
        tone || ""
      );

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "You are an expert social media content creator. Generate engaging, platform-optimized posts that resonate with the target audience.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AI API error for ${platform}:`, response.status, errorText);
        throw new Error(`AI generation failed for ${platform}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      posts.push({
        platform,
        content: content.trim(),
        status: "draft",
      });
    }

    return new Response(
      JSON.stringify({ posts }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-posts function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});