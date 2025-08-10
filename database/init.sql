-- Initialize NationBuilder Automation Database Schema
-- This script runs automatically when the Docker container starts

-- Create the oauth_tokens table
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id SERIAL PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster expiration queries
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);

-- Create index for faster updated_at queries
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_updated_at ON oauth_tokens(updated_at);

-- Print confirmation
\echo 'Schema initialized successfully for NationBuilder Automation';