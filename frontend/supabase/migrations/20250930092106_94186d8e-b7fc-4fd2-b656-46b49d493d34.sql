-- Create custom types
CREATE TYPE public.provider_type AS ENUM ('linkedin', 'x', 'instagram');
CREATE TYPE public.platform_type AS ENUM ('linkedin', 'x', 'instagram');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'awaiting_approval', 'scheduled', 'published', 'failed');
CREATE TYPE public.post_status AS ENUM ('draft', 'awaiting_approval', 'scheduled', 'published', 'failed');

-- Create users table (profiles for auth users)
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  picture TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create providers table for social media connections
CREATE TABLE public.providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type provider_type NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  handle TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, type)
);

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  idea TEXT NOT NULL,
  audience TEXT,
  tone TEXT,
  status campaign_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  status post_status NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  temporal_workflow_id TEXT,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create approvals table
CREATE TABLE public.approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  approved_by UUID NOT NULL REFERENCES public.users(id),
  approved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Create metrics table
CREATE TABLE public.metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table for logging
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  type TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for providers table
CREATE POLICY "Users can manage their own providers" ON public.providers
  FOR ALL USING (auth.uid() = (SELECT user_id FROM public.users WHERE id = providers.user_id));

-- Create RLS policies for campaigns table
CREATE POLICY "Users can manage their own campaigns" ON public.campaigns
  FOR ALL USING (auth.uid() = (SELECT user_id FROM public.users WHERE id = campaigns.user_id));

-- Create RLS policies for posts table
CREATE POLICY "Users can manage their own posts" ON public.posts
  FOR ALL USING (auth.uid() = (SELECT u.user_id FROM public.users u 
                                JOIN public.campaigns c ON c.user_id = u.id 
                                WHERE c.id = posts.campaign_id));

-- Create RLS policies for approvals table
CREATE POLICY "Users can view approvals for their posts" ON public.approvals
  FOR SELECT USING (auth.uid() = (SELECT u.user_id FROM public.users u 
                                  JOIN public.campaigns c ON c.user_id = u.id 
                                  JOIN public.posts p ON p.campaign_id = c.id 
                                  WHERE p.id = approvals.post_id));

CREATE POLICY "Users can create approvals for their posts" ON public.approvals
  FOR INSERT WITH CHECK (auth.uid() = (SELECT u.user_id FROM public.users u 
                                       JOIN public.campaigns c ON c.user_id = u.id 
                                       JOIN public.posts p ON p.campaign_id = c.id 
                                       WHERE p.id = approvals.post_id));

-- Create RLS policies for metrics table
CREATE POLICY "Users can view metrics for their posts" ON public.metrics
  FOR SELECT USING (auth.uid() = (SELECT u.user_id FROM public.users u 
                                  JOIN public.campaigns c ON c.user_id = u.id 
                                  JOIN public.posts p ON p.campaign_id = c.id 
                                  WHERE p.id = metrics.post_id));

CREATE POLICY "System can insert metrics" ON public.metrics
  FOR INSERT WITH CHECK (true);

-- Create RLS policies for events table
CREATE POLICY "Users can view events for their entities" ON public.events
  FOR SELECT USING (
    auth.uid() = (
      CASE 
        WHEN entity_type = 'campaign' THEN 
          (SELECT u.user_id FROM public.users u 
           JOIN public.campaigns c ON c.user_id = u.id 
           WHERE c.id = events.entity_id)
        WHEN entity_type = 'post' THEN 
          (SELECT u.user_id FROM public.users u 
           JOIN public.campaigns c ON c.user_id = u.id 
           JOIN public.posts p ON p.campaign_id = c.id 
           WHERE p.id = events.entity_id)
        ELSE NULL
      END
    )
  );

CREATE POLICY "System can insert events" ON public.events
  FOR INSERT WITH CHECK (true);

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (user_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_providers_user_id ON public.providers(user_id);
CREATE INDEX idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX idx_posts_campaign_id ON public.posts(campaign_id);
CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_scheduled_at ON public.posts(scheduled_at);
CREATE INDEX idx_metrics_post_id ON public.metrics(post_id);
CREATE INDEX idx_events_entity_type_id ON public.events(entity_type, entity_id);