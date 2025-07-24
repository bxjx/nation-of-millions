# NationBuilder Tag Automation App - Design Document

## Project Overview
A NationBuilder automation app that finds people with specific tags and adds them to paths at designated steps.

## Requirements
- **Real-time processing**: Not required - periodic execution is acceptable
- **Initial version**: Hardcoded tag-to-path mappings via environment variables or database
- **Future enhancement**: Web interface for configuration management
- **Not an official NationBuilder app**: Standalone application initially

## Architecture Decision: Scheduled Polling Approach

After evaluating webhooks vs polling, **scheduled polling was chosen** for simplicity:

### Why Polling Over Webhooks:
- Webhooks require fallback polling anyway for initial sync
- NationBuilder's "person updated" webhook fires for any person change (not tag-specific)
- Polling approach has single code path vs complex webhook + fallback architecture
- Real-time processing not required per requirements
- Simpler error handling and debugging

## Core Components

### 1. NationBuilder API Client
- **spraypaint.js** - Official Graphiti TypeScript client
- Built-in pagination: `.page(2).per(100)`
- Built-in filtering: `.where({ tags: 'volunteer' })`
- Handle OAuth/API token authentication
- Rate limit management
- Error handling and retries

### 2. Tag Service
- Query people by specific tags
- Handle pagination for large result sets
- Filter for people not already processed

### 3. Path Service  
- Query existing path_journeys by path_id (confirmed: filtering works)
- Filter people locally to exclude those already on path
- Add person to path at specified step
- Handle path creation if needed

### 4. Configuration Manager
- Load tag-to-path mappings from:
  - Environment variables (initial): `TAG_volunteer=PATH_volunteer_onboarding:STEP_2`
  - Database (future): More complex mappings with conditions
  - JSON config file (alternative)

### 5. Automation Engine
- Orchestrate the polling workflow
- Process each tag-to-path mapping
- Implement idempotent operations (safe to re-run)
- Logging and monitoring

### 6. Scheduler
- Configurable polling frequency (15-30 min, hourly, etc.)
- Cron job or built-in scheduler
- Graceful handling of overlapping runs

## Data Flow
1. **Scheduled trigger** initiates automation run
2. **Load configuration** - get tag-to-path mappings
3. **For each mapping**:
   - Query NationBuilder for people with source tag
   - Filter out people already in target path/step
   - Add remaining people to target path at specified step
4. **Log results** and any errors

## Configuration Examples

### Environment Variables
```
NB_TAG_volunteer=volunteer_onboarding:2
NB_TAG_donor=donor_stewardship:1  
NB_TAG_member=member_engagement:3
```

### Database Schema (Future)
```
tag_automations:
- id
- source_tag
- target_path_slug  
- target_step_number
- active (boolean)
- created_at
- updated_at
```

## Technical Considerations

### API Rate Limits
- NationBuilder typically allows reasonable API limits
- Implement exponential backoff
- Batch operations where possible

### Idempotency
- Check existing path membership before adding
- Safe to re-run without duplicates
- Handle partial failures gracefully

### Error Handling
- API failures: retry with backoff
- Invalid configurations: log and skip
- Path/step not found: log error, continue with other mappings

### Monitoring
- Log successful additions
- Track API usage
- Alert on repeated failures

## Implementation Priority
1. Core NationBuilder API integration
2. Basic tag querying and path addition
3. Environment variable configuration
4. Scheduling mechanism
5. Error handling and logging
6. Database configuration (future)
7. Web interface (future)

## Development Notes
- Focus on defensive security practices only
- No malicious functionality
- Standard Node.js/Express structure recommended
- **Use spraypaint.js** - Official Graphiti TypeScript client for NationBuilder v2 API
- **No official NationBuilder v2 npm package** exists (as of 2025)

## Project-Specific Guidelines
- **Always calculate API call optimization math upfront** when comparing approaches
- Don't give surface-level recommendations without quantifying the performance difference
- For path membership: Query existing path members first, then filter locally before adding new people
- This scales much better than optimistic adding (especially with high "already on path" percentages)

## Tech Stack & Hosting
- **Language**: TypeScript + Node.js
- **NationBuilder API**: Custom HTTP client (v2 API)
- **Scheduling**: Heroku Scheduler (hourly execution)
- **Hosting**: Heroku (familiar platform)
- **Database**: Heroku Postgres (when needed later)
- **Job timeout**: 60 minutes max (matches hourly frequency)

## Implementation Status & Findings

### ✅ COMPLETED (as of current session):
1. **Project setup** - TypeScript strict mode, ESLint, Prettier, Git
2. **Environment config** - Updated format: `NB_MAPPING_X=tag_name|path_slug|step_number`
3. **NationBuilder v2 API integration** - Working HTTP client
4. **Tag querying** - Fully functional, tested with live data

### 🔍 KEY API DISCOVERIES:
- **NationBuilder v2 API exists** but uses different endpoints than initially expected
- **No `/people` endpoint** in v2 - uses `/signups` instead
- **Working v2 endpoints confirmed**:
  - `/api/v2/signup_tags` - Get tags by name
  - `/api/v2/signups?filter[tag_id]=X` - Get people with specific tag
  - `/api/v2/path_journeys?filter[path_id]=X` - Get people on paths (confirmed via curl)
- **spraypaint.js issues** - Had undefined endpoint problems, switched to custom HTTP client
- **Authentication works** with `Bearer {token}` in v2 API

### 🏗️ CURRENT ARCHITECTURE:
- **HTTPNationBuilderClient** (`src/services/httpClient.ts`) - Direct v2 API calls
- **NationBuilderClient** (`src/services/nationbuilder.ts`) - Wrapper interface
- **TagService** - Handles tag-to-people lookup with pagination
- **PathService** - Placeholder for path membership (needs v2 implementation)

### 🔒 DATA MINIMIZATION & SECURITY:
- API tokens hidden in logs
- Personal data (names, emails) masked as `[hidden]` in development output
- Only functional data (counts, IDs) displayed
- **IMPORTANT**: No actual user data, tag names, or counts should be committed to git
- Scrub sensitive information from commit messages and documentation

### ⏭️ NEXT STEPS:
1. **Implement path membership querying** for v2 API
2. **Test path_journeys endpoint** filtering 
3. **Create local filtering logic** to find people needing to be added
4. **Implement adding people to paths** functionality
5. **Complete automation engine**

### 📝 ENVIRONMENT SETUP:
```bash
# Example .env format (confirmed working):
NATIONBUILDER_API_TOKEN=your_token_here
NATIONBUILDER_SLUG=your_nation_slug
NB_MAPPING_1=example_tag|volunteer_onboarding|2
```

### 🧪 TESTING COMMANDS:
- `npm run dev` - Run main test script
- `npx tsx src/test-simple.ts` - Direct API testing
- Tag querying functionality verified with live data