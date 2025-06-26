/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Settings, Shield, Bell, Database, Globe, Save, Server } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    siteName: 'Nexus Arena',
    siteDescription: 'The ultimate decentralized gaming multiverse',
    maintenanceMode: false,
    userRegistration: true,
    emailNotifications: true,
    smsNotifications: false,
    maxRoomsPerUser: 5,
    defaultEntryFee: 10.00,
    platformFeePercentage: 5,
    minWithdrawal: 10.00,
    maxWithdrawal: 10000.00,
  });

  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Settings Updated",
      description: "Platform settings have been successfully updated.",
    });
  };

  const handleInputChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cyber font-bold text-primary">System Settings</h1>
          <p className="text-muted-foreground">Configure platform settings and preferences</p>
        </div>
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/80">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-primary" />
              <span>General Settings</span>
            </CardTitle>
            <CardDescription>Basic platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => handleInputChange('siteName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteDescription">Site Description</Label>
              <Textarea
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Enable to put the platform in maintenance mode</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => handleInputChange('maintenanceMode', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>User Registration</Label>
                <p className="text-sm text-muted-foreground">Allow new users to register</p>
              </div>
              <Switch
                checked={settings.userRegistration}
                onCheckedChange={(checked) => handleInputChange('userRegistration', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-primary" />
              <span>Notification Settings</span>
            </CardTitle>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Send email notifications to users</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Send SMS notifications to users</p>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => handleInputChange('smsNotifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Game Settings */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-primary" />
              <span>Game Settings</span>
            </CardTitle>
            <CardDescription>Configure game-related settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxRooms">Max Rooms Per User</Label>
              <Input
                id="maxRooms"
                type="number"
                value={settings.maxRoomsPerUser}
                onChange={(e) => handleInputChange('maxRoomsPerUser', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultEntryFee">Default Entry Fee (USDC)</Label>
              <Input
                id="defaultEntryFee"
                type="number"
                step="0.01"
                value={settings.defaultEntryFee}
                onChange={(e) => handleInputChange('defaultEntryFee', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platformFee">Platform Fee (%)</Label>
              <Input
                id="platformFee"
                type="number"
                value={settings.platformFeePercentage}
                onChange={(e) => handleInputChange('platformFeePercentage', parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-primary" />
              <span>Financial Settings</span>
            </CardTitle>
            <CardDescription>Configure withdrawal and deposit limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="minWithdrawal">Minimum Withdrawal (USDC)</Label>
              <Input
                id="minWithdrawal"
                type="number"
                step="0.01"
                value={settings.minWithdrawal}
                onChange={(e) => handleInputChange('minWithdrawal', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxWithdrawal">Maximum Withdrawal (USDC)</Label>
              <Input
                id="maxWithdrawal"
                type="number"
                step="0.01"
                value={settings.maxWithdrawal}
                onChange={(e) => handleInputChange('maxWithdrawal', parseFloat(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-primary" />
            <span>System Status</span>
          </CardTitle>
          <CardDescription>Current system information and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Platform Version</Label>
              <Badge variant="outline" className="text-green-500 border-green-500/30">
                v2.1.0
              </Badge>
            </div>
            <div className="space-y-2">
              <Label>Database Status</Label>
              <Badge variant="outline" className="text-green-500 border-green-500/30">
                Connected
              </Badge>
            </div>
            <div className="space-y-2">
              <Label>API Status</Label>
              <Badge variant="outline" className="text-green-500 border-green-500/30">
                Operational
              </Badge>
            </div>
            <div className="space-y-2">
              <Label>Last Backup</Label>
              <Badge variant="outline" className="text-blue-500 border-blue-500/30">
                2 hours ago
              </Badge>
            </div>
            <div className="space-y-2">
              <Label>Server Uptime</Label>
              <Badge variant="outline" className="text-purple-500 border-purple-500/30">
                15 days
              </Badge>
            </div>
            <div className="space-y-2">
              <Label>Active Sessions</Label>
              <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                3,247
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;