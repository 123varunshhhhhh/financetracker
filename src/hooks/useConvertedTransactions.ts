import { useState, useEffect } from 'react';
import { convertCurrency } from '../lib/currencyConverter';

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
  originalAmount?: number;
  originalCurrency?: string;
}

interface ConvertedTransaction extends Transaction {
  displayAmount: number;
  isConverted: boolean;
  conversionRate?: number;
}

export function useConvertedTransactions(transactions: Transaction[], displayCurrency: string, baseCurrency: string = 'USD') {
  const [convertedTransactions, setConvertedTransactions] = useState<ConvertedTransaction[]>([]);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    const convertTransactions = async () => {
      if (!transactions.length) {
        setConvertedTransactions([]);
        return;
      }

      setIsConverting(true);

      try {
        const converted = await Promise.all(
          transactions.map(async (transaction) => {
            // Use original currency if available, otherwise assume base currency
            const fromCurrency = transaction.originalCurrency || baseCurrency;
            
            if (fromCurrency === displayCurrency) {
              return {
                ...transaction,
                displayAmount: transaction.amount,
                isConverted: false,
              };
            }

            // Convert the amount
            const convertedAmount = await convertCurrency(transaction.amount, fromCurrency, displayCurrency);
            
            return {
              ...transaction,
              displayAmount: convertedAmount,
              isConverted: true,
              conversionRate: convertedAmount / transaction.amount,
              originalAmount: transaction.amount,
              originalCurrency: fromCurrency,
            };
          })
        );

        setConvertedTransactions(converted);
      } catch (error) {
        console.error('Failed to convert transactions:', error);
        // Fallback to original transactions
        setConvertedTransactions(
          transactions.map(t => ({
            ...t,
            displayAmount: t.amount,
            isConverted: false,
          }))
        );
      } finally {
        setIsConverting(false);
      }
    };

    convertTransactions();
  }, [transactions, displayCurrency, baseCurrency]);

  // Calculate totals in display currency
  const totals = convertedTransactions.reduce(
    (acc, transaction) => {
      if (transaction.type === 'income') {
        acc.totalIncome += transaction.displayAmount;
      } else {
        acc.totalExpenses += transaction.displayAmount;
      }
      return acc;
    },
    { totalIncome: 0, totalExpenses: 0 }
  );

  return {
    convertedTransactions,
    isConverting,
    totalIncome: totals.totalIncome,
    totalExpenses: totals.totalExpenses,
    netBalance: totals.totalIncome - totals.totalExpenses,
  };
}

// Simple amount converter function
export async function convertAmount(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
  if (fromCurrency === toCurrency) return amount;
  
  try {
    return await convertCurrency(amount, fromCurrency, toCurrency);
  } catch (error) {
    console.error('Currency conversion failed:', error);
    return amount;
  }
}