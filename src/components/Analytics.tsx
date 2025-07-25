import { useEffect, useState, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Download, TrendingUp, TrendingDown, BarChart3, PieChart, Target, DollarSign } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { gsap } from 'gsap';
import { getTransactions, onTransactionsSnapshot } from '../lib/firebaseApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CurrencyContext } from './FinTrackerApp';
import { formatCurrency } from '../lib/utils';

function getLast6MonthsRange() {
  const end = new Date();
  const start = new Date();
  start.setMonth(end.getMonth() - 5);
  start.setDate(1);
  return { start, end };
}

function filterTransactionsByDate(transactions, start, end) {
  return transactions.filter(t => {
    const d = new Date(t.date);
    return d >= start && d <= end;
  });
}

function groupByMonth(transactions) {
  const result = {};
  transactions.forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!result[key]) result[key] = { income: 0, expenses: 0, savings: 0, netWorth: 0, month: key };
    if (t.type === 'income') result[key].income += t.amount;
    if (t.type === 'expense') result[key].expenses += t.amount;
  });
  // Calculate savings and netWorth
  let netWorth = 0;
  Object.values(result).forEach((m: any) => {
    m.savings = m.income - m.expenses;
    netWorth += m.savings;
    m.netWorth = netWorth;
  });
  return Object.values(result).sort((a: any, b: any) => a.month.localeCompare(b.month));
}

function getCategorySpending(transactions) {
  const map = {};
  let total = 0;
  transactions.forEach(t => {
    if (t.type === 'expense') {
      map[t.category] = (map[t.category] || 0) + t.amount;
      total += t.amount;
    }
  });
  return Object.entries(map).map(([category, amount]) => ({
    category,
    amount,
    percentage: total ? Math.round((amount as number) / total * 100) : 0,
    color: '#'+Math.floor(Math.random()*16777215).toString(16)
  }));
}

