import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, CreditCard, PiggyBank, Pill, Zap } from "lucide-react";

export const QuickActions = () => {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/loans" className="block">
            <Button variant="outline" className="w-full justify-start h-auto py-3">
              <CreditCard className="h-4 w-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Apply for Loan</div>
                <div className="text-xs text-muted-foreground">Medical financing</div>
              </div>
            </Button>
          </Link>
          
          <Link to="/savings" className="block">
            <Button variant="outline" className="w-full justify-start h-auto py-3">
              <PiggyBank className="h-4 w-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Make Deposit</div>
                <div className="text-xs text-muted-foreground">Save for goals</div>
              </div>
            </Button>
          </Link>
          
          <Link to="/medicine-requests" className="block">
            <Button variant="outline" className="w-full justify-start h-auto py-3">
              <Pill className="h-4 w-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Request Medicine</div>
                <div className="text-xs text-muted-foreground">Community support</div>
              </div>
            </Button>
          </Link>
          
          <Link to="/wallet" className="block">
            <Button variant="outline" className="w-full justify-start h-auto py-3">
              <Plus className="h-4 w-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">View Transactions</div>
                <div className="text-xs text-muted-foreground">Financial history</div>
              </div>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};