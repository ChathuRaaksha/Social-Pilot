-- Make approved_by optional in approvals table for anonymous usage
ALTER TABLE public.approvals 
ALTER COLUMN approved_by DROP NOT NULL;

-- Update RLS policies for approvals table to allow anonymous operations
DROP POLICY IF EXISTS "Users can view approvals for their posts" ON public.approvals;
DROP POLICY IF EXISTS "Users can create approvals for their posts" ON public.approvals;

CREATE POLICY "Anyone can view approvals" ON public.approvals
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create approvals" ON public.approvals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update approvals" ON public.approvals
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete approvals" ON public.approvals
  FOR DELETE USING (true);
