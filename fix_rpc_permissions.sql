-- FIX RPC Permissions & Path
-- Run this in Supabase SQL Editor

-- 1. Drop to be sure
DROP FUNCTION IF EXISTS get_sector_financials(int);

-- 2. Re-create with SET search_path (Good Practice Security)
CREATE OR REPLACE FUNCTION get_sector_financials(target_year int DEFAULT null)
RETURNS TABLE (
  sector text,
  total_raised numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.sector,
    SUM(COALESCE(mr.carnet_value, 0) + COALESCE(mr.service_offering_value, 0) + COALESCE(mr.special_offering_value, 0)) as total_raised
  FROM congregations c
  LEFT JOIN monthly_reports mr ON c.id = mr.congregation_id 
    AND (target_year IS NULL OR mr.report_year = target_year)
  WHERE 
    c.sector IS NOT NULL 
    AND c.sector <> ''
  GROUP BY c.sector
  ORDER BY total_raised DESC;
END;
$$;

-- 3. Explicit Grants (Crucial for Client Access)
GRANT EXECUTE ON FUNCTION get_sector_financials(int) TO authenticated;
GRANT EXECUTE ON FUNCTION get_sector_financials(int) TO anon;
GRANT EXECUTE ON FUNCTION get_sector_financials(int) TO service_role;
