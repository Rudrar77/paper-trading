
// Database utility functions using Supabase
import { supabase } from '@/lib/supabase';

export interface Transaction {
  id: string;
  currency: string;
  action: 'buy' | 'sell';
  amount: number;
  price: number;
  total_value: number;
  timestamp: string;
}

export interface Holding {
  currency: string;
  quantity: string;
  avg_price: string;
  timestamp: string;
}

const GUEST_TRANSACTIONS_KEY = 'paper_trading_guest_transactions';
const GUEST_HOLDINGS_KEY = 'paper_trading_guest_holdings';

const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user.id;
};

const getGuestTransactions = (): Transaction[] => {
  const raw = localStorage.getItem(GUEST_TRANSACTIONS_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as Transaction[];
  } catch {
    return [];
  }
};

const setGuestTransactions = (transactions: Transaction[]): void => {
  localStorage.setItem(GUEST_TRANSACTIONS_KEY, JSON.stringify(transactions));
};

const getGuestHoldings = (): Holding[] => {
  const raw = localStorage.getItem(GUEST_HOLDINGS_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as Holding[];
  } catch {
    return [];
  }
};

const setGuestHoldings = (holdings: Holding[]): void => {
  localStorage.setItem(GUEST_HOLDINGS_KEY, JSON.stringify(holdings));
};

export const saveTransaction = async (transaction: Omit<Transaction, 'id' | 'timestamp'>): Promise<Transaction> => {
  const userId = await getCurrentUserId();

  if (!userId) {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      ...transaction,
      timestamp: new Date().toISOString(),
    };

    const existing = getGuestTransactions();
    setGuestTransactions([newTransaction, ...existing]);
    return newTransaction;
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      ...transaction,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id.toString(),
    currency: data.currency,
    action: data.action,
    amount: data.amount,
    price: data.price,
    total_value: data.total_value,
    timestamp: data.created_at
  };
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const userId = await getCurrentUserId();

  if (!userId) {
    return getGuestTransactions();
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch transactions:', error);
    return [];
  }

  return (data || []).map(t => ({
    id: t.id.toString(),
    currency: t.currency,
    action: t.action,
    amount: t.amount,
    price: t.price,
    total_value: t.total_value,
    timestamp: t.created_at
  }));
};

export const getHoldings = async (): Promise<Holding[]> => {
  const userId = await getCurrentUserId();

  if (!userId) {
    return getGuestHoldings();
  }

  const { data, error } = await supabase
    .from('holdings')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to fetch holdings:', error);
    return [];
  }

  return (data || []).map(h => ({
    currency: h.currency,
    quantity: h.quantity.toString(),
    avg_price: h.avg_price.toString(),
    timestamp: h.updated_at
  }));
};

export const saveHoldings = async (holdings: Holding[]): Promise<void> => {
  const userId = await getCurrentUserId();

  if (!userId) {
    setGuestHoldings(holdings);
    return;
  }

  // Delete all existing holdings for the user
  await supabase
    .from('holdings')
    .delete()
    .eq('user_id', userId);

  // Insert new holdings
  if (holdings.length > 0) {
    const { error } = await supabase
      .from('holdings')
      .insert(
        holdings.map(h => ({
          user_id: userId,
          currency: h.currency,
          quantity: parseFloat(h.quantity),
          avg_price: parseFloat(h.avg_price),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      );

    if (error) {
      throw error;
    }
  }
};

export const calculatePortfolioValue = (holdings: Holding[], currentPrices: { [key: string]: number }): number => {
  return holdings.reduce((total, holding) => {
    const currentPrice = currentPrices[holding.currency] || 0;
    const quantity = parseFloat(holding.quantity);
    return total + (currentPrice * quantity);
  }, 0);
};

export const calculateTotalPnL = (holdings: Holding[], currentPrices: { [key: string]: number }): number => {
  return holdings.reduce((total, holding) => {
    const currentPrice = currentPrices[holding.currency] || 0;
    const avgPrice = parseFloat(holding.avg_price);
    const quantity = parseFloat(holding.quantity);
    const pnl = (currentPrice - avgPrice) * quantity;
    return total + pnl;
  }, 0);
};

// Database schema simulation (for reference)
export const SQL_SCHEMA = `
CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  currency VARCHAR(10) NOT NULL,
  action ENUM('buy', 'sell') NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  total_value DECIMAL(20, 8) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE holdings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  currency VARCHAR(10) NOT NULL UNIQUE,
  quantity DECIMAL(20, 8) NOT NULL,
  avg_price DECIMAL(20, 8) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;
