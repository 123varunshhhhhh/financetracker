import { useState, useEffect } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
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

export function useConvertedTransactions(transactions: Transaction[], baseCurrency: string = 'USD') {
  const { currency: displayCurrency, convertAmount } = useCurrency();
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
            const convertedAmount = await convertAmount(transaction.amount, fromCurrency, displayCurrency);
            
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
  }, [transactions, displayCurrency, baseCurrency, convertAmount]);

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

// Hook for converting individual amounts
export function useAmountConverter() {
  const { convertAmount, currency, isConverting } = useCurrency();

  const convertAndFormat = async (
    amount: number,
    fromCurrency: string,
    formatter?: (amount: number, currency: string) => string
  ) => {
    const convertedAmount = await convertAmount(amount, fromCurrency, currency);
    
    if (formatter) {
      return formatter(convertedAmount, currency);
    }
    
    return convertedAmount;
  };

  return {
    convertAndFormat,
    currentCurrency: currency,
    isConverting,
  };
}

// Hook for monthly data conversion
export function useConvertedMonthlyData(monthlyData: any[], baseCurrency: string = 'USD') {
  const { currency: displayCurrency, convertAmount } = useCurrency();
  const [convertedData, setConvertedData] = useState<any[]>([]);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    const convertData = async () => {
      if (!monthlyData.length) {
        setConvertedData([]);
        return;
      }

      if (baseCurrency === displayCurrency) {
        setConvertedData(monthlyData);
        return;
      }

      setIsConverting(true);

      try {
        const converted = await Promise.all(
          monthlyData.map(async (data) => ({
            ...data,
            income: await convertAmount(data.income, baseCurrency, displayCurrency),
            expenses: await convertAmount(data.expenses, baseCurrency, displayCurrency),
            savings: await convertAmount(data.savings, baseCurrency, displayCurrency),
            netWorth: data.netWorth ? await convertAmount(data.netWorth, baseCurrency, displayCurrency) : 0,
          }))
        );

        setConvertedData(converted);
      } catch (error) {
        console.error('Failed to convert monthly data:', error);
        setConvertedData(monthlyData);
      } finally {
        setIsConverting(false);
      }
    };

    convertData();
  }, [monthlyData, displayCurrency, baseCurrency, convertAmount]);

  return {
    convertedData,
    isConverting,
  };
}