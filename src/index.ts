import { loadConfig } from './config/index.js';
import { NationBuilderClient } from './services/nationbuilder.js';
import { AutomationService } from './services/automationService.js';

async function main(): Promise<void> {
  try {
    console.log('🚀 Starting NationBuilder Tag-to-Path Automation');

    // Load configuration
    const config = loadConfig();
    console.log(
      `Loaded ${config.tagMappings.length} tag mappings for nation: ${config.nationBuilderSlug}`
    );
    console.log(
      `Mode: ${config.simulationMode ? '🔄 SIMULATION (safe)' : '🚀 LIVE (writes to NationBuilder)'}`
    );

    if (config.tagMappings.length === 0) {
      console.log(
        '⚠️  No tag mappings configured. Add NB_MAPPING_* environment variables.'
      );
      return;
    }

    // Initialize services
    const client = new NationBuilderClient(config);
    await client.initialize();
    const automationService = new AutomationService(client);

    // Run automation
    const results = await automationService.processAllMappings(
      config.tagMappings
    );

    // Final summary
    const totalTaggedPeople = results.reduce(
      (sum, r) => sum + r.taggedPeople.length,
      0
    );
    const totalAdditions = results.reduce(
      (sum, r) => sum + r.additionResults.filter(ar => ar.success).length,
      0
    );
    const totalErrors = results.reduce(
      (sum, r) => sum + r.additionResults.filter(ar => !ar.success).length,
      0
    );

    console.log('\n🎯 Automation Complete!');
    console.log(`   Processed ${results.length} tag-to-path mappings`);
    console.log(`   Found ${totalTaggedPeople} people with configured tags`);
    console.log(`   Successfully added ${totalAdditions} people to paths`);

    if (totalErrors > 0) {
      console.log(`   Errors: ${totalErrors} additions failed`);
    }

    if (config.simulationMode && totalAdditions > 0) {
      console.log('\n💡 Running in simulation mode - no actual changes made.');
      console.log('   Set SIMULATION_MODE=false to perform live updates.');
    }
  } catch (error) {
    console.error('❌ Automation failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
main().catch(console.error);
