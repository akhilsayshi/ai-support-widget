-- PostgreSQL initialization script for AI Support Widget
-- This script runs when the PostgreSQL container starts for the first time

-- Create the main database if it doesn't exist
-- (This is handled by POSTGRES_DB environment variable)

-- Create extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create a function to generate UUIDs (if uuid-ossp is not available)
CREATE OR REPLACE FUNCTION generate_uuid() RETURNS UUID AS $$
BEGIN
    RETURN uuid_generate_v4();
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE ai_support_widget TO postgres;

-- Create a schema for the application (optional)
-- CREATE SCHEMA IF NOT EXISTS app_schema;
-- GRANT ALL ON SCHEMA app_schema TO postgres;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'AI Support Widget PostgreSQL database initialized successfully';
END $$;