function downloadCSV(transactions) {
  const header = 'Date,Type,Amount,Category,Description\n';
  const rows = transactions.map(t => `${t.date},${t.type},${t.amount},${t.category},${t.description}`);
  const csv = header + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transactions_report.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const RANGE_OPTIONS = [
  { label: 'Last 1 Day', value: '1d' },
  { label: 'Last 1 Week', value: '1w' },
  { label: 'Last 1 Month', value: '1m' },
  { label: 'Last 3 Months', value: '3m' },
  { label: 'Last 6 Months', value: '6m' },
  { label: 'Custom Range', value: 'custom' },
];

function getRangeDates(option) {
  const end = new Date();
  let start = new Date();
  switch (option) {
    case '1d': start.setDate(end.getDate() - 1); break;
    case '1w': start.setDate(end.getDate() - 7); break;
    case '1m': start.setMonth(end.getMonth() - 1); break;
    case '3m': start.setMonth(end.getMonth() - 3); break;
    case '6m': start.setMonth(end.getMonth() - 6); break;
    default: start = new Date(end); break;
  }
  return { start, end };
}

export function Analytics() {
  const [rangeOption, setRangeOption] = useState('6m');
  const [customRange, setCustomRange] = useState(getLast6MonthsRange());
  const { start, end } = rangeOption === 'custom' ? customRange : getRangeDates(rangeOption);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currency } = useContext(CurrencyContext);

  useEffect(() => {
    gsap.fromTo('.analytics-card',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
    );
    gsap.fromTo('.chart-container',
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.8, delay: 0.2, ease: 'power2.out' }
    );
  }, [transactions]);

  useEffect(() => {
    setLoading(true);
    const unsub = onTransactionsSnapshot((txs) => {
      setTransactions(txs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = filterTransactionsByDate(transactions, start, end);
  const monthlyTrends = groupByMonth(filtered);
  const categorySpending = getCategorySpending(filtered);
  const currentMonth = monthlyTrends[monthlyTrends.length - 1] as any || { income: 0, expenses: 0, savings: 0, netWorth: 0 };
  const previousMonth = monthlyTrends[monthlyTrends.length - 2] as any || { income: 0, expenses: 0, savings: 0, netWorth: 0 };
  const incomeChange = previousMonth.income > 0 ? ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100 : 0;
  const expenseChange = previousMonth.expenses > 0 ? ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100 : 0;
  const savingsChange = previousMonth.savings > 0 ? ((currentMonth.savings - previousMonth.savings) / previousMonth.savings) * 100 : 0;

  // Calculate a dynamic financial score based on savings rate
  const savingsRate = currentMonth.income > 0 ? (currentMonth.savings / currentMonth.income) * 100 : 0;
  const score = Math.max(0, Math.min(100, Math.round(savingsRate)));

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights into your financial health</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={rangeOption} onValueChange={setRangeOption}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {rangeOption === 'custom' && (
            <div className="flex gap-2 mt-2">
              <Input
                type="date"
                value={customRange.start.toISOString().split('T')[0]}
                onChange={e => setCustomRange({ ...customRange, start: new Date(e.target.value) })}
                className="w-36"
              />
              <span>to</span>
              <Input
                type="date"
                value={customRange.end.toISOString().split('T')[0]}
                onChange={e => setCustomRange({ ...customRange, end: new Date(e.target.value) })}
                className="w-36"
              />
            </div>
          )}
          <Button className="bg-gradient-primary hover:scale-105 transition-transform" onClick={() => downloadCSV(filtered)}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
      {loading && <div>Loading analytics...</div>}
      {error && <div className="text-destructive">{error}</div>}
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="analytics-card stats-card hover:scale-105 transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Worth</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(currentMonth?.netWorth, currency)}
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-success mr-1" />
              <span className="text-sm text-success">
                {formatCurrency(currentMonth.savings, currency)} this month
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="analytics-card stats-card hover:scale-105 transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Income</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(currentMonth?.income, currency)}
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-success mr-1" />
              <span className="text-sm text-success">
                {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}% from last month
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="analytics-card stats-card hover:scale-105 transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(currentMonth?.expenses, currency)}
            </div>
            <div className="flex items-center mt-2">
              <TrendingDown className="h-4 w-4 text-destructive mr-1" />
              <span className="text-sm text-destructive">
                {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}% from last month
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="analytics-card stats-card hover:scale-105 transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Savings Rate</CardTitle>
            <Target className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {currentMonth.income > 0 ? ((currentMonth.savings / currentMonth.income) * 100).toFixed(1) : '0.0'}%
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-success mr-1" />
              <span className="text-sm text-success">
                {savingsChange >= 0 ? '+' : ''}{savingsChange.toFixed(1)}% from last month
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Net Worth Trend */}
        <Card className="chart-container finance-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Net Worth Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrends}>
                <defs>
                  <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Area 
                  type="monotone" 
                  dataKey="netWorth" 
                  stroke="hsl(142, 76%, 36%)" 
                  fillOpacity={1} 
                  fill="url(#netWorthGradient)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Income vs Expenses Trend */}
        <Card className="chart-container finance-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Income vs Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Bar dataKey="income" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      {/* Spending Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Categories */}
        <Card className="chart-container finance-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Spending Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categorySpending.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium text-foreground">{category.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">
                      {category.percentage}%
                    </Badge>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(category?.amount, currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Placeholder for Savings Goals Progress or other analytics */}
        <Card className="chart-container finance-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Savings Goals Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 text-muted-foreground">(Connect to backend goals if needed)</div>
          </CardContent>
        </Card>
      </div>
      {/* Financial Health Score (placeholder) */}
      <Card className="chart-container finance-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Financial Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-success">{score}</div>
              <div className="text-sm text-muted-foreground">Overall Score</div>
              <Badge variant="default" className="bg-success/20 text-success border-success/30">
                {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Improvement'}
              </Badge>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Savings Rate</span>
                <span className="text-sm font-medium">
                  {currentMonth.income > 0 ? ((currentMonth.savings / currentMonth.income) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-2">
                <div className="bg-success h-2 rounded-full w-4/5" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Expense Ratio</span>
                <span className="text-sm font-medium">
                  {currentMonth.income > 0 ? (100 - (currentMonth.savings / currentMonth.income) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-2">
                <div className="bg-warning h-2 rounded-full w-2/3" />
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Recommendations</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Increase emergency fund to 6 months</li>
                <li>• Consider reducing dining expenses</li>
                <li>• Explore investment opportunities</li>
                <li>• Set up automatic savings transfers</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}