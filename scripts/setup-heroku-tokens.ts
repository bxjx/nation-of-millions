#!/usr/bin/env node

/**
 * Set up OAuth tokens on Heroku by copying from local database
 * Run this once after Heroku Postgres is ready
 */

import { config } from 'dotenv';

// Load environment variables from .env file FIRST
config();

import { TokenStorage } from '../src/services/tokenStorage';

async function setupHerokuTokens() {
  console.log('🔑 Setting up OAuth tokens on Heroku');
  console.log('=====================================\n');

  try {
    console.log('Step 1: Getting tokens from local database...');
    
    // Create local token storage (uses DATABASE_URL_LOCAL)
    const localStorage = new TokenStorage();
    await localStorage.initialize();

    // Get current refresh token from local database
    const refreshToken = await localStorage.getRefreshToken();
    if (!refreshToken) {
      console.error('❌ No refresh token found in local database.');
      console.error('   Run: npx tsx scripts/migrate-tokens-to-db.ts first');
      return;
    }

    console.log(`✅ Found refresh token in local database: ${refreshToken.substring(0, 20)}...`);

    console.log('\nStep 2: Setting up tokens on Heroku...');
    console.log('🚀 You need to run this manually on Heroku:');
    console.log('');
    console.log('1. Wait for database to be ready:');
    console.log('   heroku addons:info postgresql-regular-04578 --app glacial-springs-31233');
    console.log('');
    console.log('2. Set the refresh token on Heroku temporarily:');
    console.log(`   heroku config:set TEMP_REFRESH_TOKEN="${refreshToken}" --app glacial-springs-31233`);
    console.log('');
    console.log('3. Run a one-time migration script on Heroku:');
    console.log('   heroku run "node -e \\"');
    console.log('     import(\\'./dist/services/tokenService.js\\').then(async ({TokenService}) => {');
    console.log('       const ts = new TokenService(process.env.NATIONBUILDER_SLUG, process.env.OAUTH_CLIENT_ID, process.env.OAUTH_CLIENT_SECRET);');
    console.log('       await ts.initialize();');
    console.log('       await ts.saveInitialTokens(\\'\\'dummy\\'\\'\\', process.env.TEMP_REFRESH_TOKEN, 3600);');
    console.log('       console.log(\\'Tokens saved to Heroku database\\');');
    console.log('     })');
    console.log('   \\"" --app glacial-springs-31233');
    console.log('');
    console.log('4. Remove the temporary token:');
    console.log('   heroku config:unset TEMP_REFRESH_TOKEN --app glacial-springs-31233');
    console.log('');
    console.log('5. Test the setup:');
    console.log('   heroku logs --tail --app glacial-springs-31233');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupHerokuTokens().catch(console.error);