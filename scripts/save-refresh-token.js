#!/usr/bin/env node

/**
 * Script to save initial refresh token to database
 * Run this after getting tokens from get-oauth-tokens.js
 */

import { config } from 'dotenv';
import { TokenStorage } from '../dist/services/tokenStorage.js';
import readline from 'readline';

// Load environment variables from .env file
config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function saveRefreshToken() {
  console.log('💾 Save OAuth Tokens to Database\n');

  try {
    const tokenStorage = new TokenStorage();
    await tokenStorage.initialize();

    // Check if there's already a token
    const existingToken = await tokenStorage.getRefreshToken();
    if (existingToken) {
      console.log('⚠️  OAuth tokens already exist in the database.');
      console.log(`Current refresh token: ${existingToken.substring(0, 20)}...`);
      
      const overwrite = await prompt('Do you want to overwrite them? (y/N): ');
      if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
        console.log('Cancelled.');
        rl.close();
        await tokenStorage.close();
        return;
      }
    }

    console.log('Enter the tokens from your OAuth setup:');
    const accessToken = await prompt('Access token: ');
    const refreshToken = await prompt('Refresh token: ');
    const expiresInStr = await prompt('Expires in (seconds, default 86400): ');

    if (!accessToken.trim() || !refreshToken.trim()) {
      console.log('❌ Both access token and refresh token are required.');
      rl.close();
      await tokenStorage.close();
      return;
    }

    const expiresIn = parseInt(expiresInStr.trim()) || 86400; // Default 24 hours

    await tokenStorage.saveTokens(accessToken.trim(), refreshToken.trim(), expiresIn);
    
    console.log('\n✅ OAuth tokens saved successfully!');
    console.log('You can now run your automation app.');

    rl.close();
    await tokenStorage.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

saveRefreshToken().catch(console.error);