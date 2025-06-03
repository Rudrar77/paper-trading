
import { useState, useEffect, useCallback } from 'react';

export interface CryptoData {
  currency: string;
  currency_name: string;
  price: string;
  price_change_percentage: string;
  coin_icon: string;
}

export const useCryptoData = () => {
  const [allCurrencies, setAllCurrencies] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCryptoData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("https://cs-india.coinswitch.co/api/v2/external/csk_website/currencies");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const currencies = data?.data?.currencies || [];
      
      // Filter out currencies with invalid prices
      const validCurrencies = currencies.filter((currency: CryptoData) => {
        const price = Number(currency.price);
        return isFinite(price) && price > 0;
      });
      
      setAllCurrencies(validCurrencies);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch crypto data:", error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
      setLoading(false);
    }
  }, []);

  const getCurrencyPrice = useCallback((currency: string): number => {
    const crypto = allCurrencies.find(c => c.currency === currency);
    return crypto ? parseFloat(crypto.price) : 0;
  }, [allCurrencies]);

  const getTopGainers = useCallback((limit: number = 5): CryptoData[] => {
    return allCurrencies
      .filter(c => parseFloat(c.price_change_percentage) > 0)
      .sort((a, b) => parseFloat(b.price_change_percentage) - parseFloat(a.price_change_percentage))
      .slice(0, limit);
  }, [allCurrencies]);

  const getTopLosers = useCallback((limit: number = 5): CryptoData[] => {
    return allCurrencies
      .filter(c => parseFloat(c.price_change_percentage) < 0)
      .sort((a, b) => parseFloat(a.price_change_percentage) - parseFloat(b.price_change_percentage))
      .slice(0, limit);
  }, [allCurrencies]);

  const searchCurrencies = useCallback((query: string): CryptoData[] => {
    if (!query.trim()) return allCurrencies;
    
    const searchTerm = query.toLowerCase();
    return allCurrencies.filter(crypto => 
      crypto.currency.toLowerCase().includes(searchTerm) ||
      crypto.currency_name.toLowerCase().includes(searchTerm)
    );
  }, [allCurrencies]);

  useEffect(() => {
    fetchCryptoData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchCryptoData, 30000);
    
    return () => clearInterval(interval);
  }, [fetchCryptoData]);

  return {
    allCurrencies,
    loading,
    error,
    fetchCryptoData,
    getCurrencyPrice,
    getTopGainers,
    getTopLosers,
    searchCurrencies
  };
};
