-- Initial database setup for After Meet
-- This script runs automatically when the PostgreSQL container starts

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable case-insensitive text extension (useful for email comparisons)
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create database user for the application (if needed in production)
-- Note: In development, we use the default postgres user
