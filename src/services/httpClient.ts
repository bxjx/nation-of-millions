import type {
  AppConfig,
  Person,
  PathJourney,
  Path,
  PathStep,
} from '../types/index.js';
import { TokenService } from './tokenService.js';

interface APIResponse<T> {
  data: T[];
  links?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

interface SignupTag {
  id: string;
  type: 'signup_tags';
  attributes: {
    name: string;
    taggings_count: number;
  };
}

interface Signup {
  id: string;
  type: 'signups';
  attributes: {
    email?: string;
    first_name?: string;
    last_name?: string;
    do_not_call?: boolean;
    do_not_contact?: boolean;
  };
}

interface PathJourneyData {
  id: string;
  type: 'path_journeys';
  attributes: {
    signup_id: string;
    path_id: string;
    current_step_id: string;
    journey_status: string;
  };
}

interface PathData {
  id: string;
  type: 'paths';
  attributes: {
    name: string;
    default_due_date_interval: string;
    default_point_person_id?: string;
    default_value_amount: string;
    due_date_is_enabled: boolean;
    value_amount_is_enabled: boolean;
    created_at: string;
    updated_at: string;
  };
}

interface PathStepData {
  id: string;
  type: 'path_steps';
  attributes: {
    name: string;
    position: number;
    path_id: string;
    default_due_date_interval: string;
    default_point_person_id?: string;
    created_at: string;
    updated_at: string;
  };
}

export class HTTPNationBuilderClient {
  private config: AppConfig;
  private baseUrl: string;
  private tokenService: TokenService | null = null;
  private accessToken: string | null = null;

  constructor(config: AppConfig) {
    this.config = config;
    this.baseUrl = `https://${config.nationBuilderSlug}.nationbuilder.com/api/v2`;

    if (config.oauthClientId && config.oauthClientSecret) {
      this.tokenService = new TokenService(
        config.nationBuilderSlug,
        config.oauthClientId,
        config.oauthClientSecret
      );
    }
  }

  async initialize(): Promise<void> {
    if (this.tokenService) {
      console.log('🔐 Initializing OAuth access token...');
      await this.tokenService.initialize();
      this.accessToken = await this.tokenService.getAccessToken();
    }
  }

  private getAuthToken(): string {
    if (this.accessToken) {
      return this.accessToken;
    }
    if (this.config.nationBuilderApiToken) {
      return this.config.nationBuilderApiToken;
    }
    throw new Error('No authentication token available');
  }

