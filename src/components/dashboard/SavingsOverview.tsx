import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp } from "lucide-react";

interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  category: string;
  priority: string;
  target_date?: string;
  is_completed: boolean;
}

interface SavingsOverviewProps {
  goals: SavingsGoal[];
  totalSavings: number;
}

export const SavingsOverview = ({ goals, totalSavings }: SavingsOverviewProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const safeGoals = Array.isArray(goals) ? goals : [];
  const completedGoals = safeGoals.filter(goal => goal.is_completed).length;
  const totalGoals = safeGoals.length;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Savings Goals
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Goals Summary */}
        <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm font-medium">Total Progress</p>
            <p className="text-2xl font-bold text-primary">UGX {(totalSavings ?? 0).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Goals Completed</p>
            <p className="text-lg font-semibold">{completedGoals}/{totalGoals}</p>
          </div>
        </div>

        {/* Individual Goals */}
        {safeGoals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No savings goals yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {safeGoals.slice(0, 3).map((goal) => {
              const current = Number(goal.current_amount ?? 0);
              const target = Number(goal.target_amount ?? 0);
              const progress = target > 0 ? (current / target) * 100 : 0;
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">{goal.name}</h4>
                      <Badge className={`text-xs ${getPriorityColor(goal.priority)}`}>
                        {goal.priority}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>UGX {Number(goal.current_amount ?? 0).toLocaleString()}</span>
                    <span>UGX {Number(goal.target_amount ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
            {safeGoals.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                +{safeGoals.length - 3} more goals
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};