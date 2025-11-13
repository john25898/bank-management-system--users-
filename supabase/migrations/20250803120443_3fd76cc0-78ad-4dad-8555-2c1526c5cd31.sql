-- Create loans table
CREATE TABLE public.loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  purpose TEXT NOT NULL,
  interest_rate NUMERIC NOT NULL,
  term_months INTEGER NOT NULL,
  monthly_payment NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approval_date TIMESTAMP WITH TIME ZONE,
  disbursement_date TIMESTAMP WITH TIME ZONE,
  maturity_date TIMESTAMP WITH TIME ZONE,
  outstanding_balance NUMERIC NOT NULL DEFAULT 0,
  total_paid NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_loan_status CHECK (status IN ('pending', 'approved', 'disbursed', 'active', 'completed', 'defaulted', 'rejected'))
);

-- Create loan guarantors table
CREATE TABLE public.loan_guarantors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  guarantor_user_id UUID NOT NULL,
  guaranteed_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_guarantor_status CHECK (status IN ('pending', 'accepted', 'declined'))
);

-- Create loan repayments table
CREATE TABLE public.loan_repayments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  payment_type TEXT NOT NULL DEFAULT 'regular',
  reference_number TEXT NOT NULL DEFAULT gen_random_uuid(),
  balance_before NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  principal_amount NUMERIC NOT NULL,
  interest_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_payment_type CHECK (payment_type IN ('regular', 'early', 'penalty', 'late'))
);

-- Create loan eligibility criteria table
CREATE TABLE public.loan_eligibility_criteria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  min_savings_balance NUMERIC NOT NULL DEFAULT 0,
  min_months_membership INTEGER NOT NULL DEFAULT 1,
  max_loan_to_savings_ratio NUMERIC NOT NULL DEFAULT 3.0,
  min_guarantors INTEGER NOT NULL DEFAULT 0,
  max_loan_amount NUMERIC,
  interest_rate NUMERIC NOT NULL,
  max_term_months INTEGER NOT NULL DEFAULT 12,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_eligibility_criteria ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for loans
CREATE POLICY "Users can view their own loans" 
ON public.loans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own loans" 
ON public.loans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loans" 
ON public.loans 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for loan guarantors
CREATE POLICY "Users can view loans they guarantee or own" 
ON public.loan_guarantors 
FOR SELECT 
USING (auth.uid() = guarantor_user_id OR auth.uid() IN (SELECT user_id FROM public.loans WHERE id = loan_id));

CREATE POLICY "Users can create guarantor records" 
ON public.loan_guarantors 
FOR INSERT 
WITH CHECK (auth.uid() = guarantor_user_id OR auth.uid() IN (SELECT user_id FROM public.loans WHERE id = loan_id));

CREATE POLICY "Users can update their own guarantor records" 
ON public.loan_guarantors 
FOR UPDATE 
USING (auth.uid() = guarantor_user_id);

-- Create RLS policies for loan repayments
CREATE POLICY "Users can view their own loan repayments" 
ON public.loan_repayments 
FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.loans WHERE id = loan_id));

CREATE POLICY "Users can create their own loan repayments" 
ON public.loan_repayments 
FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.loans WHERE id = loan_id));

-- Create RLS policies for loan eligibility criteria
CREATE POLICY "All users can view loan eligibility criteria" 
ON public.loan_eligibility_criteria 
FOR SELECT 
USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_loans_updated_at
BEFORE UPDATE ON public.loans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_guarantors_updated_at
BEFORE UPDATE ON public.loan_guarantors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_eligibility_criteria_updated_at
BEFORE UPDATE ON public.loan_eligibility_criteria
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate loan eligibility (fixed version)
CREATE OR REPLACE FUNCTION public.calculate_loan_eligibility(user_uuid UUID)
RETURNS TABLE(
  eligible BOOLEAN,
  max_loan_amount NUMERIC,
  required_guarantors INTEGER,
  available_criteria JSONB
)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  WITH user_savings AS (
    SELECT COALESCE(public.get_user_total_savings(user_uuid), 0) as total_savings
  ),
  user_membership AS (
    SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) / (30 * 24 * 3600) as months_since_joining
    FROM public.profiles 
    WHERE user_id = user_uuid
  ),
  eligible_criteria AS (
    SELECT 
      lec.*,
      us.total_savings,
      um.months_since_joining,
      CASE 
        WHEN us.total_savings >= lec.min_savings_balance 
         AND um.months_since_joining >= lec.min_months_membership
        THEN true 
        ELSE false 
      END as meets_basic_requirements,
      LEAST(
        us.total_savings * lec.max_loan_to_savings_ratio,
        COALESCE(lec.max_loan_amount, us.total_savings * lec.max_loan_to_savings_ratio)
      ) as calculated_max_loan
    FROM public.loan_eligibility_criteria lec
    CROSS JOIN user_savings us
    CROSS JOIN user_membership um
    WHERE lec.is_active = true
  )
  SELECT 
    CASE WHEN COUNT(*) FILTER (WHERE meets_basic_requirements = true) > 0 THEN true ELSE false END as eligible,
    COALESCE(MAX(calculated_max_loan) FILTER (WHERE meets_basic_requirements = true), 0) as max_loan_amount,
    COALESCE(MIN(min_guarantors) FILTER (WHERE meets_basic_requirements = true), 0) as required_guarantors,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'name', name,
          'interest_rate', interest_rate,
          'max_term_months', max_term_months,
          'max_loan_amount', calculated_max_loan,
          'meets_requirements', meets_basic_requirements
        )
      ) FILTER (WHERE meets_basic_requirements = true),
      '[]'::jsonb
    ) as available_criteria
  FROM eligible_criteria;
$$;

-- Insert default loan eligibility criteria
INSERT INTO public.loan_eligibility_criteria (name, min_savings_balance, min_months_membership, max_loan_to_savings_ratio, min_guarantors, interest_rate, max_term_months) VALUES
('Emergency Loan', 5000, 1, 1.0, 0, 0.12, 6),
('Standard Loan', 10000, 3, 2.0, 1, 0.15, 12),
('Development Loan', 25000, 6, 3.0, 2, 0.18, 24),
('Business Loan', 50000, 12, 4.0, 3, 0.20, 36);