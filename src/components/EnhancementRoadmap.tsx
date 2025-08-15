import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Lightbulb,
  Zap,
  Target,
  Clock,
  CheckCircle,
  Circle,
  Star,
  TrendingUp,
  Smartphone,
  Brain,
  Shield,
  Users,
  BarChart3,
  Wallet,
  Bell,
  Camera,
  Download,
  Repeat,
  PieChart,
  Calculator,
  Globe,
  Banknote
} from 'lucide-react';

interface Enhancement {
  id: string;
  title: string;
  description: string;
  category: 'analytics' | 'automation' | 'mobile' | 'ai' | 'social' | 'integration';
  priority: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  status: 'planned' | 'in-progress' | 'completed';
  icon: any;
  benefits: string[];
  technicalRequirements: string[];
}

const ENHANCEMENTS: Enhancement[] = [
  {
    id: 'currency-conversion',
    title: 'Real-time Currency Conversion',
    description: 'Automatic currency conversion with live exchange rates when switching currencies',
    category: 'integration',
    priority: 'high',
    difficulty: 'medium',
    estimatedTime: '2-3 days',
    status: 'completed',
    icon: Banknote,
    benefits: [
      'Accurate financial data across currencies',
      'Better international user experience',
      'Real-time exchange rate updates'
    ],
    technicalRequirements: [
      'Exchange rate API integration',
      'Currency conversion hooks',
      'Local storage for offline rates'
    ]
  },
  {
    id: 'recurring-transactions',
    title: 'Recurring Transactions',
    description: 'Automatically add recurring income and expenses like salary, rent, subscriptions',
    category: 'automation',
    priority: 'high',
    difficulty: 'medium',
    estimatedTime: '3-4 days',
    status: 'planned',
    icon: Repeat,
    benefits: [
      'Reduce manual data entry',
      'Never miss recurring transactions',
      'Better budget accuracy'
    ],
    technicalRequirements: [
      'Cron job system',
      'Recurring transaction schema',
      'Notification system integration'
    ]
  },
  {
    id: 'ai-categorization',
    title: 'AI-Powered Smart Categorization',
    description: 'Automatically categorize transactions using machine learning',
    category: 'ai',
    priority: 'high',
    difficulty: 'hard',
    estimatedTime: '1-2 weeks',
    status: 'planned',
    icon: Brain,
    benefits: [
      'Automatic transaction categorization',
      'Learning from user behavior',
      'Improved data accuracy'
    ],
    technicalRequirements: [
      'ML model training',
      'Natural language processing',
      'User feedback system'
    ]
  },
  {
    id: 'receipt-scanner',
    title: 'Receipt Scanner & OCR',
    description: 'Scan receipts with camera and extract transaction data automatically',
    category: 'mobile',
    priority: 'medium',
    difficulty: 'hard',
    estimatedTime: '1-2 weeks',
    status: 'planned',
    icon: Camera,
    benefits: [
      'Quick expense entry',
      'Accurate transaction data',
      'Digital receipt storage'
    ],
    technicalRequirements: [
      'OCR integration (Tesseract.js)',
      'Image processing',
      'Camera API access'
    ]
  },
  {
    id: 'predictive-analytics',
    title: 'Predictive Financial Analytics',
    description: 'Forecast future expenses and income based on historical data',
    category: 'analytics',
    priority: 'medium',
    difficulty: 'hard',
    estimatedTime: '1-2 weeks',
    status: 'planned',
    icon: TrendingUp,
    benefits: [
      'Future spending predictions',
      'Budget optimization suggestions',
      'Financial planning insights'
    ],
    technicalRequirements: [
      'Time series analysis',
      'Statistical modeling',
      'Data visualization updates'
    ]
  },
  {
    id: 'bank-integration',
    title: 'Bank Account Integration',
    description: 'Connect to bank APIs for automatic transaction import',
    category: 'integration',
    priority: 'high',
    difficulty: 'hard',
    estimatedTime: '2-3 weeks',
    status: 'planned',
    icon: Wallet,
    benefits: [
      'Automatic transaction sync',
      'Real-time account balances',
      'Reduced manual entry'
    ],
    technicalRequirements: [
      'Open Banking API integration',
      'OAuth 2.0 implementation',
      'Bank-grade security measures'
    ]
  },
  {
    id: 'pwa-mobile',
    title: 'Progressive Web App (PWA)',
    description: 'Convert to PWA with offline support and mobile app features',
    category: 'mobile',
    priority: 'medium',
    difficulty: 'medium',
    estimatedTime: '1 week',
    status: 'planned',
    icon: Smartphone,
    benefits: [
      'Offline functionality',
      'App-like mobile experience',
      'Push notifications'
    ],
    technicalRequirements: [
      'Service worker implementation',
      'Offline data caching',
      'PWA manifest configuration'
    ]
  },
  {
    id: 'family-sharing',
    title: 'Family & Shared Budgets',
    description: 'Share budgets and expenses with family members or roommates',
    category: 'social',
    priority: 'medium',
    difficulty: 'hard',
    estimatedTime: '2-3 weeks',
    status: 'planned',
    icon: Users,
    benefits: [
      'Collaborative budgeting',
      'Expense splitting',
      'Family financial planning'
    ],
    technicalRequirements: [
      'Multi-user authentication',
      'Permission system',
      'Real-time collaboration'
    ]
  },
  {
    id: 'investment-tracking',
    title: 'Investment Portfolio Tracking',
    description: 'Track stocks, crypto, and other investments alongside regular finances',
    category: 'analytics',
    priority: 'medium',
    difficulty: 'medium',
    estimatedTime: '1-2 weeks',
    status: 'planned',
    icon: BarChart3,
    benefits: [
      'Complete financial picture',
      'Investment performance tracking',
      'Portfolio diversification insights'
    ],
    technicalRequirements: [
      'Stock/crypto API integration',
      'Portfolio calculation engine',
      'Advanced charting'
    ]
  },
  {
    id: 'smart-notifications',
    title: 'Smart Financial Notifications',
    description: 'AI-powered notifications for spending patterns, bill reminders, and goals',
    category: 'ai',
    priority: 'medium',
    difficulty: 'medium',
    estimatedTime: '1 week',
    status: 'planned',
    icon: Bell,
    benefits: [
      'Proactive financial alerts',
      'Spending pattern insights',
      'Goal achievement reminders'
    ],
    technicalRequirements: [
      'Notification scheduling system',
      'Pattern recognition algorithms',
      'User preference management'
    ]
  }
];

