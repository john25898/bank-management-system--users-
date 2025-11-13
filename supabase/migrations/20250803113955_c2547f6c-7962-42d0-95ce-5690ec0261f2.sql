-- Create savings plans table for flexible contribution schedules
CREATE TABLE public.savings_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  contribution_amount DECIMAL(12,2) NOT NULL,
  contribution_frequency TEXT NOT NULL CHECK (contribution_frequency IN ('daily', 'weekly', 'monthly')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_deduct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create savings goals table for virtual wallets
CREATE TABLE public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  target_date DATE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create account levels table for tiered benefits
CREATE TABLE public.account_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  min_balance DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,4) NOT NULL,
  loan_limit_multiplier DECIMAL(3,2) NOT NULL,
  benefits JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default account levels
INSERT INTO public.account_levels (name, min_balance, interest_rate, loan_limit_multiplier, benefits) VALUES
('Bronze', 0, 0.03, 2.0, '{"transaction_limit": 5, "free_transfers": 3, "priority_support": false}'),
('Silver', 10000, 0.05, 3.0, '{"transaction_limit": 15, "free_transfers": 10, "priority_support": true, "loan_processing_fee_waiver": 0.5}'),
('Gold', 50000, 0.08, 5.0, '{"transaction_limit": -1, "free_transfers": -1, "priority_support": true, "loan_processing_fee_waiver": 1.0, "investment_access": true}');

-- Create enhanced transactions table
CREATE TABLE public.savings_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  savings_goal_id UUID REFERENCES public.savings_goals(id) ON DELETE SET NULL,
  savings_plan_id UUID REFERENCES public.savings_plans(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'interest', 'transfer', 'fee')),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  reference_number TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  balance_before DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.savings_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for savings_plans
CREATE POLICY "Users can view own savings plans" ON public.savings_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own savings plans" ON public.savings_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings plans" ON public.savings_plans
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for savings_goals
CREATE POLICY "Users can view own savings goals" ON public.savings_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own savings goals" ON public.savings_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings goals" ON public.savings_goals
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for account_levels (read-only for all authenticated users)
CREATE POLICY "All users can view account levels" ON public.account_levels
  FOR SELECT TO authenticated USING (true);

-- Create RLS policies for savings_transactions
CREATE POLICY "Users can view own transactions" ON public.savings_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON public.savings_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create update triggers for timestamps
CREATE TRIGGER update_savings_plans_updated_at
  BEFORE UPDATE ON public.savings_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_savings_goals_updated_at
  BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate total savings for a user
CREATE OR REPLACE FUNCTION public.get_user_total_savings(user_uuid UUID)
RETURNS DECIMAL(12,2)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(SUM(current_amount), 0)
  FROM public.savings_goals
  WHERE user_id = user_uuid;
$$;

-- Create function to get user account level
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
AS $$
  SELECT al.name, al.min_balance, al.interest_rate, al.loan_limit_multiplier, al.benefits
  FROM public.account_levels al
  WHERE al.min_balance <= public.get_user_total_savings(user_uuid)
  ORDER BY al.min_balance DESC
  LIMIT 1;
$$;