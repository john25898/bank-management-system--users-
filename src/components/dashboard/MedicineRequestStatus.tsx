import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pill, Clock, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

interface MedicineRequest {
  id: string;
  generic_name: string;
  brand_name?: string;
  reason: string;
  status: string;
  urgency_level: string;
  quantity_units: number;
  days_treatment: number;
  total_amount?: number;
  created_at: string;
  medical_condition: string;
  prescription_status: string;
}

interface MedicineRequestStatusProps {
  requests: MedicineRequest[];
}

export const MedicineRequestStatus = ({ requests }: MedicineRequestStatusProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'fulfilled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Emergency':
        return 'bg-red-100 text-red-800';
      case 'Urgent':
        return 'bg-orange-100 text-orange-800';
      case 'Standard':
        return 'bg-blue-100 text-blue-800';
      case 'Routine':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'fulfilled':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Pill className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const urgentRequests = requests.filter(req => req.urgency_level === 'Emergency' || req.urgency_level === 'Urgent');

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5" />
          Medicine Request Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8">
            <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground mb-4">No medicine requests yet</p>
            <Link to="/medicine-requests">
              <Button variant="outline">Request Medicine</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-xl font-bold text-primary">{pendingRequests.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Urgent/Emergency</p>
                <p className="text-xl font-bold text-red-600">{urgentRequests.length}</p>
              </div>
            </div>

            {/* Individual Requests */}
            <div className="space-y-4">
              {requests.slice(0, 3).map((request) => (
                <div key={request.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <div>
                        <h4 className="font-medium">{request.generic_name}</h4>
                        {request.brand_name && (
                          <p className="text-xs text-muted-foreground">
                            Brand: {request.brand_name}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {request.reason}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                        {request.status}
                      </Badge>
                      <Badge className={`text-xs ${getUrgencyColor(request.urgency_level)}`}>
                        {request.urgency_level}
                      </Badge>
                    </div>
                  </div>

                  {/* Request Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Quantity</p>
                      <p className="font-medium">{request.quantity_units} units</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Treatment Days</p>
                      <p className="font-medium">{request.days_treatment} days</p>
                    </div>
                  </div>

                  {/* Medical Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Condition</p>
                      <p className="font-medium">{request.medical_condition}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Prescription Status</p>
                      <p className="font-medium text-xs">{request.prescription_status}</p>
                    </div>
                  </div>

                  {/* Amount & Date */}
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Requested {getTimeAgo(request.created_at)}
                      </span>
                    </div>
                    {request.total_amount && (
                      <span className="font-medium text-primary">
                        UGX {request.total_amount.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Urgent Alert */}
                  {(request.urgency_level === 'Emergency' || request.urgency_level === 'Urgent') && 
                   request.status === 'pending' && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>
                        {request.urgency_level === 'Emergency' 
                          ? 'Emergency request requires immediate attention' 
                          : 'Urgent request - expedited processing needed'
                        }
                      </span>
                    </div>
                  )}
                </div>
              ))}
              
              {requests.length > 3 && (
                <div className="text-center pt-2">
                  <Link to="/medicine-requests">
                    <Button variant="outline" size="sm">
                      View All Requests ({requests.length})
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};