-- Helper function to execute raw SQL (for setting session variables)
-- This is needed because Supabase doesn't expose SET commands directly

CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;
