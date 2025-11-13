import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Shield, 
  Star, 
  FileText, 
  Settings,
  Award,
  Camera,
  Edit
} from "lucide-react";
import { PersonalInfoForm } from "@/components/profile/PersonalInfoForm";
import { MedicalInfoForm } from "@/components/profile/MedicalInfoForm";
import { VerificationPanel } from "@/components/profile/VerificationPanel";
import { UserReviews } from "@/components/profile/UserReviews";
import { MedicalDocuments } from "@/components/profile/MedicalDocuments";
import { PreferencesForm } from "@/components/profile/PreferencesForm";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  role: string;
  date_of_birth: string;
  gender: string;
  address: string;
  city: string;
  country: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  medical_conditions: string[];
  allergies: string[];
  current_medications: string[];
  avatar_url: string;
  bio: string;
  created_at: string;
  updated_at: string;
}

interface UserRating {
  average_rating: number;
  total_reviews: number;
}

interface VerificationStatus {
  verification_status: string;
  specialty: string;
  institution_name: string;
  verified_at: string;
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rating, setRating] = useState<UserRating | null>(null);
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchRating();
      fetchVerification();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRating = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_rating', { user_uuid: user!.id });

      if (error) throw error;
      if (data && data.length > 0) {
        setRating(data[0]);
      }
    } catch (error) {
      console.error('Error fetching rating:', error);
    }
  };

  const fetchVerification = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_verification')
        .select('verification_status, specialty, institution_name, verified_at')
        .eq('user_id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setVerification(data);
    } catch (error) {
      console.error('Error fetching verification:', error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      
      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'doctor': return <Shield className="h-4 w-4" />;
      case 'pharmacist': return <Award className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'doctor': return 'default';
      case 'pharmacist': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">Profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                <AvatarFallback className="text-lg">
                  {profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 p-1 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90">
                <Camera className="h-3 w-3" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{profile.full_name || 'Anonymous User'}</h1>
                <Badge variant={getRoleBadgeVariant(profile.role)} className="flex items-center gap-1">
                  {getRoleIcon(profile.role)}
                  {profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1)}
                </Badge>
                {verification?.verification_status === 'verified' && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
              
              {rating && rating.total_reviews > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{rating.average_rating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({rating.total_reviews} review{rating.total_reviews !== 1 ? 's' : ''})
                  </span>
                </div>
              )}
              
              {profile.bio && (
                <p className="text-muted-foreground">{profile.bio}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {profile.city && <span>{profile.city}, {profile.country}</span>}
                {verification?.institution_name && (
                  <span>{verification.institution_name}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="medical" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Medical
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Verification
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Reviews
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <PersonalInfoForm profile={profile} onUpdate={fetchProfile} />
        </TabsContent>

        <TabsContent value="medical">
          <MedicalInfoForm profile={profile} onUpdate={fetchProfile} />
        </TabsContent>

        <TabsContent value="verification">
          <VerificationPanel 
            profile={profile} 
            verification={verification}
            onUpdate={fetchVerification}
          />
        </TabsContent>

        <TabsContent value="reviews">
          <UserReviews userId={user!.id} />
        </TabsContent>

        <TabsContent value="documents">
          <MedicalDocuments userId={user!.id} />
        </TabsContent>

        <TabsContent value="settings">
          <PreferencesForm userId={user!.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;