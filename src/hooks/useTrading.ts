
import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import * as dbUtil from '@/utils/database';

export interface Holding {
  currency: string;
  quantity: string;
  avg_price: string;
  timestamp: string;
}

export interface TradeParams {
  currency: string;
  action: 'buy' | 'sell';
  amount: number;
  price: number;
}

export const useTrading = () => {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadHoldings = useCallback(async () => {
    try {
      const loadedHoldings = await dbUtil.getHoldings();
      setHoldings(loadedHoldings);
    } catch (error) {
      console.error('Failed to load holdings:', error);
      toast({
        title: "Error",
        description: "Failed to load portfolio data",
        variant: "destructive",
      });
    }
  }, [toast]);

  const saveHoldings = useCallback(async (newHoldings: Holding[]) => {
    try {
      await dbUtil.saveHoldings(newHoldings);
      setHoldings(newHoldings);
    } catch (error) {
      console.error('Failed to save holdings:', error);
      toast({
        title: "Error",
        description: "Failed to save portfolio data",
        variant: "destructive",
      });
    }
  }, [toast]);

  const executeTrade = useCallback(async ({ currency, action, amount, price }: TradeParams) => {
    if (amount <= 0 || price <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid amount and price",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);

    try {
      let updatedHoldings = [...holdings];
      const existingHolding = updatedHoldings.find(h => h.currency === currency);

      if (action === 'sell') {
        if (!existingHolding || parseFloat(existingHolding.quantity) < amount) {
          toast({
            title: "Insufficient Balance",
            description: `You don't have enough ${currency} to sell`,
            variant: "destructive",
          });
          setLoading(false);
          return false;
        }
        
        const newQuantity = parseFloat(existingHolding.quantity) - amount;
        if (newQuantity <= 0.00000001) { // Remove holding if quantity is too small
          updatedHoldings = updatedHoldings.filter(h => h.currency !== currency);
        } else {
          existingHolding.quantity = newQuantity.toString();
        }
      } else {
        // Buy logic with weighted average price calculation
        if (existingHolding) {
          const currentQty = parseFloat(existingHolding.quantity);
          const currentAvgPrice = parseFloat(existingHolding.avg_price);
          const newQty = currentQty + amount;
          const newTotalValue = (currentQty * currentAvgPrice) + (amount * price);
          const newAvgPrice = newTotalValue / newQty;
          
          existingHolding.quantity = newQty.toString();
          existingHolding.avg_price = newAvgPrice.toString();
        } else {
          updatedHoldings.push({
            currency,
            quantity: amount.toString(),
            avg_price: price.toString(),
            timestamp: new Date().toISOString()
          });
        }
      }

      // Save transaction log to Supabase
      await dbUtil.saveTransaction({
        currency,
        action,
        amount,
        price,
        total_value: amount * price
      });

      // Save holdings
      await saveHoldings(updatedHoldings);
      
      toast({
        title: "Trade Successful",
        description: `${action === 'buy' ? 'Bought' : 'Sold'} ${amount} ${currency} at ₹${price.toLocaleString('en-IN')}`,
      });
      
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Trade execution failed:', error);
      toast({
        title: "Trade Failed",
        description: "An error occurred while executing the trade",
        variant: "destructive",
      });
      setLoading(false);
      return false;
    }
  }, [holdings, saveHoldings, toast]);

  const calculateProfitLoss = useCallback((holding: Holding, currentPrice: number) => {
    const quantity = parseFloat(holding.quantity);
    const avgPrice = parseFloat(holding.avg_price);
    
    const profit = (currentPrice - avgPrice) * quantity;
    const percentage = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;
    
    return { profit, percentage };
  }, []);

  const getTotalPortfolioValue = useCallback((currentPrices: { [key: string]: number }) => {
    return holdings.reduce((total, holding) => {
      const currentPrice = currentPrices[holding.currency] || 0;
      const quantity = parseFloat(holding.quantity);
      return total + (currentPrice * quantity);
    }, 0);
  }, [holdings]);

  const getTotalPnL = useCallback((currentPrices: { [key: string]: number }) => {
    return holdings.reduce((total, holding) => {
      const { profit } = calculateProfitLoss(holding, currentPrices[holding.currency] || 0);
      return total + profit;
    }, 0);
  }, [holdings, calculateProfitLoss]);

  return {
    holdings,
    loading,
    loadHoldings,
    executeTrade,
    calculateProfitLoss,
    getTotalPortfolioValue,
    getTotalPnL
  };
};
