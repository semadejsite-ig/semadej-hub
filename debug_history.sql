-- DEBUG script
-- 1. Check if ANY history exists
SELECT count(*) as total_history FROM agent_assignments;

-- 2. Force insert a record for Camila (to test if UI is working)
INSERT INTO agent_assignments (agent_id, congregation_id, start_date, reason)
SELECT id, congregation_id, CURRENT_DATE, 'Teste de Debug Manual'
FROM profiles
WHERE full_name ILIKE '%Camila Prado%'
AND congregation_id IS NOT NULL;

-- 3. Check if it was inserted
SELECT 
  aa.id, 
  p.full_name as agent_name, 
  c.name as congregation_name,
  aa.start_date
FROM agent_assignments aa
JOIN profiles p ON aa.agent_id = p.id
JOIN congregations c ON aa.congregation_id = c.id
WHERE p.full_name ILIKE '%Camila Prado%';
