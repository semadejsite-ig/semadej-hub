-- Backfill APPROVED status for existing users
-- This ensures that users who were already using the system (but had approved=false/null due to migration) are not locked out.

UPDATE profiles 
SET approved = true 
WHERE approved IS NOT true 
  AND role IS NOT NULL 
  AND role != '';

-- Optional: Ensure Status column is consistent if still used elsewhere
-- UPDATE profiles SET status = 'approved' WHERE approved = true;
