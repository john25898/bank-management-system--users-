import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, CreditCard, Pill } from "lucide-react";

interface MetricsCardsProps {
  totalSavings: number;
  totalLoans: number;
  activeLoans: number;
  pendingMedicineRequests: number;
  walletBalance: number;
  savingsGoals: number;
}

export const MetricsCards = ({
  totalSavings,
  totalLoans,
  activeLoans,
  pendingMedicineRequests,
  walletBalance,
  savingsGoals
}: MetricsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Total Savings */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">UGX {totalSavings.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {savingsGoals} active goal{savingsGoals !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Active Loans */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{activeLoans}</div>
          <p className="text-xs text-muted-foreground">
            UGX {totalLoans.toLocaleString()} total outstanding
          </p>
        </CardContent>
      </Card>

      {/* Wallet Balance */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">UGX {walletBalance.toLocaleString()}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {walletBalance >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
            )}
            Available funds
          </div>
        </CardContent>
      </Card>

      {/* Medicine Requests */}
      <Card className="border-0 shadow-lg md:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Medicine Requests</CardTitle>
          <Pill className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{pendingMedicineRequests}</div>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="secondary" className="text-xs">Pending</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};