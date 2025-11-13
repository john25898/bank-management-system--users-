import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { SavingsOverview } from "@/components/dashboard/SavingsOverview";
import { LoanOverview } from "@/components/dashboard/LoanOverview";
import { MedicineRequestStatus } from "@/components/dashboard/MedicineRequestStatus";
import { FinancialHealthScore } from "@/components/dashboard/FinancialHealthScore";
import { FinancialInsights } from "@/components/dashboard/FinancialInsights";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { SpendingAnalytics } from "@/components/dashboard/SpendingAnalytics";
import { GoalAchievementTracking } from "@/components/dashboard/GoalAchievementTracking";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Dashboard state
  const [dashboardData, setDashboardData] = useState({
    totalSavings: 0,
    totalLoans: 0,
    activeLoans: 0,
    pendingMedicineRequests: 0,
    walletBalance: 0,
    savingsGoals: 0,
    recentActivities: [],
    savingsGoalsList: [],
    loansList: [],
    medicineRequestsList: []
  });
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && !loading) {
      fetchDashboardData();
    }
  }, [user, loading]);

  const fetchDashboardData = async () => {
    try {
      setIsDashboardLoading(true);

      // Fetch base data first (excluding repayments join)
      const [
        { data: loans },
        { data: savingsGoals },
        { data: savingsTransactions },
        { data: medicineRequests }
      ] = await Promise.all([
        supabase.from('loans').select('*').eq('user_id', user.id),
        supabase.from('savings_goals').select('*').eq('user_id', user.id),
        supabase.from('savings_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('medicine_requests').select('*').eq('user_id', user.id)
      ]);

      // Fetch repayments using loan_id IN user loan ids to avoid FK join dependency
      let loanRepayments: any[] = [];
      const loanIds = (loans || []).map((l: any) => l.id);
      if (loanIds.length > 0) {
        const { data } = await supabase
          .from('loan_repayments')
          .select('*')
          .in('loan_id', loanIds)
          .order('payment_date', { ascending: false });
        loanRepayments = data || [];
      }

      // Calculate metrics
      const totalSavings = savingsGoals?.reduce((sum, goal) => sum + goal.current_amount, 0) || 0;
      const activeLoans = loans?.filter(loan => loan.status === 'active').length || 0;
      const totalLoansAmount = loans?.reduce((sum, loan: any) => sum + (loan.total_payable ?? 0), 0) || 0;
      const pendingMedicineRequests = medicineRequests?.filter(req => req.status === 'pending').length || 0;
      
      // Calculate wallet balance (simplified)
      const walletBalance = totalSavings - totalLoansAmount;

      // Create recent activities
      const activities = [];
      
      // Add loan activities
      loans?.slice(0, 3).forEach(loan => {
        activities.push({
          id: loan.id,
          type: 'loan',
          title: 'Loan Application',
          description: `${loan.purpose} - UGX ${loan.amount.toLocaleString()}`,
          amount: loan.amount,
          status: loan.status,
          date: loan.created_at
        });
      });

      // Add savings activities
      savingsTransactions?.slice(0, 3).forEach(transaction => {
        activities.push({
          id: transaction.id,
          type: 'savings',
          title: 'Savings Transaction',
          description: transaction.description,
          amount: transaction.amount,
          status: 'completed',
          date: transaction.created_at
        });
      });

      // Add medicine request activities
      medicineRequests?.slice(0, 2).forEach(request => {
        activities.push({
          id: request.id,
          type: 'medicine',
          title: 'Medicine Request',
          description: `${request.generic_name} - ${request.reason}`,
          status: request.status,
          date: request.created_at
        });
      });

      // Sort activities by date
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setDashboardData({
        totalSavings,
        totalLoans: totalLoansAmount,
        activeLoans,
        pendingMedicineRequests,
        walletBalance,
        savingsGoals: savingsGoals?.length || 0,
        recentActivities: activities,
        savingsGoalsList: savingsGoals || [],
        loansList: loans || [],
        medicineRequestsList: medicineRequests || []
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsDashboardLoading(false);
    }
  };

  if (loading || isDashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">MedClinic Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user.email}
            </span>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user.email?.split('@')[0]}</h2>
          <p className="text-muted-foreground">
            Here's an overview of your medical financial activities
          </p>
        </div>

        {/* Metrics Cards */}
        <MetricsCards
          totalSavings={dashboardData.totalSavings}
          totalLoans={dashboardData.totalLoans}
          activeLoans={dashboardData.activeLoans}
          pendingMedicineRequests={dashboardData.pendingMedicineRequests}
          walletBalance={dashboardData.walletBalance}
          savingsGoals={dashboardData.savingsGoals}
        />

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Actions, Health Score & Notifications */}
          <div className="space-y-6">
            <QuickActions />
            <FinancialHealthScore 
              data={{
                totalSavings: dashboardData.totalSavings,
                totalLoans: dashboardData.totalLoans,
                activeLoans: dashboardData.activeLoans,
                savingsGoals: dashboardData.savingsGoals,
                pendingMedicineRequests: dashboardData.pendingMedicineRequests,
                walletBalance: dashboardData.walletBalance
              }}
            />
            <NotificationCenter 
              data={{
                totalSavings: dashboardData.totalSavings,
                totalLoans: dashboardData.totalLoans,
                activeLoans: dashboardData.activeLoans,
                savingsGoalsList: dashboardData.savingsGoalsList,
                loansList: dashboardData.loansList,
                medicineRequestsList: dashboardData.medicineRequestsList,
                walletBalance: dashboardData.walletBalance
              }}
            />
          </div>

          {/* Center Column - Savings, Medicine Requests & Goal Tracking */}
          <div className="space-y-6">
            <SavingsOverview 
              goals={dashboardData.savingsGoalsList} 
              totalSavings={dashboardData.totalSavings}
            />
            <MedicineRequestStatus requests={dashboardData.medicineRequestsList} />
            <GoalAchievementTracking 
              data={{
                savingsGoalsList: dashboardData.savingsGoalsList,
                totalSavings: dashboardData.totalSavings
              }}
            />
          </div>

          {/* Right Column - Loans, Analytics, Insights & Recent Activity */}
          <div className="space-y-6">
            <LoanOverview loans={dashboardData.loansList} />
            <SpendingAnalytics 
              data={{
                savingsGoalsList: dashboardData.savingsGoalsList,
                loansList: dashboardData.loansList,
                medicineRequestsList: dashboardData.medicineRequestsList,
                recentActivities: dashboardData.recentActivities
              }}
            />
            <FinancialInsights 
              data={{
                totalSavings: dashboardData.totalSavings,
                totalLoans: dashboardData.totalLoans,
                savingsGoalsList: dashboardData.savingsGoalsList,
                recentActivities: dashboardData.recentActivities,
                medicineRequestsList: dashboardData.medicineRequestsList
              }}
            />
            <RecentActivity activities={dashboardData.recentActivities} />
          </div>
        </div>

        {/* Navigation Cards - Keep original for easy access */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold mb-6">All Services</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link to="/loans" className="block">
              <div className="p-6 border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="font-semibold mb-2">Loan Management</h3>
                <p className="text-sm text-muted-foreground">
                  Request and manage your clinic loans
                </p>
              </div>
            </Link>
            <Link to="/wallet" className="block">
              <div className="p-6 border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="font-semibold mb-2">Wallet & Transactions</h3>
                <p className="text-sm text-muted-foreground">
                  View your balance and transaction history
                </p>
              </div>
            </Link>
            <Link to="/savings" className="block">
              <div className="p-6 border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="font-semibold mb-2">Savings Account</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your savings and deposits
                </p>
              </div>
            </Link>
            <Link to="/medicine-requests" className="block">
              <div className="p-6 border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="font-semibold mb-2">Medicine Requests</h3>
                <p className="text-sm text-muted-foreground">
                  Request community medicine support
                </p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
