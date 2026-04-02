-- Create holdings table
CREATE TABLE holdings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  currency VARCHAR(10) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  avg_price DECIMAL(20, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_currency UNIQUE(user_id, currency),
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT positive_avg_price CHECK (avg_price > 0)
);

-- Create index for faster queries
CREATE INDEX holdings_user_id_idx ON holdings(user_id);
CREATE INDEX holdings_currency_idx ON holdings(currency);
CREATE INDEX holdings_updated_at_idx ON holdings(updated_at DESC);

-- Enable RLS
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own holdings" ON holdings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own holdings" ON holdings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own holdings" ON holdings
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own holdings" ON holdings
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_holdings_updated_at BEFORE UPDATE
ON holdings FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
