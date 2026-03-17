# Nation of Millions

Automation app that finds NationBuilder contacts with specific tags and adds them to paths at designated steps. Runs on a schedule via Heroku Scheduler.

## How it works

Reads `NB_MAPPING_*` environment variables, each defining a tag-to-path rule. For each rule, it queries NationBuilder for everyone with the given tag, filters out people already on the target path, and adds the rest at the specified step.

## Setup

**Requirements:** Node.js 22.10.0 (see `.tool-versions`)

```bash
npm install
cp .env.example .env
# Fill in your credentials and mappings in .env
```

## Configuration

```
NB_MAPPING_1=volunteer|Volunteer Onboarding|Welcome Email
NB_MAPPING_2=donor|Donor Stewardship Program|Thank You Call
```

Format: `tag_name|path_name|step_name` — names must match exactly as they appear in NationBuilder.

Key variables:

| Variable | Description |
|---|---|
| `NATIONBUILDER_SLUG` | Your NationBuilder nation slug |
| `OAUTH_CLIENT_ID` / `OAUTH_CLIENT_SECRET` | OAuth app credentials |
| `DATABASE_URL` | Postgres connection string (Heroku sets this automatically) |
| `SIMULATION_MODE` | Set to `false` to enable actual writes (default: `true`) |

## Running

```bash
npm run dev      # Development with live reload
npm start        # Build and run once (used by Heroku Scheduler)
npm test         # Run tests
```

## OAuth setup

```bash
npm run oauth:setup   # Interactive token acquisition
npm run oauth:save    # Save refresh token to database
```

## Deployment (Heroku)

Add the Heroku Scheduler add-on and configure it to run `npm start` on your desired interval (hourly recommended). Set all environment variables from `.env.example` in Heroku config vars.
