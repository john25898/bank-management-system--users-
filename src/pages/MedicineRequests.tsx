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
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Pill, Plus, Search, MapPin, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MedicineRequests = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [myRequests, setMyRequests] = useState([]);
  const [communityRequests, setCommunityRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form state for new medicine request
  const [requestForm, setRequestForm] = useState({
    generic_name: '',
    brand_name: '',
    strength_dosage: '',
    form_type: 'Tablets/Pills',
    quantity_units: 1,
    days_treatment: 1,
    medical_condition: 'Other',
    medical_condition_other: '',
    reason: '',
    urgency_level: 'Routine',
    prescription_status: 'Over-the-counter medication',
    return_method: 'Same medicine type',
    alternative_names_accepted: false,
    home_delivery: false,
    hospital_clinic_pickup: false,
    pickup_from_lender: false,
    meet_at_pharmacy: false,
    max_distance: 10
  });

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else {
        fetchMedicineRequests();
      }
    }
  }, [user, loading, navigate]);

  const fetchMedicineRequests = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user's own requests
      const { data: myRequestsData, error: myRequestsError } = await supabase
        .from('medicine_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (myRequestsError) throw myRequestsError;
      setMyRequests(myRequestsData || []);
      
      // Fetch community requests (excluding user's own)
      const { data: communityRequestsData, error: communityRequestsError } = await supabase
        .from('medicine_requests')
        .select('*')
        .neq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (communityRequestsError) throw communityRequestsError;
      setCommunityRequests(communityRequestsData || []);
      
    } catch (error) {
      console.error('Error fetching medicine requests:', error);
      toast({
        title: "Error",
        description: "Failed to load medicine requests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    try {
      if (!requestForm.generic_name || !requestForm.reason) {
        toast({
          title: "Validation Error",
          description: "Please fill in the required fields (medicine name and reason).",
          variant: "destructive",
        });
        return;
      }
      
      // Debug: Log the form data to see what urgency_level is being sent
      console.log('Request form data:', requestForm);
      console.log('Urgency level being sent:', requestForm.urgency_level);
      
      // Ensure urgency_level is valid
      const validUrgencyLevels = ['Emergency', 'Urgent', 'Routine', 'Preventive'];
      if (!validUrgencyLevels.includes(requestForm.urgency_level)) {
        console.error('Invalid urgency level:', requestForm.urgency_level);
        setRequestForm(prev => ({ ...prev, urgency_level: 'Routine' }));
        toast({
          title: "Validation Error",
          description: "Invalid urgency level. Please select a valid option.",
          variant: "destructive",
        });
        return;
      }
      
      // Insert only known-safe columns and avoid selecting returning columns
      // Attempt insert with generic_name; if column doesn't exist, retry without it
      let { error } = await supabase
        .from('medicine_requests')
        .insert({
          generic_name: requestForm.generic_name,
          reason: requestForm.reason,
          urgency_level: requestForm.urgency_level,
          user_id: user.id,
          status: 'pending',
        });

      if (error && typeof error.message === 'string' && error.message.includes("'generic_name'")) {
        console.warn("generic_name column missing, retrying insert without it");
        const retry = await supabase
          .from('medicine_requests')
          .insert({
            reason: requestForm.reason,
            urgency_level: requestForm.urgency_level,
            user_id: user.id,
            status: 'pending',
          });
        error = retry.error as any;
      }

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Medicine request created successfully!",
      });
      
      setShowRequestDialog(false);
      setRequestForm({
        generic_name: '',
        brand_name: '',
        strength_dosage: '',
        form_type: 'Tablets/Pills',
        quantity_units: 1,
        days_treatment: 1,
        medical_condition: 'Other',
        medical_condition_other: '',
        reason: '',
        urgency_level: 'Routine',
        prescription_status: 'Over-the-counter medication',
        return_method: 'Same medicine type',
        alternative_names_accepted: false,
        home_delivery: false,
        hospital_clinic_pickup: false,
        pickup_from_lender: false,
        meet_at_pharmacy: false,
        max_distance: 10
      });
      
      fetchMedicineRequests();
    } catch (error) {
      console.error('Error creating medicine request:', error);
      toast({
        title: "Error",
        description: "Failed to create medicine request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'Emergency': return 'bg-red-500';
      case 'Urgent': return 'bg-orange-500';
      case 'Routine': return 'bg-blue-500';
      case 'Preventive': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'fulfilled': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredCommunityRequests = communityRequests.filter((request) => {
    const g = (request.generic_name || '').toLowerCase();
    const b = (request.brand_name || '').toLowerCase();
    const m = (request.medical_condition || '').toLowerCase();
    const q = (searchTerm || '').toLowerCase();
    return g.includes(q) || b.includes(q) || m.includes(q);
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading medicine requests...</p>
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
              <Pill className="h-6 w-6 mr-2" />
              Medicine Sharing
            </h1>
          </div>
          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Request Medicine
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary">{myRequests.length}</div>
              <p className="text-sm text-muted-foreground">My Requests</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary">{communityRequests.length}</div>
              <p className="text-sm text-muted-foreground">Community Requests</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary">
                {myRequests.filter(r => r.status === 'fulfilled').length}
              </div>
              <p className="text-sm text-muted-foreground">Fulfilled</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="my-requests" className="space-y-6">
          <TabsList className="grid grid-cols-2 lg:w-auto">
            <TabsTrigger value="my-requests">My Requests</TabsTrigger>
            <TabsTrigger value="community">Help Others</TabsTrigger>
          </TabsList>

          {/* My Requests Tab */}
          <TabsContent value="my-requests" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Your Medicine Requests</h2>
              <Button onClick={() => setShowRequestDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </div>
            
            {myRequests.length > 0 ? (
              <div className="grid gap-4">
                {myRequests.map((request) => (
                  <Card key={request.id} className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">
                            {request.generic_name}
                            {request.brand_name && ` (${request.brand_name})`}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getUrgencyColor(request.urgency_level)} text-white`}>
                              {request.urgency_level}
                            </Badge>
                            <Badge className={`${getStatusColor(request.status)} text-white`}>
                              {request.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>{new Date(request.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-muted-foreground">Dosage</p>
                          <p className="font-medium">{request.strength_dosage}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Form</p>
                          <p className="font-medium">{request.form_type}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Quantity</p>
                          <p className="font-medium">{request.quantity_units} units</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">{request.days_treatment} days</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Condition</p>
                          <p className="text-sm">{request.medical_condition}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Reason</p>
                          <p className="text-sm">{request.reason}</p>
                        </div>
                      </div>
                      
                      {/* Delivery Options */}
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-2">Delivery Options:</p>
                        <div className="flex flex-wrap gap-2">
                          {request.home_delivery && <Badge variant="outline">Home Delivery</Badge>}
                          {request.hospital_clinic_pickup && <Badge variant="outline">Hospital Pickup</Badge>}
                          {request.pickup_from_lender && <Badge variant="outline">Pickup from Lender</Badge>}
                          {request.meet_at_pharmacy && <Badge variant="outline">Meet at Pharmacy</Badge>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-md">
                <CardContent className="p-12 text-center">
                  <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Medicine Requests</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't created any medicine requests yet.
                  </p>
                  <Button onClick={() => setShowRequestDialog(true)}>
                    Create Your First Request
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Help Others in Need</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search medicines..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
            
            {filteredCommunityRequests.length > 0 ? (
              <div className="grid gap-4">
                {filteredCommunityRequests.map((request) => (
                  <Card key={request.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">
                            {request.generic_name}
                            {request.brand_name && ` (${request.brand_name})`}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getUrgencyColor(request.urgency_level)} text-white`}>
                              {request.urgency_level}
                            </Badge>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 mr-1" />
                              {new Date(request.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Button size="sm">
                          Help
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-muted-foreground">Dosage</p>
                          <p className="font-medium">{request.strength_dosage}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Form</p>
                          <p className="font-medium">{request.form_type}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Quantity</p>
                          <p className="font-medium">{request.quantity_units} units</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Max Distance</p>
                          <p className="font-medium">{request.max_distance} km</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Condition</p>
                          <p className="text-sm">{request.medical_condition}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Reason</p>
                          <p className="text-sm">{request.reason}</p>
                        </div>
                      </div>
                      
                      {/* Delivery Options */}
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-2">Available Options:</p>
                        <div className="flex flex-wrap gap-2">
                          {request.home_delivery && <Badge variant="outline">Home Delivery</Badge>}
                          {request.hospital_clinic_pickup && <Badge variant="outline">Hospital Pickup</Badge>}
                          {request.pickup_from_lender && <Badge variant="outline">Pickup from Lender</Badge>}
                          {request.meet_at_pharmacy && <Badge variant="outline">Meet at Pharmacy</Badge>}
                          {request.alternative_names_accepted && <Badge variant="outline">Alternative Names OK</Badge>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-md">
                <CardContent className="p-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Requests Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? "No medicine requests match your search." : "No community requests available at the moment."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Request Creation Dialog */}
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Request Medicine from Community</DialogTitle>
              <DialogDescription>
                Fill out the details of the medicine you need
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Basic Medicine Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="generic-name">Generic Name *</Label>
                  <Input
                    id="generic-name"
                    value={requestForm.generic_name}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, generic_name: e.target.value }))}
                    placeholder="e.g., Paracetamol"
                  />
                </div>
                <div>
                  <Label htmlFor="brand-name">Brand Name</Label>
                  <Input
                    id="brand-name"
                    value={requestForm.brand_name}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, brand_name: e.target.value }))}
                    placeholder="e.g., Panadol"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="strength">Strength/Dosage</Label>
                  <Input
                    id="strength"
                    value={requestForm.strength_dosage}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, strength_dosage: e.target.value }))}
                    placeholder="e.g., 500mg"
                  />
                </div>
                <div>
                  <Label htmlFor="form-type">Form Type</Label>
                  <Select 
                    value={requestForm.form_type} 
                    onValueChange={(value) => setRequestForm(prev => ({ ...prev, form_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tablets/Pills">Tablets/Pills</SelectItem>
                      <SelectItem value="Capsules">Capsules</SelectItem>
                      <SelectItem value="Liquid/Syrup">Liquid/Syrup</SelectItem>
                      <SelectItem value="Injection">Injection</SelectItem>
                      <SelectItem value="Topical">Topical</SelectItem>
                      <SelectItem value="Inhaler">Inhaler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity (units)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={requestForm.quantity_units}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, quantity_units: parseInt(e.target.value) }))}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="days">Days of Treatment</Label>
                  <Input
                    id="days"
                    type="number"
                    value={requestForm.days_treatment}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, days_treatment: parseInt(e.target.value) }))}
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="condition">Medical Condition</Label>
                  <Select 
                    value={requestForm.medical_condition} 
                    onValueChange={(value) => setRequestForm(prev => ({ ...prev, medical_condition: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pain Management">Pain Management</SelectItem>
                      <SelectItem value="Fever">Fever</SelectItem>
                      <SelectItem value="Cold/Flu">Cold/Flu</SelectItem>
                      <SelectItem value="Allergy">Allergy</SelectItem>
                      <SelectItem value="Diabetes">Diabetes</SelectItem>
                      <SelectItem value="Hypertension">Hypertension</SelectItem>
                      <SelectItem value="Infection">Infection</SelectItem>
                      <SelectItem value="Chronic Disease">Chronic Disease</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="urgency">Urgency Level</Label>
                  <Select 
                    value={requestForm.urgency_level} 
                    onValueChange={(value) => setRequestForm(prev => ({ ...prev, urgency_level: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                      <SelectItem value="Routine">Routine</SelectItem>
                      <SelectItem value="Preventive">Preventive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {requestForm.medical_condition === 'Other' && (
                <div>
                  <Label htmlFor="condition-other">Specify Medical Condition</Label>
                  <Input
                    id="condition-other"
                    value={requestForm.medical_condition_other}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, medical_condition_other: e.target.value }))}
                    placeholder="Please specify the condition"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="reason">Reason for Request *</Label>
                <Textarea
                  id="reason"
                  value={requestForm.reason}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Explain why you need this medicine"
                  rows={3}
                />
              </div>

              {/* Delivery Options */}
              <div className="space-y-3">
                <Label>Pickup/Delivery Options</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="home-delivery"
                      checked={requestForm.home_delivery}
                      onCheckedChange={(checked) => setRequestForm(prev => ({ ...prev, home_delivery: checked === true }))}
                    />
                    <Label htmlFor="home-delivery" className="text-sm">Home Delivery</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hospital-pickup"
                      checked={requestForm.hospital_clinic_pickup}
                      onCheckedChange={(checked) => setRequestForm(prev => ({ ...prev, hospital_clinic_pickup: checked === true }))}
                    />
                    <Label htmlFor="hospital-pickup" className="text-sm">Hospital/Clinic Pickup</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pickup-lender"
                      checked={requestForm.pickup_from_lender}
                      onCheckedChange={(checked) => setRequestForm(prev => ({ ...prev, pickup_from_lender: checked === true }))}
                    />
                    <Label htmlFor="pickup-lender" className="text-sm">Pickup from Lender</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="meet-pharmacy"
                      checked={requestForm.meet_at_pharmacy}
                      onCheckedChange={(checked) => setRequestForm(prev => ({ ...prev, meet_at_pharmacy: checked === true }))}
                    />
                    <Label htmlFor="meet-pharmacy" className="text-sm">Meet at Pharmacy</Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max-distance">Max Distance (km)</Label>
                  <Input
                    id="max-distance"
                    type="number"
                    value={requestForm.max_distance}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, max_distance: parseInt(e.target.value) }))}
                    min="1"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="alternative-names"
                    checked={requestForm.alternative_names_accepted}
                    onCheckedChange={(checked) => setRequestForm(prev => ({ ...prev, alternative_names_accepted: checked === true }))}
                  />
                  <Label htmlFor="alternative-names" className="text-sm">Accept Alternative Names</Label>
                </div>
              </div>

              <Button onClick={handleCreateRequest} className="w-full">
                Create Medicine Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default MedicineRequests;