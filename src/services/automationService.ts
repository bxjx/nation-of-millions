import type { HTTPNationBuilderClient } from './httpClient.js';
import type { TagToPathMapping, Person, Path } from '../types/index.js';

export interface AutomationResult {
  mapping: TagToPathMapping;
  taggedPeople: Person[];
  targetPath: Path | null;
  peopleAlreadyOnPath: Set<string>;
  peopleToAdd: Person[];
  additionResults: { person: Person; success: boolean; error?: string }[];
}

export class AutomationService {
  constructor(private client: HTTPNationBuilderClient) {}

  async processMapping(mapping: TagToPathMapping): Promise<AutomationResult> {
    const result: AutomationResult = {
      mapping,
      taggedPeople: [],
      targetPath: null,
      peopleAlreadyOnPath: new Set(),
      peopleToAdd: [],
      additionResults: [],
    };

    try {
      console.log(
        `\n🔄 Processing mapping: ${mapping.sourceTag} → ${mapping.targetPathSlug} (step ${mapping.targetStepNumber})`
      );

      // Step 1: Get all people with the source tag
      console.log(`Step 1: Getting people with tag "${mapping.sourceTag}"`);
      const allPeople: Person[] = [];
      let page = 1;
      const perPage = 100;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const people = await this.client.getPeopleWithTag(
          mapping.sourceTag,
          page,
          perPage
        );
        if (people.length === 0) break;

        allPeople.push(...people);
        if (people.length < perPage) break;
        page++;
      }

      result.taggedPeople = allPeople;
      console.log(
        `Found ${allPeople.length} people with tag "${mapping.sourceTag}"`
      );

      if (allPeople.length === 0) {
        console.log('⚠️  No people found with this tag, skipping');
        return result;
      }

      // Step 2: Find the target path
      console.log(`Step 2: Looking up path "${mapping.targetPathSlug}"`);
      const targetPath = await this.client.getPathBySlug(
        mapping.targetPathSlug
      );

      if (!targetPath) {
        console.log(`❌ Path not found: "${mapping.targetPathSlug}"`);
        return result;
      }

      result.targetPath = targetPath;
      console.log(`✅ Found path: "${targetPath.name}" (ID: ${targetPath.id})`);

      // Step 3: Get all people currently on the path
      console.log(
        `Step 3: Getting people currently on path "${targetPath.name}"`
      );
      const allJourneys = [];
      page = 1;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const journeys = await this.client.getPathJourneys(
          targetPath.id,
          page,
          perPage
        );
        if (journeys.length === 0) break;

        allJourneys.push(...journeys);
        if (journeys.length < perPage) break;
        page++;
      }

      result.peopleAlreadyOnPath = new Set(allJourneys.map(j => j.person_id));
      console.log(
        `Found ${result.peopleAlreadyOnPath.size} people already on path`
      );

      // Step 4: Filter to find people who need to be added
      result.peopleToAdd = allPeople.filter(
        person => !result.peopleAlreadyOnPath.has(person.id)
      );
      console.log(
        `${result.peopleToAdd.length} people need to be added to the path`
      );

      // Step 5: Add people to path (in simulation or live mode)
      if (result.peopleToAdd.length > 0) {
        console.log(
          `Step 5: Adding ${result.peopleToAdd.length} people to path`
        );

        for (const person of result.peopleToAdd) {
          try {
            const success = await this.client.addPersonToPath(
              person.id,
              targetPath.id,
              mapping.targetStepNumber
            );

            result.additionResults.push({ person, success });

            if (success) {
              console.log(`✅ Added person ${person.id} to path`);
            } else {
              console.log(`❌ Failed to add person ${person.id} to path`);
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            result.additionResults.push({
              person,
              success: false,
              error: errorMessage,
            });
            console.log(`❌ Error adding person ${person.id}: ${errorMessage}`);
          }
        }
      } else {
        console.log('✅ All tagged people are already on the path');
      }

      return result;
    } catch (error) {
      console.error(
        `❌ Error processing mapping ${mapping.sourceTag} → ${mapping.targetPathSlug}:`,
        error
      );
      throw error;
    }
  }

  async processAllMappings(
    mappings: TagToPathMapping[]
  ): Promise<AutomationResult[]> {
    console.log(
      `🚀 Starting automation for ${mappings.length} tag-to-path mappings`
    );

    const results: AutomationResult[] = [];

    for (const mapping of mappings) {
      try {
        const result = await this.processMapping(mapping);
        results.push(result);

        // Add a small delay between mappings to be nice to the API
        if (mappings.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(
          `Failed to process mapping ${mapping.sourceTag} → ${mapping.targetPathSlug}:`,
          error
        );

        // Create a failed result
        results.push({
          mapping,
          taggedPeople: [],
          targetPath: null,
          peopleAlreadyOnPath: new Set(),
          peopleToAdd: [],
          additionResults: [],
        });
      }
    }

    console.log('\n📊 Automation Summary:');
    results.forEach((result, index) => {
      const successCount = result.additionResults.filter(r => r.success).length;
      const failCount = result.additionResults.filter(r => !r.success).length;

      console.log(
        `${index + 1}. ${result.mapping.sourceTag} → ${result.mapping.targetPathSlug}:`
      );
      console.log(`   Tagged people: ${result.taggedPeople.length}`);
      console.log(`   Already on path: ${result.peopleAlreadyOnPath.size}`);
      console.log(`   Added successfully: ${successCount}`);
      if (failCount > 0) {
        console.log(`   Failed to add: ${failCount}`);
      }
    });

    return results;
  }
}
