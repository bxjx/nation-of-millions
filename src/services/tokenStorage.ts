import { Pool } from 'pg';

export class TokenStorage {
  private pool: Pool;

  constructor() {
    // Use local development database first, then Heroku Postgres
    const connectionString =
      process.env.DATABASE_URL_LOCAL || process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL_LOCAL or DATABASE_URL environment variable is required'
      );
    }

    this.pool = new Pool({
      connectionString,
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
    });
  }

  async initialize(): Promise<void> {
    // Create table if it doesn't exist
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS oauth_tokens (
        id SERIAL PRIMARY KEY,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  async getValidAccessToken(): Promise<string | null> {
    try {
      const result = await this.pool.query(
        'SELECT access_token, expires_at FROM oauth_tokens WHERE expires_at > NOW() ORDER BY updated_at DESC LIMIT 1'
      );

      return result.rows.length > 0 ? result.rows[0].access_token : null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      const result = await this.pool.query(
        'SELECT refresh_token FROM oauth_tokens ORDER BY updated_at DESC LIMIT 1'
      );

      return result.rows.length > 0 ? result.rows[0].refresh_token : null;
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  async saveTokens(
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  ): Promise<void> {
    try {
      // Calculate expiration time (subtract 5 minutes for safety)
      const expiresAt = new Date(Date.now() + (expiresIn - 300) * 1000);

      // Delete old tokens and insert new ones
      await this.pool.query('DELETE FROM oauth_tokens');
      await this.pool.query(
        'INSERT INTO oauth_tokens (access_token, refresh_token, expires_at) VALUES ($1, $2, $3)',
        [accessToken, refreshToken, expiresAt]
      );

      console.log(
        `✅ Tokens saved to database (expires at ${expiresAt.toISOString()})`
      );
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
