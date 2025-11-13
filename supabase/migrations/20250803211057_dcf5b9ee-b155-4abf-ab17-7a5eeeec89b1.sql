-- Create a security definer function to avoid infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update the RLS policies to use the security definer function instead of direct queries
DROP POLICY IF EXISTS "Admins can view all verification requests" ON public.medical_verification;
DROP POLICY IF EXISTS "Admins can update verification requests" ON public.medical_verification;

CREATE POLICY "Admins can view all verification requests" 
ON public.medical_verification 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update verification requests" 
ON public.medical_verification 
FOR UPDATE 
USING (public.get_current_user_role() = 'admin');