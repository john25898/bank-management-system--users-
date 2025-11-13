import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { TrendingUp, DollarSign, Calendar, PieChart as PieChartIcon } from "lucide-react";

interface SpendingData {
  savingsGoalsList: any[];
  loansList: any[];
  medicineRequestsList: any[];
  recentActivities: any[];
}

interface SpendingAnalyticsProps {
  data: SpendingData;
}

export const SpendingAnalytics = ({ data }: SpendingAnalyticsProps) => {
  // Process data for charts
  const getMonthlySpending = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const monthlyData = months.map(month => ({
      month,
      loans: 0,
      savings: 0,
      medicine: 0,
      total: 0
    }));

    // Process loan data
    data.loansList.forEach(loan => {
      const date = new Date(loan.created_at);
      if (date.getFullYear() === currentYear) {
        const monthIndex = date.getMonth();
        monthlyData[monthIndex].loans += loan.amount || 0;
      }
    });

    // Process savings data
    data.savingsGoalsList.forEach(goal => {
      const date = new Date(goal.created_at);
      if (date.getFullYear() === currentYear) {
        const monthIndex = date.getMonth();
        monthlyData[monthIndex].savings += goal.current_amount || 0;
      }
    });

    // Process medicine requests
    data.medicineRequestsList.forEach(request => {
      const date = new Date(request.created_at);
      if (date.getFullYear() === currentYear && request.total_amount) {
        const monthIndex = date.getMonth();
        monthlyData[monthIndex].medicine += request.total_amount || 0;
      }
    });

    // Calculate totals
    monthlyData.forEach(month => {
      month.total = month.loans + month.savings + month.medicine;
    });

    return monthlyData.slice(0, new Date().getMonth() + 1); // Only show months up to current
  };

  const getCategorySpending = () => {
    const totalLoans = data.loansList.reduce((sum, loan) => sum + (loan.amount || 0), 0);
    const totalSavings = data.savingsGoalsList.reduce((sum, goal) => sum + (goal.current_amount || 0), 0);
    const totalMedicine = data.medicineRequestsList.reduce((sum, req) => sum + (req.total_amount || 0), 0);

    return [
      { name: 'Medical Loans', value: totalLoans, color: '#8884d8' },
      { name: 'Savings', value: totalSavings, color: '#82ca9d' },
      { name: 'Medicine Requests', value: totalMedicine, color: '#ffc658' }
    ].filter(item => item.value > 0);
  };

  const getSpendingTrends = () => {
    const last6Months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en', { month: 'short' });
      
      // Calculate spending for this month
      const monthSpending = data.recentActivities
        .filter(activity => {
          const activityDate = new Date(activity.date);
          return activityDate.getMonth() === date.getMonth() && 
                 activityDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, activity) => {
          if (activity.type === 'loan' || activity.type === 'medicine') {
            return sum + (activity.amount || 0);
          }
          return sum;
        }, 0);

      last6Months.push({
        month: monthName,
        spending: monthSpending
      });
    }
    
    return last6Months;
  };

  const monthlySpending = getMonthlySpending();
  const categorySpending = getCategorySpending();
  const spendingTrends = getSpendingTrends();

  const totalSpending = monthlyData => monthlyData.reduce((sum, month) => sum + month.total, 0);
  const avgMonthlySpending = monthlySpending.length > 0 ? totalSpending(monthlySpending) / monthlySpending.length : 0;

  // Calculate spending insights
  const currentMonth = monthlySpending[monthlySpending.length - 1] || { total: 0 };
  const lastMonth = monthlySpending[monthlySpending.length - 2] || { total: 0 };
  const monthlyChange = lastMonth.total > 0 ? ((currentMonth.total - lastMonth.total) / lastMonth.total) * 100 : 0;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Spending Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <p className="text-lg font-bold text-primary">UGX {avgMonthlySpending.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Avg Monthly</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-lg font-bold text-primary">
              {monthlyChange >= 0 ? '+' : ''}{monthlyChange.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Month Change</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Calendar className="h-5 w-5 mx-auto mb-1 text-purple-600" />
            <p className="text-lg font-bold text-primary">{monthlySpending.length}</p>
            <p className="text-xs text-muted-foreground">Active Months</p>
          </div>
        </div>

        {/* Monthly Spending Chart */}
        {monthlySpending.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Monthly Breakdown</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySpending}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    formatter={(value) => [`UGX ${Number(value).toLocaleString()}`, '']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Bar dataKey="loans" fill="#8884d8" name="Loans" />
                  <Bar dataKey="savings" fill="#82ca9d" name="Savings" />
                  <Bar dataKey="medicine" fill="#ffc658" name="Medicine" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Category Distribution */}
        {categorySpending.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Spending by Category</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySpending}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categorySpending.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `UGX ${Number(value).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {categorySpending.map((category, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                    </div>
                    <span className="font-medium">UGX {category.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Spending Trend */}
        {spendingTrends.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">6-Month Trend</h4>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spendingTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(value) => [`UGX ${Number(value).toLocaleString()}`, 'Spending']} />
                  <Line 
                    type="monotone" 
                    dataKey="spending" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Insights</h4>
          <div className="space-y-2">
            {monthlyChange > 20 && (
              <div className="flex items-start gap-2 text-sm p-2 bg-orange-50 rounded border border-orange-200">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-2 flex-shrink-0" />
                <p className="text-orange-800">Spending increased by {monthlyChange.toFixed(1)}% this month. Consider reviewing your budget.</p>
              </div>
            )}
            {monthlyChange < -10 && (
              <div className="flex items-start gap-2 text-sm p-2 bg-green-50 rounded border border-green-200">
                <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                <p className="text-green-800">Great job! You reduced spending by {Math.abs(monthlyChange).toFixed(1)}% this month.</p>
              </div>
            )}
            {categorySpending.length > 0 && (
              <div className="flex items-start gap-2 text-sm p-2 bg-blue-50 rounded border border-blue-200">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                <p className="text-blue-800">
                  Your largest spending category is {categorySpending[0]?.name} at UGX {categorySpending[0]?.value.toLocaleString()}.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};