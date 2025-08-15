import { useState, useEffect } from 'react';
import { convertCurrency } from '../lib/currencyConverter';

// Simple hook for currency conversion without complex context dependencies
export function useSimpleCurrencyConversion() {
  const [isConverting, setIsConverting] = useState(false);

  const convertAmount = async (amount: number, fromCurrency: string, toCurrency: string): Promise<number> => {
    if (fromCurrency === toCurrency) return amount;
    
    setIsConverting(true);
    try {
      const converted = await convertCurrency(amount, fromCurrency, toCurrency);
      return converted;
    } catch (error) {
      console.error('Currency conversion failed:', error);
      return amount;
    } finally {
      setIsConverting(false);
    }
  };

  const convertTransactionAmounts = async (
    transactions: any[], 
    fromCurrency: string, 
    toCurrency: string
  ): Promise<any[]> => {
    if (fromCurrency === toCurrency) return transactions;
    
    setIsConverting(true);
    try {
      const converted = await Promise.all(
        transactions.map(async (transaction) => {
          const convertedAmount = await convertCurrency(transaction.amount, fromCurrency, toCurrency);
          return {
            ...transaction,
            amount: convertedAmount,
            originalAmount: transaction.amount,
            originalCurrency: fromCurrency,
            isConverted: true
          };
        })
      );
      return converted;
    } catch (error) {
      console.error('Failed to convert transactions:', error);
      return transactions;
    } finally {
      setIsConverting(false);
    }
  };

  return {
    convertAmount,
    convertTransactionAmounts,
    isConverting
  };
}