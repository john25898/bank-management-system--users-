-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.get_user_total_savings(user_uuid UUID)
RETURNS DECIMAL(12,2)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(SUM(current_amount), 0)
  FROM public.savings_goals
  WHERE user_id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.get_user_account_level(user_uuid UUID)
RETURNS TABLE(
  level_name TEXT,
  min_balance DECIMAL(12,2),
  interest_rate DECIMAL(5,4),
  loan_limit_multiplier DECIMAL(3,2),
  benefits JSONB
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT al.name, al.min_balance, al.interest_rate, al.loan_limit_multiplier, al.benefits
  FROM public.account_levels al
  WHERE al.min_balance <= public.get_user_total_savings(user_uuid)
  ORDER BY al.min_balance DESC
  LIMIT 1;
$$;