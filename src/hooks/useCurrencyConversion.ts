import { useState, useEffect, useCallback, useContext } from 'react';
import { convertCurrency, convertTransactionsCurrency, getExchangeRate, fetchExchangeRates } from '../lib/currencyConverter';
import { CurrencyContext } from '../components/FinTrackerApp';
import { useLocalStorage } from './usePerformance';

interface ConversionState {
  isConverting: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface CurrencyData {
  originalCurrency: string;
  convertedCurrency: string;
  exchangeRate: number;
  lastConversion: Date;
}

export function useCurrencyConversion() {
  const { currency: currentCurrency } = useContext(CurrencyContext);
  const [conversionState, setConversionState] = useState<ConversionState>({
    isConverting: false,
    error: null,
    lastUpdated: null,
  });
  
  // Store user's original currency and conversion data
  const [currencyData, setCurrencyData] = useLocalStorage<CurrencyData | null>('fintracker-currency-data', null);

  /**
   * Convert a single amount
   */
  const convertAmount = useCallback(async (
    amount: number,
    fromCurrency: string,
    toCurrency?: string
  ): Promise<number> => {
    const targetCurrency = toCurrency || currentCurrency;
    
    if (fromCurrency === targetCurrency) return amount;
    
    setConversionState(prev => ({ ...prev, isConverting: true, error: null }));
    
    try {
      const convertedAmount = await convertCurrency(amount, fromCurrency, targetCurrency);
      setConversionState(prev => ({ 
        ...prev, 
        isConverting: false, 
        lastUpdated: new Date() 
      }));
      return convertedAmount;
    } catch (error) {
      setConversionState(prev => ({ 
        ...prev, 
        isConverting: false, 
        error: 'Failed to convert currency' 
      }));
      return amount;
    }
  }, [currentCurrency]);

  /**
   * Convert all transactions when currency changes
   */
  const convertTransactions = useCallback(async (
    transactions: any[],
    fromCurrency: string,
    toCurrency?: string
  ): Promise<any[]> => {
    const targetCurrency = toCurrency || currentCurrency;
    
    if (fromCurrency === targetCurrency) return transactions;
    
    setConversionState(prev => ({ ...prev, isConverting: true, error: null }));
    
    try {
      const convertedTransactions = await convertTransactionsCurrency(
        transactions,
        fromCurrency,
        targetCurrency
      );
      
      setConversionState(prev => ({ 
        ...prev, 
        isConverting: false, 
        lastUpdated: new Date() 
      }));
      
      return convertedTransactions;
    } catch (error) {
      setConversionState(prev => ({ 
        ...prev, 
        isConverting: false, 
        error: 'Failed to convert transactions' 
      }));
      return transactions;
    }
  }, [currentCurrency]);

  /**
   * Get current exchange rate
   */
  const getCurrentExchangeRate = useCallback(async (
    fromCurrency: string,
    toCurrency?: string
  ): Promise<number> => {
    const targetCurrency = toCurrency || currentCurrency;
    return await getExchangeRate(fromCurrency, targetCurrency);
  }, [currentCurrency]);

  /**
   * Handle currency change with conversion
   */
  const handleCurrencyChange = useCallback(async (
    newCurrency: string,
    oldCurrency: string
  ) => {
    if (newCurrency === oldCurrency) return;
    
    setConversionState(prev => ({ ...prev, isConverting: true, error: null }));
    
    try {
      const exchangeRate = await getExchangeRate(oldCurrency, newCurrency);
      
      setCurrencyData({
        originalCurrency: oldCurrency,
        convertedCurrency: newCurrency,
        exchangeRate,
        lastConversion: new Date(),
      });
      
      setConversionState(prev => ({ 
        ...prev, 
        isConverting: false, 
        lastUpdated: new Date() 
      }));
      
      return exchangeRate;
    } catch (error) {
      setConversionState(prev => ({ 
        ...prev, 
        isConverting: false, 
        error: 'Failed to handle currency change' 
      }));
      return 1;
    }
  }, [setCurrencyData]);

  /**
   * Refresh exchange rates
   */
  const refreshRates = useCallback(async () => {
    setConversionState(prev => ({ ...prev, isConverting: true, error: null }));
    
    try {
      await fetchExchangeRates();
      setConversionState(prev => ({ 
        ...prev, 
        isConverting: false, 
        lastUpdated: new Date() 
      }));
    } catch (error) {
      setConversionState(prev => ({ 
        ...prev, 
        isConverting: false, 
        error: 'Failed to refresh exchange rates' 
      }));
    }
  }, []);

  return {
    convertAmount,
    convertTransactions,
    getCurrentExchangeRate,
    handleCurrencyChange,
    refreshRates,
    conversionState,
    currencyData,
  };
}

/**
 * Hook for automatic transaction conversion
 */
export function useTransactionConversion(transactions: any[], userCurrency: string) {
  const [convertedTransactions, setConvertedTransactions] = useState<any[]>(transactions);
  const [isConverting, setIsConverting] = useState(false);
  const { convertTransactions } = useCurrencyConversion();

  useEffect(() => {
    if (!transactions.length) return;
    
    // Check if transactions need conversion
    const needsConversion = transactions.some(t => 
      t.originalCurrency && t.originalCurrency !== userCurrency
    );
    
    if (needsConversion) {
      setIsConverting(true);
      
      // Convert transactions from their original currency
      const convertPromises = transactions.map(async (transaction) => {
        if (transaction.originalCurrency && transaction.originalCurrency !== userCurrency) {
          const convertedAmount = await convertCurrency(
            transaction.originalAmount || transaction.amount,
            transaction.originalCurrency,
            userCurrency
          );
          
          return {
            ...transaction,
            amount: convertedAmount,
            displayOriginal: true,
          };
        }
        return transaction;
      });
      
      Promise.all(convertPromises)
        .then(converted => {
          setConvertedTransactions(converted);
          setIsConverting(false);
        })
        .catch(() => {
          setConvertedTransactions(transactions);
          setIsConverting(false);
        });
    } else {
      setConvertedTransactions(transactions);
    }
  }, [transactions, userCurrency, convertTransactions]);

  return { convertedTransactions, isConverting };
}

/**
 * Hook for real-time currency rates display
 */
export function useCurrencyRates(baseCurrency: string = 'USD') {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const exchangeRates = await fetchExchangeRates();
      setRates(exchangeRates);
    } catch (err) {
      setError('Failed to fetch exchange rates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    updateRates();
    
    // Update rates every 5 minutes
    const interval = setInterval(updateRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [updateRates]);

  return { rates, loading, error, updateRates };
}