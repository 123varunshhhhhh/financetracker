import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Download,
  Upload,
  Trash2,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { gsap } from 'gsap';
import { saveUserSettings, getUserSettings, deleteAccountAndData, changeUserPassword } from '../lib/firebaseApi';
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

// Define types for your settings
type Theme = 'light' | 'dark' | 'system';
type DefaultView = 'dashboard' | 'transactions' | 'budget' | 'analytics';
type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'INR' | 'AUD' | 'BTC' | 'ETH' | 'SOL';
type Timezone = 'America/New_York' | 'America/Chicago' | 'America/Denver' | 'America/Los_Angeles';

interface UserSettings {
  firstName: string;
  lastName: string;
  email: string;
  currency: Currency;
  timezone: Timezone;
  emailNotifications: boolean;
  pushNotifications: boolean;
  budgetAlerts: boolean;
  goalReminders: boolean;
  weeklyReports: boolean;
  dataSharing: boolean;
  analyticsTracking: boolean;
  marketingEmails: boolean;
  theme: Theme;
  compactView: boolean;
  showBalances: boolean;
  defaultView: DefaultView;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  showPasswords: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  firstName: '',
  lastName: '',
  email: '',
  currency: 'USD',
  timezone: 'America/New_York',
  emailNotifications: true,
  pushNotifications: true,
  budgetAlerts: true,
  goalReminders: true,
  weeklyReports: true,
  dataSharing: false,
  analyticsTracking: true,
  marketingEmails: false,
  theme: 'dark',
  compactView: false,
  showBalances: true,
  defaultView: 'dashboard'
};