  private async apiCall<T>(endpoint: string): Promise<APIResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`API Call: ${url}`);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `API call failed: ${response.status} ${response.statusText}`
      );
    }

    return (await response.json()) as APIResponse<T>;
  }

  async findTagByName(tagName: string): Promise<string | null> {
    try {
      const response = await this.apiCall<SignupTag>(
        `/signup_tags?filter[name]=${encodeURIComponent(tagName)}`
      );

      if (response.data.length === 0) {
        return null;
      }

      return response.data[0]!.id;
    } catch (error) {
      throw new Error(`Failed to find tag "${tagName}": ${error}`);
    }
  }

  async getPeopleWithTag(
    tag: string,
    page = 1,
    perPage = 100
  ): Promise<Person[]> {
    try {
      console.log(`Step 1: Finding tag "${tag}" by name...`);

      const tagId = await this.findTagByName(tag);
      if (!tagId) {
        console.log(`No tag found with name: ${tag}`);
        return [];
      }

      console.log(`Step 2: Found tag ID ${tagId}, getting signups...`);

      const endpoint = `/signups?filter[tag_id]=${tagId}&page[number]=${page}&page[size]=${perPage}`;
      const response = await this.apiCall<Signup>(endpoint);

      console.log(`Found ${response.data.length} signups with tag "${tag}"`);

      return response.data.map(signup => ({
        id: signup.id,
        email: signup.attributes.email ? '[email-hidden]' : '[no-email]',
        first_name: signup.attributes.first_name
          ? '[name-hidden]'
          : '[no-name]',
        last_name: signup.attributes.last_name ? '[name-hidden]' : '[no-name]',
        tags: [tag],
      }));
    } catch (error) {
      throw new Error(`Failed to get people with tag "${tag}": ${error}`);
    }
  }

  async getPathJourneys(
    pathId: string,
    page = 1,
    perPage = 100
  ): Promise<PathJourney[]> {
    try {
      const endpoint = `/path_journeys?filter[path_id]=${pathId}&page[number]=${page}&page[size]=${perPage}`;
      const response = await this.apiCall<PathJourneyData>(endpoint);

      return response.data.map(journey => ({
        id: journey.id,
        person_id: journey.attributes.signup_id, // API uses signup_id, not person_id
        path_id: journey.attributes.path_id,
        step_id: journey.attributes.current_step_id, // API uses current_step_id
      }));
    } catch (error) {
      throw new Error(
        `Failed to get path journeys for path "${pathId}": ${error}`
      );
    }
  }

  async getAllPaths(): Promise<Path[]> {
    try {
      const allPaths: Path[] = [];
      let page = 1;
      const perPage = 100;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const response = await this.apiCall<PathData>(
          `/paths?page[number]=${page}&page[size]=${perPage}`
        );

        if (response.data.length === 0) break;

        const paths = response.data.map(path => ({
          id: path.id,
          name: path.attributes.name,
          slug: path.attributes.name.toLowerCase().replace(/\s+/g, '-'),
          status: 'active',
        }));

        allPaths.push(...paths);

        // If we got less than perPage, we're on the last page
        if (response.data.length < perPage) break;
        page++;
      }

      return allPaths;
    } catch (error) {
      throw new Error(`Failed to get all paths: ${error}`);
    }
  }

  async getPathBySlug(slug: string): Promise<Path | null> {
    try {
      const allPaths = await this.getAllPaths();
      return allPaths.find(path => path.slug === slug) || null;
    } catch (error) {
      throw new Error(`Failed to get path with slug "${slug}": ${error}`);
    }
  }

  async getPathSteps(pathId: string): Promise<PathStep[]> {
    try {
      const response = await this.apiCall<PathStepData>(
        `/path_steps?filter[path_id]=${pathId}`
      );
      return response.data.map(step => ({
        id: step.id,
        name: step.attributes.name,
        step_number: step.attributes.position,
        path_id: step.attributes.path_id,
      }));
    } catch (error) {
      throw new Error(
        `Failed to get path steps for path "${pathId}": ${error}`
      );
    }
  }

  async addPersonToPath(
    personId: string,
    pathId: string,
    stepNumber: number
  ): Promise<boolean> {
    if (this.config.simulationMode) {
      console.log(
        `🔄 SIMULATION: Would add person ${personId} to path ${pathId} at step ${stepNumber}`
      );
      return true;
    }

    try {
      console.log(
        `🚀 LIVE MODE: Adding person ${personId} to path ${pathId} at step ${stepNumber}`
      );

      // First, get the path steps to find the correct step ID
      const pathSteps = await this.getPathSteps(pathId);
      const targetStep = pathSteps.find(
        step => step.step_number === stepNumber
      );

      if (!targetStep) {
        throw new Error(
          `Step ${stepNumber} not found in path ${pathId}. Available steps: ${pathSteps.map(s => s.step_number).join(', ')}`
        );
      }

      console.log(
        `Found target step: "${targetStep.name}" (ID: ${targetStep.id})`
      );

      // Create the path journey via POST to /path_journeys
      // Based on existing path journey structure: signup_id, path_id, and current_step_id are in attributes
      const journeyData = {
        data: {
          type: 'path_journeys',
          attributes: {
            signup_id: personId,
            path_id: pathId,
            current_step_id: targetStep.id,
          },
        },
      };

      const url = `${this.baseUrl}/path_journeys`;
      console.log(`API Call: POST ${url}`);
      console.log(`Request body:`, JSON.stringify(journeyData, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
        body: JSON.stringify(journeyData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API call failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const result = (await response.json()) as { data?: { id?: string } };
      console.log(
        `✅ Successfully created path journey (ID: ${result.data?.id || 'unknown'})`
      );

      return true;
    } catch (error) {
      throw new Error(`Failed to add person to path: ${error}`);
    }
  }
}
