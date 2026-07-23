# Career Cloud Automation

This is the long-term setup for the Career Hub morning job run.

## What Runs Each Morning

Vercel calls:

```txt
/api/career/morning-run
```

That endpoint does two things:

1. Reads recent Gmail job-alert emails from LinkedIn, Indeed, and HiringCafe.
2. Runs the existing job scout against public job feeds and company boards.

Both paths send jobs into the same Career Hub inbox, where they are filtered to Georgia and re-scored for Owen's target roles.

## Current Schedule

The Vercel cron schedule is:

```txt
0 12 * * *
```

That means 12:00 UTC every day, which is usually morning in Georgia. Vercel cron uses UTC, so daylight saving time can shift the local clock time by an hour.

## Required Cloud Environment Variables

Add these to Vercel project settings:

```txt
CRON_SECRET
CAREER_INGEST_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GMAIL_REFRESH_TOKEN
GMAIL_JOB_MAX_RESULTS
GMAIL_JOB_QUERY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

`CRON_SECRET` and `CAREER_INGEST_SECRET` should be long random strings.

## Gmail Setup

Create a Google Cloud OAuth app with Gmail read-only access.

Use this scope:

```txt
https://www.googleapis.com/auth/gmail.readonly
```

The app needs a refresh token. Store that refresh token in Vercel as `GMAIL_REFRESH_TOKEN`.

## Manual Test

After deploying, test the morning run with:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://YOUR-VERCEL-DOMAIN.vercel.app/api/career/morning-run
```

The response should show how many Gmail emails were scanned and how many jobs were accepted.

## Laptop Requirement

Once deployed on Vercel with Gmail OAuth configured, the laptop does not need to be open. Vercel wakes the endpoint, Gmail provides the job-alert emails, and Supabase stores the jobs.
