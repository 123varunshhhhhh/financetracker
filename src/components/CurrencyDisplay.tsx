import { useState, useEffect, useContext } from 'react';
import { CurrencyContext } from './FinTrackerApp';
import { useSimpleCurrencyConversion } from '../hooks/useSimpleCurrencyConversion';
import { formatCurrency } from '../lib/utils';
import { Badge } from '@/components/ui/badge';

interface CurrencyDisplayProps {
  amount: number;
  originalCurrency?: string;
  showOriginal?: boolean;
  className?: string;
}

export function CurrencyDisplay({ 
  amount, 
  originalCurrency = 'USD', 
  showOriginal = false,
  className = '' 
}: CurrencyDisplayProps) {
  const { currency } = useContext(CurrencyContext);
  const { convertAmount } = useSimpleCurrencyConversion();
  const [convertedAmount, setConvertedAmount] = useState(amount);
  const [isConverted, setIsConverted] = useState(false);

  useEffect(() => {
    const convert = async () => {
      if (originalCurrency === currency) {
        setConvertedAmount(amount);
        setIsConverted(false);
        return;
      }

      try {
        const converted = await convertAmount(amount, originalCurrency, currency);
        setConvertedAmount(converted);
        setIsConverted(true);
      } catch (error) {
        console.error('Conversion failed:', error);
        setConvertedAmount(amount);
        setIsConverted(false);
      }
    };

    convert();
  }, [amount, originalCurrency, currency, convertAmount]);

  return (
    <div className={`flex flex-col ${className}`}>
      <span className="font-semibold">
        {formatCurrency(convertedAmount, currency)}
      </span>
      {isConverted && showOriginal && (
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-muted-foreground">
            was {formatCurrency(amount, originalCurrency)}
          </span>
          <Badge variant="outline" className="text-xs px-1 py-0">
            Converted
          </Badge>
        </div>
      )}
    </div>
  );
}

// Hook for converting transaction lists
export function useConvertedTransactions(transactions: any[], baseCurrency: string = 'USD') {
  const { currency } = useContext(CurrencyContext);
  const { convertTransactionAmounts, isConverting } = useSimpleCurrencyConversion();
  const [convertedTransactions, setConvertedTransactions] = useState(transactions);

  useEffect(() => {
    const convert = async () => {
      if (baseCurrency === currency) {
        setConvertedTransactions(transactions);
        return;
      }

      try {
        const converted = await convertTransactionAmounts(transactions, baseCurrency, currency);
        setConvertedTransactions(converted);
      } catch (error) {
        console.error('Failed to convert transactions:', error);
        setConvertedTransactions(transactions);
      }
    };

    convert();
  }, [transactions, baseCurrency, currency, convertTransactionAmounts]);

  return {
    convertedTransactions,
    isConverting
  };
}