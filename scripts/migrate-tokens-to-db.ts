#!/usr/bin/env node

/**
 * Migrate OAuth tokens from environment variables to database
 * Run this once to move from env-based to database-only token storage
 */

import { config } from 'dotenv';

// Load environment variables from .env file FIRST
config();

import { TokenService } from '../src/services/tokenService';

async function migrateTokens() {
  console.log('📦 Migrating OAuth tokens to database');
  console.log('=====================================\n');

  // Check required environment variables
  const nationSlug = process.env.NATIONBUILDER_SLUG;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  const accessToken = process.env.ACCESS_TOKEN;
  const refreshToken = process.env.OAUTH_REFRESH_TOKEN;

  const missing = [];
  if (!nationSlug) missing.push('NATIONBUILDER_SLUG');
  if (!clientId) missing.push('OAUTH_CLIENT_ID');
  if (!clientSecret) missing.push('OAUTH_CLIENT_SECRET');
  if (!accessToken) missing.push('ACCESS_TOKEN');
  if (!refreshToken) missing.push('OAUTH_REFRESH_TOKEN');

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('\nPlease set these in your .env file first.');
    return;
  }

  try {
    // Initialize TokenService
    const tokenService = new TokenService(nationSlug, clientId, clientSecret);
    await tokenService.initialize();

    console.log('📝 Found tokens in environment:');
    console.log(`   Access token: ${accessToken.substring(0, 20)}...`);
    console.log(`   Refresh token: ${refreshToken.substring(0, 20)}...`);
    console.log('');

    // Save tokens to database (assuming 3600 seconds expiry for existing token)
    console.log('💾 Saving tokens to database...');
    await tokenService.saveInitialTokens(accessToken, refreshToken, 3600);

    console.log('✅ Tokens successfully migrated to database!');
    console.log('');
    console.log('🧹 Next steps:');
    console.log('1. Remove ACCESS_TOKEN from your .env file');
    console.log('2. Remove OAUTH_REFRESH_TOKEN from your .env file');
    console.log('3. Keep only these OAuth env vars:');
    console.log('   - NATIONBUILDER_SLUG');
    console.log('   - OAUTH_CLIENT_ID');
    console.log('   - OAUTH_CLIENT_SECRET');
    console.log('');
    console.log('✨ Your app will now automatically refresh tokens from the database!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrateTokens().catch(console.error);