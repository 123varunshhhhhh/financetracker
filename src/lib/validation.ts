import { z } from 'zod';

// Transaction validation schema
export const TransactionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be positive').max(1000000000, 'Amount is too large'),
  description: z.string().min(1, 'Description is required').max(200, 'Description is too long'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  time: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

// Budget validation schema
export const BudgetSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Budget amount must be positive'),
  period: z.enum(['weekly', 'monthly', 'yearly']),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date'),
  alertThreshold: z.number().min(0).max(100).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export type Budget = z.infer<typeof BudgetSchema>;

// Goal validation schema
export const GoalSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Goal name is required').max(100, 'Goal name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  targetAmount: z.number().positive('Target amount must be positive'),
  currentAmount: z.number().min(0, 'Current amount cannot be negative').default(0),
  targetDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid target date'),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  isCompleted: z.boolean().default(false),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).refine((data) => new Date(data.targetDate) > new Date(), {
  message: 'Target date must be in the future',
  path: ['targetDate'],
});

export type Goal = z.infer<typeof GoalSchema>;

// User settings validation schema
export const UserSettingsSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  email: z.string().email('Invalid email address'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'INR', 'AUD', 'BTC', 'ETH', 'SOL']).default('USD'),
  timezone: z.enum([
    'America/New_York',
    'America/Chicago', 
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai'
  ]).default('America/New_York'),
  theme: z.enum(['light', 'dark', 'system']).default('dark'),
  defaultView: z.enum(['dashboard', 'transactions', 'budget', 'analytics']).default('dashboard'),
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  budgetAlerts: z.boolean().default(true),
  goalReminders: z.boolean().default(true),
  weeklyReports: z.boolean().default(true),
  dataSharing: z.boolean().default(false),
  analyticsTracking: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  compactView: z.boolean().default(false),
  showBalances: z.boolean().default(true),
});

export type UserSettings = z.infer<typeof UserSettingsSchema>;

// Password validation schema
export const PasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type PasswordData = z.infer<typeof PasswordSchema>;

// Form validation helpers
export function validateTransaction(data: unknown): { success: true; data: Transaction } | { success: false; errors: string[] } {
  try {
    const validData = TransactionSchema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors.map(e => e.message) };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

export function validateBudget(data: unknown): { success: true; data: Budget } | { success: false; errors: string[] } {
  try {
    const validData = BudgetSchema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors.map(e => e.message) };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

export function validateGoal(data: unknown): { success: true; data: Goal } | { success: false; errors: string[] } {
  try {
    const validData = GoalSchema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors.map(e => e.message) };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

export function validateUserSettings(data: unknown): { success: true; data: UserSettings } | { success: false; errors: string[] } {
  try {
    const validData = UserSettingsSchema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors.map(e => e.message) };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

export function validatePassword(data: unknown): { success: true; data: PasswordData } | { success: false; errors: string[] } {
  try {
    const validData = PasswordSchema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors.map(e => e.message) };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

// Additional validation utilities
export const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Other Income'],
  expense: [
    'Food & Dining',
    'Transportation', 
    'Entertainment',
    'Bills & Utilities',
    'Shopping',
    'Healthcare',
    'Education',
    'Travel',
    'Insurance',
    'Other Expense'
  ]
} as const;

export const GOAL_CATEGORIES = [
  'Emergency Fund',
  'Vacation',
  'Home Purchase',
  'Car Purchase',
  'Education',
  'Retirement',
  'Investment',
  'Debt Payoff',
  'Other'
] as const;

export function isValidCategory(category: string, type: 'income' | 'expense'): boolean {
  return CATEGORIES[type].includes(category as any);
}

export function isValidGoalCategory(category: string): boolean {
  return GOAL_CATEGORIES.includes(category as any);
}

// Data sanitization
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function sanitizeNumber(input: string | number): number {
  const num = typeof input === 'string' ? parseFloat(input) : input;
  return isNaN(num) ? 0 : Math.max(0, num);
}