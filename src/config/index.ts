import { config } from 'dotenv';

import type { AppConfig, TagToPathMapping } from '../types/index.js';

// Load environment variables
config();

function parseTagMappings(): TagToPathMapping[] {
  const mappings: TagToPathMapping[] = [];

  // Look for environment variables with pattern NB_MAPPING_*
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('NB_MAPPING_') && value) {
      // Validate pipe character count before splitting
      const pipeCount = (value.match(/\|/g) || []).length;
      if (pipeCount !== 2) {
        throw new Error(
          `Invalid tag mapping format for ${key}. Expected exactly 2 pipe characters (|), found ${pipeCount}. Format: "tag_name|path_name|step_name"`
        );
      }

      // Parse format: "tag_name|path_name|step_name"
      const parts = value.split('|');

      // This should always be 3 due to pipe count validation above, but double-check
      if (parts.length !== 3) {
        throw new Error(
          `Invalid tag mapping format for ${key}. Expected "tag_name|path_name|step_name", got "${value}"`
        );
      }

      const [tagName, pathName, stepName] = parts as [string, string, string];

      // Check for empty parts (but allow any characters except pipe)
      if (!tagName || !pathName || !stepName) {
        throw new Error(
          `Invalid tag mapping format for ${key}. All parts (tag|path|step) must be non-empty. Got: tag="${tagName || 'empty'}", path="${pathName || 'empty'}", step="${stepName || 'empty'}"`
        );
      }

      // Validate that none of the parts contain pipe characters (should be impossible due to split, but safety check)
      if (
        tagName.includes('|') ||
        pathName.includes('|') ||
        stepName.includes('|')
      ) {
        throw new Error(
          `Invalid tag mapping format for ${key}. Parts cannot contain pipe characters. Use a different separator if needed.`
        );
      }

      mappings.push({
        sourceTag: tagName,
        targetPathName: pathName,
        targetStepName: stepName,
      });
    }
  }

  return mappings;
}

function validateRequiredEnvVars(): void {
  const required = ['NATIONBUILDER_SLUG'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  // Check for either OAuth client credentials or legacy API token
  const hasOAuthCredentials = !!(
    process.env.OAUTH_CLIENT_ID && process.env.OAUTH_CLIENT_SECRET
  );
  const hasLegacyToken = !!process.env.NATIONBUILDER_API_TOKEN;

  if (!hasOAuthCredentials && !hasLegacyToken) {
    throw new Error(
      'Missing authentication: Please set either (OAUTH_CLIENT_ID + OAUTH_CLIENT_SECRET) or NATIONBUILDER_API_TOKEN'
    );
  }

  if (hasOAuthCredentials && hasLegacyToken) {
    console.log(
      '⚠️  Both OAuth and legacy tokens found. Using OAuth credentials.'
    );
  }
}

export function loadConfig(): AppConfig {
  validateRequiredEnvVars();

  const tagMappings = parseTagMappings();

  if (tagMappings.length === 0) {
    throw new Error(
      'No tag mappings found. Please set NB_MAPPING_* environment variables.'
    );
  }

  // Default to simulation mode for safety
  const simulationMode = process.env.SIMULATION_MODE !== 'false';

  return {
    nationBuilderApiToken: process.env.NATIONBUILDER_API_TOKEN || null,
    oauthClientId: process.env.OAUTH_CLIENT_ID || null,
    oauthClientSecret: process.env.OAUTH_CLIENT_SECRET || null,
    nationBuilderSlug: process.env.NATIONBUILDER_SLUG!,
    tagMappings,
    simulationMode,
  };
}
