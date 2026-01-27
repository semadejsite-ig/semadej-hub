-- Migration: Add new fields for Monthly Report Redesign
-- Run this in Supabase SQL Editor

-- 1. Add Financial Columns
alter table monthly_reports 
add column if not exists carnet_value decimal(10, 2) default 0.00,
add column if not exists service_offering_value decimal(10, 2) default 0.00,
add column if not exists special_offering_value decimal(10, 2) default 0.00;

-- 2. Add Statistics Columns
alter table monthly_reports
add column if not exists member_count integer default 0,
add column if not exists carnet_count integer default 0;

-- 3. Rename old offering_value to keep data consistent (optional, or just ignore it)
-- We will stop using 'offering_value' and use the specific ones instead.
-- If you want to migrate old data, you could sum them up, but better to keep separate.
