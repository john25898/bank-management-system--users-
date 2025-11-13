import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Shield, Award, Clock, CheckCircle, XCircle } from "lucide-react";

interface VerificationData {
  specialty: 'general_practitioner' | 'cardiologist' | 'dermatologist' | 'endocrinologist' | 'gastroenterologist' | 'neurologist' | 'oncologist' | 'pediatrician' | 'psychiatrist' | 'surgeon' | 'pharmacist' | 'other';
  license_number: string;
  institution_name: string;
  years_of_experience: number;
  verification_notes: string;
}

interface VerificationPanelProps {
  profile: any;
  verification: any;
  onUpdate: () => void;
}

export const VerificationPanel = ({ profile, verification, onUpdate }: VerificationPanelProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<VerificationData>({
    defaultValues: {
      specialty: verification?.specialty || '',
      license_number: verification?.license_number || '',
      institution_name: verification?.institution_name || '',
      years_of_experience: verification?.years_of_experience || 0,
      verification_notes: verification?.verification_notes || '',
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified': return <Badge variant="default" className="bg-green-600">Verified</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'license' | 'certificate') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.user_id}/${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(filePath);

      // Update the verification record with the document URL
      const updateField = type === 'license' ? 'license_document_url' : 'certificate_document_url';
      
      if (verification?.id) {
        const { error: updateError } = await supabase
          .from('medical_verification')
          .update({ [updateField]: publicUrl })
          .eq('id', verification.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Success",
        description: `${type === 'license' ? 'License' : 'Certificate'} document uploaded successfully`,
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: VerificationData) => {
    setLoading(true);
    try {
      if (verification?.id) {
        // Update existing verification
        const { error } = await supabase
          .from('medical_verification')
          .update(data)
          .eq('id', verification.id);

        if (error) throw error;
      } else {
        // Create new verification
        const { error } = await supabase
          .from('medical_verification')
          .insert({
            ...data,
            user_id: profile.user_id,
            verification_status: 'pending'
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Verification information submitted successfully",
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast({
        title: "Error",
        description: "Failed to submit verification information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show different content based on role and verification status
  if (profile.role === 'patient' && !verification) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Become a Verified Medical Professional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Apply to become a verified medical professional on our platform</p>
            <p className="text-sm text-muted-foreground">Fill out the verification form below to start the process</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      {verification && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(verification.verification_status)}
              Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{verification.specialty?.replace('_', ' ').toUpperCase()}</p>
                <p className="text-sm text-muted-foreground">{verification.institution_name}</p>
              </div>
              {getStatusBadge(verification.verification_status)}
            </div>
            {verification.verified_at && (
              <p className="text-sm text-muted-foreground mt-2">
                Verified on {new Date(verification.verified_at).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Verification Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Professional Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specialty">Medical Specialty</Label>
                <Select onValueChange={(value) => setValue("specialty", value as any)} defaultValue={watch("specialty")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general_practitioner">General Practitioner</SelectItem>
                    <SelectItem value="cardiologist">Cardiologist</SelectItem>
                    <SelectItem value="dermatologist">Dermatologist</SelectItem>
                    <SelectItem value="endocrinologist">Endocrinologist</SelectItem>
                    <SelectItem value="gastroenterologist">Gastroenterologist</SelectItem>
                    <SelectItem value="neurologist">Neurologist</SelectItem>
                    <SelectItem value="oncologist">Oncologist</SelectItem>
                    <SelectItem value="pediatrician">Pediatrician</SelectItem>
                    <SelectItem value="psychiatrist">Psychiatrist</SelectItem>
                    <SelectItem value="surgeon">Surgeon</SelectItem>
                    <SelectItem value="pharmacist">Pharmacist</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="years_of_experience">Years of Experience</Label>
                <Input
                  id="years_of_experience"
                  type="number"
                  min="0"
                  {...register("years_of_experience", { required: "Years of experience is required" })}
                  placeholder="Enter years of experience"
                />
                {errors.years_of_experience && (
                  <p className="text-sm text-destructive">{errors.years_of_experience.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_number">License Number</Label>
                <Input
                  id="license_number"
                  {...register("license_number", { required: "License number is required" })}
                  placeholder="Enter your license number"
                />
                {errors.license_number && (
                  <p className="text-sm text-destructive">{errors.license_number.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="institution_name">Institution/Hospital</Label>
                <Input
                  id="institution_name"
                  {...register("institution_name", { required: "Institution name is required" })}
                  placeholder="Enter your institution name"
                />
                {errors.institution_name && (
                  <p className="text-sm text-destructive">{errors.institution_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification_notes">Additional Notes</Label>
              <Textarea
                id="verification_notes"
                {...register("verification_notes")}
                placeholder="Any additional information for verification..."
                rows={3}
              />
            </div>

            {/* Document Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Supporting Documents</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>License Document</Label>
                  <div className="border-2 border-dashed border-muted rounded-lg p-4">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, 'license')}
                      className="hidden"
                      id="license-upload"
                    />
                    <label
                      htmlFor="license-upload"
                      className="flex flex-col items-center cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                    >
                      <Upload className="h-6 w-6 mb-1" />
                      Click to upload license
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Certificate Document</Label>
                  <div className="border-2 border-dashed border-muted rounded-lg p-4">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, 'certificate')}
                      className="hidden"
                      id="certificate-upload"
                    />
                    <label
                      htmlFor="certificate-upload"
                      className="flex flex-col items-center cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                    >
                      <Upload className="h-6 w-6 mb-1" />
                      Click to upload certificate
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading || uploading} className="w-full">
              {(loading || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {verification ? 'Update Verification' : 'Submit for Verification'}
            </Button>
          </form>

          <div className="mt-4 text-sm text-muted-foreground p-3 bg-muted rounded-lg">
            <p className="font-medium mb-1">Verification Process:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Submit your professional information and documents</li>
              <li>Our medical team will review your credentials</li>
              <li>Verification typically takes 2-3 business days</li>
              <li>You'll be notified via email once verification is complete</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};