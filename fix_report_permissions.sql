-- Fix: Enable Update and Delete for Agents on Monthly Reports

-- 1. Check if RLS is enabled (it should be, but good to ensure)
alter table monthly_reports enable row level security;

-- 2. Allow Agents to UPDATE their own reports
-- Policy: Users can update rows where they are the owner (agent_id)
create policy "Agents can update own reports" 
on monthly_reports 
for update 
using (auth.uid() = agent_id);

-- 3. Allow Agents to DELETE their own reports
-- Policy: Users can delete rows where they are the owner (agent_id)
create policy "Agents can delete own reports" 
on monthly_reports 
for delete 
using (auth.uid() = agent_id);
