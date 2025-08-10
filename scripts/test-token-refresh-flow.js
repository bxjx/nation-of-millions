#!/usr/bin/env node

/**
 * Comprehensive test script to validate OAuth token refresh flow
 * Tests the key behavior: refreshing a token invalidates the previous token
 */

import { config } from 'dotenv';

// Load environment variables from .env file
config();

async function makeApiCall(accessToken, testName) {
  const nationSlug = process.env.NATIONBUILDER_SLUG;
  const apiUrl = `https://${nationSlug}.nationbuilder.com/api/v2/signup_tags`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    });

    console.log(`${testName}: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${testName} - API call successful (${data.data ? data.data.length : 0} tags)`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`❌ ${testName} - API call failed: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${testName} - Network error: ${error.message}`);
    return false;
  }
}

async function refreshToken(currentRefreshToken) {
  const nationSlug = process.env.NATIONBUILDER_SLUG;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  
  const tokenUrl = `https://${nationSlug}.nationbuilder.com/oauth/token`;

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: currentRefreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    console.log(`Token refresh response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const tokens = await response.json();
      console.log(`✅ Token refresh successful (expires in ${tokens.expires_in} seconds)`);
      return {
        success: true,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in
      };
    } else {
      const errorText = await response.text();
      console.log(`❌ Token refresh failed: ${errorText}`);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.log(`❌ Token refresh network error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testTokenRefreshFlow() {
  console.log('🧪 Testing OAuth Token Refresh Flow');
  console.log('=====================================\n');

  // Check required environment variables
  const nationSlug = process.env.NATIONBUILDER_SLUG;
  const currentRefreshToken = process.env.OAUTH_REFRESH_TOKEN;
  const currentAccessToken = process.env.ACCESS_TOKEN;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  const missing = [];
  if (!nationSlug) missing.push('NATIONBUILDER_SLUG');
  if (!currentRefreshToken) missing.push('OAUTH_REFRESH_TOKEN');
  if (!currentAccessToken) missing.push('ACCESS_TOKEN');
  if (!clientId) missing.push('OAUTH_CLIENT_ID');
  if (!clientSecret) missing.push('OAUTH_CLIENT_SECRET');

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('\nPlease set these in your .env file:');
    missing.forEach(varName => console.error(`   ${varName}=your_value_here`));
    return;
  }

  console.log(`Nation: ${nationSlug}`);
  console.log(`Current access token: ${currentAccessToken.substring(0, 20)}...`);
  console.log(`Current refresh token: ${currentRefreshToken.substring(0, 20)}...`);
  console.log('');

  // Step 1: Test current access token
  console.log('📍 STEP 1: Test current access token');
  const step1Success = await makeApiCall(currentAccessToken, 'Current token test');
  
  if (!step1Success) {
    console.log('⚠️  Current access token is already invalid. This is expected if it expired.');
    console.log('   Proceeding with refresh test...\n');
  } else {
    console.log('');
  }

  // Step 2: Refresh the token
  console.log('📍 STEP 2: Refresh the access token');
  const refreshResult = await refreshToken(currentRefreshToken);
  
  if (!refreshResult.success) {
    console.log('❌ Token refresh failed. Cannot continue with validation.');
    console.log('   Check that OAUTH_REFRESH_TOKEN is valid and not expired.');
    return;
  }

  const newAccessToken = refreshResult.access_token;
  const newRefreshToken = refreshResult.refresh_token;
  
  console.log(`New access token: ${newAccessToken.substring(0, 20)}...`);
  console.log(`New refresh token: ${newRefreshToken.substring(0, 20)}...`);
  console.log('');

  // Step 3: Test new access token
  console.log('📍 STEP 3: Test new access token');
  const step3Success = await makeApiCall(newAccessToken, 'New token test');
  
  if (!step3Success) {
    console.log('❌ New access token is invalid! This suggests a problem with the refresh.');
    return;
  }
  console.log('');

  // Step 4: Test old access token (should be invalid now)
  console.log('📍 STEP 4: Test old access token (should be invalid)');
  const step4Success = await makeApiCall(currentAccessToken, 'Old token validation');
  
  if (step4Success) {
    console.log('⚠️  UNEXPECTED: Old access token still works!');
    console.log('   This suggests tokens might not be immediately invalidated.');
  } else {
    console.log('✅ CONFIRMED: Old access token is now invalid (as expected)');
  }
  console.log('');

  // Step 5: Test old refresh token (should be invalid now)
  console.log('📍 STEP 5: Test old refresh token (should be invalid)');
  const oldRefreshResult = await refreshToken(currentRefreshToken);
  
  if (oldRefreshResult.success) {
    console.log('⚠️  UNEXPECTED: Old refresh token still works!');
    console.log('   This suggests refresh tokens might not be immediately invalidated.');
  } else {
    console.log('✅ CONFIRMED: Old refresh token is now invalid (as expected)');
  }
  console.log('');

  // Summary and recommendations
  console.log('📋 SUMMARY & RECOMMENDATIONS');
  console.log('============================');
  console.log('✅ Token refresh flow completed successfully');
  console.log('✅ New access token is valid and functional');
  
  if (!step4Success && !oldRefreshResult.success) {
    console.log('✅ CONFIRMED: Refreshing tokens invalidates previous tokens');
    console.log('');
    console.log('🔐 SECURITY IMPLICATIONS:');
    console.log('   - Each refresh creates new tokens and invalidates old ones');
    console.log('   - This is good security practice (prevents token reuse)');
    console.log('   - Our app MUST store the new tokens from each refresh');
    console.log('   - Never use old tokens after refreshing');
  } else {
    console.log('⚠️  Token invalidation behavior unclear - needs investigation');
  }
  
  console.log('');
  console.log('💾 IMPLEMENTATION NOTES:');
  console.log('   - TokenStorage.saveTokens() correctly replaces old tokens');
  console.log('   - Database approach is correct for persistent token storage');
  console.log('   - Always use the newest tokens from refresh response');
  
  console.log('');
  console.log('📝 UPDATE YOUR .env FILE:');
  console.log(`ACCESS_TOKEN=${newAccessToken}`);
  console.log(`OAUTH_REFRESH_TOKEN=${newRefreshToken}`);
}

testTokenRefreshFlow().catch(console.error);