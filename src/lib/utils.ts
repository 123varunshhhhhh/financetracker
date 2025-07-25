import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string) {
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
