-- Enable pgsodium extension for encryption
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- Create audit_logs table for security monitoring
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins or system can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_audit_logs_event_type ON public.audit_logs(event_type);

-- Add encrypted columns to providers table
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS access_token_encrypted bytea,
ADD COLUMN IF NOT EXISTS refresh_token_encrypted bytea;

-- Create function to securely encrypt tokens
CREATE OR REPLACE FUNCTION public.encrypt_provider_token(token text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF token IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN pgsodium.crypto_secretbox_noncegen(token::bytea, 
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'provider_token_key' LIMIT 1)::bytea
  );
END;
$$;

-- Create function to securely decrypt tokens (only callable by service role)
CREATE OR REPLACE FUNCTION public.decrypt_provider_token(encrypted_token bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  decrypted_value bytea;
BEGIN
  IF encrypted_token IS NULL THEN
    RETURN NULL;
  END IF;
  
  decrypted_value := pgsodium.crypto_secretbox_open(encrypted_token,
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'provider_token_key' LIMIT 1)::bytea
  );
  
  RETURN convert_from(decrypted_value, 'UTF8');
END;
$$;

-- Create function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id uuid,
  p_event_type text,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    event_type,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    p_user_id,
    p_event_type,
    p_entity_type,
    p_entity_id,
    p_metadata
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Create function to cleanup old audit logs (90 day retention)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Add token expiration tracking
ALTER TABLE public.providers
ADD COLUMN IF NOT EXISTS token_refreshed_at timestamp with time zone DEFAULT now();

-- Update RLS policies to prevent direct token access
DROP POLICY IF EXISTS "Users can manage their own providers" ON public.providers;

-- Separate policies for different operations
CREATE POLICY "Users can view their provider info (no tokens)"
ON public.providers
FOR SELECT
USING (
  auth.uid() = (SELECT user_id FROM users WHERE id = providers.user_id)
);

CREATE POLICY "Users can insert their own providers"
ON public.providers
FOR INSERT
WITH CHECK (
  auth.uid() = (SELECT user_id FROM users WHERE id = providers.user_id)
);

CREATE POLICY "Users can update their own providers"
ON public.providers
FOR UPDATE
USING (
  auth.uid() = (SELECT user_id FROM users WHERE id = providers.user_id)
);

CREATE POLICY "Users can delete their own providers"
ON public.providers
FOR DELETE
USING (
  auth.uid() = (SELECT user_id FROM users WHERE id = providers.user_id)
);