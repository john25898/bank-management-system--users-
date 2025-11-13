import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X } from "lucide-react";

interface MedicalInfo {
  medical_conditions: string[];
  allergies: string[];
  current_medications: string[];
}

interface MedicalInfoFormProps {
  profile: any;
  onUpdate: () => void;
}

export const MedicalInfoForm = ({ profile, onUpdate }: MedicalInfoFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [medicalConditions, setMedicalConditions] = useState<string[]>(profile.medical_conditions || []);
  const [allergies, setAllergies] = useState<string[]>(profile.allergies || []);
  const [medications, setMedications] = useState<string[]>(profile.current_medications || []);
  const [newCondition, setNewCondition] = useState("");
  const [newAllergy, setNewAllergy] = useState("");
  const [newMedication, setNewMedication] = useState("");

  const addItem = (type: 'condition' | 'allergy' | 'medication') => {
    switch (type) {
      case 'condition':
        if (newCondition.trim() && !medicalConditions.includes(newCondition.trim())) {
          setMedicalConditions([...medicalConditions, newCondition.trim()]);
          setNewCondition("");
        }
        break;
      case 'allergy':
        if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
          setAllergies([...allergies, newAllergy.trim()]);
          setNewAllergy("");
        }
        break;
      case 'medication':
        if (newMedication.trim() && !medications.includes(newMedication.trim())) {
          setMedications([...medications, newMedication.trim()]);
          setNewMedication("");
        }
        break;
    }
  };

  const removeItem = (type: 'condition' | 'allergy' | 'medication', index: number) => {
    switch (type) {
      case 'condition':
        setMedicalConditions(medicalConditions.filter((_, i) => i !== index));
        break;
      case 'allergy':
        setAllergies(allergies.filter((_, i) => i !== index));
        break;
      case 'medication':
        setMedications(medications.filter((_, i) => i !== index));
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          medical_conditions: medicalConditions,
          allergies: allergies,
          current_medications: medications,
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Medical information updated successfully",
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error updating medical info:', error);
      toast({
        title: "Error",
        description: "Failed to update medical information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medical Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Medical Conditions */}
          <div className="space-y-3">
            <Label>Medical Conditions</Label>
            <div className="flex gap-2">
              <Input
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                placeholder="Add a medical condition"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('condition'))}
              />
              <Button
                type="button"
                onClick={() => addItem('condition')}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {medicalConditions.map((condition, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {condition}
                  <button
                    type="button"
                    onClick={() => removeItem('condition', index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div className="space-y-3">
            <Label>Allergies</Label>
            <div className="flex gap-2">
              <Input
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="Add an allergy"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('allergy'))}
              />
              <Button
                type="button"
                onClick={() => addItem('allergy')}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allergies.map((allergy, index) => (
                <Badge key={index} variant="destructive" className="flex items-center gap-1">
                  {allergy}
                  <button
                    type="button"
                    onClick={() => removeItem('allergy', index)}
                    className="ml-1 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Current Medications */}
          <div className="space-y-3">
            <Label>Current Medications</Label>
            <div className="flex gap-2">
              <Input
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                placeholder="Add a current medication"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('medication'))}
              />
              <Button
                type="button"
                onClick={() => addItem('medication')}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {medications.map((medication, index) => (
                <Badge key={index} variant="default" className="flex items-center gap-1">
                  {medication}
                  <button
                    type="button"
                    onClick={() => removeItem('medication', index)}
                    className="ml-1 hover:text-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
            <p className="font-medium mb-1">Privacy Notice:</p>
            <p>Your medical information is encrypted and only shared with healthcare providers you explicitly authorize. You can control visibility in your privacy settings.</p>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Medical Information
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};