const CATEGORY_INFO = {
  analytics: { name: 'Analytics & Insights', color: 'bg-blue-500', icon: BarChart3 },
  automation: { name: 'Automation', color: 'bg-green-500', icon: Zap },
  mobile: { name: 'Mobile Experience', color: 'bg-purple-500', icon: Smartphone },
  ai: { name: 'AI & Machine Learning', color: 'bg-orange-500', icon: Brain },
  social: { name: 'Social & Collaboration', color: 'bg-pink-500', icon: Users },
  integration: { name: 'Integrations', color: 'bg-indigo-500', icon: Globe },
};

export function EnhancementRoadmap() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const filteredEnhancements = ENHANCEMENTS.filter(enhancement => {
    const categoryMatch = selectedCategory === 'all' || enhancement.category === selectedCategory;
    const priorityMatch = selectedPriority === 'all' || enhancement.priority === selectedPriority;
    return categoryMatch && priorityMatch;
  });

  const completedCount = ENHANCEMENTS.filter(e => e.status === 'completed').length;
  const inProgressCount = ENHANCEMENTS.filter(e => e.status === 'in-progress').length;
  const plannedCount = ENHANCEMENTS.filter(e => e.status === 'planned').length;
  const totalCount = ENHANCEMENTS.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  const EnhancementCard = ({ enhancement }: { enhancement: Enhancement }) => {
    const categoryInfo = CATEGORY_INFO[enhancement.category];
    const Icon = enhancement.icon;

    return (
      <Card className="finance-card hover:scale-[1.02] transition-all duration-300">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${categoryInfo.color} text-white`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{enhancement.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={enhancement.priority === 'high' ? 'destructive' : enhancement.priority === 'medium' ? 'default' : 'secondary'}>
                    {enhancement.priority} priority
                  </Badge>
                  <Badge variant="outline">
                    {enhancement.difficulty} difficulty
                  </Badge>
                  <Badge variant="secondary">
                    {enhancement.estimatedTime}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {enhancement.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {enhancement.status === 'in-progress' && <Clock className="h-5 w-5 text-yellow-500" />}
              {enhancement.status === 'planned' && <Circle className="h-5 w-5 text-gray-400" />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{enhancement.description}</p>
          
          <div>
            <h4 className="font-semibold text-sm mb-2">Benefits</h4>
            <ul className="space-y-1">
              {enhancement.benefits.map((benefit, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                  <Star className="h-3 w-3 text-yellow-500" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2">Technical Requirements</h4>
            <ul className="space-y-1">
              {enhancement.technicalRequirements.map((req, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                  <Target className="h-3 w-3 text-blue-500" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Lightbulb className="h-8 w-8 text-yellow-500" />
            Enhancement Roadmap
          </h1>
          <p className="text-muted-foreground">Future features and improvements for FinTracker</p>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="finance-card">
        <CardHeader>
          <CardTitle>Development Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{completedCount}/{totalCount} completed</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{completedCount}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">{inProgressCount}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-500">{plannedCount}</div>
                <div className="text-sm text-muted-foreground">Planned</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all" onClick={() => setSelectedCategory('all')}>All</TabsTrigger>
          {Object.entries(CATEGORY_INFO).map(([key, info]) => {
            const Icon = info.icon;
            return (
              <TabsTrigger 
                key={key} 
                value={key} 
                onClick={() => setSelectedCategory(key)}
                className="flex items-center gap-1"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{info.name.split(' ')[0]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredEnhancements.map((enhancement) => (
              <EnhancementCard key={enhancement.id} enhancement={enhancement} />
            ))}
          </div>
        </TabsContent>

        {Object.keys(CATEGORY_INFO).map((category) => (
          <TabsContent key={category} value={category} className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {ENHANCEMENTS.filter(e => e.category === category).map((enhancement) => (
                <EnhancementCard key={enhancement.id} enhancement={enhancement} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Call to Action */}
      <Card className="finance-card bg-gradient-primary text-primary-foreground">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-bold mb-2">Want to Contribute?</h3>
          <p className="mb-4 opacity-90">
            Help us build these features! Check out our GitHub repository and contribute to the project.
          </p>
          <Button variant="secondary" className="bg-white text-primary hover:bg-white/90">
            View on GitHub
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}