-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('patient', 'doctor', 'pharmacist', 'admin');

-- Create verification status enum  
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected');

-- Create medical professional specialties enum
CREATE TYPE public.medical_specialty AS ENUM (
  'general_practitioner',
  'cardiologist', 
  'dermatologist',
  'endocrinologist',
  'gastroenterologist',
  'neurologist',
  'oncologist',
  'pediatrician',
  'psychiatrist',
  'surgeon',
  'pharmacist',
  'other'
);

-- Extend profiles table with comprehensive user information
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'patient';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Uganda';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medical_conditions TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allergies TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_medications TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create medical professional verification table
CREATE TABLE public.medical_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  verification_status verification_status DEFAULT 'pending',
  specialty medical_specialty,
  license_number TEXT,
  institution_name TEXT,
  years_of_experience INTEGER,
  license_document_url TEXT,
  certificate_document_url TEXT,
  additional_documents_urls TEXT[],
  verification_notes TEXT,
  verified_by UUID REFERENCES public.profiles(user_id),
  verified_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user ratings and reviews table
CREATE TABLE public.user_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  reviewed_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  transaction_type TEXT, -- 'medicine_request', 'loan_guarantee', etc.
  transaction_id UUID,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reviewer_id, reviewed_user_id, transaction_id)
);

-- Create user preferences table
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  marketing_emails BOOLEAN DEFAULT false,
  privacy_level TEXT DEFAULT 'friends' CHECK (privacy_level IN ('public', 'friends', 'private')),
  show_medical_conditions BOOLEAN DEFAULT false,
  show_contact_info BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medical documents table
CREATE TABLE public.medical_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 'prescription', 'lab_result', 'medical_report', etc.
  document_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  is_shared BOOLEAN DEFAULT false,
  shared_with UUID[] DEFAULT '{}',
  expiry_date DATE,
  notes TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE public.medical_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for medical_verification
CREATE POLICY "Users can view their own verification" ON public.medical_verification
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own verification" ON public.medical_verification
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own verification" ON public.medical_verification
  FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for user_reviews
CREATE POLICY "Users can view reviews about them" ON public.user_reviews
  FOR SELECT USING (reviewed_user_id = auth.uid() OR reviewer_id = auth.uid());

CREATE POLICY "Users can create reviews" ON public.user_reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users can update their own reviews" ON public.user_reviews
  FOR UPDATE USING (reviewer_id = auth.uid());

-- Create RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for medical_documents
CREATE POLICY "Users can view their own documents" ON public.medical_documents
  FOR SELECT USING (user_id = auth.uid() OR auth.uid() = ANY(shared_with));

CREATE POLICY "Users can create their own documents" ON public.medical_documents
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own documents" ON public.medical_documents
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own documents" ON public.medical_documents
  FOR DELETE USING (user_id = auth.uid());

-- Create storage buckets for files
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('medical-documents', 'medical-documents', false),
  ('verification-documents', 'verification-documents', false),
  ('avatars', 'avatars', true);

-- Create storage policies
CREATE POLICY "Users can upload their own medical documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own medical documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload verification documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view verification documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes for better performance
CREATE INDEX idx_medical_verification_user_id ON public.medical_verification(user_id);
CREATE INDEX idx_medical_verification_status ON public.medical_verification(verification_status);
CREATE INDEX idx_user_reviews_reviewed_user ON public.user_reviews(reviewed_user_id);
CREATE INDEX idx_user_reviews_reviewer ON public.user_reviews(reviewer_id);
CREATE INDEX idx_medical_documents_user_id ON public.medical_documents(user_id);
CREATE INDEX idx_medical_documents_type ON public.medical_documents(document_type);

-- Create triggers for updating timestamps
CREATE TRIGGER update_medical_verification_updated_at
  BEFORE UPDATE ON public.medical_verification
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_reviews_updated_at
  BEFORE UPDATE ON public.user_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate user rating
CREATE OR REPLACE FUNCTION public.get_user_rating(user_uuid uuid)
RETURNS TABLE(average_rating NUMERIC, total_reviews INTEGER)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    ROUND(AVG(rating), 2) as average_rating,
    COUNT(*)::INTEGER as total_reviews
  FROM public.user_reviews
  WHERE reviewed_user_id = user_uuid;
$$;