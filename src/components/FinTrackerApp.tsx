import React, { useState, createContext, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { gsap } from 'gsap';
import Lenis from '@studio-freight/lenis';
import { RequireAuth } from './RequireAuth';
import { getUserSettings, saveUserSettings } from '../lib/firebaseApi';
import { CurrencyConverter } from './CurrencyConverter';
import { Menu, X } from 'lucide-react';
import { Dashboard } from '@/components/Dashboard';
import { TransactionManager } from '@/components/TransactionManager';
import { BudgetManager } from '@/components/BudgetManager';
import { Analytics } from '@/components/Analytics';
import { Goals } from '@/components/Goals';
import { Settings } from '@/components/Settings';
import { EnhancementRoadmap } from '@/components/EnhancementRoadmap';
import { useSimpleCurrencyConversion } from '../hooks/useSimpleCurrencyConversion';
import FinTrackerLogo from './FinTrackerLogo';

export type View = 'dashboard' | 'transactions' | 'budget' | 'analytics' | 'goals' | 'settings' | 'roadmap';

// Create and export the context
export const SidebarContext = createContext<{ currentView: View, setCurrentView: (v: View) => void }>({
  currentView: 'dashboard',
  setCurrentView: () => {},
});

export const CurrencyContext = createContext<{ 
  currency: string;
  setCurrency: (currency: string) => Promise<void>;
  isConverting: boolean;
}>({ 
  currency: 'USD',
  setCurrency: async () => {},
  isConverting: false
});

const FinTrackerApp = () => {
  console.log('FinTrackerApp rendering...');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [currency, setCurrencyState] = useState('USD');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isConverting } = useSimpleCurrencyConversion();

  useEffect(() => {
    getUserSettings()
      .then(settings => {
        if (settings && settings.currency) setCurrencyState(settings.currency);
      })
      .catch(err => {
        if (err.message === 'Not authenticated') {
          console.warn('User not authenticated, redirect or show login.');
        } else {
          console.error(err);
        }
      });
  }, []);

  const setCurrency = async (newCurrency: string) => {
    if (newCurrency === currency) return;
    
    try {
      // Update the currency in state
      setCurrencyState(newCurrency);
      
      // Save to user settings
      const currentSettings = await getUserSettings();
      await saveUserSettings({
        ...currentSettings,
        currency: newCurrency
      });
      
      console.log(`Currency changed to ${newCurrency}`);
    } catch (error) {
      console.error('Failed to change currency:', error);
      // Revert on error
      setCurrencyState(currency);
    }
  };

  // Enhanced renderView with all components
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <RequireAuth><Dashboard /></RequireAuth>;
      case 'transactions':
        return <RequireAuth><TransactionManager /></RequireAuth>;
      case 'budget':
        return <RequireAuth><BudgetManager /></RequireAuth>;
      case 'analytics':
        return <RequireAuth><Analytics /></RequireAuth>;
      case 'goals':
        return <RequireAuth><Goals /></RequireAuth>;
      case 'settings':
        return <RequireAuth><Settings onCurrencyChange={setCurrency} /></RequireAuth>;
      case 'roadmap':
        return <RequireAuth><EnhancementRoadmap /></RequireAuth>;
      default:
        return <RequireAuth><Dashboard /></RequireAuth>;
    }
  };

  console.log('About to render FinTrackerApp');
  
  return (
    <SidebarContext.Provider value={{ currentView, setCurrentView }}>
      <CurrencyContext.Provider value={{ currency, setCurrency, isConverting }}>
        <div className="min-h-screen w-full bg-gradient-to-br from-background to-muted/20">
          {/* Mobile Hamburger */}
          <button
            className="md:hidden fixed top-4 left-4 z-40 bg-background p-2 rounded-full shadow-lg border border-border/30"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          {/* Sidebar Overlay for Mobile */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
          )}
          <div className="flex flex-col md:flex-row w-full">
            {/* Enhanced Sidebar */}
            <div
              className={`bg-gradient-card border-r border-border/50 p-4 md:static fixed z-40 top-0 left-0 h-full md:h-auto md:relative transition-all duration-300
                w-72 md:w-72
                ${sidebarOpen ? 'block' : 'hidden'} md:block
              `}
            >
              {/* Close button for mobile */}
              <button
                className="md:hidden absolute top-4 right-4 z-50 bg-background p-2 rounded-full shadow-lg border border-border/30"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl md:text-xl font-bold text-foreground">FinTracker</h1>
                  <p className="text-sm md:text-sm text-muted-foreground">Smart Finance Manager</p>
                </div>
              </div>
              
              <nav className="space-y-2">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                  { id: 'transactions', label: 'Transactions', icon: '💳' },
                  { id: 'budget', label: 'Budget', icon: '🏦' },
                  { id: 'analytics', label: 'Analytics', icon: '📈' },
                  { id: 'goals', label: 'Goals', icon: '🎯' },
                  { id: 'settings', label: 'Settings', icon: '⚙️' },
                  { id: 'roadmap', label: 'Roadmap', icon: '🚀' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id as View)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                      currentView === item.id
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <main className="flex-1 p-2 md:p-6">
              {renderView()}
            </main>
          </div>
        </div>
      </CurrencyContext.Provider>
    </SidebarContext.Provider>
  );
};

export default FinTrackerApp;