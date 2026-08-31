import { useState, useEffect } from 'react';

export const DEFAULT_USD_NGN_RATE = 1350;
const CACHE_KEY = 'glassea_usd_ngn_rate';
const CACHE_TIME_KEY = 'glassea_usd_ngn_rate_time';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

let inMemoryRate: number | null = null;
let inMemoryTimestamp = 0;

export async function getUSDToNGNRate(): Promise<number> {
  const now = Date.now();

  // 1. Check in-memory cache
  if (inMemoryRate && now - inMemoryTimestamp < CACHE_TTL_MS) {
    return inMemoryRate;
  }

  // 2. Check localStorage in browser
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      if (cached && cachedTime && now - Number(cachedTime) < CACHE_TTL_MS) {
        inMemoryRate = Number(cached);
        inMemoryTimestamp = Number(cachedTime);
        return inMemoryRate;
      }
    } catch (e) {
      // localStorage error fallback
    }
  }

  // 3. Fetch live rate from Open Exchange Rates API
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && data.rates.NGN) {
        const rate = Math.round(data.rates.NGN);
        inMemoryRate = rate;
        inMemoryTimestamp = now;

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(CACHE_KEY, String(rate));
            localStorage.setItem(CACHE_TIME_KEY, String(now));
          } catch (e) {}
        }
        return rate;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch live USD/NGN exchange rate, trying backend fallback', err);
  }

  // 4. Try backend fallback endpoint
  try {
    const backendRes = await fetch('/api/exchange-rate');
    if (backendRes.ok) {
      const data = await backendRes.json();
      if (data.rate) {
        inMemoryRate = data.rate;
        inMemoryTimestamp = now;
        return inMemoryRate;
      }
    }
  } catch (err) {}

  return inMemoryRate || DEFAULT_USD_NGN_RATE;
}

export function useExchangeRate() {
  const [rate, setRate] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) return Number(cached);
      } catch (e) {}
    }
    return DEFAULT_USD_NGN_RATE;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getUSDToNGNRate().then((liveRate) => {
      if (active) {
        setRate(liveRate);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { rate, loading };
}

export function formatUSD(amount: number): string {
  if (amount === 0) return 'Free';
  return `$${amount.toLocaleString('en-US')}`;
}

export function convertUSDToNGN(usdAmount: number, rate: number = DEFAULT_USD_NGN_RATE): number {
  return Math.round(usdAmount * rate);
}

export function formatNGN(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export function formatDualPrice(usdAmount: number, rate: number = DEFAULT_USD_NGN_RATE): string {
  if (!usdAmount || usdAmount === 0) return 'Free';
  const ngnAmount = convertUSDToNGN(usdAmount, rate);
  return `$${usdAmount} USD (≈ ₦${ngnAmount.toLocaleString()} NGN)`;
}
