import { TokenStorage } from './tokenStorage.js';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export class TokenService {
  private accessToken: string | null = null;
  private nationSlug: string;
  private clientId: string;
  private clientSecret: string;
  private tokenStorage: TokenStorage;

  constructor(nationSlug: string, clientId: string, clientSecret: string) {
    this.nationSlug = nationSlug;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.tokenStorage = new TokenStorage();
  }

  async initialize(): Promise<void> {
    await this.tokenStorage.initialize();
  }

  async getAccessToken(): Promise<string> {
    // First check if we have a valid access token in memory
    if (this.accessToken) {
      return this.accessToken;
    }

    // Check if we have a valid access token in database
    const storedAccessToken = await this.tokenStorage.getValidAccessToken();
    if (storedAccessToken) {
      console.log('✅ Using valid access token from database');
      this.accessToken = storedAccessToken;
      return this.accessToken;
    }

    console.log('🔄 Refreshing OAuth access token...');

    // Get refresh token from database
    const refreshToken = await this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error(
        'No refresh token found in database. Run OAuth setup first.'
      );
    }

    const tokenUrl = `https://${this.nationSlug}.nationbuilder.com/oauth/token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${error}`);
    }

    const tokens = (await response.json()) as TokenResponse;
    this.accessToken = tokens.access_token;

    // Save both tokens to database with expiration
    await this.tokenStorage.saveTokens(
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_in
    );

    console.log(
      `✅ Access token refreshed (expires in ${tokens.expires_in} seconds)`
    );

    return this.accessToken;
  }

  async saveInitialTokens(
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  ): Promise<void> {
    await this.tokenStorage.saveTokens(accessToken, refreshToken, expiresIn);
  }
}
