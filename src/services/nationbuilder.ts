import { HTTPNationBuilderClient } from './httpClient.js';
import type { AppConfig, Person, PathJourney, Path } from '../types/index.js';

export class NationBuilderClient {
  private httpClient: HTTPNationBuilderClient;

  constructor(config: AppConfig) {
    this.httpClient = new HTTPNationBuilderClient(config);
  }

  async getPeopleWithTag(tag: string, page = 1, perPage = 100): Promise<Person[]> {
    return await this.httpClient.getPeopleWithTag(tag, page, perPage);
  }

  async getPathJourneys(pathId: string, page = 1, perPage = 100): Promise<PathJourney[]> {
    return await this.httpClient.getPathJourneys(pathId, page, perPage);
  }

  async getAllPaths(): Promise<Path[]> {
    return await this.httpClient.getAllPaths();
  }

  async getPathBySlug(slug: string): Promise<Path | null> {
    return await this.httpClient.getPathBySlug(slug);
  }
}