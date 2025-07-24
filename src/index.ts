import { loadConfig } from './config/index.js';
import { NationBuilderClient } from './services/nationbuilder.js';
import { TagService } from './services/tagService.js';
import { PathService } from './services/pathService.js';

async function main(): Promise<void> {
  try {
    // Load configuration
    console.log('Loading configuration...');
    const config = loadConfig();
    console.log(`Loaded ${config.tagMappings.length} tag mappings for nation: ${config.nationBuilderSlug}`);
    
    // Initialize services
    const client = new NationBuilderClient(config);
    const tagService = new TagService(client);
    const pathService = new PathService(client);
    
    // Debug: Check API setup
    console.log('API Configuration:');
    console.log(`Base URL: https://${config.nationBuilderSlug}.nationbuilder.com`);
    console.log(`API Token: [hidden]`);
    console.log(`Simulation Mode: ${config.simulationMode ? '🔄 ENABLED (safe)' : '🚀 DISABLED (live writes)'}`);
    console.log(`First tag mapping: ${config.tagMappings[0]?.sourceTag}`);
    
    // Test basic functionality
    console.log('\n=== Testing Tag Service ===');
    const firstMapping = config.tagMappings[0];
    if (firstMapping) {
      console.log(`Testing tag: ${firstMapping.sourceTag}`);
      const taggedPeople = await tagService.getPeopleWithTagSample(firstMapping.sourceTag, 5);
      console.log(`Found ${taggedPeople.length} people with tag "${firstMapping.sourceTag}" (sample)`);
      
      if (taggedPeople.length > 0) {
        console.log('Sample person data structure confirmed (PII hidden)');
      }
    }
    
    console.log('\n=== Testing Full Tag Count ===');
    let allTaggedPeople: any[] = [];
    if (firstMapping) {
      console.log(`Getting ALL people with tag: ${firstMapping.sourceTag}`);
      allTaggedPeople = await tagService.getAllPeopleWithTag(firstMapping.sourceTag);
      console.log(`🎯 Total people with tag "${firstMapping.sourceTag}": ${allTaggedPeople.length}`);
      
      if (allTaggedPeople.length > 0) {
        console.log('✅ Person data structure verified (PII minimized)');
      }
    }
    
    console.log('\n=== Testing Simulation Mode ===');
    if (firstMapping && allTaggedPeople.length > 0) {
      console.log('Testing path addition simulation...');
      const testPersonId = allTaggedPeople[0]!.id;
      const testPathId = 'example_path_123';
      const testStepNumber = firstMapping.targetStepNumber;
      
      const success = await client.addPersonToPath(testPersonId, testPathId, testStepNumber);
      console.log(`Simulation result: ${success ? '✅ Success' : '❌ Failed'}`);
    }
    
    console.log('\n=== Path Testing (Skipped) ===');
    console.log('Path API endpoints not yet implemented for v2 - will add next!');
    
    console.log('\n✅ Testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}