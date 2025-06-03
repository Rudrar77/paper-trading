
// Database utility functions to simulate MySQL connectivity
// In a real application, these would connect to your MySQL backend

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

export const saveTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp'>): Transaction => {
  const transactions = getTransactions();
  const newTransaction: Transaction = {
    ...transaction,
    id: Date.now().toString(),
    timestamp: new Date().toISOString()
  };
  
  transactions.push(newTransaction);
  localStorage.setItem('cryptoTransactions', JSON.stringify(transactions));
  
  return newTransaction;
};

export const getTransactions = (): Transaction[] => {
  const stored = localStorage.getItem('cryptoTransactions');
  return stored ? JSON.parse(stored) : [];
};

export const getHoldings = (): Holding[] => {
  const stored = localStorage.getItem('cryptoHoldings');
  return stored ? JSON.parse(stored) : [];
};

export const saveHoldings = (holdings: Holding[]): void => {
  localStorage.setItem('cryptoHoldings', JSON.stringify(holdings));
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
