#!/usr/bin/env node

/**
 * Debug script to test direct access token API calls
 */

import { config } from 'dotenv';

// Load environment variables from .env file
config();

async function testAccessToken() {
  const nationSlug = process.env.NATIONBUILDER_SLUG;
  const accessToken = process.env.ACCESS_TOKEN; // Use the access token from OAuth script output

  if (!nationSlug || !accessToken) {
    console.error('❌ Missing required environment variables:');
    console.error('   NATIONBUILDER_SLUG:', nationSlug ? '✅' : '❌');
    console.error('   ACCESS_TOKEN:', accessToken ? '✅' : '❌');
    console.error('\nAdd ACCESS_TOKEN=your_access_token_here to your .env file');
    return;
  }

  console.log('🔍 Testing direct access token API call...');
  console.log(`Nation: ${nationSlug}`);
  console.log(`Access token: ${accessToken.substring(0, 20)}...`);

  try {
    // Test a simple API call - get signup tags
    const apiUrl = `https://${nationSlug}.nationbuilder.com/api/v2/signup_tags`;
    console.log(`API URL: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful!');
      console.log(`Found ${data.data ? data.data.length : 0} tags`);
      
      // Show first few tags (without sensitive data)
      if (data.data && data.data.length > 0) {
        console.log('\nFirst few tags:');
        data.data.slice(0, 3).forEach((tag, index) => {
          console.log(`${index + 1}. ${tag.attributes.name} (${tag.attributes.taggings_count} people)`);
        });
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API call failed');
      console.log('Response body:', errorText);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testAccessToken().catch(console.error);