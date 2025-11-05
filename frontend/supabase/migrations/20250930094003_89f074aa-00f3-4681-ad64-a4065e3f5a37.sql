-- Remove authentication requirements and allow public access for campaign creation

-- Update campaigns table policies
DROP POLICY IF EXISTS "Users can manage their own campaigns" ON public.campaigns;

CREATE POLICY "Anyone can view campaigns"
ON public.campaigns
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create campaigns"
ON public.campaigns
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update campaigns"
ON public.campaigns
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete campaigns"
ON public.campaigns
FOR DELETE
USING (true);

-- Update posts table policies
DROP POLICY IF EXISTS "Users can manage their own posts" ON public.posts;

CREATE POLICY "Anyone can view posts"
ON public.posts
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create posts"
ON public.posts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update posts"
ON public.posts
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete posts"
ON public.posts
FOR DELETE
USING (true);

-- Update approvals table policies
DROP POLICY IF EXISTS "Users can view approvals for their posts" ON public.approvals;
DROP POLICY IF EXISTS "Users can create approvals for their posts" ON public.approvals;

CREATE POLICY "Anyone can view approvals"
ON public.approvals
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create approvals"
ON public.approvals
FOR INSERT
WITH CHECK (true);

-- Update events table policies
DROP POLICY IF EXISTS "Users can view events for their entities" ON public.events;
DROP POLICY IF EXISTS "System can insert events" ON public.events;

CREATE POLICY "Anyone can view events"
ON public.events
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert events"
ON public.events
FOR INSERT
WITH CHECK (true);

-- Update metrics table policies
DROP POLICY IF EXISTS "Users can view metrics for their posts" ON public.metrics;
DROP POLICY IF EXISTS "System can insert metrics" ON public.metrics;

CREATE POLICY "Anyone can view metrics"
ON public.metrics
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert metrics"
ON public.metrics
FOR INSERT
WITH CHECK (true);

-- Make campaigns.user_id nullable since we don't require auth anymore
ALTER TABLE public.campaigns ALTER COLUMN user_id DROP NOT NULL;

-- Add Temporal-specific columns for workflow tracking
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS temporal_run_id text,
ADD COLUMN IF NOT EXISTS scheduled_for timestamp with time zone;

-- Create function to update post status
CREATE OR REPLACE FUNCTION public.update_post_status(
  p_post_id uuid,
  p_status text,
  p_error text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts
  SET 
    status = p_status::post_status,
    last_error = p_error
  WHERE id = p_post_id;
END;
$$;