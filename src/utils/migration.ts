// Utility to migrate data from localStorage to Supabase
import { supabase } from '@/lib/supabase';

export interface LocalTransaction {
  id: string;
  currency: string;
  action: 'buy' | 'sell';
  amount: number;
  price: number;
  total_value: number;
  timestamp: string;
}

export interface LocalHolding {
  currency: string;
  quantity: string;
  avg_price: string;
  timestamp: string;
}

export const migrateLocalStorageToSupabase = async (): Promise<{
  success: boolean;
  transactionsMigrated: number;
  holdingsMigrated: number;
  message: string;
}> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        transactionsMigrated: 0,
        holdingsMigrated: 0,
        message: 'User not authenticated. Please log in first.'
      };
    }

    // Get localStorage data
    const localTransactions: LocalTransaction[] = JSON.parse(
      localStorage.getItem('cryptoTransactions') || '[]'
    );
    const localHoldings: LocalHolding[] = JSON.parse(
      localStorage.getItem('cryptoHoldings') || '[]'
    );

    // Migrate transactions
    let transactionsMigrated = 0;
    if (localTransactions.length > 0) {
      const transactionsToInsert = localTransactions.map(t => ({
        user_id: user.id,
        currency: t.currency,
        action: t.action,
        amount: t.amount,
        price: t.price,
        total_value: t.total_value,
        created_at: t.timestamp
      }));

      const { error: transError } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

      if (transError) {
        console.error('Failed to migrate transactions:', transError);
        throw new Error(`Transaction migration failed: ${transError.message}`);
      }
      transactionsMigrated = localTransactions.length;
    }

    // Migrate holdings
    let holdingsMigrated = 0;
    if (localHoldings.length > 0) {
      // First check if holdings already exist
      const { data: existingHoldings, error: checkError } = await supabase
        .from('holdings')
        .select('currency')
        .eq('user_id', user.id);

      if (checkError) {
        console.error('Failed to check existing holdings:', checkError);
      }

      const existingCurrencies = new Set(
        (existingHoldings || []).map(h => h.currency)
      );

      // Prepare holdings to insert (skip duplicates)
      const holdingsToInsert = localHoldings
        .filter(h => !existingCurrencies.has(h.currency))
        .map(h => ({
          user_id: user.id,
          currency: h.currency,
          quantity: parseFloat(h.quantity),
          avg_price: parseFloat(h.avg_price),
          created_at: h.timestamp,
          updated_at: h.timestamp
        }));

      if (holdingsToInsert.length > 0) {
        const { error: holdError } = await supabase
          .from('holdings')
          .insert(holdingsToInsert);

        if (holdError) {
          console.error('Failed to migrate holdings:', holdError);
          throw new Error(`Holdings migration failed: ${holdError.message}`);
        }
        holdingsMigrated = holdingsToInsert.length;
      }
    }

    return {
      success: true,
      transactionsMigrated,
      holdingsMigrated,
      message: `Migration complete! Migrated ${transactionsMigrated} transactions and ${holdingsMigrated} holdings.`
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      transactionsMigrated: 0,
      holdingsMigrated: 0,
      message: error instanceof Error ? error.message : 'Migration failed'
    };
  }
};

export const clearLocalStorage = (): void => {
  localStorage.removeItem('cryptoTransactions');
  localStorage.removeItem('cryptoHoldings');
  console.log('Local storage cleared');
};

export const backupLocalStorage = (): string => {
  const backup = {
    transactions: JSON.parse(localStorage.getItem('cryptoTransactions') || '[]'),
    holdings: JSON.parse(localStorage.getItem('cryptoHoldings') || '[]'),
    backupDate: new Date().toISOString()
  };
  return JSON.stringify(backup, null, 2);
};
