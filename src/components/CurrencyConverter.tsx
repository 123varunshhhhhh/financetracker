import React, { useState, useEffect } from 'react';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', coingecko: 'usd' },
  { code: 'EUR', name: 'Euro', symbol: '€', coingecko: 'eur' },
  { code: 'GBP', name: 'British Pound', symbol: '£', coingecko: 'gbp' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', coingecko: 'cad' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', coingecko: 'inr' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', coingecko: 'aud' },
  { code: 'BTC', name: 'Bitcoin', symbol: '₿', coingecko: 'bitcoin' },
  { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', coingecko: 'ethereum' },
  { code: 'SOL', name: 'Solana', symbol: '◎', coingecko: 'solana' },
];

function getSymbol(code: string) {
  return CURRENCIES.find(c => c.code === code)?.symbol || code;
}

function getCoingeckoId(code: string) {
  return CURRENCIES.find(c => c.code === code)?.coingecko;
}

export const CurrencyConverter: React.FC = () => {
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('INR');
  const [amount, setAmount] = useState(1);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!amount || isNaN(Number(amount))) {
      setResult('');
      return;
    }
    setLoading(true);
    setError('');
    const isCrypto = (code: string) => ['BTC', 'ETH', 'SOL'].includes(code);
    const isFiat = (code: string) => !isCrypto(code);
    const fetchRate = async () => {
      try {
        let rate = 1;
        const fromId = getCoingeckoId(from);
        const toId = getCoingeckoId(to);
        if (!fromId || !toId) throw new Error('Unsupported currency');
        if (from === to) {
          setResult(Number(amount).toLocaleString(undefined, { maximumFractionDigits: 8 }));
          setLoading(false);
          return;
        }
        if (isCrypto(from) && isCrypto(to)) {
          // Crypto to crypto: get both in USD, then ratio
          const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${fromId},${toId}&vs_currencies=usd`);
          const data = await res.json();
          rate = data[fromId].usd / data[toId].usd;
        } else if (isCrypto(from) && isFiat(to)) {
          // Crypto to fiat
          const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${fromId}&vs_currencies=${toId}`);
          const data = await res.json();
          rate = data[fromId][toId];
        } else if (isFiat(from) && isCrypto(to)) {
          // Fiat to crypto
          const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${toId}&vs_currencies=${fromId}`);
          const data = await res.json();
          rate = 1 / data[toId][fromId];
        } else {
          // Fiat to fiat: use USD as bridge
          if (from === 'USD' || to === 'USD') {
            // Direct
            const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${from === 'USD' ? toId : fromId}&vs_currencies=usd`);
            const data = await res.json();
            if (from === 'USD') {
              rate = 1 / data[toId].usd;
            } else {
              rate = data[fromId].usd;
            }
          } else {
            // Both non-USD: from → USD → to
            const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${fromId},${toId}&vs_currencies=usd`);
            const data = await res.json();
            rate = data[fromId].usd / data[toId].usd;
          }
        }
        if (typeof rate === 'number' && !isNaN(rate)) {
          setResult((Number(amount) * rate).toLocaleString(undefined, { maximumFractionDigits: 8 }));
        } else {
          setError('Conversion rate unavailable');
          setResult('');
        }
      } catch (e) {
        setError('Failed to fetch rate');
        setResult('');
      } finally {
        setLoading(false);
      }
    };
    fetchRate();
  }, [from, to, amount]);

  return (
    <div className="rounded-lg bg-muted/30 p-4 shadow-md">
      <h3 className="font-semibold mb-2 text-foreground">Currency Converter</h3>
      <div className="flex gap-2 mb-2">
        <select value={from} onChange={e => setFrom(e.target.value)} className="rounded p-1 bg-background border">
          {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
        </select>
        <span className="self-center">→</span>
        <select value={to} onChange={e => setTo(e.target.value)} className="rounded p-1 bg-background border">
          {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
        </select>
      </div>
      <input
        type="number"
        min="0"
        value={amount}
        onChange={e => setAmount(Number(e.target.value))}
        className="w-full rounded p-1 mb-2 bg-background border"
        placeholder="Amount"
      />
      <div className="text-sm text-muted-foreground mb-1">
        {loading ? 'Converting...' : error ? error : result && `${getSymbol(to)} ${result}`}
      </div>
    </div>
  );
}; 