import type { AppConfig, Person, PathJourney, Path } from '../types/index.js';

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
    person_id: string;
    path_id: string;
    step_id: string;
    step_number: number;
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

export class HTTPNationBuilderClient {
  private config: AppConfig;
  private baseUrl: string;

  constructor(config: AppConfig) {
    this.config = config;
    this.baseUrl = `https://${config.nationBuilderSlug}.nationbuilder.com/api/v2`;
  }

  private async apiCall<T>(endpoint: string): Promise<APIResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`API Call: ${url}`);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.config.nationBuilderApiToken}`,
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
        person_id: journey.attributes.person_id,
        path_id: journey.attributes.path_id,
        step_id: journey.attributes.step_id,
        step_number: journey.attributes.step_number,
      }));
    } catch (error) {
      throw new Error(
        `Failed to get path journeys for path "${pathId}": ${error}`
      );
    }
  }

  async getAllPaths(): Promise<Path[]> {
    try {
      const response = await this.apiCall<PathData>('/paths');
      return response.data.map(path => ({
        id: path.id,
        name: path.attributes.name,
        slug: path.attributes.name.toLowerCase().replace(/\s+/g, '-'),
        status: 'active',
      }));
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
      // TODO: Implement actual API call when ready
      console.log(
        `🚀 LIVE MODE: Adding person ${personId} to path ${pathId} at step ${stepNumber}`
      );
      throw new Error(
        'Live path addition not yet implemented - use simulation mode'
      );
    } catch (error) {
      throw new Error(`Failed to add person to path: ${error}`);
    }
  }
}
