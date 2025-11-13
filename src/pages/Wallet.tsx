import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Wallet as WalletIcon, TrendingUp, TrendingDown } from "lucide-react";

interface Transaction {
  id: string;
  type: "loan_disbursement" | "loan_payment" | "savings_deposit" | "savings_withdrawal";
  amount: number;
  description: string;
  date: string;
}

const Wallet = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  // Realtime updates: subscribe to changes and refetch wallet data
  useEffect(() => {
    if (!user) return;

    let refetchTimer: number | undefined;
    const triggerRefetch = () => {
      if (refetchTimer) window.clearTimeout(refetchTimer);
      refetchTimer = window.setTimeout(() => {
        fetchWalletData();
      }, 300);
    };

    const channel = supabase
      .channel('wallet-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'savings_transactions', filter: `user_id=eq.${user.id}` },
        () => triggerRefetch()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'loan_repayments' },
        () => triggerRefetch()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'loans', filter: `user_id=eq.${user.id}` },
        () => triggerRefetch()
      )
      .subscribe();

    return () => {
      if (refetchTimer) window.clearTimeout(refetchTimer);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all user's financial data
      // Fetch loans first to derive repayment list
      const [
        { data: savingsData, error: savingsError },
        { data: loansData, error: loansError },
        { data: savingsTransactions, error: transactionsError }
      ] = await Promise.all([
        supabase.from('savings_goals').select('*').eq('user_id', user.id),
        supabase.from('loans').select('*').eq('user_id', user.id),
        supabase.from('savings_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      // Fetch repayments using loan_id IN (<user loan ids>) to avoid join dependency
      let loanRepayments: any[] | null = [];
      let repaymentsError: any = null;
      const loanIds = (loansData || []).map((l: any) => l.id);
      if (loanIds.length > 0) {
        const { data, error } = await supabase
          .from('loan_repayments')
          .select('*')
          .in('loan_id', loanIds)
          .order('payment_date', { ascending: false });
        loanRepayments = data;
        repaymentsError = error;
      }

      if (savingsError) throw savingsError;
      if (loansError) throw loansError;
      if (transactionsError) throw transactionsError;
      if (repaymentsError) throw repaymentsError;

      // Calculate available balance
      const totalSavings = savingsData?.reduce((sum, goal) => sum + goal.current_amount, 0) || 0;
      const totalLoansOwed = loansData?.reduce((sum, loan: any) => sum + (loan.total_payable ?? 0), 0) || 0;
      const availableBalance = Math.max(0, totalSavings - totalLoansOwed);

      // Combine all transactions for history
      const allTransactions: Transaction[] = [];

      // Add savings transactions
      savingsTransactions?.forEach((transaction) => {
        allTransactions.push({
          id: transaction.id,
          type: transaction.transaction_type === 'deposit' ? 'savings_deposit' : 'savings_withdrawal',
          amount: transaction.amount,
          description: transaction.description,
          date: transaction.created_at,
        });
      });

      // Add loan repayment transactions
      loanRepayments?.forEach((repayment) => {
        allTransactions.push({
          id: repayment.id,
          type: 'loan_payment',
          amount: repayment.amount,
          description: `Loan repayment - Payment #${repayment.reference_number}`,
          date: repayment.payment_date,
        });
      });

      // Add loan disbursements
      loansData?.filter(loan => loan.status === 'disbursed' || loan.status === 'active')
        .forEach((loan) => {
          allTransactions.push({
            id: `loan-${loan.id}`,
            type: 'loan_disbursement',
            amount: loan.amount,
            description: `Loan disbursed - ${loan.purpose}`,
            date: loan.created_at,
          });
        });

      // Sort transactions by date (newest first)
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setBalance(availableBalance);
      setTransactions(allTransactions.slice(0, 20)); // Show last 20 transactions
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch wallet data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "loan_disbursement":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "loan_payment":
        return <TrendingDown className="h-4 w-4 text-blue-500" />;
      case "savings_deposit":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "savings_withdrawal":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <WalletIcon className="h-4 w-4" />;
    }
  };

  const getTransactionSign = (type: string) => {
    switch (type) {
      case "loan_disbursement":
      case "savings_withdrawal":
        return "+";
      case "loan_payment":
      case "savings_deposit":
        return "-";
      default:
        return "";
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "loan_disbursement":
      case "savings_withdrawal":
        return "text-green-600";
      case "loan_payment":
        return "text-blue-600";
      case "savings_deposit":
        return "text-green-600";
      default:
        return "text-foreground";
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/")} size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Wallet & Transactions</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Balance Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <WalletIcon className="h-5 w-5 mr-2" />
              Current Balance
            </CardTitle>
            <CardDescription>
              Your available funds after loans and savings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              UGX {balance.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Available balance after savings and loan obligations
            </p>
          </CardContent>
        </Card>

        {/* Transactions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Transaction History</h2>
          {transactions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No transactions yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="py-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString()} at{" "}
                            {new Date(transaction.date).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                          {getTransactionSign(transaction.type)}UGX {transaction.amount.toLocaleString()}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {transaction.type.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Wallet;