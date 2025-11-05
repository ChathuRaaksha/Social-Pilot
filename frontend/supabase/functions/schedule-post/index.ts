import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Schedule Post Function
 * 
 * This edge function schedules a post to be published via Temporal Cloud.
 * It creates a workflow execution that will wait until the scheduled time
 * and then publish the post to the specified platform.
 * 
 * Request body:
 * {
 *   postId: string,
 *   scheduledFor: string (ISO 8601 timestamp),
 *   platform: 'linkedin' | 'x' | 'instagram'
 * }
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { postId, scheduledFor, platform } = await req.json();

    // Validate input
    if (!postId || !scheduledFor || !platform) {
      return new Response(
        JSON.stringify({ error: "postId, scheduledFor, and platform are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate scheduledFor is in the future
    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      return new Response(
        JSON.stringify({ error: "scheduledFor must be a valid future timestamp" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the post
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      return new Response(
        JSON.stringify({ error: "Post not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Temporal credentials from environment
    const temporalAddress = Deno.env.get("TEMPORAL_ADDRESS");
    const temporalNamespace = Deno.env.get("TEMPORAL_NAMESPACE");
    const temporalApiKey = Deno.env.get("TEMPORAL_API_KEY");

    if (!temporalAddress || !temporalNamespace || !temporalApiKey) {
      console.error("Temporal credentials not configured");
      return new Response(
        JSON.stringify({ 
          error: "Temporal integration not configured. Please set TEMPORAL_ADDRESS, TEMPORAL_NAMESPACE, and TEMPORAL_API_KEY secrets." 
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate delay in seconds
    const delaySeconds = Math.floor((scheduledDate.getTime() - Date.now()) / 1000);

    // Create workflow ID
    const workflowId = `publish-post-${postId}-${Date.now()}`;

    // Start Temporal workflow
    const temporalResponse = await fetch(`${temporalAddress}/api/v1/namespaces/${temporalNamespace}/workflows/${workflowId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${temporalApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workflowType: "PublishPostWorkflow",
        taskQueue: "social-media-posts",
        input: {
          postId,
          platform,
          content: post.content,
          imageUrl: post.image_url,
          delaySeconds,
        },
        workflowExecutionTimeout: "86400s", // 24 hours
        workflowRunTimeout: "43200s", // 12 hours
      }),
    });

    if (!temporalResponse.ok) {
      const errorText = await temporalResponse.text();
      console.error("Temporal API error:", errorText);
      throw new Error("Failed to start Temporal workflow");
    }

    const temporalData = await temporalResponse.json();

    // Update post with workflow information
    const { error: updateError } = await supabase
      .from("posts")
      .update({
        status: "scheduled",
        scheduled_at: scheduledFor,
        temporal_workflow_id: workflowId,
        temporal_run_id: temporalData.runId,
      })
      .eq("id", postId);

    if (updateError) {
      console.error("Error updating post:", updateError);
      throw updateError;
    }

    // Log scheduling event
    await supabase
      .from("events")
      .insert({
        entity_type: "post",
        entity_id: postId,
        type: "post_scheduled",
        data: {
          scheduledFor,
          workflowId,
          runId: temporalData.runId,
          platform,
        },
      });

    console.log(`Post ${postId} scheduled for ${scheduledFor} via workflow ${workflowId}`);

    return new Response(
      JSON.stringify({
        message: "Post scheduled successfully",
        workflowId,
        runId: temporalData.runId,
        scheduledFor,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error scheduling post:", error);
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
