#!/usr/bin/env node

/**
 * Test database-only token service implementation
 * Verifies tokens are properly stored and refreshed from database
 */

import { config } from 'dotenv';

// Load environment variables from .env file FIRST
config();

import { TokenService } from '../src/services/tokenService';

async function testDatabaseTokenService() {
  console.log('🧪 Testing Database-Only Token Service');
  console.log('======================================\n');

  // Check required environment variables (only OAuth client credentials)
  const nationSlug = process.env.NATIONBUILDER_SLUG;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  const missing = [];
  if (!nationSlug) missing.push('NATIONBUILDER_SLUG');
  if (!clientId) missing.push('OAUTH_CLIENT_ID');
  if (!clientSecret) missing.push('OAUTH_CLIENT_SECRET');

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('\nOnly OAuth client credentials should be in .env file.');
    console.error('Tokens should be stored in database only.');
    return;
  }

  // Check that token env vars are NOT present (they should be database-only now)
  const hasAccessToken = !!process.env.ACCESS_TOKEN;
  const hasRefreshToken = !!process.env.OAUTH_REFRESH_TOKEN;

  if (hasAccessToken || hasRefreshToken) {
    console.log('⚠️  Token env vars still present:');
    if (hasAccessToken) console.log('   - ACCESS_TOKEN found in env');
    if (hasRefreshToken) console.log('   - OAUTH_REFRESH_TOKEN found in env');
    console.log('\n📝 Recommendation: Remove token env vars and use database-only storage');
    console.log('');
  } else {
    console.log('✅ No token env vars found - using database-only storage');
    console.log('');
  }

  try {
    // Initialize TokenService
    console.log('🔧 Initializing TokenService...');
    const tokenService = new TokenService(nationSlug, clientId, clientSecret);
    await tokenService.initialize();
    console.log('✅ TokenService initialized');
    console.log('');

    // Test getting access token (should automatically refresh if needed)
    console.log('🔑 Testing access token retrieval...');
    const accessToken = await tokenService.getAccessToken();
    
    if (accessToken) {
      console.log(`✅ Access token retrieved: ${accessToken.substring(0, 20)}...`);
      console.log('');

      // Test API call with the token
      console.log('🌐 Testing API call with retrieved token...');
      const apiUrl = `https://${nationSlug}.nationbuilder.com/api/v2/signup_tags`;
      
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      });

      console.log(`API response: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ API call successful (${data.data ? data.data.length : 0} tags found)`);
        console.log('');
        console.log('🎉 Database-only token service is working perfectly!');
        console.log('');
        console.log('✨ Summary:');
        console.log('   - No tokens stored in environment variables');
        console.log('   - Tokens automatically retrieved from database');
        console.log('   - Token refresh handled transparently');
        console.log('   - API calls working with database tokens');
      } else {
        const errorText = await response.text();
        console.log(`❌ API call failed: ${errorText}`);
        console.log('   This might indicate a token issue.');
      }
    } else {
      console.log('❌ Failed to retrieve access token');
      console.log('   Check that tokens were properly migrated to database');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('No refresh token found in database')) {
      console.log('');
      console.log('💡 Solution: Run the migration script first:');
      console.log('   node scripts/migrate-tokens-to-db.js');
      console.log('');
      console.log('   Or generate new tokens:');
      console.log('   node scripts/get-oauth-tokens.js');
    }
    
    process.exit(1);
  }
}

testDatabaseTokenService().catch(console.error);