import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateTransaction } from '../lib/firebaseApi';

const categories = {
  income: ['Salary', 'Freelance', 'Investment', 'Business', 'Other Income'],
  expense: ['Food & Dining', 'Transportation', 'Entertainment', 'Bills', 'Shopping', 'Healthcare', 'Other Expense']
};

export default function EditTransactionDialog({ transaction, onTransactionUpdated, trigger }: {
  transaction: any,
  onTransactionUpdated?: () => void,
  trigger: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState({ ...transaction, time: transaction.time || new Date().toTimeString().slice(0,5) });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEditTransaction = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = {
        type: editTransaction.type,
        amount: parseFloat(editTransaction.amount),
        description: editTransaction.description,
        category: editTransaction.category,
        date: editTransaction.date,
        time: editTransaction.time,
      };
      await updateTransaction(transaction.id, data);
      setIsOpen(false);
      if (onTransactionUpdated) onTransactionUpdated();
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
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={editTransaction.type} onValueChange={(value) => 
                setEditTransaction({...editTransaction, type: value as 'income' | 'expense', category: ''})
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={editTransaction.amount}
                onChange={(e) => setEditTransaction({...editTransaction, amount: e.target.value})}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Transaction description"
              value={editTransaction.description}
              onChange={(e) => setEditTransaction({...editTransaction, description: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={editTransaction.category} onValueChange={(value) => 
              setEditTransaction({...editTransaction, category: value})
            }>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories[editTransaction.type].map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={editTransaction.date}
              onChange={(e) => setEditTransaction({...editTransaction, date: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={editTransaction.time}
              onChange={(e) => setEditTransaction({...editTransaction, time: e.target.value})}
            />
          </div>
          {error && <div className="text-destructive text-center">{error}</div>}
          <Button 
            onClick={handleEditTransaction}
            className="w-full bg-gradient-primary"
            disabled={!editTransaction.amount || !editTransaction.description || !editTransaction.category || loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 