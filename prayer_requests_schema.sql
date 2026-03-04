-- schema for prayer requests table

CREATE TABLE public.prayer_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    address TEXT,
    request TEXT NOT NULL,
    consent_lgpd BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, prayed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on RLS
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (anyone can submit a prayer request)
CREATE POLICY "Allow public insert on prayer_requests" 
ON public.prayer_requests
FOR INSERT 
TO public
WITH CHECK (true);

-- Allow authenticated users to view all
CREATE POLICY "Allow authenticated access to prayer_requests" 
ON public.prayer_requests 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to update (e.g. change status to prayed)
CREATE POLICY "Allow authenticated update to prayer_requests" 
ON public.prayer_requests 
FOR UPDATE 
TO authenticated 
USING (true);
