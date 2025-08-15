import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { convertCurrency, fetchExchangeRates } from '../lib/currencyConverter';
import { useSuccessNotification, useErrorNotification } from '../components/NotificationSystem';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  convertAmount: (amount: number, fromCurrency: string, toCurrency?: string) => Promise<number>;
  isConverting: boolean;
  exchangeRates: Record<string, number>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

interface CurrencyProviderProps {
  children: ReactNode;
  initialCurrency?: string;
}

export function CurrencyProvider({ children, initialCurrency = 'USD' }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState(initialCurrency);
  const [isConverting, setIsConverting] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const showSuccess = useSuccessNotification();
  const showError = useErrorNotification();

  // Load exchange rates on mount and periodically
  useEffect(() => {
    const loadRates = async () => {
      try {
        const rates = await fetchExchangeRates();
        setExchangeRates(rates);
      } catch (error) {
        console.warn('Failed to load exchange rates:', error);
      }
    };

    loadRates();
    
    // Update rates every 30 minutes
    const interval = setInterval(loadRates, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const convertAmount = async (amount: number, fromCurrency: string, toCurrency?: string): Promise<number> => {
    const targetCurrency = toCurrency || currency;
    if (fromCurrency === targetCurrency) return amount;

    try {
      return await convertCurrency(amount, fromCurrency, targetCurrency);
    } catch (error) {
      console.error('Currency conversion failed:', error);
      return amount;
    }
  };

  const setCurrency = async (newCurrency: string) => {
    if (newCurrency === currency) return;

    setIsConverting(true);
    
    try {
      // Get exchange rate for user feedback
      const rate = exchangeRates[newCurrency] || 1;
      const oldRate = exchangeRates[currency] || 1;
      const conversionRate = currency === 'USD' ? rate : rate / oldRate;
      
      setCurrencyState(newCurrency);
      
      showSuccess(
        'Currency Changed',
        `Switched to ${newCurrency}. Conversion rate: ${conversionRate.toFixed(4)}`
      );
    } catch (error) {
      showError('Currency Change Failed', 'Please try again later');
    } finally {
      setIsConverting(false);
    }
  };

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    convertAmount,
    isConverting,
    exchangeRates,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}