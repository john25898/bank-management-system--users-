import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface Loan {
  id: string;
  amount: number;
  outstanding_balance: number;
  total_paid: number;
  monthly_payment: number;
  interest_rate: number;
  term_months: number;
  status: string;
  purpose: string;
  maturity_date?: string;
  disbursement_date?: string;
}

interface LoanOverviewProps {
  loans: Loan[];
}

export const LoanOverview = ({ loans }: LoanOverviewProps) => {
  const safeLoans = Array.isArray(loans) ? loans : [];
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Calendar className="h-4 w-4 text-yellow-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-500" />;
    }
  };

  const calculateProgress = (loan: Loan) => {
    const paid = Number(loan.total_paid ?? 0);
    const amount = Number(loan.amount ?? 0);
    return amount > 0 ? (paid / amount) * 100 : 0;
  };

  const getDaysUntilDue = (maturityDate?: string) => {
    if (!maturityDate) return null;
    const today = new Date();
    const dueDate = new Date(maturityDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const activeLoans = safeLoans.filter(loan => loan.status === 'active');

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Loan Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {safeLoans.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground mb-4">No loans yet</p>
            <Link to="/loans">
              <Button variant="outline">Apply for Loan</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Active Loans</p>
                <p className="text-xl font-bold">{activeLoans.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Outstanding</p>
                <p className="text-xl font-bold text-primary">
                  UGX {activeLoans.reduce((sum, loan) => sum + loan.outstanding_balance, 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Individual Loans */}
            <div className="space-y-4">
              {safeLoans.slice(0, 3).map((loan) => {
                const progress = calculateProgress(loan);
                const daysUntilDue = getDaysUntilDue(loan.maturity_date);
                
                return (
                  <div key={loan.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(loan.status)}
                        <div>
                          <h4 className="font-medium">{loan.purpose}</h4>
                          <p className="text-sm text-muted-foreground">
                            UGX {Number(loan.amount ?? 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(loan.status)}`}>
                        {loan.status}
                      </Badge>
                    </div>

                    {/* Payment Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Repayment Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Paid: UGX {Number(loan.total_paid ?? 0).toLocaleString()}</span>
                        <span>Remaining: UGX {Number(loan.outstanding_balance ?? 0).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Monthly Payment</p>
                        <p className="font-medium">UGX {Number(loan.monthly_payment ?? 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Interest Rate</p>
                        <p className="font-medium">{loan.interest_rate}% p.a.</p>
                      </div>
                    </div>

                    {/* Due Date Alert */}
                    {daysUntilDue !== null && loan.status === 'active' && (
                      <div className={`flex items-center gap-2 p-2 rounded text-sm ${
                        daysUntilDue < 30 ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        <Calendar className="h-4 w-4" />
                        {daysUntilDue < 0 ? (
                          <span>Overdue by {Math.abs(daysUntilDue)} days</span>
                        ) : daysUntilDue < 30 ? (
                          <span>Due in {daysUntilDue} days</span>
                        ) : (
                          <span>Next payment due in {daysUntilDue} days</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {safeLoans.length > 3 && (
                <div className="text-center pt-2">
                  <Link to="/loans">
                    <Button variant="outline" size="sm">
                      View All Loans ({safeLoans.length})
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};