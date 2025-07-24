import { config } from 'dotenv';

import type { AppConfig, TagToPathMapping } from '../types/index.js';

// Load environment variables
config();

function parseTagMappings(): TagToPathMapping[] {
  const mappings: TagToPathMapping[] = [];

  // Look for environment variables with pattern NB_MAPPING_*
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('NB_MAPPING_') && value) {
      // Parse format: "tag_name|path_slug|step_number"
      const parts = value.split('|');
      if (parts.length !== 3) {
        throw new Error(
          `Invalid tag mapping format for ${key}. Expected "tag_name|path_slug|step_number", got "${value}"`
        );
      }

      const [tagName, pathSlug, stepStr] = parts;

      if (!tagName || !pathSlug || !stepStr) {
        throw new Error(
          `Invalid tag mapping format for ${key}. All parts (tag|path|step) must be non-empty.`
        );
      }

      const stepNumber = parseInt(stepStr, 10);

      if (isNaN(stepNumber) || stepNumber < 1) {
        throw new Error(
          `Invalid step number for ${key}. Expected positive integer, got "${stepStr}"`
        );
      }

      mappings.push({
        sourceTag: tagName,
        targetPathSlug: pathSlug,
        targetStepNumber: stepNumber,
      });
    }
  }

  return mappings;
}

function validateRequiredEnvVars(): void {
  const required = ['NATIONBUILDER_API_TOKEN', 'NATIONBUILDER_SLUG'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
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
    nationBuilderApiToken: process.env.NATIONBUILDER_API_TOKEN!,
    nationBuilderSlug: process.env.NATIONBUILDER_SLUG!,
    tagMappings,
    simulationMode,
  };
}
