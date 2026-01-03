CREATE TABLE IF NOT EXISTS investment_goals (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  months TEXT[] NOT NULL,
  total_value NUMERIC NOT NULL CHECK (total_value > 0),
  monthly_value NUMERIC NOT NULL CHECK (monthly_value > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investment_goals_name ON investment_goals (name);
CREATE INDEX IF NOT EXISTS idx_investment_goals_months ON investment_goals USING GIN (months);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_investment_goals_updated_at ON investment_goals;
CREATE TRIGGER trigger_investment_goals_updated_at
BEFORE UPDATE ON investment_goals
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
