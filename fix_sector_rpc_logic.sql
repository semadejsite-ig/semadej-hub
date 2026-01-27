-- RPC: Get Sector Financials (Fixed Logic)
-- Run this in Supabase SQL Editor

-- FIX: Moved the year filter to the JOIN clause.
-- Previous version filtered out sectors that had no reports because 'NULL = year' is false.

CREATE OR REPLACE FUNCTION get_sector_financials(target_year int DEFAULT null)
RETURNS TABLE (
  sector text,
  total_raised numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.sector,
    SUM(COALESCE(mr.carnet_value, 0) + COALESCE(mr.service_offering_value, 0) + COALESCE(mr.special_offering_value, 0)) as total_raised
  FROM congregations c
  LEFT JOIN monthly_reports mr ON c.id = mr.congregation_id 
    AND (target_year IS NULL OR mr.report_year = target_year) -- Filter inside JOIN
  WHERE 
    c.sector IS NOT NULL 
    AND c.sector <> '' -- Ensure not empty string
  GROUP BY c.sector
  ORDER BY total_raised DESC;
END;
$$;
