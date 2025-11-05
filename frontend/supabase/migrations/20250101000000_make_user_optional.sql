-- Make user_id optional in campaigns table for anonymous usage
ALTER TABLE public.campaigns 
ALTER COLUMN user_id DROP NOT NULL;

-- Allow anonymous users to create and manage campaigns
DROP POLICY IF EXISTS "Users can manage their own campaigns" ON public.campaigns;

CREATE POLICY "Anyone can view campaigns" ON public.campaigns
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update campaigns" ON public.campaigns
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete campaigns" ON public.campaigns
  FOR DELETE USING (true);

-- Allow anonymous users to manage posts
DROP POLICY IF EXISTS "Users can manage their own posts" ON public.posts;

CREATE POLICY "Anyone can view posts" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert posts" ON public.posts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update posts" ON public.posts
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete posts" ON public.posts
  FOR DELETE USING (true);
