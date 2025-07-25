import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateBudget } from '../lib/firebaseApi';

const categories = [
  'Food & Dining', 'Transportation', 'Entertainment', 'Shopping', 
  'Bills & Utilities', 'Healthcare', 'Education', 'Travel', 'Other'
];

export default function EditBudgetDialog({ budget, onBudgetUpdated, trigger }: {
  budget: any,
  onBudgetUpdated?: () => void,
  trigger: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editBudget, setEditBudget] = useState({ ...budget });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEditBudget = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = {
        category: editBudget.category,
        budgeted: parseFloat(editBudget.budgeted),
        spent: parseFloat(editBudget.spent),
        period: editBudget.period,
        color: editBudget.color,
      };
      await updateBudget(budget.id, data);
      setIsOpen(false);
      if (onBudgetUpdated) onBudgetUpdated();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Budget</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={editBudget.category} onValueChange={(value) => 
              setEditBudget({...editBudget, category: value})
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
              value={editBudget.budgeted}
              onChange={(e) => setEditBudget({...editBudget, budgeted: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="spent">Spent</Label>
            <Input
              id="spent"
              type="number"
              placeholder="0.00"
              value={editBudget.spent}
              onChange={(e) => setEditBudget({...editBudget, spent: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="period">Period</Label>
            <Select value={editBudget.period} onValueChange={(value) => 
              setEditBudget({...editBudget, period: value as 'monthly' | 'weekly' | 'yearly'})
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
          {error && <div className="text-destructive text-center">{error}</div>}
          <Button 
            onClick={handleEditBudget}
            className="w-full bg-gradient-primary"
            disabled={!editBudget.category || !editBudget.budgeted || loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 