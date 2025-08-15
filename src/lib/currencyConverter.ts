// Currency conversion utilities with real exchange rates

interface ExchangeRates {
  [key: string]: number;
}

interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  BTC: { code: 'BTC', name: 'Bitcoin', symbol: '₿', flag: '₿' },
  ETH: { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', flag: 'Ξ' },
  SOL: { code: 'SOL', name: 'Solana', symbol: '◎', flag: '◎' },
};

// Cache for exchange rates
let exchangeRatesCache: { rates: ExchangeRates; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Free exchange rate API (you can replace with a premium one for production)
const EXCHANGE_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

// Fallback exchange rates (approximate, for offline use)
const FALLBACK_RATES: ExchangeRates = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  CAD: 1.25,
  INR: 83.12,
  AUD: 1.35,
  JPY: 110.0,
  CNY: 6.45,
  BTC: 0.000023, // 1 USD = 0.000023 BTC (approximate)
  ETH: 0.00041,  // 1 USD = 0.00041 ETH (approximate)
  SOL: 0.014,    // 1 USD = 0.014 SOL (approximate)
};

/**
 * Fetch current exchange rates from API
 */
export async function fetchExchangeRates(): Promise<ExchangeRates> {
  try {
    // Check cache first
    if (exchangeRatesCache && Date.now() - exchangeRatesCache.timestamp < CACHE_DURATION) {
      return exchangeRatesCache.rates;
    }

    const response = await fetch(EXCHANGE_API_URL);
    if (!response.ok) throw new Error('Failed to fetch exchange rates');
    
    const data = await response.json();
    const rates = data.rates as ExchangeRates;
    
    // Cache the rates
    exchangeRatesCache = {
      rates,
      timestamp: Date.now()
    };
    
    return rates;
  } catch (error) {
    console.warn('Failed to fetch live exchange rates, using fallback:', error);
    return FALLBACK_RATES;
  }
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) return amount;
  
  try {
    const rates = await fetchExchangeRates();
    
    // Convert to USD first, then to target currency
    const usdAmount = fromCurrency === 'USD' ? amount : amount / rates[fromCurrency];
    const convertedAmount = toCurrency === 'USD' ? usdAmount : usdAmount * rates[toCurrency];
    
    return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Currency conversion failed:', error);
    return amount; // Return original amount if conversion fails
  }
}

/**
 * Convert all transactions to a new currency
 */
export async function convertTransactionsCurrency(
  transactions: any[],
  fromCurrency: string,
  toCurrency: string
): Promise<any[]> {
  if (fromCurrency === toCurrency) return transactions;
  
  const convertedTransactions = await Promise.all(
    transactions.map(async (transaction) => ({
      ...transaction,
      amount: await convertCurrency(transaction.amount, fromCurrency, toCurrency),
      originalAmount: transaction.amount,
      originalCurrency: fromCurrency,
    }))
  );
  
  return convertedTransactions;
}

/**
 * Get exchange rate between two currencies
 */
export async function getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  if (fromCurrency === toCurrency) return 1;
  
  try {
    const rates = await fetchExchangeRates();
    const usdRate = fromCurrency === 'USD' ? 1 : 1 / rates[fromCurrency];
    const targetRate = toCurrency === 'USD' ? 1 : rates[toCurrency];
    return usdRate * targetRate;
  } catch (error) {
    console.error('Failed to get exchange rate:', error);
    return 1;
  }
}

/**
 * Format currency with proper symbol and locale
 */
export function formatCurrencyWithConversion(
  amount: number,
  currency: string,
  showOriginal?: { amount: number; currency: string }
): string {
  const currencyInfo = SUPPORTED_CURRENCIES[currency];
  if (!currencyInfo) return `${amount.toFixed(2)} ${currency}`;
  
  let formatted: string;
  
  // Special handling for crypto currencies
  if (['BTC', 'ETH', 'SOL'].includes(currency)) {
    const decimals = currency === 'BTC' ? 8 : currency === 'ETH' ? 6 : 4;
    formatted = `${currencyInfo.symbol}${amount.toFixed(decimals)}`;
  } else {
    // Use Intl.NumberFormat for fiat currencies
    formatted = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  
  // Show original amount if conversion happened
  if (showOriginal && showOriginal.currency !== currency) {
    const originalInfo = SUPPORTED_CURRENCIES[showOriginal.currency];
    const originalFormatted = originalInfo 
      ? `${originalInfo.symbol}${showOriginal.amount.toFixed(2)}`
      : `${showOriginal.amount.toFixed(2)} ${showOriginal.currency}`;
    formatted += ` (${originalFormatted})`;
  }
  
  return formatted;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  return SUPPORTED_CURRENCIES[currency]?.symbol || currency;
}

/**
 * Get currency info
 */
export function getCurrencyInfo(currency: string): CurrencyInfo | null {
  return SUPPORTED_CURRENCIES[currency] || null;
}

/**
 * Check if currency conversion is needed
 */
export function needsCurrencyConversion(
  userCurrency: string,
  dataCurrency: string
): boolean {
  return userCurrency !== dataCurrency;
}

/**
 * Batch convert multiple amounts
 */
export async function batchConvertCurrency(
  amounts: { amount: number; fromCurrency: string }[],
  toCurrency: string
): Promise<number[]> {
  const rates = await fetchExchangeRates();
  
  return amounts.map(({ amount, fromCurrency }) => {
    if (fromCurrency === toCurrency) return amount;
    
    const usdAmount = fromCurrency === 'USD' ? amount : amount / rates[fromCurrency];
    const convertedAmount = toCurrency === 'USD' ? usdAmount : usdAmount * rates[toCurrency];
    
    return Math.round(convertedAmount * 100) / 100;
  });
}