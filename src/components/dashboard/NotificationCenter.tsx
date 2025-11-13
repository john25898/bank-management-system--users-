import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  AlertTriangle, 
  Calendar, 
  CreditCard, 
  Target,
  Clock,
  TrendingUp,
  CheckCircle2,
  X
} from "lucide-react";
import { useState } from "react";

interface NotificationData {
  totalSavings: number;
  totalLoans: number;
  activeLoans: number;
  savingsGoalsList: any[];
  loansList: any[];
  medicineRequestsList: any[];
  walletBalance: number;
}

interface NotificationCenterProps {
  data: NotificationData;
}

interface Notification {
  id: string;
  type: 'alert' | 'reminder' | 'achievement' | 'warning';
  title: string;
  message: string;
  action?: string;
  actionUrl?: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
}

export const NotificationCenter = ({ data }: NotificationCenterProps) => {
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);

  const generateNotifications = (): Notification[] => {
    const notifications: Notification[] = [];
    const now = new Date();

    // Loan due date alerts
    data.loansList.forEach(loan => {
      if (loan.status === 'active' && loan.maturity_date) {
        const dueDate = new Date(loan.maturity_date);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue <= 7 && daysUntilDue > 0) {
          notifications.push({
            id: `loan-due-${loan.id}`,
            type: 'alert',
            title: 'Loan Payment Due Soon',
            message: `Your ${loan.purpose} loan payment is due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`,
            action: 'Make Payment',
            actionUrl: '/loans',
            priority: daysUntilDue <= 3 ? 'high' : 'medium',
            timestamp: now
          });
        }
      }
    });

    // Savings goal deadlines
    data.savingsGoalsList.forEach(goal => {
      if (!goal.is_completed && goal.target_date) {
        const targetDate = new Date(goal.target_date);
        const daysUntilTarget = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilTarget <= 30 && daysUntilTarget > 0) {
          const progress = (goal.current_amount / goal.target_amount) * 100;
          notifications.push({
            id: `goal-deadline-${goal.id}`,
            type: 'reminder',
            title: 'Savings Goal Deadline Approaching',
            message: `"${goal.name}" target date is in ${daysUntilTarget} days (${Math.round(progress)}% complete)`,
            action: 'Add Funds',
            actionUrl: '/savings',
            priority: daysUntilTarget <= 7 ? 'high' : 'medium',
            timestamp: now
          });
        }
      }
    });

    // Achievement notifications
    data.savingsGoalsList.forEach(goal => {
      const progress = (goal.current_amount / goal.target_amount) * 100;
      if (progress >= 80 && !goal.is_completed) {
        notifications.push({
          id: `goal-almost-complete-${goal.id}`,
          type: 'achievement',
          title: 'Goal Almost Complete!',
          message: `"${goal.name}" is ${Math.round(progress)}% complete. You're almost there!`,
          action: 'Complete Goal',
          actionUrl: '/savings',
          priority: 'medium',
          timestamp: now
        });
      }
    });

    // Low balance warning
    if (data.walletBalance < 50000 && data.walletBalance > 0) {
      notifications.push({
        id: 'low-balance',
        type: 'warning',
        title: 'Low Available Balance',
        message: `Your available balance is UGX ${data.walletBalance.toLocaleString()}. Consider adding funds for emergencies.`,
        action: 'Add Funds',
        actionUrl: '/wallet',
        priority: 'medium',
        timestamp: now
      });
    }

    // Urgent medicine requests
    const urgentMedicine = data.medicineRequestsList.filter(req => 
      req.urgency_level === 'Emergency' && req.status === 'pending'
    );
    
    urgentMedicine.forEach(request => {
      notifications.push({
        id: `urgent-medicine-${request.id}`,
        type: 'alert',
        title: 'Emergency Medicine Request',
        message: `Emergency request for ${request.generic_name} needs immediate attention`,
        action: 'View Request',
        actionUrl: '/medicine-requests',
        priority: 'high',
        timestamp: new Date(request.created_at)
      });
    });

    // No activity reminder
    const recentActivity = data.savingsGoalsList.some(goal => {
      const updatedDate = new Date(goal.updated_at);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return updatedDate > weekAgo;
    });

    if (!recentActivity && data.savingsGoalsList.length > 0) {
      notifications.push({
        id: 'no-recent-activity',
        type: 'reminder',
        title: 'Keep Building Your Savings',
        message: 'You haven\'t made any savings contributions this week. Stay on track with your goals!',
        action: 'Make Deposit',
        actionUrl: '/savings',
        priority: 'low',
        timestamp: now
      });
    }

    // Sort by priority and timestamp
    return notifications
      .filter(notification => !dismissedNotifications.includes(notification.id))
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.timestamp.getTime() - a.timestamp.getTime();
      })
      .slice(0, 5); // Show max 5 notifications
  };

  const notifications = generateNotifications();

  const dismissNotification = (notificationId: string) => {
    setDismissedNotifications(prev => [...prev, notificationId]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert': return AlertTriangle;
      case 'reminder': return Clock;
      case 'achievement': return TrendingUp;
      case 'warning': return AlertTriangle;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') return 'border-red-200 bg-red-50';
    if (type === 'achievement') return 'border-green-200 bg-green-50';
    if (type === 'warning') return 'border-yellow-200 bg-yellow-50';
    return 'border-blue-200 bg-blue-50';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive" className="text-xs">High</Badge>;
      case 'medium': return <Badge variant="secondary" className="text-xs">Medium</Badge>;
      case 'low': return <Badge variant="outline" className="text-xs">Low</Badge>;
      default: return null;
    }
  };

  if (notifications.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-muted-foreground">All caught up!</p>
            <p className="text-sm text-muted-foreground">No new notifications at this time.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </div>
          <Badge variant="secondary" className="text-xs">
            {notifications.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notifications.map((notification) => {
            const IconComponent = getNotificationIcon(notification.type);
            return (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border ${getNotificationColor(notification.type, notification.priority)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1">
                    <IconComponent className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{notification.title}</p>
                        {getPriorityBadge(notification.priority)}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      {notification.action && notification.actionUrl && (
                        <Button size="sm" variant="outline" className="text-xs h-6">
                          {notification.action}
                        </Button>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dismissNotification(notification.id)}
                    className="h-6 w-6 p-0 hover:bg-background/80"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};