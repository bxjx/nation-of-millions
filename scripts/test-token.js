#!/usr/bin/env node

/**
 * Debug script to test OAuth token refresh
 */

import { config } from 'dotenv';

// Load environment variables from .env file
config();

async function testTokenRefresh() {
  const nationSlug = process.env.NATIONBUILDER_SLUG;
  const refreshToken = process.env.OAUTH_REFRESH_TOKEN;

  if (!nationSlug || !refreshToken) {
    console.error('❌ Missing required environment variables:');
    console.error('   NATIONBUILDER_SLUG:', nationSlug ? '✅' : '❌');
    console.error('   OAUTH_REFRESH_TOKEN:', refreshToken ? '✅' : '❌');
    return;
  }

  console.log('🔍 Testing OAuth token refresh...');
  console.log(`Nation: ${nationSlug}`);
  console.log(`Refresh token: ${refreshToken.substring(0, 20)}...`);

  const tokenUrl = `https://${nationSlug}.nationbuilder.com/oauth/token`;
  console.log(`Token URL: ${tokenUrl}`);

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      })
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (response.ok) {
      const tokens = JSON.parse(responseText);
      console.log('✅ Token refresh successful!');
      console.log(`Access token: ${tokens.access_token.substring(0, 20)}...`);
      console.log(`Expires in: ${tokens.expires_in} seconds`);
    } else {
      console.log('❌ Token refresh failed');
      console.log('This suggests the refresh token is invalid or expired');
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testTokenRefresh().catch(console.error);