-- Enforce case-insensitive identity uniqueness at the database boundary.
-- This migration will fail if existing rows already differ only by letter case.
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;

ALTER TABLE "users" ALTER COLUMN "email" TYPE public.CITEXT;
ALTER TABLE "education_organizations" ALTER COLUMN "name" TYPE public.CITEXT;
