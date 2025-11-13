import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, DollarSign, Users, AlertCircle, CheckCircle, Clock, XCircle, ArrowLeft, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Loans = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loans, setLoans] = useState([]);
  const [eligibility, setEligibility] = useState<any>(null);
  // Repayments and guarantors are not implemented in current schema
  const [repayments, setRepayments] = useState([]);
  const [guarantors, setGuarantors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [showRepaymentDialog, setShowRepaymentDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  
  // Form states
  const [applicationForm, setApplicationForm] = useState({
    amount: '',
    purpose: '',
    termMonths: 12,
    selectedCriteria: null
  });
  
  const [repaymentForm, setRepaymentForm] = useState({
    amount: '',
    paymentType: 'regular'
  });

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else {
        fetchLoanData();
      }
    }
  }, [user, loading, navigate]);

  const fetchLoanData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch loans for current user (user_id)
      const { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (loansError) throw loansError;
      setLoans(loansData || []);
      
      // Provide default loan products while RPC/back-end products are unavailable
      const defaultCriteria = [
        {
          id: 'basic',
          name: 'Basic Medical Loan',
          interest_rate: 0.05, // 5%
          max_loan_amount: 1000000,
          max_term_months: 12,
          meets_requirements: true,
        },
        {
          id: 'standard',
          name: 'Standard Medical Loan',
          interest_rate: 0.08, // 8%
          max_loan_amount: 3000000,
          max_term_months: 24,
          meets_requirements: true,
        },
        {
          id: 'premium',
          name: 'Premium Medical Loan',
          interest_rate: 0.12, // 12%
          max_loan_amount: 7000000,
          max_term_months: 36,
          meets_requirements: true,
        },
      ];
      setEligibility({ eligible: true, available_criteria: defaultCriteria });
      
      // Repayments and guarantors tables are not available in current schema
      setRepayments([]);
      setGuarantors([]);
      
    } catch (error) {
      console.error('Error fetching loan data:', error);
      toast({
        title: "Error",
        description: "Failed to load loan data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoanApplication = async () => {
    try {
      if (!applicationForm.selectedCriteria || !applicationForm.amount || !applicationForm.purpose) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
      
      const amount = parseFloat(applicationForm.amount);
      const criteria = applicationForm.selectedCriteria;
      const totalPayable = amount * (1 + criteria.interest_rate);
      const monthlyPayment = totalPayable / applicationForm.termMonths;
      
      const { error } = await supabase
        .from('loans')
        .insert([{
          user_id: user.id,
          amount: amount,
          purpose: applicationForm.purpose,
          interest_rate: criteria.interest_rate,
          term_months: applicationForm.termMonths,
          monthly_payment: monthlyPayment,
          total_payable: totalPayable,
          status: 'pending',
        }]);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Loan application submitted successfully!",
      });
      
      setShowApplicationDialog(false);
      setApplicationForm({
        amount: '',
        purpose: '',
        termMonths: 12,
        selectedCriteria: null
      });
      
      fetchLoanData();
    } catch (error) {
      console.error('Error submitting loan application:', error);
      toast({
        title: "Error",
        description: "Failed to submit loan application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRepayment = async () => {
    try {
      if (!repaymentForm.amount || !selectedLoan) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid amount.",
          variant: "destructive",
        });
        return;
      }
      
      // Repayments are not supported yet in current schema
      toast({
        title: "Not Available",
        description: "Repayments will be enabled soon.",
      });
      setShowRepaymentDialog(false);
      setRepaymentForm({ amount: '', paymentType: 'regular' });
      setSelectedLoan(null);
    } catch (error) {
      console.error('Error processing repayment:', error);
      toast({
        title: "Error",
        description: "Failed to process repayment.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-blue-500';
      case 'disbursed': return 'bg-green-500';
      case 'active': return 'bg-green-600';
      case 'completed': return 'bg-gray-500';
      case 'defaulted': return 'bg-red-500';
      case 'rejected': return 'bg-red-600';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': case 'disbursed': case 'active': case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'defaulted': case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading loan information...</p>
        </div>
      </div>
    );
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
            <h1 className="text-2xl font-bold flex items-center">
              <CreditCard className="h-6 w-6 mr-2" />
              Medical Loans
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Eligibility Overview */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary to-primary-foreground text-primary-foreground rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-6 w-6" />
              Loan Eligibility
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {eligibility ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${eligibility.eligible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {eligibility.eligible ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                    {eligibility.eligible ? 'Eligible' : 'Not Eligible'}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Max Loan Amount</p>
                  <p className="text-2xl font-bold text-primary">UGX {Number(eligibility.max_loan_amount).toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Required Guarantors</p>
                  <p className="text-2xl font-bold text-primary">{eligibility.required_guarantors}</p>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">Unable to calculate eligibility. Please ensure you have a savings account.</p>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-2 lg:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="apply">Apply</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Your Loans</h2>
                {eligibility?.eligible && (
                  <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
                    <DialogTrigger asChild>
                      <Button>Apply for Loan</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Apply for Medical Loan</DialogTitle>
                        <DialogDescription>
                          Fill out the application form below
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="criteria">Loan Type</Label>
                          <Select onValueChange={(value) => {
                            const criteria = eligibility.available_criteria.find(c => c.id === value);
                            setApplicationForm(prev => ({ ...prev, selectedCriteria: criteria }));
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select loan type" />
                            </SelectTrigger>
                            <SelectContent>
                              {eligibility?.available_criteria?.map((criteria) => (
                                <SelectItem key={criteria.id} value={criteria.id}>
                                  {criteria.name} - {(criteria.interest_rate * 100).toFixed(1)}% APR
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="amount">Amount (UGX)</Label>
                          <Input
                            id="amount"
                            type="number"
                            value={applicationForm.amount}
                            onChange={(e) => setApplicationForm(prev => ({ ...prev, amount: e.target.value }))}
                            placeholder="Enter loan amount"
                          />
                        </div>
                        <div>
                          <Label htmlFor="purpose">Purpose</Label>
                          <Textarea
                            id="purpose"
                            value={applicationForm.purpose}
                            onChange={(e) => setApplicationForm(prev => ({ ...prev, purpose: e.target.value }))}
                            placeholder="Describe the medical purpose"
                          />
                        </div>
                        <div>
                          <Label htmlFor="term">Term (Months)</Label>
                          <Select 
                            value={applicationForm.termMonths.toString()} 
                            onValueChange={(value) => setApplicationForm(prev => ({ ...prev, termMonths: parseInt(value) }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[3, 6, 12, 18, 24, 36].map(month => (
                                <SelectItem key={month} value={month.toString()}>{month} months</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleLoanApplication} className="w-full">
                          Submit Application
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              
              {loans.length > 0 ? (
                <div className="grid gap-4">
                  {loans.map((loan) => (
                    <Card key={loan.id} className="border-0 shadow-md">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Badge className={`${getStatusColor(loan.status)} text-white flex items-center gap-1`}>
                              {getStatusIcon(loan.status)}
                              {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                            </Badge>
                            <span className="text-lg font-semibold">UGX {Number(loan.amount).toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Purpose</p>
                            <p className="font-medium">{loan.purpose}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Interest Rate</p>
                            <p className="font-medium">{(loan.interest_rate * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Term</p>
                            <p className="font-medium">{loan.term_months} months</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Monthly Payment</p>
                            <p className="font-medium">UGX {Number(loan.monthly_payment).toLocaleString()}</p>
                          </div>
                        </div>
                        
                        {loan.status === 'active' && (
                          <div className="mt-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span>Outstanding Balance</span>
                              <span>—</span>
                            </div>
                            <Progress 
                              value={0}
                              className="h-2"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-12 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Loans Found</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven't applied for any loans yet.
                    </p>
                    {eligibility?.eligible && (
                      <Button onClick={() => setShowApplicationDialog(true)}>
                        Apply for Your First Loan
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Apply Tab */}
          <TabsContent value="apply" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Available Loan Products</CardTitle>
                <CardDescription>
                  Choose from our medical loan options based on your needs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {eligibility?.available_criteria?.map((criteria) => (
                  <Card key={criteria.id} className="border-2 hover:border-primary transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold">{criteria.name}</h3>
                        <Badge variant="secondary">{(criteria.interest_rate * 100).toFixed(1)}% APR</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Max Amount</p>
                          <p className="font-medium">UGX {Number(criteria.max_loan_amount).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Max Term</p>
                          <p className="font-medium">{criteria.max_term_months} months</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Requirements</p>
                          <p className="font-medium">{criteria.meets_requirements ? '✓ Qualified' : '✗ Not Qualified'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Repayments Tab (disabled) */}
          <TabsContent value="repayments" className="space-y-6 hidden">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {repayments.length > 0 ? (
                  <div className="space-y-4">
                    {repayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">UGX {Number(payment.amount).toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge variant="outline">{payment.payment_type}</Badge>
                          <p className="text-sm text-muted-foreground">
                            Ref: {payment.reference_number.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No payment history available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Guarantors Tab (disabled) */}
          <TabsContent value="guarantors" className="space-y-6 hidden">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Loan Guarantors
                </CardTitle>
              </CardHeader>
              <CardContent>
                {guarantors.length > 0 ? (
                  <div className="space-y-4">
                    {guarantors.map((guarantor) => (
                      <div key={guarantor.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">UGX {Number(guarantor.guaranteed_amount).toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            For loan: {guarantor.loans.purpose}
                          </p>
                        </div>
                        <Badge 
                          className={
                            guarantor.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            guarantor.status === 'declined' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {guarantor.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No guarantors assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Repayment Dialog (disabled) */}
        <Dialog open={showRepaymentDialog} onOpenChange={setShowRepaymentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Make Loan Payment</DialogTitle>
              <DialogDescription>
                Make a payment towards your loan
              </DialogDescription>
            </DialogHeader>
            {selectedLoan && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                  <p className="text-lg font-semibold">UGX {Number(selectedLoan.outstanding_balance).toLocaleString()}</p>
                </div>
                <div>
                  <Label htmlFor="repayment-amount">Payment Amount (UGX)</Label>
                  <Input
                    id="repayment-amount"
                    type="number"
                    value={repaymentForm.amount}
                    onChange={(e) => setRepaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter payment amount"
                  />
                </div>
                <div>
                  <Label htmlFor="payment-type">Payment Type</Label>
                  <Select 
                    value={repaymentForm.paymentType} 
                    onValueChange={(value) => setRepaymentForm(prev => ({ ...prev, paymentType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular Payment</SelectItem>
                      <SelectItem value="early">Early Payment</SelectItem>
                      <SelectItem value="penalty">Penalty Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleRepayment} className="w-full">
                  Process Payment
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Loans;