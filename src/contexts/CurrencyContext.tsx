import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { convertCurrency, fetchExchangeRates } from '../lib/currencyConverter';

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
      setCurrencyState(newCurrency);
      console.log(`Currency changed to ${newCurrency}`);
    } catch (error) {
      console.error('Currency change failed:', error);
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