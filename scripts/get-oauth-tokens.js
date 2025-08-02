#!/usr/bin/env node

/**
 * NationBuilder OAuth Token Acquisition Script
 * 
 * This script helps you manually obtain OAuth tokens for a NationBuilder nation.
 * Run this once per nation to get the refresh token for your .env file.
 * 
 * Usage:
 *   node scripts/get-oauth-tokens.js
 * 
 * Prerequisites:
 *   1. Register your app at: https://NATION_SLUG.nationbuilder.com/admin/apps/new
 *   2. Set redirect URI to: http://localhost:3000/callback
 *   3. Note your Client ID and Client Secret
 */

import readline from 'readline';
import { createServer } from 'http';
import { parse } from 'url';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function exchangeCodeForTokens(nationSlug, clientId, clientSecret, authCode) {
  const tokenUrl = `https://${nationSlug}.nationbuilder.com/oauth/token`;
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code: authCode,
      redirect_uri: 'http://localhost:3000/callback'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${error}`);
  }

  return await response.json();
}

function startCallbackServer() {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      
      if (parsedUrl.pathname === '/callback') {
        const { code, error } = parsedUrl.query;
        
        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`<h1>Authorization Failed</h1><p>Error: ${error}</p>`);
          reject(new Error(`OAuth error: ${error}`));
          return;
        }
        
        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <h1>Authorization Successful!</h1>
            <p>You can close this window and return to the terminal.</p>
            <script>window.close();</script>
          `);
          server.close();
          resolve(code);
          return;
        }
      }
      
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>Not Found</h1>');
    });

    server.listen(3000, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('🚀 Callback server started on http://localhost:3000');
      }
    });

    server.on('error', reject);
  });
}

async function main() {
  console.log('🔐 NationBuilder OAuth Token Acquisition\n');

  try {
    // Get app details
    const nationSlug = await prompt('Enter your nation slug (e.g., "myorganization"): ');
    const clientId = await prompt('Enter your app Client ID: ');
    const clientSecret = await prompt('Enter your app Client Secret: ');

    console.log('\n📋 Steps to complete:');
    console.log('1. Make sure your app redirect URI is: http://localhost:3000/callback');
    console.log('2. Click the authorization URL that will open');
    console.log('3. Authorize the app in your browser');
    console.log('4. Return here for your tokens\n');

    // Generate authorization URL
    const authUrl = `https://${nationSlug}.nationbuilder.com/oauth/authorize?` +
      `response_type=code&` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent('http://localhost:3000/callback')}&` +
      `scope=`;

    console.log('🌐 Authorization URL:');
    console.log(authUrl);
    console.log('\nPress Enter after opening the URL above...');
    await prompt('');

    // Start callback server and wait for authorization
    console.log('⏳ Waiting for authorization...');
    const authCode = await startCallbackServer();
    
    console.log('✅ Authorization code received!');
    console.log('🔄 Exchanging code for tokens...');

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(nationSlug, clientId, clientSecret, authCode);

    console.log('\n🎉 Success! Your OAuth tokens:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📝 Add these to your .env file:');
    console.log(`NATIONBUILDER_SLUG=${nationSlug}`);
    console.log(`OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
    
    if (tokens.access_token) {
      console.log(`\n🔑 Current access token (expires in ${tokens.expires_in} seconds):`);
      console.log(`ACCESS_TOKEN=${tokens.access_token}`);
    }

    console.log('\n📄 Full token response:');
    console.log(JSON.stringify(tokens, null, 2));

    console.log('\n✨ Setup complete! Your app can now use the refresh token to get access tokens automatically.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main().catch(console.error);