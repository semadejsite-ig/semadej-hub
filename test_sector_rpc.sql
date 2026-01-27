-- TEST RPC Output
-- Run this in Supabase SQL Editor to see what the function returns

SELECT * FROM get_sector_financials(2026);

-- Also check raw data to verify we have sectors
SELECT sector, count(*) as count 
FROM congregations 
WHERE sector IS NOT NULL 
GROUP BY sector;
