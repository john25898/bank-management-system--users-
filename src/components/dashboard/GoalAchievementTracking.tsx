import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  Trophy, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Clock,
  Star,
  Award,
  Zap
} from "lucide-react";

interface GoalData {
  savingsGoalsList: any[];
  totalSavings: number;
}

interface GoalAchievementTrackingProps {
  data: GoalData;
}

export const GoalAchievementTracking = ({ data }: GoalAchievementTrackingProps) => {
  const goals = Array.isArray(data?.savingsGoalsList) ? data.savingsGoalsList : [];
  
  // Calculate achievement statistics
  const completedGoals = goals.filter(goal => goal.is_completed);
  const activeGoals = goals.filter(goal => !goal.is_completed);
  const nearCompletionGoals = activeGoals.filter(goal => 
    (goal.current_amount / goal.target_amount) >= 0.8
  );
  const overdueGoals = activeGoals.filter(goal => {
    if (!goal.target_date) return false;
    return new Date(goal.target_date) < new Date();
  });

  // Calculate overall progress
  const totalTargetAmount = goals.reduce((sum, goal) => sum + Number(goal?.target_amount ?? 0), 0);
  const totalCurrentAmount = goals.reduce((sum, goal) => sum + Number(goal?.current_amount ?? 0), 0);
  const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  // Get achievement milestones
  const getMilestones = () => {
    const milestones = [];
    
    // First goal created
    if (goals.length > 0) {
      milestones.push({
        id: 'first-goal',
        title: 'Goal Setter',
        description: 'Created your first savings goal',
        achieved: true,
        icon: Target,
        date: goals[0]?.created_at
      });
    }

    // First goal completed
    if (completedGoals.length > 0) {
      milestones.push({
        id: 'first-completion',
        title: 'Goal Achiever',
        description: 'Completed your first savings goal',
        achieved: true,
        icon: Trophy,
        date: completedGoals[0]?.updated_at
      });
    }

    // Multiple goals completed
    if (completedGoals.length >= 3) {
      milestones.push({
        id: 'multiple-goals',
        title: 'Serial Achiever',
        description: 'Completed 3 or more goals',
        achieved: true,
        icon: Award,
        date: completedGoals[2]?.updated_at
      });
    }

    // High saver milestone
    if (Number(data?.totalSavings ?? 0) >= 1000000) {
      milestones.push({
        id: 'high-saver',
        title: 'Millionaire Saver',
        description: 'Reached UGX 1,000,000 in savings',
        achieved: true,
        icon: Star,
        date: new Date().toISOString()
      });
    }

    // Consistent saver (goals with regular contributions)
    const consistentGoals = goals.filter(goal => goal.current_amount > 0);
    if (consistentGoals.length >= 5) {
      milestones.push({
        id: 'consistent',
        title: 'Consistent Saver',
        description: 'Maintained 5+ active savings goals',
        achieved: true,
        icon: Zap,
        date: new Date().toISOString()
      });
    }

    return milestones.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const milestones = getMilestones();

  // Get priority goals for quick access
  const getPriorityGoals = () => {
    return activeGoals
      .sort((a, b) => {
        // Sort by priority (high first) then by progress
        if (a.priority !== b.priority) {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        const aTarget = Number(a?.target_amount ?? 0);
        const bTarget = Number(b?.target_amount ?? 0);
        const aProg = aTarget > 0 ? Number(a?.current_amount ?? 0) / aTarget : 0;
        const bProg = bTarget > 0 ? Number(b?.current_amount ?? 0) / bTarget : 0;
        return bProg - aProg;
      })
      .slice(0, 3);
  };

  const priorityGoals = getPriorityGoals();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getDaysRemaining = (targetDate: string) => {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (goals.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Goal Achievement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No savings goals yet</p>
            <p className="text-sm text-muted-foreground">Create your first goal to start tracking achievements!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Goal Achievement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Achievement Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-lg font-bold text-green-800">{completedGoals.length}</p>
            <p className="text-xs text-green-600">Completed</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <p className="text-lg font-bold text-blue-800">{activeGoals.length}</p>
            <p className="text-xs text-blue-600">Active</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
            <p className="text-lg font-bold text-yellow-800">{Math.round(overallProgress)}%</p>
            <p className="text-xs text-yellow-600">Overall Progress</p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Total Progress</span>
            <span className="text-muted-foreground">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>UGX {Number(totalCurrentAmount ?? 0).toLocaleString()}</span>
            <span>UGX {Number(totalTargetAmount ?? 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Priority Goals */}
        {priorityGoals.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Priority Goals</h4>
            <div className="space-y-3">
              {priorityGoals.map((goal) => {
                const current = Number(goal?.current_amount ?? 0);
                const target = Number(goal?.target_amount ?? 0);
                const progress = target > 0 ? (current / target) * 100 : 0;
                const daysRemaining = getDaysRemaining(goal.target_date);
                
                return (
                  <div key={goal.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-sm">{goal.name}</h5>
                        <Badge className={`text-xs ${getPriorityColor(goal.priority)}`}>
                          {goal.priority}
                        </Badge>
                      </div>
                      <span className="text-sm font-medium">{Math.round(progress)}%</span>
                    </div>

                    <Progress value={progress} className="h-2" />

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>UGX {Number(goal?.current_amount ?? 0).toLocaleString()}</span>
                      <span>UGX {Number(goal?.target_amount ?? 0).toLocaleString()}</span>
                    </div>

                    {daysRemaining !== null && (
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        <span className={daysRemaining < 0 ? 'text-red-600' : 'text-muted-foreground'}>
                          {daysRemaining < 0 
                            ? `${Math.abs(daysRemaining)} days overdue`
                            : `${daysRemaining} days remaining`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {(nearCompletionGoals.length > 0 || overdueGoals.length > 0) && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Quick Actions</h4>
            <div className="space-y-2">
              {nearCompletionGoals.length > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800 text-sm">Almost There!</span>
                  </div>
                  <p className="text-sm text-green-700">
                    {nearCompletionGoals.length} goal{nearCompletionGoals.length > 1 ? 's are' : ' is'} 80%+ complete
                  </p>
                </div>
              )}
              
              {overdueGoals.length > 0 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-orange-800 text-sm">Needs Attention</span>
                  </div>
                  <p className="text-sm text-orange-700">
                    {overdueGoals.length} goal{overdueGoals.length > 1 ? 's have' : ' has'} passed the target date
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Milestones */}
        {milestones.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Recent Achievements</h4>
            <div className="space-y-2">
              {milestones.slice(0, 3).map((milestone) => {
                const IconComponent = milestone.icon;
                return (
                  <div key={milestone.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                    <div className="p-1.5 bg-primary/10 rounded-full">
                      <IconComponent className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{milestone.title}</p>
                      <p className="text-xs text-muted-foreground">{milestone.description}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      ✓
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};