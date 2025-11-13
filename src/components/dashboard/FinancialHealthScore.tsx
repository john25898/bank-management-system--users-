import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Heart, Target, Shield } from "lucide-react";

interface FinancialData {
  totalSavings: number;
  totalLoans: number;
  activeLoans: number;
  savingsGoals: number;
  pendingMedicineRequests: number;
  walletBalance: number;
}

interface FinancialHealthScoreProps {
  data: FinancialData;
}

export const FinancialHealthScore = ({ data }: FinancialHealthScoreProps) => {
  // Calculate individual scores (0-100)
  const calculateSavingsScore = () => {
    if (data.totalSavings === 0) return 0;
    if (data.totalSavings >= 1000000) return 100; // 1M UGX = excellent
    if (data.totalSavings >= 500000) return 80;   // 500K UGX = good
    if (data.totalSavings >= 100000) return 60;   // 100K UGX = fair
    return Math.max(20, (data.totalSavings / 100000) * 60);
  };

  const calculateDebtScore = () => {
    if (data.totalLoans === 0) return 100; // No debt is excellent
    if (data.totalSavings === 0) return 20; // Debt with no savings is poor
    
    const debtToSavingsRatio = data.totalLoans / data.totalSavings;
    if (debtToSavingsRatio <= 0.3) return 90;  // Debt is 30% or less of savings
    if (debtToSavingsRatio <= 0.5) return 70;  // Debt is 50% or less of savings
    if (debtToSavingsRatio <= 1.0) return 50;  // Debt equals savings
    return Math.max(10, 50 - (debtToSavingsRatio - 1) * 30);
  };

  const calculateGoalsScore = () => {
    if (data.savingsGoals === 0) return 30; // No goals is not great
    if (data.savingsGoals >= 3) return 100; // 3+ goals is excellent
    if (data.savingsGoals === 2) return 80;  // 2 goals is good
    return 60; // 1 goal is fair
  };

  const calculateEmergencyScore = () => {
    if (data.walletBalance <= 0) return 10;
    if (data.walletBalance >= 200000) return 100; // 200K emergency fund
    if (data.walletBalance >= 100000) return 80;  // 100K emergency fund
    if (data.walletBalance >= 50000) return 60;   // 50K emergency fund
    return Math.max(20, (data.walletBalance / 50000) * 60);
  };

  // Individual scores
  const savingsScore = calculateSavingsScore();
  const debtScore = calculateDebtScore();
  const goalsScore = calculateGoalsScore();
  const emergencyScore = calculateEmergencyScore();

  // Overall health score (weighted average)
  const overallScore = Math.round(
    (savingsScore * 0.3 + debtScore * 0.3 + goalsScore * 0.2 + emergencyScore * 0.2)
  );

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "bg-green-100 text-green-800", icon: CheckCircle };
    if (score >= 60) return { label: "Good", color: "bg-blue-100 text-blue-800", icon: TrendingUp };
    if (score >= 40) return { label: "Fair", color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle };
    return { label: "Needs Improvement", color: "bg-red-100 text-red-800", icon: TrendingDown };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const healthStatus = getHealthStatus(overallScore);
  const StatusIcon = healthStatus.icon;

  const getRecommendations = () => {
    const recommendations = [];
    
    if (savingsScore < 60) {
      recommendations.push("Increase your savings target to build a stronger financial foundation");
    }
    if (debtScore < 60) {
      recommendations.push("Focus on reducing outstanding loan balances");
    }
    if (goalsScore < 60) {
      recommendations.push("Set more specific savings goals to improve financial planning");
    }
    if (emergencyScore < 60) {
      recommendations.push("Build an emergency fund for unexpected medical expenses");
    }
    if (data.activeLoans > 2) {
      recommendations.push("Consider consolidating multiple loans for better management");
    }
    if (data.pendingMedicineRequests > 3) {
      recommendations.push("Review pending medicine requests to avoid accumulating costs");
    }

    return recommendations.slice(0, 3); // Show top 3 recommendations
  };

  const recommendations = getRecommendations();

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Financial Health Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 mx-auto">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${overallScore}, 100`}
                  className={getScoreColor(overallScore)}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                  {overallScore}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <StatusIcon className="h-5 w-5" />
            <Badge className={`${healthStatus.color} text-sm`}>
              {healthStatus.label}
            </Badge>
          </div>
        </div>

        {/* Individual Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Savings</span>
              <span className={`text-sm font-bold ${getScoreColor(savingsScore)}`}>
                {Math.round(savingsScore)}%
              </span>
            </div>
            <Progress value={savingsScore} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Debt Management</span>
              <span className={`text-sm font-bold ${getScoreColor(debtScore)}`}>
                {Math.round(debtScore)}%
              </span>
            </div>
            <Progress value={debtScore} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Goal Setting</span>
              <span className={`text-sm font-bold ${getScoreColor(goalsScore)}`}>
                {Math.round(goalsScore)}%
              </span>
            </div>
            <Progress value={goalsScore} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Emergency Fund</span>
              <span className={`text-sm font-bold ${getScoreColor(emergencyScore)}`}>
                {Math.round(emergencyScore)}%
              </span>
            </div>
            <Progress value={emergencyScore} className="h-2" />
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg text-sm">
          <div className="text-center">
            <p className="text-muted-foreground">Savings Rate</p>
            <p className="font-bold">
              {data.totalLoans > 0 ? Math.round((data.totalSavings / (data.totalSavings + data.totalLoans)) * 100) : 100}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Active Goals</p>
            <p className="font-bold">{data.savingsGoals}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Net Worth</p>
            <p className="font-bold text-primary">
              UGX {(data.totalSavings - data.totalLoans).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Recommendations</h4>
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p className="text-muted-foreground">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};