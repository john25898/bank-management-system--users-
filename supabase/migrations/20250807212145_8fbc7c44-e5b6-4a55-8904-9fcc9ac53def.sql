-- Update the loan eligibility function to make everyone eligible
CREATE OR REPLACE FUNCTION public.calculate_loan_eligibility(user_uuid uuid)
 RETURNS TABLE(eligible boolean, max_loan_amount numeric, required_guarantors integer, available_criteria jsonb)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
      -- Make everyone eligible by always returning true
      true as meets_basic_requirements,
      -- Provide generous loan amounts - use max loan amount or a default of 5M UGX
      COALESCE(lec.max_loan_amount, 5000000) as calculated_max_loan
    FROM public.loan_eligibility_criteria lec
    CROSS JOIN user_savings us
    CROSS JOIN user_membership um
    WHERE lec.is_active = true
  )
  SELECT 
    -- Everyone is now eligible
    true as eligible,
    -- Return the maximum available loan amount
    COALESCE(MAX(calculated_max_loan), 5000000) as max_loan_amount,
    -- Minimum guarantors required (set to 0 for accessibility)
    COALESCE(MIN(min_guarantors), 0) as required_guarantors,
    -- Return all available criteria since everyone meets requirements
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
      ),
      '[{"id": "default", "name": "Standard Medical Loan", "interest_rate": 0.15, "max_term_months": 24, "max_loan_amount": 5000000, "meets_requirements": true}]'::jsonb
    ) as available_criteria
  FROM eligible_criteria;
$function$