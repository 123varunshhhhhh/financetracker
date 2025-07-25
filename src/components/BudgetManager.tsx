
import { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  PiggyBank,
  Edit,
  Trash2
} from 'lucide-react';
import { gsap } from 'gsap';
import { getBudgets, addBudget, updateBudget, deleteBudget, getTransactions, onBudgetsSnapshot, onTransactionsSnapshot, resetUserBudgetsAndTransactions, addTransaction } from "../lib/firebaseApi";
import { CurrencyContext } from './FinTrackerApp';
import { formatCurrency } from '../lib/utils';

interface Budget {
  id: string;
  category: string;
  budgeted: number;
  spent: number;
  period: 'monthly' | 'weekly' | 'yearly';
  color: string;
}

const categories = [
  'Food & Dining', 'Transportation', 'Entertainment', 'Shopping',
  'Bills & Utilities', 'Healthcare', 'Education', 'Travel', 'Other'
];

interface EditBudgetDialogProps {
  budget: Budget;
  onBudgetUpdated: () => void;
  trigger: React.ReactNode;
}

function EditBudgetDialog({ budget, onBudgetUpdated, trigger }: EditBudgetDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editedBudget, setEditedBudget] = useState({
    category: budget.category,
    budgeted: budget.budgeted.toString(),
    period: budget.period,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateBudget = async () => {
    setLoading(true);
    setError(null);
    try {
      await updateBudget(budget.id, {
        category: editedBudget.category,
        budgeted: parseFloat(editedBudget.budgeted),
        period: editedBudget.period,
      });
      onBudgetUpdated();
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
          <DialogTitle>Edit Budget</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={editedBudget.category}
              onValueChange={(value) =>
                setEditedBudget({ ...editedBudget, category: value })
              }
            >
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
            <Label htmlFor="budgeted">Budget Amount</Label>
            <Input
              id="budgeted"
              type="number"
              placeholder="0.00"
              value={editedBudget.budgeted}
              onChange={(e) => setEditedBudget({ ...editedBudget, budgeted: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="period">Period</Label>
            <Select
              value={editedBudget.period}
              onValueChange={(value) =>
                setEditedBudget({ ...editedBudget, period: value as 'monthly' | 'weekly' | 'yearly' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="text-destructive text-sm">{error}</div>
          )}

          <Button
            onClick={handleUpdateBudget}
            className="w-full bg-gradient-primary"
            disabled={!editedBudget.category || !editedBudget.budgeted || loading}
          >
            {loading ? 'Updating...' : 'Update Budget'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SpendDialog({ category }: { category: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handleSpend = async () => {
    setLoading(true);
    setError(null);
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0 || value > 100000) {
      setError('Enter a valid spend amount (1 - 100,000)');
      setLoading(false);
      return;
    }
    try {
      await addTransaction({
        type: 'expense',
        amount: value,
        description,
        category,
        date: new Date().toISOString().split('T')[0],
      });
      setAmount('');
      setDescription('');
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Spend</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record a Spend</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          {error && <div className="text-destructive text-sm">{error}</div>}
          <Button onClick={handleSpend} className="w-full bg-gradient-primary" disabled={loading}>Spend</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BudgetManager() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBudget, setNewBudget] = useState({
    category: '',
    budgeted: '',
    period: 'monthly' as 'monthly' | 'weekly' | 'yearly'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const { currency } = useContext(CurrencyContext);

  useEffect(() => {
    setLoading(true);
    // Subscribe to real-time updates for budgets and transactions
    const unsubBudgets = onBudgetsSnapshot((budgetsData) => {
      setBudgets(
        budgetsData.map((b: any) => ({
          ...b,
          id: b.id,
          spent: 0, // will be calculated below
          color: b.color || '#' + Math.floor(Math.random()*16777215).toString(16)
        }))
      );
      setLoading(false);
    });
    const unsubTransactions = onTransactionsSnapshot((transactionsData) => {
      setTransactions(transactionsData);
    });
    return () => {
      unsubBudgets();
      unsubTransactions();
    };
  }, []);

  useEffect(() => {
    gsap.fromTo('.budget-card',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
    );
  }, [budgets]);

  // Calculate spent for each budget from transactions
  const budgetsWithSpent = budgets.map(budget => {
    const spent = transactions
      .filter(t => t.type === 'expense' && t.category === budget.category)
      .reduce((sum, t) => sum + t.amount, 0);
    return { ...budget, spent };
  });

  const totalBudgeted = budgetsWithSpent.reduce((sum, budget) => sum + budget.budgeted, 0);
  const totalSpent = budgetsWithSpent.reduce((sum, budget) => sum + budget.spent, 0);
  const remainingBudget = totalBudgeted - totalSpent;

  const getProgressColor = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100;
    if (percentage >= 100) return 'bg-destructive';
    if (percentage >= 80) return 'bg-warning';
    return 'bg-success';
  };

  const getStatusBadge = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100;
    if (percentage >= 100) return { text: 'Over Budget', variant: 'destructive' as const };
    if (percentage >= 80) return { text: 'Close to Limit', variant: 'secondary' as const };
    return { text: 'On Track', variant: 'default' as const };
  };

  const handleAddBudget = async () => {
    setLoading(true);
    setError(null);
    setBudgetError(null);
    const amount = parseFloat(newBudget.budgeted);
    if (!newBudget.category || isNaN(amount) || amount <= 0 || amount > 100000) {
      setBudgetError('Please enter a valid budget amount (1 - 100,000) and select a category.');
      setLoading(false);
      return;
    }
    try {
      const data = {
        category: newBudget.category,
        budgeted: amount,
        spent: 0,
        period: newBudget.period,
        color: '#' + Math.floor(Math.random()*16777215).toString(16)
      };
      await addBudget(data);
      setNewBudget({ category: '', budgeted: '', period: 'monthly' });
      setIsAddDialogOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleDeleteBudget = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteBudget(id);
      // No need to refetch budgets and transactions here, they are already live
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleResetData = async () => {
    setResetLoading(true);
    setError(null);
    try {
      await resetUserBudgetsAndTransactions();
    } catch (err: any) {
      setError(err.message);
    }
    setResetLoading(false);
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Budget Manager</h1>
          <p className="text-muted-foreground">Track and manage your spending limits</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:scale-105 transition-transform">
                <Plus className="w-4 h-4 mr-2" />
                Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Budget</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newBudget.category} onValueChange={(value) =>
                    setNewBudget({ ...newBudget, category: value })
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
                  <Label htmlFor="budgeted">Budget Amount</Label>
                  <Input
                    id="budgeted"
                    type="number"
                    placeholder="0.00"
                    value={newBudget.budgeted}
                    onChange={(e) => setNewBudget({ ...newBudget, budgeted: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="period">Period</Label>
                  <Select value={newBudget.period} onValueChange={(value) =>
                    setNewBudget({ ...newBudget, period: value as 'monthly' | 'weekly' | 'yearly' })
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddBudget}
                  className="w-full bg-gradient-primary"
                  disabled={!newBudget.category || !newBudget.budgeted || loading}
                >
                  Create Budget
                </Button>
                {budgetError && (
                  <div className="text-destructive text-sm mt-2">{budgetError}</div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          {process.env.NODE_ENV !== 'production' && (
            <Button
              className="ml-4 bg-destructive hover:bg-destructive/80"
              onClick={handleResetData}
              disabled={resetLoading}
            >
              {resetLoading ? 'Resetting...' : 'Reset Data'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="stats-card hover:scale-105 transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
            <PiggyBank className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalBudgeted, currency)}</div>
            <p className="text-xs text-muted-foreground">Monthly allocation</p>
          </CardContent>
        </Card>

        <Card className="stats-card hover:scale-105 transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalSpent, currency)}</div>
            <p className="text-xs text-muted-foreground">{((totalSpent / totalBudgeted) * 100).toFixed(1)}% of budget</p>
          </CardContent>
        </Card>

        <Card className="stats-card hover:scale-105 transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
            {remainingBudget >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remainingBudget >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(Math.abs(remainingBudget), currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {remainingBudget >= 0 ? 'Under budget' : 'Over budget'}
            </p>
          </CardContent>
        </Card>

        <Card className="stats-card hover:scale-105 transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{budgetsWithSpent.length}</div>
            <p className="text-xs text-muted-foreground">Active budgets</p>
          </CardContent>
        </Card>
      </div>

      <Card className="finance-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Overall Budget Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Monthly Progress</span>
              <span className="text-sm font-medium">
                {formatCurrency(totalSpent, currency)} / {formatCurrency(totalBudgeted, currency)}
              </span>
            </div>
            <Progress
              value={(totalSpent / totalBudgeted) * 100}
              className="h-3"
            />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {((totalSpent / totalBudgeted) * 100).toFixed(1)}% used
              </span>
              <span className={remainingBudget >= 0 ? 'text-success' : 'text-destructive'}>
                {formatCurrency(Math.abs(remainingBudget), currency)} {remainingBudget >= 0 ? 'remaining' : 'over'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgetsWithSpent.map((budget) => {
          const percentage = (budget.spent / budget.budgeted) * 100;
          const status = getStatusBadge(budget.spent, budget.budgeted);

          return (
            <Card key={budget.id} className="budget-card finance-card group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: budget.color }}
                  />
                  <CardTitle className="text-lg">{budget.category}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={status.variant} className="text-xs">
                    {status.text}
                  </Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <EditBudgetDialog
                      budget={budget}
                      onBudgetUpdated={async () => {
                        // No need to refetch budgets and transactions here, they are already live
                      }}
                      trigger={
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteBudget(budget.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-foreground">
                    {formatCurrency(budget.spent, currency)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    of {formatCurrency(budget.budgeted, currency)} ({budget.period})
                  </span>
                </div>
                <div className="space-y-2">
                  <Progress
                    value={Math.min(percentage, 100)}
                    className="h-2"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {percentage.toFixed(1)}% used
                    </span>
                    <span className={percentage >= 100 ? 'text-destructive' : 'text-success'}>
                      {formatCurrency(budget.budgeted - budget.spent, currency)} {percentage >= 100 ? 'over' : 'left'}
                    </span>
                  </div>
                </div>
                {percentage >= 80 && (
                  <div className={`flex items-center gap-2 p-2 rounded-lg ${
                    percentage >= 100 ? 'bg-destructive/20' : 'bg-warning/20'
                  }`}>
                    <AlertTriangle className={`h-4 w-4 ${
                      percentage >= 100 ? 'text-destructive' : 'text-warning'
                    }`} />
                    <span className={`text-sm ${
                      percentage >= 100 ? 'text-destructive' : 'text-warning'
                    }`}>
                      {percentage >= 100 ? 'Budget exceeded!' : 'Approaching budget limit'}
                    </span>
                  </div>
                )}
                <SpendDialog category={budget.category} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
