import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Temporal Webhook Handler
 * 
 * This edge function receives webhook callbacks from Temporal Cloud when workflows complete.
 * It updates post statuses and logs events based on the workflow execution results.
 * 
 * Expected webhook payload from Temporal:
 * {
 *   workflowId: string,
 *   runId: string,
 *   status: 'completed' | 'failed' | 'terminated',
 *   result?: any,
 *   error?: string
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

    const payload = await req.json();
    console.log("Temporal webhook received:", payload);

    const { workflowId, runId, status, result, error } = payload;

    // Validate webhook payload
    if (!workflowId || !status) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the post associated with this workflow
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("*")
      .eq("temporal_workflow_id", workflowId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching post:", fetchError);
      throw fetchError;
    }

    if (!post) {
      console.warn("No post found for workflow:", workflowId);
      return new Response(
        JSON.stringify({ message: "Post not found for workflow" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update post status based on workflow status
    let newStatus: string;
    let lastError: string | null = null;

    switch (status) {
      case "completed":
        newStatus = "published";
        break;
      case "failed":
      case "terminated":
        newStatus = "failed";
        lastError = error || "Workflow execution failed";
        break;
      default:
        console.warn("Unknown workflow status:", status);
        newStatus = post.status; // Keep current status
    }

    // Update the post
    const { error: updateError } = await supabase
      .from("posts")
      .update({
        status: newStatus,
        last_error: lastError,
        temporal_run_id: runId,
      })
      .eq("id", post.id);

    if (updateError) {
      console.error("Error updating post:", updateError);
      throw updateError;
    }

    // Log event
    const { error: eventError } = await supabase
      .from("events")
      .insert({
        entity_type: "post",
        entity_id: post.id,
        type: `workflow_${status}`,
        data: {
          workflowId,
          runId,
          status,
          result,
          error,
        },
      });

    if (eventError) {
      console.error("Error logging event:", eventError);
    }

    console.log(`Post ${post.id} updated to ${newStatus}`);

    return new Response(
      JSON.stringify({ 
        message: "Webhook processed successfully",
        postId: post.id,
        newStatus 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
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
