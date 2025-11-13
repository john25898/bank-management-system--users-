import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Target, 
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign
} from "lucide-react";

interface InsightData {
  totalSavings: number;
  totalLoans: number;
  savingsGoalsList: any[];
  recentActivities: any[];
  medicineRequestsList: any[];
}

interface FinancialInsightsProps {
  data: InsightData;
}

export const FinancialInsights = ({ data }: FinancialInsightsProps) => {
  const getMonthlyTrend = () => {
    const now = new Date();
    const thisMonth = data.recentActivities.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate.getMonth() === now.getMonth() && 
             activityDate.getFullYear() === now.getFullYear();
    });
    
    const savingsActivities = thisMonth.filter(a => a.type === 'savings');
    const loanActivities = thisMonth.filter(a => a.type === 'loan');
    
    return {
      savingsCount: savingsActivities.length,
      loansCount: loanActivities.length,
      totalSavingsActivity: savingsActivities.reduce((sum, a) => sum + (a.amount || 0), 0),
    };
  };

  const getGoalProgress = () => {
    const activeGoals = data.savingsGoalsList.filter(goal => !goal.is_completed);
    const completedGoals = data.savingsGoalsList.filter(goal => goal.is_completed);
    const nearCompleteGoals = activeGoals.filter(goal => 
      (goal.current_amount / goal.target_amount) >= 0.8
    );
    
    return {
      active: activeGoals.length,
      completed: completedGoals.length,
      nearComplete: nearCompleteGoals.length,
      averageProgress: activeGoals.length > 0 
        ? activeGoals.reduce((sum, goal) => sum + (goal.current_amount / goal.target_amount), 0) / activeGoals.length 
        : 0
    };
  };

  const getMedicineInsights = () => {
    const urgentRequests = data.medicineRequestsList.filter(req => 
      req.urgency_level === 'Urgent' || req.urgency_level === 'Emergency'
    );
    const thisWeekRequests = data.medicineRequestsList.filter(req => {
      const requestDate = new Date(req.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return requestDate >= weekAgo;
    });
    
    return {
      urgent: urgentRequests.length,
      thisWeek: thisWeekRequests.length,
      totalCost: data.medicineRequestsList.reduce((sum, req) => sum + (req.total_amount || 0), 0)
    };
  };

  const getUpcomingEvents = () => {
    const events = [];
    
    // Check for loan due dates
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    
    // Check for goal target dates approaching
    data.savingsGoalsList.forEach(goal => {
      if (goal.target_date && !goal.is_completed) {
        const targetDate = new Date(goal.target_date);
        if (targetDate <= nextMonth && targetDate > now) {
          const daysLeft = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          events.push({
            type: 'goal_deadline',
            title: `Goal deadline: ${goal.name}`,
            daysLeft,
            priority: daysLeft <= 7 ? 'high' : 'medium'
          });
        }
      }
    });

    return events.slice(0, 3);
  };

  const monthlyTrend = getMonthlyTrend();
  const goalProgress = getGoalProgress();
  const medicineInsights = getMedicineInsights();
  const upcomingEvents = getUpcomingEvents();

  const insights = [
    {
      title: "Monthly Activity",
      value: `${monthlyTrend.savingsCount} savings transactions`,
      trend: monthlyTrend.savingsCount > 0 ? "up" : "neutral",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Goal Achievement",
      value: `${Math.round(goalProgress.averageProgress * 100)}% average progress`,
      trend: goalProgress.averageProgress > 0.5 ? "up" : "down",
      icon: Target,
      color: goalProgress.averageProgress > 0.5 ? "text-green-600" : "text-yellow-600"
    },
    {
      title: "Medicine Costs",
      value: `UGX ${medicineInsights.totalCost.toLocaleString()} total`,
      trend: medicineInsights.urgent > 0 ? "down" : "neutral",
      icon: DollarSign,
      color: medicineInsights.urgent > 0 ? "text-red-600" : "text-blue-600"
    }
  ];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Financial Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Insights */}
        <div className="grid grid-cols-1 gap-4">
          {insights.map((insight, index) => {
            const IconComponent = insight.icon;
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <IconComponent className={`h-4 w-4 ${insight.color}`} />
                  <div>
                    <p className="text-sm font-medium">{insight.title}</p>
                    <p className="text-xs text-muted-foreground">{insight.value}</p>
                  </div>
                </div>
                {insight.trend === "up" && <TrendingUp className="h-4 w-4 text-green-600" />}
                {insight.trend === "down" && <TrendingDown className="h-4 w-4 text-red-600" />}
              </div>
            );
          })}
        </div>

        {/* Goal Progress Summary */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Goal Status</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center p-2 bg-green-50 rounded">
              <p className="font-bold text-green-700">{goalProgress.completed}</p>
              <p className="text-xs text-green-600">Completed</p>
            </div>
            <div className="text-center p-2 bg-yellow-50 rounded">
              <p className="font-bold text-yellow-700">{goalProgress.nearComplete}</p>
              <p className="text-xs text-yellow-600">Near Complete</p>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded">
              <p className="font-bold text-blue-700">{goalProgress.active}</p>
              <p className="text-xs text-blue-600">Active</p>
            </div>
          </div>
        </div>

        {/* Medicine Request Alerts */}
        {medicineInsights.urgent > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-800 text-sm">Urgent Medicine Requests</span>
            </div>
            <p className="text-sm text-red-700">
              You have {medicineInsights.urgent} urgent medicine request{medicineInsights.urgent > 1 ? 's' : ''} requiring immediate attention.
            </p>
          </div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming Events
            </h4>
            <div className="space-y-2">
              {upcomingEvents.map((event, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="flex-1">{event.title}</span>
                  <Badge 
                    variant={event.priority === 'high' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {event.daysLeft} days
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Wins */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Quick Wins</h4>
          <div className="space-y-2">
            {goalProgress.nearComplete > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5" />
                <p className="text-muted-foreground">
                  Complete {goalProgress.nearComplete} goal{goalProgress.nearComplete > 1 ? 's' : ''} that are 80% finished
                </p>
              </div>
            )}
            {data.totalSavings > data.totalLoans && (
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5" />
                <p className="text-muted-foreground">
                  Great job! Your savings exceed your loan debt
                </p>
              </div>
            )}
            {medicineInsights.thisWeek === 0 && (
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5" />
                <p className="text-muted-foreground">
                  No medicine requests this week - staying healthy!
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};