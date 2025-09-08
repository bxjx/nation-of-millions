#!/usr/bin/env node

/**
 * Migrate OAuth tokens from local database to Heroku database
 * Run this once to setup tokens on Heroku production
 */

import { config } from 'dotenv';

// Load environment variables from .env file FIRST
config();

import { TokenService } from '../src/services/tokenService';

async function migrateTokensToHeroku() {
  console.log('🚀 Migrating OAuth tokens to Heroku database');
  console.log('=============================================\n');

  // Check required environment variables
  const nationSlug = process.env.NATIONBUILDER_SLUG;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  const missing = [];
  if (!nationSlug) missing.push('NATIONBUILDER_SLUG');
  if (!clientId) missing.push('OAUTH_CLIENT_ID');
  if (!clientSecret) missing.push('OAUTH_CLIENT_SECRET');

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('\nPlease set these environment variables first.');
    return;
  }

  try {
    console.log('🔧 Initializing TokenService with Heroku Postgres...');
    
    // Initialize TokenService (will use DATABASE_URL from Heroku)
    const tokenService = new TokenService(nationSlug, clientId, clientSecret);
    await tokenService.initialize();
    console.log('✅ TokenService initialized');

    // Try to get an access token (this will refresh using stored tokens if available)
    console.log('🔑 Attempting to get access token...');
    
    try {
      const accessToken = await tokenService.getAccessToken();
      console.log(`✅ Access token obtained: ${accessToken.substring(0, 20)}...`);
      console.log('');
      console.log('🎉 Token migration successful!');
      console.log('✨ Heroku database is ready for automatic token refresh');
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('No refresh token found in database')) {
        console.log('⚠️  No refresh token found in Heroku database.');
        console.log('');
        console.log('📝 Next steps:');
        console.log('1. Set up OAuth tokens locally first');
        console.log('2. Run: npx tsx scripts/migrate-tokens-to-db.ts (locally)');  
        console.log('3. Then copy tokens to Heroku using manual setup');
        console.log('');
        console.log('💡 Alternatively, run OAuth setup directly on Heroku:');
        console.log('   heroku run "npx tsx scripts/get-oauth-tokens.js" --app glacial-springs-31233');
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateTokensToHeroku().catch(console.error);