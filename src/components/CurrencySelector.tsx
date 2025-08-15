import { useState, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  TrendingUp, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { SUPPORTED_CURRENCIES, getCurrencyInfo } from '../lib/currencyConverter';
import { useCurrencyConversion, useCurrencyRates } from '../hooks/useCurrencyConversion';
import { CurrencyContext } from './FinTrackerApp';
import { formatCurrency } from '../lib/utils';
import { useSuccessNotification, useErrorNotification } from './NotificationSystem';

interface CurrencySelectorProps {
  onCurrencyChange?: (newCurrency: string, oldCurrency: string) => void;
  showRates?: boolean;
  compact?: boolean;
}

export function CurrencySelector({ 
  onCurrencyChange, 
  showRates = true, 
  compact = false 
}: CurrencySelectorProps) {
  const { currency: currentCurrency } = useContext(CurrencyContext);
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency);
  const { handleCurrencyChange, conversionState } = useCurrencyConversion();
  const { rates, loading: ratesLoading, updateRates } = useCurrencyRates();
  const showSuccess = useSuccessNotification();
  const showError = useErrorNotification();

  const handleCurrencySelect = async (newCurrency: string) => {
    if (newCurrency === currentCurrency) return;
    
    setSelectedCurrency(newCurrency);
    
    try {
      const exchangeRate = await handleCurrencyChange(newCurrency, currentCurrency);
      
      if (onCurrencyChange) {
        onCurrencyChange(newCurrency, currentCurrency);
      }
      
      showSuccess(
        'Currency Changed',
        `Switched to ${getCurrencyInfo(newCurrency)?.name}. Exchange rate: ${exchangeRate.toFixed(4)}`
      );
    } catch (error) {
      showError('Currency Change Failed', 'Please try again later');
      setSelectedCurrency(currentCurrency); // Revert selection
    }
  };

  const popularCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'];
  const cryptoCurrencies = ['BTC', 'ETH', 'SOL'];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Select value={selectedCurrency} onValueChange={handleCurrencySelect}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => (
              <SelectItem key={code} value={code}>
                <div className="flex items-center gap-2">
                  <span>{info.flag}</span>
                  <span>{code}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {conversionState.isConverting && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
    );
  }

  return (
    <Card className="finance-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Currency Settings
          {conversionState.isConverting && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Currency Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Select Currency
          </label>
          <Select value={selectedCurrency} onValueChange={handleCurrencySelect}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <div className="p-2">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Popular Currencies
                </div>
                {popularCurrencies.map((code) => {
                  const info = SUPPORTED_CURRENCIES[code];
                  return (
                    <SelectItem key={code} value={code}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{info.flag}</span>
                        <div>
                          <div className="font-medium">{code}</div>
                          <div className="text-xs text-muted-foreground">{info.name}</div>
                        </div>
                        {rates[code] && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {rates[code].toFixed(4)}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
                
                <Separator className="my-2" />
                
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Cryptocurrencies
                </div>
                {cryptoCurrencies.map((code) => {
                  const info = SUPPORTED_CURRENCIES[code];
                  return (
                    <SelectItem key={code} value={code}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{info.flag}</span>
                        <div>
                          <div className="font-medium">{code}</div>
                          <div className="text-xs text-muted-foreground">{info.name}</div>
                        </div>
                        {rates[code] && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {rates[code].toFixed(8)}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </div>
            </SelectContent>
          </Select>
        </div>

        {/* Conversion Status */}
        {conversionState.error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{conversionState.error}</span>
          </div>
        )}

        {conversionState.lastUpdated && !conversionState.error && (
          <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm text-success">
              Last updated: {conversionState.lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Exchange Rates */}
        {showRates && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Current Exchange Rates (vs USD)
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={updateRates}
                disabled={ratesLoading}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${ratesLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {Object.entries(rates).slice(0, 8).map(([code, rate]) => {
                const info = SUPPORTED_CURRENCIES[code];
                if (!info) return null;
                
                return (
                  <div key={code} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{info.flag}</span>
                      <span className="text-sm font-medium">{code}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {rate.toFixed(4)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sample Conversion */}
        {selectedCurrency !== 'USD' && rates[selectedCurrency] && (
          <div className="p-3 bg-primary/5 rounded-lg">
            <div className="text-sm font-medium text-foreground mb-1">
              Sample Conversion
            </div>
            <div className="text-xs text-muted-foreground">
              $100 USD = {formatCurrency(100 * rates[selectedCurrency], selectedCurrency)}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatCurrency(100, selectedCurrency)} = ${(100 / rates[selectedCurrency]).toFixed(2)} USD
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Quick currency switcher for header/toolbar
 */
export function QuickCurrencySwitcher() {
  const { currency } = useContext(CurrencyContext);
  const currencyInfo = getCurrencyInfo(currency);

  return (
    <CurrencySelector compact={true} showRates={false} />
  );
}

/**
 * Currency rate ticker component
 */
export function CurrencyRateTicker({ currencies = ['EUR', 'GBP', 'INR', 'BTC'] }: { currencies?: string[] }) {
  const { rates, loading } = useCurrencyRates();

  if (loading) {
    return (
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading rates...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      {currencies.map((code) => {
        const rate = rates[code];
        const info = getCurrencyInfo(code);
        if (!rate || !info) return null;

        return (
          <div key={code} className="flex items-center gap-1">
            <span>{info.flag}</span>
            <span className="font-medium">{code}</span>
            <span className="text-muted-foreground">{rate.toFixed(4)}</span>
          </div>
        );
      })}
    </div>
  );
}