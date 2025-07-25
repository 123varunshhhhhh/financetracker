import { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Target,
  Calendar,
  DollarSign,
  TrendingUp,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Flag
} from 'lucide-react';
import { gsap } from 'gsap';
import { getGoals, addGoal, updateGoal, deleteGoal, onGoalsSnapshot, addGoalDeposit, onGoalDepositsSnapshot, GoalDeposit } from "../lib/firebaseApi";
import { CurrencyContext } from './FinTrackerApp';
import { formatCurrency } from '../lib/utils';

interface Goal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused';
  color: string;
  monthlyContribution: number;
}

const categories = [
  'Emergency', 'Travel', 'Transportation', 'Real Estate', 'Investment',
  'Education', 'Technology', 'Health', 'Entertainment', 'Other'
];

interface EditGoalDialogProps {
  goal: Goal;
  onGoalUpdated: () => void;
  trigger: React.ReactNode;
}

function EditGoalDialog({ goal, onGoalUpdated, trigger }: EditGoalDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editedGoal, setEditedGoal] = useState({
    title: goal.title,
    description: goal.description,
    targetAmount: goal.targetAmount.toString(),
    targetDate: goal.targetDate,
    category: goal.category,
    priority: goal.priority,
    monthlyContribution: goal.monthlyContribution.toString(),
    status: goal.status as 'active' | 'completed' | 'paused'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateGoal = async () => {
    setLoading(true);
    setError(null);
    try {
      await updateGoal(goal.id, {
        title: editedGoal.title,
        description: editedGoal.description,
        targetAmount: parseFloat(editedGoal.targetAmount),
        targetDate: editedGoal.targetDate,
        category: editedGoal.category,
        priority: editedGoal.priority,
        monthlyContribution: parseFloat(editedGoal.monthlyContribution),
        status: editedGoal.status as 'active' | 'completed' | 'paused'
      });
      onGoalUpdated();
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Goal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Goal Title</Label>
            <Input
              id="title"
              placeholder="e.g., Emergency Fund"
              value={editedGoal.title}
              onChange={(e) => setEditedGoal({...editedGoal, title: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your goal..."
              value={editedGoal.description}
              onChange={(e) => setEditedGoal({...editedGoal, description: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetAmount">Target Amount</Label>
              <Input
                id="targetAmount"
                type="number"
                placeholder="0.00"
                value={editedGoal.targetAmount}
                onChange={(e) => setEditedGoal({...editedGoal, targetAmount: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="monthlyContribution">Monthly Contribution</Label>
              <Input
                id="monthlyContribution"
                type="number"
                placeholder="0.00"
                value={editedGoal.monthlyContribution}
                onChange={(e) => setEditedGoal({...editedGoal, monthlyContribution: e.target.value})}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={editedGoal.category} onValueChange={(value) => 
                setEditedGoal({...editedGoal, category: value})
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={editedGoal.priority} onValueChange={(value) => 
                setEditedGoal({...editedGoal, priority: value as 'low' | 'medium' | 'high'})
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetDate">Target Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={editedGoal.targetDate}
                onChange={(e) => setEditedGoal({...editedGoal, targetDate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={editedGoal.status} onValueChange={(value) => 
                setEditedGoal({...editedGoal, status: value as 'active' | 'completed' | 'paused'})
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {error && (
            <div className="text-destructive text-sm">{error}</div>
          )}
          
          <Button 
            onClick={handleUpdateGoal}
            className="w-full bg-gradient-primary"
            disabled={!editedGoal.title || !editedGoal.targetAmount || !editedGoal.category || loading}
          >
            {loading ? 'Updating...' : 'Update Goal'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DepositDialog({ goalId, onDeposit }: { goalId: string, onDeposit: (amount: number) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const handleDeposit = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0 || value > 100000) {
      setError('Enter a valid deposit amount (1 - 100,000)');
      return;
    }
    setError(null);
    onDeposit(value);
    setAmount('');
    setIsOpen(false);
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Deposit</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit to Goal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          {error && <div className="text-destructive text-sm">{error}</div>}
          <Button onClick={handleDeposit} className="w-full bg-gradient-primary">Deposit</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalDeposits, setGoalDeposits] = useState<GoalDeposit[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetAmount: '',
    targetDate: '',
    category: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    monthlyContribution: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currency } = useContext(CurrencyContext);

  // Load goals from Firestore
  useEffect(() => {
    setLoading(true);
    const unsubGoals = onGoalsSnapshot((data) => {
      setGoals(
        data.map((g: any) => ({
          ...g,
          id: g.id,
          status: (g.status as 'active' | 'completed' | 'paused') || 'active',
          color: g.color || '#' + Math.floor(Math.random()*16777215).toString(16),
          monthlyContribution: g.monthlyContribution || 0
        }))
      );
      setLoading(false);
    });
    const unsubDeposits = onGoalDepositsSnapshot((deposits) => {
      setGoalDeposits(deposits);
    });
    return () => { unsubGoals(); unsubDeposits(); };
  }, []);

  useEffect(() => {
    gsap.fromTo('.goals-card',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
    );
  }, [goals]);

  // Calculate currentAmount for each goal from deposits
  const goalsWithDeposits = goals.map(goal => {
    const deposits = goalDeposits.filter(d => d.goalId === goal.id);
    const currentAmount = deposits.reduce((sum, d) => sum + d.amount, 0);
    return { ...goal, currentAmount };
  });
  const activeGoals = goalsWithDeposits.filter(goal => goal.status === 'active');
  const completedGoals = goalsWithDeposits.filter(goal => goal.status === 'completed');
  const totalTargetAmount = activeGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrentAmount = activeGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalProgress = (totalCurrentAmount / totalTargetAmount) * 100;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'medium': return 'bg-warning/20 text-warning border-warning/30';
      case 'low': return 'bg-success/20 text-success border-success/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'paused': return <Clock className="h-4 w-4 text-warning" />;
      default: return <Target className="h-4 w-4 text-primary" />;
    }
  };

  const calculateMonthsRemaining = (targetDate: string, currentAmount: number, targetAmount: number, monthlyContribution: number) => {
    const target = new Date(targetDate);
    const now = new Date();
    const monthsUntilTarget = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    if (monthlyContribution === 0) return monthsUntilTarget;
    
    const remainingAmount = targetAmount - currentAmount;
    const monthsNeeded = Math.ceil(remainingAmount / monthlyContribution);
    
    return Math.min(monthsUntilTarget, monthsNeeded);
  };

  // Add goal to Firestore
  const handleAddGoal = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = {
        title: newGoal.title,
        description: newGoal.description,
        targetAmount: parseFloat(newGoal.targetAmount),
        currentAmount: 0,
        targetDate: newGoal.targetDate,
        category: newGoal.category,
        priority: newGoal.priority,
        status: 'active' as 'active',
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
        monthlyContribution: parseFloat(newGoal.monthlyContribution) || 0
      };
      await addGoal(data);
      setNewGoal({
        title: '',
        description: '',
        targetAmount: '',
        targetDate: '',
        category: '',
        priority: 'medium',
        monthlyContribution: ''
      });
      setIsAddDialogOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Delete goal from Firestore
  const handleDeleteGoal = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteGoal(id);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Complete goal (update status)
  const handleCompleteGoal = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const goal = goals.find(g => g.id === id);
      if (!goal) throw new Error('Goal not found');
      await updateGoal(id, { 
        status: 'completed' as 'completed', 
        currentAmount: goal.targetAmount 
      });
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Deposit handler
  const handleDepositToGoal = async (goalId: string, amount: number) => {
    setLoading(true);
    setError(null);
    try {
      await addGoalDeposit(goalId, amount);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Goals</h1>
          <p className="text-muted-foreground">Track your savings goals and milestones</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:scale-105 transition-transform">
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Emergency Fund"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your goal..."
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetAmount">Target Amount</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    placeholder="0.00"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal({...newGoal, targetAmount: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="monthlyContribution">Monthly Contribution</Label>
                  <Input
                    id="monthlyContribution"
                    type="number"
                    placeholder="0.00"
                    value={newGoal.monthlyContribution}
                    onChange={(e) => setNewGoal({...newGoal, monthlyContribution: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newGoal.category} onValueChange={(value) => 
                    setNewGoal({...newGoal, category: value})
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newGoal.priority} onValueChange={(value) => 
                    setNewGoal({...newGoal, priority: value as 'low' | 'medium' | 'high'})
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="targetDate">Target Date</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal({...newGoal, targetDate: e.target.value})}
                />
              </div>
              
              <Button 
                onClick={handleAddGoal}
                className="w-full bg-gradient-primary"
                disabled={!newGoal.title || !newGoal.targetAmount || !newGoal.category}
              >
                Create Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="stats-card hover:scale-105 transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeGoals.length}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card className="stats-card hover:scale-105 transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Target</CardTitle>
            <DollarSign className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{formatCurrency(totalTargetAmount, currency)}</div>
            <p className="text-xs text-muted-foreground">Combined goal amount</p>
          </CardContent>
        </Card>

        <Card className="stats-card hover:scale-105 transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Saved</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalCurrentAmount, currency)}</div>
            <p className="text-xs text-muted-foreground">{totalProgress.toFixed(1)}% of total goals</p>
          </CardContent>
        </Card>

        <Card className="stats-card hover:scale-105 transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Goals</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{completedGoals.length}</div>
            <p className="text-xs text-muted-foreground">Goals achieved</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="finance-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Combined Progress</span>
              <span className="text-sm font-medium">
                {formatCurrency(totalCurrentAmount, currency)} / {formatCurrency(totalTargetAmount, currency)}
              </span>
            </div>
            <Progress value={totalProgress} className="h-3" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{totalProgress.toFixed(1)}% complete</span>
              <span className="text-primary">
                {formatCurrency(totalTargetAmount - totalCurrentAmount, currency)} remaining
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Goals */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Active Goals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeGoals.map((goal) => {
            const percentage = (goal.currentAmount / goal.targetAmount) * 100;
            const monthsRemaining = calculateMonthsRemaining(
              goal.targetDate, 
              goal.currentAmount, 
              goal.targetAmount, 
              goal.monthlyContribution
            );
            
            return (
              <Card key={goal.id} className="goals-card finance-card group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: goal.color }}
                    />
                    <div>
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(goal.status)}
                    <Badge className={getPriorityColor(goal.priority)}>
                      {goal.priority}
                    </Badge>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <EditGoalDialog
                        goal={goal}
                        onGoalUpdated={() => {
                          // No need to reload, listener handles updates
                        }}
                        trigger={
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                        }
                      />
                      {percentage >= 100 ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-success hover:text-success"
                          onClick={() => handleCompleteGoal(goal.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <DepositDialog goalId={goal.id} onDeposit={amount => handleDepositToGoal(goal.id, amount)} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-foreground">
                      {formatCurrency(goal.currentAmount, currency)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      of {formatCurrency(goal.targetAmount, currency)}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <Progress value={Math.min(percentage, 100)} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {percentage.toFixed(1)}% complete
                      </span>
                      <span className="text-primary">
                        {formatCurrency(goal.targetAmount - goal.currentAmount, currency)} remaining
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/30">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Monthly Contribution</div>
                      <div className="font-semibold text-foreground">
                        {formatCurrency(goal.monthlyContribution, currency)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Months Remaining</div>
                      <div className="font-semibold text-foreground">
                        {monthsRemaining > 0 ? monthsRemaining : 'On track!'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Target: {new Date(goal.targetDate).toLocaleDateString()}
                  </div>
                </CardContent>
                {/* Deposit history (optional) */}
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-1">Deposit History:</div>
                  <ul className="text-xs">
                    {goalDeposits.filter(d => d.goalId === goal.id).map(d => (
                      <li key={d.id}>+{formatCurrency(d.amount, currency)} on {new Date(d.date).toLocaleDateString()}</li>
                    ))}
                  </ul>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Completed Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedGoals.map((goal) => (
              <Card key={goal.id} className="goals-card finance-card bg-success/5 border-success/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <CardTitle className="text-base">{goal.title}</CardTitle>
                  </div>
                  <Badge className="bg-success/20 text-success border-success/30">
                    Completed
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-success">
                    {formatCurrency(goal.targetAmount, currency)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {goal.category} • {goal.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}