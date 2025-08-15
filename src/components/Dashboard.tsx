import { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Wallet,
  CreditCard,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
  DollarSign,
  PieChart,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { gsap } from "gsap";
import AddTransactionDialog from "./AddTransactionDialog";
import { SidebarContext, CurrencyContext } from "./FinTrackerApp";
import {
  getTransactions,
  getUserSettings,
  onTransactionsSnapshot,
  onBudgetsSnapshot,
  onGoalsSnapshot,
  onGoalDepositsSnapshot,
  GoalDeposit,
  Goal,
} from "../lib/firebaseApi";
import { auth } from "../firebaseConfig";
import { formatCurrency } from "../lib/utils";
import { DashboardSkeleton } from "./LoadingSkeleton";
import { useConvertedTransactions } from "./CurrencyDisplay";

// --- Type Definitions ---
interface Transaction {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  type: "income" | "expense";
  createdAt: string;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

interface ExpenseCategory {
  name: string;
  value: number;
  color: string;
  percentage?: number;
}

export function Dashboard() {
  // All hooks at the top
  const [balanceVisible, setBalanceVisible] = useState(true);
  const { setCurrentView } = useContext(SidebarContext);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [budgets, setBudgets] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [goals, setGoals] = useState<Goal[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [goalDeposits, setGoalDeposits] = useState<GoalDeposit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [user, setUser] = useState<any>(null);
  const { currency } = useContext(CurrencyContext);

  // Track auth state
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(setUser);
    return () => unsub();
  }, []);

  // Real-time listeners for all data (only after auth)
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsubTx = onTransactionsSnapshot((txs) => {
      setTransactions(txs);
      setLoading(false);
    });
    const unsubBudgets = onBudgetsSnapshot((budgets) => setBudgets(budgets));
    const unsubGoals = onGoalsSnapshot((goals) => setGoals(goals));
    const unsubGoalDeposits = onGoalDepositsSnapshot((deposits) =>
      setGoalDeposits(deposits)
    );
    // User settings (one-time fetch is fine)
    getUserSettings().then((settings) => {
      if (settings) {
        const nameParts = [settings.firstName, settings.lastName].filter(
          Boolean
        );
        setUserName(nameParts.join(" "));
      }
    });
    return () => {
      unsubTx();
      unsubBudgets();
      unsubGoals();
      unsubGoalDeposits();
    };
  }, [user]);

  // Animation effects
  useEffect(() => {
    gsap.fromTo(
      ".dashboard-card",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
    );
    gsap.fromTo(
      ".chart-container",
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.8, delay: 0.3, ease: "power2.out" }
    );
  }, []);

  if (!user) {
    return (
      <div className="text-center py-12 text-lg">
        Loading... Please sign in to view your dashboard.
      </div>
    );
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  // Use converted transactions
  const { convertedTransactions } = useConvertedTransactions(
    transactions,
    "USD"
  );

  // Compute monthly summaries from converted transactions
  const groupByMonth = (transactions: any[]): MonthlyData[] => {
    const result: Record<string, MonthlyData> = {};
    transactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      if (!result[key])
        result[key] = { income: 0, expenses: 0, savings: 0, month: key };
      if (t.type === "income") result[key].income += t.amount;
      if (t.type === "expense") result[key].expenses += t.amount;
    });
    return Object.values(result)
      .map((m) => ({ ...m, savings: m.income - m.expenses }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };
  const monthlyData: MonthlyData[] = groupByMonth(convertedTransactions);

  // Compute expense categories from converted transactions
  const getExpenseCategories = (transactions: any[]): ExpenseCategory[] => {
    const map: Record<string, number> = {};
    let total = 0;
    transactions.forEach((t) => {
      if (t.type === "expense") {
        map[t.category] = (map[t.category] || 0) + t.amount;
        total += t.amount;
      }
    });
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      percentage: total > 0 ? Math.round(((value as number) / total) * 100) : 0,
    }));
  };
  const expenseCategories: ExpenseCategory[] = getExpenseCategories(
    convertedTransactions
  );

  // Compute recent transactions (last 5) from converted transactions
  const recentTransactions = [...convertedTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Compute totals for cards
  const lastMonth: MonthlyData = monthlyData[monthlyData.length - 1] || {
    income: 0,
    expenses: 0,
    savings: 0,
    month: "",
  };
  const prevMonth: MonthlyData = monthlyData[monthlyData.length - 2] || {
    income: 0,
    expenses: 0,
    savings: 0,
    month: "",
  };
  const totalBalance = monthlyData.reduce((sum, m) => sum + m.savings, 0);
  const savingsGoal = 15000; // Example static goal
  const currentSavings = totalBalance;

  const handleRefreshTransactions = async () => {
    setLoading(true);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to refresh transactions"
      );
    } finally {
      setLoading(false);
    }
  };

  // Improved custom label for PieChart with staggered small slice labels
  const renderPieLabelSmart = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent, name, index } = props;
    const RADIAN = Math.PI / 180;
    let offset = 20;
    let yOffset = 0;
    if (percent < 0.08) {
      offset = 40;
      // Stagger small labels vertically by index
      yOffset = (index % 2 === 0 ? -1 : 1) * (index + 1) * 10;
    }
    const radius = outerRadius + offset;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN) + yOffset;
    return (
      <text
        x={x}
        y={y}
        fill="hsl(var(--foreground))"
        fontSize={12}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
        {name} {(percent * 100).toFixed(0)}%
      </text>
    );
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back{userName ? `, ${userName}` : ""}!
          </h1>
          <p className="text-muted-foreground">
            Here's your financial overview
          </p>
        </div>
        <div className="flex gap-2">
          <AddTransactionDialog
            onTransactionAdded={handleRefreshTransactions}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshTransactions}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {loading && <div className="text-center py-4">Loading...</div>}
      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="dashboard-card stats-card group hover:scale-[1.02] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Balance
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-white/10"
              onClick={() => setBalanceVisible(!balanceVisible)}
            >
              {balanceVisible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Wallet className="h-5 w-5 text-primary" />
              <div className="text-2xl font-bold text-foreground">
                {balanceVisible
                  ? formatCurrency(totalBalance, currency)
                  : "••••••"}
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-success mr-1" />
              <span className="text-sm text-success">
                {lastMonth.savings >= 0 ? "+" : ""}
                {formatCurrency(lastMonth.savings, currency)} this month
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="dashboard-card stats-card group hover:scale-[1.02] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Income
            </CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(lastMonth.income, currency)}
            </div>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-4 w-4 text-success mr-1" />
              <span className="text-sm text-success">
                {prevMonth.income > 0
                  ? (
                      ((lastMonth.income - prevMonth.income) /
                        prevMonth.income) *
                      100
                    ).toFixed(1)
                  : "0.0"}
                % from last month
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="dashboard-card stats-card group hover:scale-[1.02] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Expenses
            </CardTitle>
            <CreditCard className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(lastMonth.expenses, currency)}
            </div>
            <div className="flex items-center mt-2">
              <ArrowDownRight className="h-4 w-4 text-destructive mr-1" />
              <span className="text-sm text-destructive">
                {prevMonth.expenses > 0
                  ? (
                      ((lastMonth.expenses - prevMonth.expenses) /
                        prevMonth.expenses) *
                      100
                    ).toFixed(1)
                  : "0.0"}
                % from last month
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="dashboard-card stats-card group hover:scale-[1.02] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Savings Goal
            </CardTitle>
            <Target className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatCurrency(currentSavings, currency)}
            </div>
            <div className="w-full bg-muted/30 rounded-full h-2 mt-2">
              <div
                className="bg-gradient-gold h-2 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    (currentSavings / savingsGoal) * 100
                  )}%`,
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {Math.min(100, (currentSavings / savingsGoal) * 100).toFixed(1)}%
              of {formatCurrency(savingsGoal, currency)} goal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="chart-container finance-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Income vs Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient
                    id="incomeGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(142, 76%, 36%)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(142, 76%, 36%)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient
                    id="expenseGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(0, 84%, 60%)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(0, 84%, 60%)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  opacity={0.3}
                />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a2e",
                    border: "3px solid #4ECDC4",
                    borderRadius: "16px",
                    color: "#ffffff",
                    boxShadow: "0 15px 35px rgba(78, 205, 196, 0.4), 0 5px 15px rgba(0, 0, 0, 0.3)",
                    fontSize: "16px",
                    fontWeight: "600",
                    padding: "12px 16px",
                  }}
                  labelStyle={{
                    color: "#4ECDC4",
                    fontWeight: "700",
                    fontSize: "14px",
                  }}
                  formatter={(value: number, name: string) => [
                    <span style={{ 
                      color: name === "income" ? "#00ff88" : "#ff6b6b",
                      fontWeight: "700",
                      fontSize: "16px"
                    }}>
                      {formatCurrency(value, currency)}
                    </span>,
                    <span style={{ 
                      color: name === "income" ? "#00ff88" : "#ff6b6b",
                      fontWeight: "600"
                    }}>
                      {name === "income" ? "💰 Income" : "💸 Expenses"}
                    </span>,
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="hsl(142, 76%, 36%)"
                  fillOpacity={1}
                  fill="url(#incomeGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="hsl(0, 84%, 60%)"
                  fillOpacity={1}
                  fill="url(#expenseGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Expense Categories */}
        <Card className="chart-container finance-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Expense Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={expenseCategories}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={renderPieLabelSmart}
                  labelLine
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#2d1b69",
                    border: "3px solid #bb86fc",
                    borderRadius: "16px",
                    color: "#ffffff",
                    boxShadow: "0 15px 35px rgba(187, 134, 252, 0.4), 0 5px 15px rgba(0, 0, 0, 0.3)",
                    fontSize: "16px",
                    fontWeight: "600",
                    padding: "12px 16px",
                  }}
                  labelStyle={{
                    color: "#bb86fc",
                    fontWeight: "700",
                    fontSize: "14px",
                  }}
                  formatter={(value: number, name: string) => [
                    <span style={{ 
                      color: "#ffd700",
                      fontWeight: "700",
                      fontSize: "18px",
                      textShadow: "0 0 10px rgba(255, 215, 0, 0.5)"
                    }}>
                      {formatCurrency(value, currency)}
                    </span>,
                    <span style={{ 
                      color: "#ff6b6b",
                      fontWeight: "600"
                    }}>
                      💳 {name || "Amount"}
                    </span>,
                  ]}
                />
              </RePieChart>
            </ResponsiveContainer>
            {/* Legend for all categories */}
            <div className="flex flex-wrap gap-3 justify-center mt-4">
              {expenseCategories.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center gap-2 text-xs"
                >
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span>
                    {entry.name}{" "}
                    {entry.percentage ? `${entry.percentage}%` : ""}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="chart-container finance-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Recent Transactions
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="border-primary/30 hover:bg-primary/10"
            onClick={() => setCurrentView("transactions")}
          >
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent transactions found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Extracted Transaction Item component for better readability
// Extracted Transaction Item component for better readability
const TransactionItem = ({ transaction }: { transaction: any }) => {
  const { currency } = useContext(CurrencyContext);
  const isConverted = transaction.isConverted || false;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
      <div className="flex items-center space-x-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            transaction.type === "income"
              ? "bg-success/20"
              : "bg-destructive/20"
          }`}
        >
          {transaction.type === "income" ? (
            <ArrowUpRight className="w-5 h-5 text-success" />
          ) : (
            <ArrowDownRight className="w-5 h-5 text-destructive" />
          )}
        </div>
        <div>
          <p className="font-medium text-foreground">
            {transaction.description}
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {transaction.category}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {new Date(transaction.date).toLocaleDateString()}
            </span>
            {isConverted && (
              <Badge variant="outline" className="text-xs">
                Converted
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div
          className={`text-lg font-semibold ${
            transaction.type === "income" ? "text-success" : "text-destructive"
          }`}
        >
          {transaction.type === "income" ? "+" : "-"}
          {formatCurrency(Math.abs(transaction.amount), currency)}
        </div>
        {isConverted &&
          transaction.originalAmount &&
          transaction.originalCurrency && (
            <div className="text-xs text-muted-foreground">
              was{" "}
              {formatCurrency(
                transaction.originalAmount,
                transaction.originalCurrency
              )}
            </div>
          )}
      </div>
    </div>
  );
};
