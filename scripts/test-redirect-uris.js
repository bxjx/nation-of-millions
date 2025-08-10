#!/usr/bin/env node

/**
 * Test different redirect URI patterns to find the correct one
 */

import { config } from 'dotenv';

// Load environment variables from .env file
config();

async function testRefreshWithDifferentUris() {
  const nationSlug = process.env.NATIONBUILDER_SLUG;
  const refreshToken = process.env.OAUTH_REFRESH_TOKEN;

  if (!nationSlug || !refreshToken) {
    console.error('❌ Missing NATIONBUILDER_SLUG or OAUTH_REFRESH_TOKEN in .env');
    return;
  }

  const commonRedirectUris = [
    'https://bxjx.ngrok.io/callback',
    'http://localhost:3000/callback',
    'https://localhost:3000/callback',
    'http://127.0.0.1:3000/callback',
    'https://glacial-springs-31233-b4d3a5e84c98.herokuapp.com/oauth/callback',
    'urn:ietf:wg:oauth:2.0:oob',
    // Common variations
    'https://bxjx.ngrok.io/callback/',  // with trailing slash
    'http://localhost:3000/callback/',
  ];

  console.log('🔍 Testing different redirect URIs...\n');

  const tokenUrl = `https://${nationSlug}.nationbuilder.com/oauth/token`;

  for (const redirectUri of commonRedirectUris) {
    console.log(`Testing: ${redirectUri}`);
    
    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          redirect_uri: redirectUri,
        })
      });

      if (response.ok) {
        const tokens = await response.json();
        console.log(`✅ SUCCESS! Found working redirect URI: ${redirectUri}`);
        console.log(`New access token: ${tokens.access_token.substring(0, 20)}...`);
        console.log(`\nAdd this to your .env:`);
        console.log(`OAUTH_REDIRECT_URI=${redirectUri}`);
        return;
      } else {
        console.log(`❌ Failed (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n❌ None of the common redirect URIs worked.');
  console.log('The refresh token may be invalid, or the redirect URI is something else entirely.');
  console.log('\nCheck your app registration at:');
  console.log(`https://${nationSlug}.nationbuilder.com/admin/apps`);
}

testRefreshWithDifferentUris().catch(console.error);