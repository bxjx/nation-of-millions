#!/usr/bin/env node

/**
 * Debug script to compare authorization vs refresh requests
 */

import { config } from 'dotenv';

// Load environment variables from .env file
config();

async function debugOAuthRequests() {
  const nationSlug = process.env.NATIONBUILDER_SLUG;
  const refreshToken = process.env.OAUTH_REFRESH_TOKEN;
  const redirectUri = process.env.OAUTH_REDIRECT_URI;

  if (!nationSlug || !refreshToken || !redirectUri) {
    console.error('❌ Missing required environment variables:');
    console.error('   NATIONBUILDER_SLUG:', nationSlug ? '✅' : '❌');
    console.error('   OAUTH_REFRESH_TOKEN:', refreshToken ? '✅' : '❌');
    console.error('   OAUTH_REDIRECT_URI:', redirectUri ? '✅' : '❌');
    return;
  }

  console.log('🔍 Debugging OAuth refresh request...');
  console.log(`Nation: ${nationSlug}`);
  console.log(`Redirect URI: ${redirectUri}`);
  console.log(`Refresh token: ${refreshToken.substring(0, 20)}...`);

  const tokenUrl = `https://${nationSlug}.nationbuilder.com/oauth/token`;
  
  // Test the exact same request format that worked for authorization
  const requestBody = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    redirect_uri: redirectUri,
  };

  console.log('\n📤 Request details:');
  console.log(`URL: ${tokenUrl}`);
  console.log(`Body:`, JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`\n📥 Response: ${response.status} ${response.statusText}`);
    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (response.ok) {
      console.log('✅ Refresh token works!');
    } else {
      console.log('❌ Refresh token failed');
      
      // Let's try without redirect_uri (some OAuth providers don't require it for refresh)
      console.log('\n🔄 Trying without redirect_uri...');
      
      const requestBodyNoRedirect = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      };
      
      const response2 = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBodyNoRedirect)
      });
      
      console.log(`Response: ${response2.status} ${response2.statusText}`);
      const responseText2 = await response2.text();
      console.log('Response body:', responseText2);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

debugOAuthRequests().catch(console.error);