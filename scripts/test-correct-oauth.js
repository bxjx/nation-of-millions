#!/usr/bin/env node

/**
 * Test the correct OAuth refresh flow with client_id and client_secret
 */

import { config } from 'dotenv';

// Load environment variables from .env file
config();

async function testCorrectOAuthRefresh() {
  const nationSlug = process.env.NATIONBUILDER_SLUG;
  const refreshToken = process.env.OAUTH_REFRESH_TOKEN;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  console.log('🔍 Testing CORRECT OAuth refresh format...');
  console.log('Environment variables:');
  console.log('   NATIONBUILDER_SLUG:', nationSlug ? '✅' : '❌');
  console.log('   OAUTH_REFRESH_TOKEN:', refreshToken ? '✅' : '❌');
  console.log('   OAUTH_CLIENT_ID:', clientId ? '✅' : '❌');
  console.log('   OAUTH_CLIENT_SECRET:', clientSecret ? '✅' : '❌');

  if (!nationSlug || !refreshToken || !clientId || !clientSecret) {
    console.error('\n❌ Missing required environment variables');
    console.error('Add these to your .env file:');
    console.error('OAUTH_CLIENT_ID=your_client_id');
    console.error('OAUTH_CLIENT_SECRET=your_client_secret');
    return;
  }

  const tokenUrl = `https://${nationSlug}.nationbuilder.com/oauth/token`;
  
  // According to NationBuilder docs, refresh request needs:
  const requestBody = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  };

  console.log('\n📤 Correct request format:');
  console.log(`URL: ${tokenUrl}`);
  console.log(`Body:`, {
    grant_type: 'refresh_token',
    refresh_token: `${refreshToken.substring(0, 20)}...`,
    client_id: clientId,
    client_secret: '***hidden***',
  });

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`\n📥 Response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const tokens = await response.json();
      console.log('✅ SUCCESS! OAuth refresh works!');
      console.log(`New access token: ${tokens.access_token.substring(0, 20)}...`);
      console.log(`New refresh token: ${tokens.refresh_token.substring(0, 20)}...`);
      console.log(`Expires in: ${tokens.expires_in} seconds`);
      
      console.log('\n📝 Update your .env with the NEW refresh token:');
      console.log(`OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
    } else {
      const errorText = await response.text();
      console.log('❌ Still failed');
      console.log('Response body:', errorText);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testCorrectOAuthRefresh().catch(console.error);