import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { addTransaction, getTransactions } from '../lib/firebaseApi';

const categories = {
  income: ['Salary', 'Freelance', 'Investment', 'Business', 'Other Income'],
  expense: ['Food & Dining', 'Transportation', 'Entertainment', 'Bills', 'Shopping', 'Healthcare', 'Other Expense']
};

export default function AddTransactionDialog({ onTransactionAdded }: { onTransactionAdded?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0,5) // default to current time in HH:MM
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const handleAddTransaction = async () => {
    setLoading(true);
    setError(null);
    setTransactionError(null);
    const amount = parseFloat(newTransaction.amount);
    if (!newTransaction.category || isNaN(amount) || amount <= 0 || amount > 100000) {
      setTransactionError('Please enter a valid amount (1 - 100,000) and select a category.');
      setLoading(false);
      return;
    }
    try {
      const data = {
        type: newTransaction.type,
        amount: amount,
        description: newTransaction.description,
        category: newTransaction.category,
        date: newTransaction.date,
        time: newTransaction.time,
      };
      await addTransaction(data);
      setNewTransaction({
        type: 'expense',
        amount: '',
        description: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0,5)
      });
      setIsOpen(false);
      if (onTransactionAdded) onTransactionAdded();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:scale-105 transition-transform">
          <Plus className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={newTransaction.type} onValueChange={(value) => 
                setNewTransaction({...newTransaction, type: value as 'income' | 'expense', category: ''})
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
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Transaction description"
              value={newTransaction.description}
              onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={newTransaction.category} onValueChange={(value) => 
              setNewTransaction({...newTransaction, category: value})
            }>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories[newTransaction.type].map((category) => (
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
              value={newTransaction.date}
              onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={newTransaction.time}
              onChange={(e) => setNewTransaction({...newTransaction, time: e.target.value})}
            />
          </div>
          {error && <div className="text-destructive text-center">{error}</div>}
          <Button 
            onClick={handleAddTransaction}
            className="w-full bg-gradient-primary"
            disabled={!newTransaction.category || !newTransaction.amount || loading}
          >
            {loading ? 'Adding...' : 'Add Transaction'}
          </Button>
          {transactionError && (
            <div className="text-destructive text-sm mt-2">{transactionError}</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 