import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings } from "lucide-react";

interface UserPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  marketing_emails: boolean;
  privacy_level: string;
  show_medical_conditions: boolean;
  show_contact_info: boolean;
  language: string;
  theme: string;
}

interface PreferencesFormProps {
  userId: string;
}

export const PreferencesForm = ({ userId }: PreferencesFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    marketing_emails: false,
    privacy_level: 'friends',
    show_medical_conditions: false,
    show_contact_info: false,
    language: 'en',
    theme: 'system'
  });

  useEffect(() => {
    fetchPreferences();
  }, [userId]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) setPreferences(data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ ...preferences, user_id: userId });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Preferences updated successfully",
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Account Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notifications</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="email_notifications">Email Notifications</Label>
              <Switch
                id="email_notifications"
                checked={preferences.email_notifications}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, email_notifications: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push_notifications">Push Notifications</Label>
              <Switch
                id="push_notifications"
                checked={preferences.push_notifications}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, push_notifications: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms_notifications">SMS Notifications</Label>
              <Switch
                id="sms_notifications"
                checked={preferences.sms_notifications}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, sms_notifications: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="marketing_emails">Marketing Emails</Label>
              <Switch
                id="marketing_emails"
                checked={preferences.marketing_emails}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, marketing_emails: checked })
                }
              />
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Privacy</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Privacy Level</Label>
              <Select 
                value={preferences.privacy_level}
                onValueChange={(value) => setPreferences({ ...preferences, privacy_level: value })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="friends">Friends</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show_medical_conditions">Show Medical Conditions</Label>
              <Switch
                id="show_medical_conditions"
                checked={preferences.show_medical_conditions}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, show_medical_conditions: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show_contact_info">Show Contact Information</Label>
              <Switch
                id="show_contact_info"
                checked={preferences.show_contact_info}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, show_contact_info: checked })
                }
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
};