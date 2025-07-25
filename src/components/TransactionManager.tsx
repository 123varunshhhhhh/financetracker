import { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  DollarSign,
  Edit,
  Trash2
} from 'lucide-react';
import { gsap } from 'gsap';
import { getTransactions, addTransaction, updateTransaction, deleteTransaction, onTransactionsSnapshot } from "../lib/firebaseApi";
import AddTransactionDialog from "./AddTransactionDialog";
import EditTransactionDialog from "./EditTransactionDialog";
import { CurrencyContext } from './FinTrackerApp';
import { formatCurrency } from '../lib/utils';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  time?: string;
}

const categories = {
  income: ['Salary', 'Freelance', 'Investment', 'Business', 'Other Income'],
  expense: ['Food & Dining', 'Transportation', 'Entertainment', 'Bills', 'Shopping', 'Healthcare', 'Other Expense']
};

export function TransactionManager() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { currency } = useContext(CurrencyContext);

  // Real-time listener for transactions
  useEffect(() => {
    setLoading(true);
    const unsub = onTransactionsSnapshot((txs) => {
      setTransactions(txs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    gsap.fromTo('.transaction-card',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: 'power2.out' }
    );
  }, [transactions]);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
    const matchesType = selectedType === 'all' || transaction.type === selectedType;
    const matchesDate = !selectedDate || transaction.date === selectedDate;
    return matchesSearch && matchesCategory && matchesType && matchesDate;
  });

  // Add transaction to Firestore
  const handleAddTransaction = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = {
        type: newTransaction.type,
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
        category: newTransaction.category,
        date: newTransaction.date,
      };
      await addTransaction(data);
      // Reload transactions
      const updated = await getTransactions();
      setTransactions(updated);
      setNewTransaction({
        type: 'expense',
        amount: '',
        description: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
      });
      setIsAddDialogOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Delete transaction from Firestore
  const handleDeleteTransaction = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteTransaction(id);
      // Reload transactions
      const updated = await getTransactions();
      setTransactions(updated);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  // TODO: Implement updateTransaction for edit button

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Add a handler to reload transactions after adding
  const reloadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (err: any) {
      setError((err as Error).message);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground">Manage your income and expenses</p>
        </div>
        <AddTransactionDialog onTransactionAdded={reloadTransactions} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="stats-card hover:scale-105 transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalIncome, currency)}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>

        <Card className="stats-card hover:scale-105 transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses, currency)}</div>
            <p className="text-xs text-muted-foreground">+5.2% from last month</p>
          </CardContent>
        </Card>

        <Card className="stats-card hover:scale-105 transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(totalIncome - totalExpenses, currency)}
            </div>
            <p className="text-xs text-muted-foreground">Current period</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="finance-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {[...categories.income, ...categories.expense].map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              <Input
                type="date"
                value={selectedDate || ''}
                onChange={e => setSelectedDate(e.target.value || null)}
                className="w-full md:w-40"
                placeholder="Filter by date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="finance-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Recent Transactions ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading && <p className="text-center py-12">Loading transactions...</p>}
            {error && <p className="text-center py-12 text-destructive">{error}</p>}
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="transaction-card flex items-center justify-between p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      transaction.type === 'income' ? 'bg-success/20' : 'bg-destructive/20'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="w-6 h-6 text-success" />
                      ) : (
                        <ArrowDownRight className="w-6 h-6 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{transaction.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {transaction.category}
                        </Badge>
                        {transaction.date && (
                          <span className="text-xs text-muted-foreground">{transaction.date}</span>
                        )}
                        <span className="text-xs text-primary font-mono">{transaction.time || '12:00'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={`text-xl font-bold ${
                      transaction.type === 'income' ? 'text-success' : 'text-destructive'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, currency)}
                    </div>
                    
                    <EditTransactionDialog
                      transaction={transaction}
                      onTransactionUpdated={reloadTransactions}
                      trigger={
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-yellow-400 hover:bg-yellow-500">
                          <Edit className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteTransaction(transaction.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No transactions found matching your criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}