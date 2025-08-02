interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export class TokenService {
  private accessToken: string | null = null;
  private nationSlug: string;

  constructor(nationSlug: string) {
    this.nationSlug = nationSlug;
  }

  async getAccessToken(refreshToken: string): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    console.log('🔄 Refreshing OAuth access token...');

    const tokenUrl = `https://${this.nationSlug}.nationbuilder.com/oauth/token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${error}`);
    }

    const tokens = (await response.json()) as TokenResponse;
    this.accessToken = tokens.access_token;

    console.log(
      `✅ Access token refreshed (expires in ${tokens.expires_in} seconds)`
    );

    return this.accessToken;
  }
}
