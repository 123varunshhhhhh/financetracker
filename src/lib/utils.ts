import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return formatCurrency(0, currency);
  }
  
  switch (currency) {
    case 'BTC':
      return `₿${amount.toFixed(8)}`;
    case 'ETH':
      return `Ξ${amount.toFixed(8)}`;
    case 'SOL':
      return `◎${amount.toFixed(4)}`;
    default:
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
  }
}

// Enhanced utility functions for better data handling
export function formatNumber(num: number, decimals: number = 2): string {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatPercentage(value: number, decimals: number = 1): string {
  if (typeof value !== 'number' || isNaN(value)) return '0.0%';
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(date: string | Date, format: 'short' | 'long' | 'relative' = 'short'): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  
  switch (format) {
    case 'long':
      return d.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    case 'relative':
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
      return `${Math.ceil(diffDays / 365)} years ago`;
    default:
      return d.toLocaleDateString();
  }
}

export function validateAmount(amount: string | number): { isValid: boolean; value: number; error?: string } {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) {
    return { isValid: false, value: 0, error: 'Please enter a valid number' };
  }
  
  if (num < 0) {
    return { isValid: false, value: 0, error: 'Amount cannot be negative' };
  }
  
  if (num > 1000000000) {
    return { isValid: false, value: 0, error: 'Amount is too large' };
  }
  
  return { isValid: true, value: num };
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function calculateSavingsRate(income: number, expenses: number): number {
  if (income <= 0) return 0;
  return ((income - expenses) / income) * 100;
}

export function getFinancialHealthScore(savingsRate: number, expenseRatio: number): {
  score: number;
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  color: string;
} {
  let score = 0;
  
  // Savings rate scoring (0-50 points)
  if (savingsRate >= 20) score += 50;
  else if (savingsRate >= 15) score += 40;
  else if (savingsRate >= 10) score += 30;
  else if (savingsRate >= 5) score += 20;
  else score += 10;
  
  // Expense ratio scoring (0-50 points)
  if (expenseRatio <= 50) score += 50;
  else if (expenseRatio <= 70) score += 40;
  else if (expenseRatio <= 80) score += 30;
  else if (expenseRatio <= 90) score += 20;
  else score += 10;
  
  let rating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  let color: string;
  
  if (score >= 80) {
    rating = 'Excellent';
    color = 'text-green-600';
  } else if (score >= 60) {
    rating = 'Good';
    color = 'text-blue-600';
  } else if (score >= 40) {
    rating = 'Fair';
    color = 'text-yellow-600';
  } else {
    rating = 'Poor';
    color = 'text-red-600';
  }
  
  return { score, rating, color };
}
