# Heroku Deployment Guide

This guide walks through deploying the NationBuilder Tag-to-Path Automation to Heroku with scheduled execution.

## 🚀 Deployment Steps

### 1. Create Heroku App
```bash
heroku create your-app-name
# or let Heroku generate a name:
heroku create
```

### 2. Configure Environment Variables
Set your NationBuilder credentials and configuration:

```bash
# Required - NationBuilder API credentials
heroku config:set NATIONBUILDER_API_TOKEN="your-api-token"
heroku config:set NATIONBUILDER_SLUG="your-nation-slug"

# Required - Tag-to-path mappings (format: tag_name|path_slug|step_number)
heroku config:set NB_MAPPING_1="test-path-sync|nationbuilder-path-sync-test|1"
# Add more mappings as needed:
# heroku config:set NB_MAPPING_2="another-tag|another-path|2"

# Optional - Simulation mode (defaults to true for safety)
heroku config:set SIMULATION_MODE="true"
# Set to "false" for live mode when ready
```

### 3. Deploy to Heroku
```bash
git push heroku main
```

### 4. Set Up Heroku Scheduler

#### Install Heroku Scheduler Add-on:
```bash
heroku addons:create scheduler:standard
```

#### Configure Scheduled Job:
```bash
heroku addons:open scheduler
```

In the Scheduler dashboard, add a new job:
- **Command:** `npm start`
- **Frequency:** Choose your preferred schedule:
  - Every hour
  - Every day at specific time
  - Custom cron expression

## 🔧 Configuration Options

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NATIONBUILDER_API_TOKEN` | ✅ | Your NationBuilder API token | `eyJhbGci...` |
| `NATIONBUILDER_SLUG` | ✅ | Your nation slug | `risingtide` |
| `NB_MAPPING_*` | ✅ | Tag-to-path mappings | `tag\|path-slug\|step` |
| `SIMULATION_MODE` | ❌ | Enable/disable simulation mode | `true` or `false` |

### Tag Mapping Format
```
NB_MAPPING_1=source-tag|target-path-slug|step-number
```

Example:
```
NB_MAPPING_1=newsletter-signup|welcome-series|1
NB_MAPPING_2=event-attendee|follow-up-sequence|2
```

## 📊 Monitoring

### View Logs
```bash
heroku logs --tail
```

### Check Scheduler Jobs
```bash
heroku addons:open scheduler
```

### Manual Test Run
```bash
heroku run npm start
```

## 🛡️ Safety Features

- **Simulation Mode**: Defaults to `true` - shows what would happen without making changes
- **Step Validation**: Confirms target steps exist before adding people
- **Error Handling**: Graceful failure with detailed error messages
- **PII Protection**: Masks sensitive data in logs

## 🎯 Production Checklist

Before enabling live mode (`SIMULATION_MODE=false`):

- [ ] Test with simulation mode and verify correct paths/steps
- [ ] Confirm tag mappings are correct
- [ ] Review logs for any errors or warnings
- [ ] Set appropriate scheduler frequency
- [ ] Monitor first few live runs closely

## 🔄 Updating the App

To deploy updates:
```bash
git push heroku main
```

The `heroku-prebuild` script automatically runs linting and type checking before deployment.