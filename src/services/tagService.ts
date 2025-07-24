import type { NationBuilderClient } from './nationbuilder.js';
import type { Person } from '../types/index.js';

export class TagService {
  constructor(private client: NationBuilderClient) {}

  async getAllPeopleWithTag(tag: string): Promise<Person[]> {
    const allPeople: Person[] = [];
    let page = 1;
    const perPage = 100;
    
    while (true) {
      const people = await this.client.getPeopleWithTag(tag, page, perPage);
      
      if (people.length === 0) {
        break;
      }
      
      allPeople.push(...people);
      
      // If we got less than perPage, we're on the last page
      if (people.length < perPage) {
        break;
      }
      
      page++;
    }
    
    return allPeople;
  }

  async getPeopleWithTagSample(tag: string, limit = 10): Promise<Person[]> {
    const people = await this.client.getPeopleWithTag(tag, 1, limit);
    return people;
  }
}