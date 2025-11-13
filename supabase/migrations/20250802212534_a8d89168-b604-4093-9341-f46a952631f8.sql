-- First, delete all existing data from loans table
DELETE FROM public.loans;

-- Update loans table to handle medicine requests
ALTER TABLE public.loans RENAME TO medicine_requests;

-- Add medicine information columns
ALTER TABLE public.medicine_requests 
  ADD COLUMN generic_name TEXT NOT NULL DEFAULT 'Unknown',
  ADD COLUMN brand_name TEXT,
  ADD COLUMN alternative_names_accepted BOOLEAN DEFAULT false,
  ADD COLUMN strength_dosage TEXT NOT NULL DEFAULT 'Unknown',
  ADD COLUMN form_type TEXT NOT NULL DEFAULT 'Tablets/Pills',
  ADD COLUMN quantity_units INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN days_treatment INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN total_amount INTEGER GENERATED ALWAYS AS (quantity_units * days_treatment) STORED;

-- Add medical context columns
ALTER TABLE public.medicine_requests 
  ADD COLUMN medical_condition TEXT NOT NULL DEFAULT 'Other',
  ADD COLUMN medical_condition_other TEXT,
  ADD COLUMN urgency_level TEXT NOT NULL DEFAULT 'Routine',
  ADD COLUMN prescription_status TEXT NOT NULL DEFAULT 'Over-the-counter medication';

-- Add delivery and return preferences
ALTER TABLE public.medicine_requests 
  ADD COLUMN pickup_from_lender BOOLEAN DEFAULT false,
  ADD COLUMN home_delivery BOOLEAN DEFAULT false,
  ADD COLUMN meet_at_pharmacy BOOLEAN DEFAULT false,
  ADD COLUMN hospital_clinic_pickup BOOLEAN DEFAULT false,
  ADD COLUMN max_distance INTEGER DEFAULT 10,
  ADD COLUMN return_method TEXT NOT NULL DEFAULT 'Same medicine type';

-- Remove old loan-specific columns
ALTER TABLE public.medicine_requests 
  DROP COLUMN amount,
  DROP COLUMN duration_months;

-- Update RLS policies for the renamed table
DROP POLICY "Users can view own loans" ON public.medicine_requests;
DROP POLICY "Users can insert own loans" ON public.medicine_requests;
DROP POLICY "Users can update own loans" ON public.medicine_requests;

CREATE POLICY "Users can view own medicine requests" 
ON public.medicine_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medicine requests" 
ON public.medicine_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medicine requests" 
ON public.medicine_requests 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add check constraints for valid values
ALTER TABLE public.medicine_requests 
  ADD CONSTRAINT valid_form_type 
  CHECK (form_type IN ('Tablets/Pills', 'Capsules', 'Liquid/Syrup', 'Injection', 'Cream/Ointment', 'Inhaler', 'Patches'));

ALTER TABLE public.medicine_requests 
  ADD CONSTRAINT valid_urgency_level 
  CHECK (urgency_level IN ('Emergency', 'Urgent', 'Routine', 'Preventive'));

ALTER TABLE public.medicine_requests 
  ADD CONSTRAINT valid_prescription_status 
  CHECK (prescription_status IN ('Have valid prescription', 'Previous prescription (expired)', 'Over-the-counter medication', 'Refill of existing medication'));

ALTER TABLE public.medicine_requests 
  ADD CONSTRAINT valid_return_method 
  CHECK (return_method IN ('Same medicine type', 'Cash equivalent', 'Different medicine of equal value', 'Donation (no return expected)'));

ALTER TABLE public.medicine_requests 
  ADD CONSTRAINT valid_max_distance 
  CHECK (max_distance >= 0 AND max_distance <= 50);