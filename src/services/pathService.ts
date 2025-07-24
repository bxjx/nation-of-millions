import type { HTTPNationBuilderClient } from './httpClient.js';
import type { PathJourney, Path } from '../types/index.js';

export class PathService {
  constructor(private client: HTTPNationBuilderClient) {}

  async getAllPathJourneys(pathId: string): Promise<PathJourney[]> {
    const allJourneys: PathJourney[] = [];
    let page = 1;
    const perPage = 100;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const journeys = await this.client.getPathJourneys(pathId, page, perPage);

      if (journeys.length === 0) {
        break;
      }

      allJourneys.push(...journeys);

      // If we got less than perPage, we're on the last page
      if (journeys.length < perPage) {
        break;
      }

      page++;
    }

    return allJourneys;
  }

  async getPathJourneysSample(
    pathId: string,
    limit = 10
  ): Promise<PathJourney[]> {
    const journeys = await this.client.getPathJourneys(pathId, 1, limit);
    return journeys;
  }

  async getPersonIdsOnPath(pathId: string): Promise<Set<string>> {
    const journeys = await this.getAllPathJourneys(pathId);
    return new Set(journeys.map(journey => journey.person_id));
  }

  async getPersonIdsOnPathSample(
    pathId: string,
    limit = 10
  ): Promise<Set<string>> {
    const journeys = await this.getPathJourneysSample(pathId, limit);
    return new Set(journeys.map(journey => journey.person_id));
  }

  async getPathBySlug(slug: string): Promise<Path | null> {
    return await this.client.getPathBySlug(slug);
  }

  async getAllPaths(): Promise<Path[]> {
    return await this.client.getAllPaths();
  }
}