export function Settings({ onCurrencyChange }: { onCurrencyChange?: (currency: string) => void } = {}) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showPasswords: false
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Helper function to safely parse settings from API
  const parseSettings = (data: any): UserSettings => {
    return {
      ...DEFAULT_SETTINGS,
      ...data,
      theme: ['light', 'dark', 'system'].includes(data?.theme) ? data.theme as Theme : 'dark',
      defaultView: ['dashboard', 'transactions', 'budget', 'analytics'].includes(data?.defaultView)
        ? data.defaultView as DefaultView
        : 'dashboard',
      currency: ['USD', 'EUR', 'GBP', 'CAD', 'INR', 'AUD', 'BTC', 'ETH', 'SOL'].includes(data?.currency) ? data.currency as Currency : 'USD',
      timezone: [
        'America/New_York', 
        'America/Chicago', 
        'America/Denver', 
        'America/Los_Angeles'
      ].includes(data?.timezone) ? data.timezone as Timezone : 'America/New_York'
    };
  };

  useEffect(() => {
    gsap.fromTo('.settings-card',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
    );
    setLoading(true);
    getUserSettings()
      .then((data) => {
        if (data) setSettings(parseSettings(data));
      })
      .catch((err) => toast({ title: "Error", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  // Theme switching effect
  useEffect(() => {
    const applyTheme = (theme: Theme) => {
      const html = document.documentElement;
      if (theme === "system") {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        if (mq.matches) {
          html.classList.add("dark");
        } else {
          html.classList.remove("dark");
        }
        // Listen for system changes
        const handler = (e: MediaQueryListEvent) => {
          if (e.matches) html.classList.add("dark");
          else html.classList.remove("dark");
        };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
      } else if (theme === "dark") {
        html.classList.add("dark");
      } else {
        html.classList.remove("dark");
      }
    };
    applyTheme(settings.theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.theme]);

  const handleSettingChange = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await saveUserSettings(settings);
      toast({ title: "Settings saved", description: "Your settings have been updated." });
      if (onCurrencyChange) {
        onCurrencyChange(settings.currency);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await changeUserPassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showPasswords: false
      });
      toast({ title: "Password updated", description: "Your password has been changed." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Export user data as JSON
  const handleExportData = async () => {
    setLoading(true);
    try {
      const [settingsData, transactions, budgets, goals] = await Promise.all([
        getUserSettings(),
        (await import("../lib/firebaseApi")).getTransactions(),
        (await import("../lib/firebaseApi")).getBudgets(),
        (await import("../lib/firebaseApi")).getGoals(),
      ]);
      const data = { settings: settingsData, transactions, budgets, goals };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fintracker-data.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Export successful", description: "Your data has been downloaded." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Import user data from JSON
  const handleImportData = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      setLoading(true);
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.settings) await saveUserSettings(data.settings);
        if (data.transactions) {
          const { addTransaction } = await import("../lib/firebaseApi");
          for (const t of data.transactions) {
            await addTransaction(t);
          }
        }
        if (data.budgets) {
          const { addBudget } = await import("../lib/firebaseApi");
          for (const b of data.budgets) {
            await addBudget(b);
          }
        }
        if (data.goals) {
          const { addGoal } = await import("../lib/firebaseApi");
          for (const g of data.goals) {
            await addGoal(g);
          }
        }
        toast({ title: "Import successful", description: "Your data has been imported." });
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    setLoading(true);
    try {
      await deleteAccountAndData();
      toast({ title: "Account deleted", description: "Your account has been deleted." });
      setTimeout(() => navigate("/"), 2000);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
        <Button 
          onClick={handleSaveSettings} 
          className="save-button bg-gradient-primary hover:scale-105 transition-transform"
          disabled={loading}
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <Card className="settings-card finance-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={settings.firstName}
                  onChange={(e) => handleSettingChange('firstName', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={settings.lastName}
                  onChange={(e) => handleSettingChange('lastName', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => handleSettingChange('email', e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currency">Default Currency</Label>
                <Select 
                  value={settings.currency} 
                  onValueChange={(value) => handleSettingChange('currency', value as Currency)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">🇺🇸 USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">🇪🇺 EUR - Euro</SelectItem>
                    <SelectItem value="GBP">🇬🇧 GBP - British Pound</SelectItem>
                    <SelectItem value="CAD">🇨🇦 CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="INR">🇮🇳 INR - Indian Rupee</SelectItem>
                    <SelectItem value="AUD">🇦🇺 AUD - Australian Dollar</SelectItem>
                    <SelectItem value="JPY">🇯🇵 JPY - Japanese Yen</SelectItem>
                    <SelectItem value="CNY">🇨🇳 CNY - Chinese Yuan</SelectItem>
                    <SelectItem value="BTC">₿ BTC - Bitcoin</SelectItem>
                    <SelectItem value="ETH">Ξ ETH - Ethereum</SelectItem>
                    <SelectItem value="SOL">◎ SOL - Solana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select 
                  value={settings.timezone} 
                  onValueChange={(value) => handleSettingChange('timezone', value as Timezone)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="settings-card finance-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={handleExportData}
              disabled={loading}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={handleImportData}
              disabled={loading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Data
            </Button>
            <Separator />
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={handleDeleteAccount}
              disabled={loading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Settings */}
        <Card className="settings-card finance-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security & Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={passwordData.showPasswords ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  disabled={loading}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setPasswordData(prev => ({ ...prev, showPasswords: !prev.showPasswords }))}
                  disabled={loading}
                >
                  {passwordData.showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type={passwordData.showPasswords ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type={passwordData.showPasswords ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                disabled={loading}
              />
            </div>

            <Button 
              onClick={handlePasswordChange} 
              className="w-full bg-gradient-primary"
              disabled={loading}
            >
              Update Password
            </Button>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card className="settings-card finance-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Display & Interface
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="theme">Theme</Label>
              <Select 
                value={settings.theme} 
                onValueChange={(value) => handleSettingChange('theme', value as Theme)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="defaultView">Default View</Label>
              <Select 
                value={settings.defaultView} 
                onValueChange={(value) => handleSettingChange('defaultView', value as DefaultView)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                  <SelectItem value="transactions">Transactions</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="compactView">Compact View</Label>
                <Switch
                  id="compactView"
                  checked={settings.compactView}
                  onCheckedChange={(checked) => handleSettingChange('compactView', checked)}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showBalances">Show Account Balances</Label>
                <Switch
                  id="showBalances"
                  checked={settings.showBalances}
                  onCheckedChange={(checked) => handleSettingChange('showBalances', checked)}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Settings */}
      <Card className="settings-card finance-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications & Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Communication</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive important updates via email</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="pushNotifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications in the app</p>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketingEmails">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">Receive product updates and tips</p>
                  </div>
                  <Switch
                    id="marketingEmails"
                    checked={settings.marketingEmails}
                    onCheckedChange={(checked) => handleSettingChange('marketingEmails', checked)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Financial Alerts</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="budgetAlerts">Budget Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when approaching limits</p>
                  </div>
                  <Switch
                    id="budgetAlerts"
                    checked={settings.budgetAlerts}
                    onCheckedChange={(checked) => handleSettingChange('budgetAlerts', checked)}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="goalReminders">Goal Reminders</Label>
                    <p className="text-sm text-muted-foreground">Reminders about your savings goals</p>
                  </div>
                  <Switch
                    id="goalReminders"
                    checked={settings.goalReminders}
                    onCheckedChange={(checked) => handleSettingChange('goalReminders', checked)}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="weeklyReports">Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">Summary of your financial activity</p>
                  </div>
                  <Switch
                    id="weeklyReports"
                    checked={settings.weeklyReports}
                    onCheckedChange={(checked) => handleSettingChange('weeklyReports', checked)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card className="settings-card finance-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Privacy & Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dataSharing">Data Sharing</Label>
                <p className="text-sm text-muted-foreground">Share anonymized data to improve the service</p>
              </div>
              <Switch
                id="dataSharing"
                checked={settings.dataSharing}
                onCheckedChange={(checked) => handleSettingChange('dataSharing', checked)}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="analyticsTracking">Analytics Tracking</Label>
                <p className="text-sm text-muted-foreground">Help us improve the app with usage analytics</p>
              </div>
              <Switch
                id="analyticsTracking"
                checked={settings.analyticsTracking}
                onCheckedChange={(checked) => handleSettingChange('analyticsTracking', checked)}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}