import { config } from 'dotenv';

// Load environment variables
config();

// Simple HTTP test without spraypaint
async function testAuth(): Promise<void> {
  const token = process.env.NATIONBUILDER_API_TOKEN;
  const slug = process.env.NATIONBUILDER_SLUG;
  
  if (!token || !slug) {
    throw new Error('Missing NATIONBUILDER_API_TOKEN or NATIONBUILDER_SLUG');
  }
  
  const url = `https://${slug}.nationbuilder.com/api/v2/signups?filter[tag_id]=2&page[size]=3`;
  
  console.log('Testing direct API call...');
  console.log('URL:', url);
  console.log('Token:', token.substring(0, 20) + '...');
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response body (first 500 chars):', text.substring(0, 500));
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log('✅ API call successful');
      console.log('Data keys:', Object.keys(data));
    } else {
      console.log('❌ API call failed');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAuth().catch(console.error);