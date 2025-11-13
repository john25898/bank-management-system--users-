import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Target, Calendar, TrendingUp, CreditCard, Award, Wallet, PiggyBank, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SavingsGoal {
  id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  category: string;
  priority: 'low' | 'medium' | 'high';
  target_date?: string;
  is_completed: boolean;
  created_at: string;
}

interface SavingsPlan {
  id: string;
  name: string;
  target_amount: number;
  contribution_amount: number;
  contribution_frequency: 'daily' | 'weekly' | 'monthly';
  start_date: string;
  target_date?: string;
  is_active: boolean;
  auto_deduct: boolean;
  created_at: string;
}

interface AccountLevel {
  level_name: string;
  min_balance: number;
  interest_rate: number;
  loan_limit_multiplier: number;
  benefits: any;
}

interface SavingsTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  description: string;
  reference_number: string;
  balance_before: number;
  balance_after: number;
  savings_goal_id?: string;
  created_at: string;
}

const Savings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State management
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [savingsPlans, setSavingsPlans] = useState<SavingsPlan[]>([]);
  const [accountLevel, setAccountLevel] = useState<AccountLevel | null>(null);
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Form states
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Goal form
  const [goalName, setGoalName] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [goalCategory, setGoalCategory] = useState("medical");
  const [goalPriority, setGoalPriority] = useState<'low' | 'medium' | 'high'>("medium");
  const [goalTargetDate, setGoalTargetDate] = useState("");

  // Plan form
  const [planName, setPlanName] = useState("");
  const [planTargetAmount, setPlanTargetAmount] = useState("");
  const [planContributionAmount, setPlanContributionAmount] = useState("");
  const [planFrequency, setPlanFrequency] = useState<'daily' | 'weekly' | 'monthly'>("monthly");
  const [planTargetDate, setPlanTargetDate] = useState("");
  const [planAutoDeduct, setPlanAutoDeduct] = useState(false);

  // Deposit form
  const [depositAmount, setDepositAmount] = useState("");
  const [depositDescription, setDepositDescription] = useState("");
  const [depositGoalId, setDepositGoalId] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSavingsData();
    }
  }, [user]);

  const fetchSavingsData = async () => {
    setIsLoading(true);
    try {
      // Fetch savings goals
      const { data: goalsData, error: goalsError } = await supabase
        .from("savings_goals")
        .select("*")
        .order("created_at", { ascending: false });

      if (goalsError) throw goalsError;

      // Fetch savings plans
      const { data: plansData, error: plansError } = await supabase
        .from("savings_plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (plansError) throw plansError;

      // Fetch account level
      const { data: levelData, error: levelError } = await supabase
        .rpc("get_user_account_level", { user_uuid: user?.id });

      if (levelError) throw levelError;

      // Fetch recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("savings_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (transactionsError) throw transactionsError;

      // Type the data with proper casting to ensure type safety
      const typedGoalsData = (goalsData || []) as SavingsGoal[];
      const typedPlansData = (plansData || []) as SavingsPlan[];
      const typedTransactionsData = (transactionsData || []) as SavingsTransaction[];

      setSavingsGoals(typedGoalsData);
      setSavingsPlans(typedPlansData);
      setAccountLevel(levelData?.[0] || null);
      setTransactions(typedTransactionsData);

      // Calculate total savings
      const total = typedGoalsData.reduce((sum: number, goal: SavingsGoal) => sum + goal.current_amount, 0);
      setTotalSavings(total);

    } catch (error) {
      console.error("Error fetching savings data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch savings data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("savings_goals").insert({
        user_id: user.id,
        name: goalName,
        description: goalDescription || null,
        target_amount: parseFloat(goalTargetAmount),
        category: goalCategory,
        priority: goalPriority,
        target_date: goalTargetDate || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Savings goal created successfully",
      });

      // Reset form
      setGoalName("");
      setGoalDescription("");
      setGoalTargetAmount("");
      setGoalCategory("medical");
      setGoalPriority("medium");
      setGoalTargetDate("");
      setShowGoalForm(false);
      fetchSavingsData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create savings goal",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("savings_plans").insert({
        user_id: user.id,
        name: planName,
        target_amount: parseFloat(planTargetAmount),
        contribution_amount: parseFloat(planContributionAmount),
        contribution_frequency: planFrequency,
        target_date: planTargetDate || null,
        auto_deduct: planAutoDeduct,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Savings plan created successfully",
      });

      // Reset form
      setPlanName("");
      setPlanTargetAmount("");
      setPlanContributionAmount("");
      setPlanFrequency("monthly");
      setPlanTargetDate("");
      setPlanAutoDeduct(false);
      setShowPlanForm(false);
      fetchSavingsData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create savings plan",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMakeDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const depositAmountNum = parseFloat(depositAmount);
      let goalId = depositGoalId === "general" ? null : depositGoalId;
      let currentGoalAmount = 0;

      // If depositing to a specific goal, update the goal amount
      if (goalId) {
        const goal = savingsGoals.find(g => g.id === goalId);
        if (goal) {
          currentGoalAmount = goal.current_amount;
          const { error: goalError } = await supabase
            .from("savings_goals")
            .update({ 
              current_amount: currentGoalAmount + depositAmountNum,
              is_completed: (currentGoalAmount + depositAmountNum) >= goal.target_amount
            })
            .eq("id", goalId);

          if (goalError) throw goalError;
        }
      }

      // Create transaction record
      const { error: transactionError } = await supabase.from("savings_transactions").insert({
        user_id: user.id,
        savings_goal_id: goalId,
        transaction_type: "deposit",
        amount: depositAmountNum,
        description: depositDescription || `Deposit to ${goalId ? 'savings goal' : 'general savings'}`,
        balance_before: goalId ? currentGoalAmount : totalSavings,
        balance_after: goalId ? (currentGoalAmount + depositAmountNum) : (totalSavings + depositAmountNum),
      });

      if (transactionError) throw transactionError;

      toast({
        title: "Success",
        description: "Deposit made successfully",
      });

      // Reset form
      setDepositAmount("");
      setDepositDescription("");
      setDepositGoalId("");
      setShowDepositForm(false);
      fetchSavingsData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to make deposit",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getAccountLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "gold": return "bg-gradient-to-r from-yellow-400 to-yellow-600";
      case "silver": return "bg-gradient-to-r from-gray-300 to-gray-500";
      case "bronze": return "bg-gradient-to-r from-orange-400 to-orange-600";
      default: return "bg-gradient-to-r from-gray-400 to-gray-600";
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
            <h1 className="text-2xl font-bold">Medical Savings Account</h1>
          </div>
          <div className="flex space-x-2">
            <Dialog open={showDepositForm} onOpenChange={setShowDepositForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Make Deposit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Make a Deposit</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleMakeDeposit} className="space-y-4">
                  <div>
                    <Label htmlFor="depositAmount">Amount (UGX)</Label>
                    <Input
                      id="depositAmount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="depositGoal">Savings Goal (Optional)</Label>
                    <Select value={depositGoalId} onValueChange={setDepositGoalId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Savings</SelectItem>
                        {savingsGoals.map((goal) => (
                          <SelectItem key={goal.id} value={goal.id}>
                            {goal.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="depositDescription">Description (Optional)</Label>
                    <Textarea
                      id="depositDescription"
                      value={depositDescription}
                      onChange={(e) => setDepositDescription(e.target.value)}
                      placeholder="Add a note"
                      rows={3}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                      {isSubmitting ? "Processing..." : "Make Deposit"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowDepositForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Account Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Total Savings */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Wallet className="h-5 w-5 mr-2" />
                Total Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                UGX {totalSavings.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Across {savingsGoals.length} goal{savingsGoals.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          {/* Account Level */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Account Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`px-3 py-1 rounded-full text-white font-medium ${getAccountLevelColor(accountLevel?.level_name || 'Bronze')}`}>
                  {accountLevel?.level_name || 'Bronze'}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {accountLevel?.interest_rate ? `${(accountLevel.interest_rate * 100).toFixed(1)}% interest rate` : '3.0% interest rate'}
              </p>
            </CardContent>
          </Card>

          {/* Interest Earned */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Monthly Interest
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                UGX {((totalSavings * (accountLevel?.interest_rate || 0.03)) / 12).toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Estimated monthly earnings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="goals">Savings Goals</TabsTrigger>
            <TabsTrigger value="plans">Savings Plans</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Recent Goals */}
            <Card>
              <CardHeader>
                <CardTitle>Active Savings Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {savingsGoals.slice(0, 3).map((goal) => {
                  const progress = (goal.current_amount / goal.target_amount) * 100;
                  return (
                    <div key={goal.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{goal.name}</h4>
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        </div>
                        <Badge className={getPriorityColor(goal.priority)}>
                          {goal.priority}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>${goal.current_amount.toLocaleString()}</span>
                          <span>${goal.target_amount.toLocaleString()}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">{progress.toFixed(1)}% complete</p>
                      </div>
                    </div>
                  );
                })}
                {savingsGoals.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No savings goals yet. Create your first goal to start saving!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Savings Goals</h2>
              <Dialog open={showGoalForm} onOpenChange={setShowGoalForm}>
                <DialogTrigger asChild>
                  <Button>
                    <Target className="h-4 w-4 mr-2" />
                    Create Goal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Savings Goal</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateGoal} className="space-y-4">
                    <div>
                      <Label htmlFor="goalName">Goal Name</Label>
                      <Input
                        id="goalName"
                        value={goalName}
                        onChange={(e) => setGoalName(e.target.value)}
                        placeholder="e.g., Emergency Fund"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="goalDescription">Description</Label>
                      <Textarea
                        id="goalDescription"
                        value={goalDescription}
                        onChange={(e) => setGoalDescription(e.target.value)}
                        placeholder="Describe your goal"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="goalTargetAmount">Target Amount ($)</Label>
                        <Input
                          id="goalTargetAmount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={goalTargetAmount}
                          onChange={(e) => setGoalTargetAmount(e.target.value)}
                          placeholder="5000"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="goalTargetDate">Target Date</Label>
                        <Input
                          id="goalTargetDate"
                          type="date"
                          value={goalTargetDate}
                          onChange={(e) => setGoalTargetDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="goalCategory">Category</Label>
                        <Select value={goalCategory} onValueChange={setGoalCategory}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="medical">Medical Bills</SelectItem>
                            <SelectItem value="emergency">Emergency Fund</SelectItem>
                            <SelectItem value="surgery">Surgery Fund</SelectItem>
                            <SelectItem value="medication">Medication</SelectItem>
                            <SelectItem value="insurance">Insurance</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="goalPriority">Priority</Label>
                        <Select value={goalPriority} onValueChange={(value: 'low' | 'medium' | 'high') => setGoalPriority(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Target className="h-4 w-4 mr-2" />}
                        {isSubmitting ? "Creating..." : "Create Goal"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowGoalForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {savingsGoals.map((goal) => {
                const progress = (goal.current_amount / goal.target_amount) * 100;
                return (
                  <Card key={goal.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{goal.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        </div>
                        <Badge className={getPriorityColor(goal.priority)}>
                          {goal.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>${goal.current_amount.toLocaleString()}</span>
                          <span>${goal.target_amount.toLocaleString()}</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                        <p className="text-xs text-muted-foreground">{progress.toFixed(1)}% complete</p>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Category: {goal.category}</span>
                        {goal.target_date && (
                          <span className="text-muted-foreground">
                            Due: {new Date(goal.target_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {goal.is_completed && (
                        <Badge className="bg-green-100 text-green-800">Completed!</Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Savings Plans</h2>
              <Dialog open={showPlanForm} onOpenChange={setShowPlanForm}>
                <DialogTrigger asChild>
                  <Button>
                    <Calendar className="h-4 w-4 mr-2" />
                    Create Plan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Savings Plan</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreatePlan} className="space-y-4">
                    <div>
                      <Label htmlFor="planName">Plan Name</Label>
                      <Input
                        id="planName"
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        placeholder="e.g., Monthly Medical Fund"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="planTargetAmount">Target Amount ($)</Label>
                        <Input
                          id="planTargetAmount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={planTargetAmount}
                          onChange={(e) => setPlanTargetAmount(e.target.value)}
                          placeholder="10000"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="planContributionAmount">Contribution ($)</Label>
                        <Input
                          id="planContributionAmount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={planContributionAmount}
                          onChange={(e) => setPlanContributionAmount(e.target.value)}
                          placeholder="500"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="planFrequency">Frequency</Label>
                        <Select value={planFrequency} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setPlanFrequency(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="planTargetDate">Target Date</Label>
                        <Input
                          id="planTargetDate"
                          type="date"
                          value={planTargetDate}
                          onChange={(e) => setPlanTargetDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />}
                        {isSubmitting ? "Creating..." : "Create Plan"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowPlanForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {savingsPlans.map((plan) => (
                <Card key={plan.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                        <div className="flex space-x-4 text-sm text-muted-foreground">
                          <span>${plan.contribution_amount} {plan.contribution_frequency}</span>
                          <span>Target: ${plan.target_amount.toLocaleString()}</span>
                          {plan.target_date && (
                            <span>Due: {new Date(plan.target_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {plan.auto_deduct && (
                          <Badge variant="secondary">Auto-deduct</Badge>
                        )}
                        <Badge variant={plan.is_active ? "default" : "secondary"}>
                          {plan.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {savingsPlans.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No savings plans yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create a plan to automate your savings
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`font-semibold ${
                            transaction.transaction_type === 'deposit' ? 'text-green-600' : 
                            transaction.transaction_type === 'withdrawal' ? 'text-red-600' : 
                            'text-blue-600'
                          }`}>
                            {transaction.transaction_type === 'deposit' ? '+' : 
                             transaction.transaction_type === 'withdrawal' ? '-' : ''}
                            ${transaction.amount.toLocaleString()}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {transaction.transaction_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ref: {transaction.reference_number}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {transactions.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No transactions yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your transaction history will appear here
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Savings;