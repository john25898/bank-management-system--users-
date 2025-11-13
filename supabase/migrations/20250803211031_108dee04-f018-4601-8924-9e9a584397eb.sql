-- Update RLS policies for medical_verification table to allow admins to view all requests

-- First, drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own verification" ON public.medical_verification;

-- Create new policies that allow:
-- 1. Users can view their own verification requests
-- 2. Admin users can view all verification requests
CREATE POLICY "Users can view their own verification" 
ON public.medical_verification 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all verification requests" 
ON public.medical_verification 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Also allow admins to update verification requests (for approving/rejecting)
CREATE POLICY "Admins can update verification requests" 
ON public.medical_verification 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);