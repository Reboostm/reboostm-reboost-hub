# Cloud Run Deployment Guide

## Overview

This is the automated citations submission engine for ReBoost Hub. It runs on Google Cloud Run and submits business listings to 300+ directories using Playwright + Chromium + 2Captcha.

## Prerequisites

1. **Google Cloud Project** — `reboost-hub` (same as Firebase project)
2. **gcloud CLI** — installed and authenticated
3. **Artifact Registry** — enabled in your Google Cloud project
4. **Service Account** — with Firestore + Cloud Storage permissions

## One-Time Setup

### 1. Create Service Account for Cloud Run

```bash
gcloud iam service-accounts create reboost-citations-engine \
  --display-name="ReBoost Citations Submission Engine" \
  --project=reboost-hub
```

### 2. Grant Permissions

```bash
# Firestore access
gcloud projects add-iam-policy-binding reboost-hub \
  --member="serviceAccount:reboost-citations-engine@reboost-hub.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

# Cloud Logging (for logs)
gcloud projects add-iam-policy-binding reboost-hub \
  --member="serviceAccount:reboost-citations-engine@reboost-hub.iam.gserviceaccount.com" \
  --role="roles/logging.logWriter"
```

### 3. Set Up Gmail API

**In Google Cloud Console:**

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Add authorized redirect URI: `http://localhost` (for manual token generation)
5. Download the credentials JSON
6. Note the `client_id` and `client_secret`

**Generate refresh token (one-time, manually):**

You'll need to run a script to get the refresh token. Here's a quick way:

```javascript
const { google } = require('googleapis')

const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'http://localhost'
)

const scopes = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.modify']
const authUrl = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: scopes })
console.log('Visit this URL:', authUrl)
// After allowing access, you'll get a code. Exchange it for a refresh token:
// const { tokens } = await oauth2Client.getToken(code)
// console.log(tokens.refresh_token)
```

Once you have the refresh token, save it securely.

### 4. Set Up 2Captcha Account

1. Sign up at https://2captcha.com
2. Fund your account (minimum ~$10 for testing)
3. Get your API key from your account settings
4. Test the API key:

```bash
curl "http://2captcha.com/api/user?apikey=YOUR_API_KEY&action=getbalance&json=1"
```

### 5. Set Environment Variables in Cloud Run

You'll set these as **Secret Manager** secrets in Google Cloud, then reference them in Cloud Run.

```bash
# Create secrets
gcloud secrets create gmail-client-id --replication-policy="automatic" --project=reboost-hub
echo -n "YOUR_CLIENT_ID" | gcloud secrets versions add gmail-client-id --data-file=- --project=reboost-hub

gcloud secrets create gmail-client-secret --replication-policy="automatic" --project=reboost-hub
echo -n "YOUR_CLIENT_SECRET" | gcloud secrets versions add gmail-client-secret --data-file=- --project=reboost-hub

gcloud secrets create gmail-refresh-token --replication-policy="automatic" --project=reboost-hub
echo -n "YOUR_REFRESH_TOKEN" | gcloud secrets versions add gmail-refresh-token --data-file=- --project=reboost-hub

gcloud secrets create two-captcha-api-key --replication-policy="automatic" --project=reboost-hub
echo -n "YOUR_2CAPTCHA_API_KEY" | gcloud secrets versions add two-captcha-api-key --data-file=- --project=reboost-hub
```

Grant the service account access to these secrets:

```bash
for secret in gmail-client-id gmail-client-secret gmail-refresh-token two-captcha-api-key; do
  gcloud secrets add-iam-policy-binding "$secret" \
    --member="serviceAccount:reboost-citations-engine@reboost-hub.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --project=reboost-hub
done
```

## Deployment

### 1. Build and Push Docker Image

```bash
# Set your Artifact Registry repo (or Docker Hub)
export IMAGE_REPO="us-central1-docker.pkg.dev/reboost-hub/reboost-citations/engine"

# Build
docker build -t reboost-citations-engine:latest .

# Tag for Artifact Registry
docker tag reboost-citations-engine:latest "$IMAGE_REPO:latest"

# Authenticate Docker to Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev

# Push
docker push "$IMAGE_REPO:latest"
```

### 2. Deploy to Cloud Run

```bash
gcloud run deploy reboost-citations-engine \
  --image "$IMAGE_REPO:latest" \
  --service-account="reboost-citations-engine@reboost-hub.iam.gserviceaccount.com" \
  --memory=1Gi \
  --cpu=1 \
  --timeout=3600 \
  --max-instances=1 \
  --set-env-vars="FIREBASE_PROJECT_ID=reboost-hub" \
  --set-secrets="GMAIL_CLIENT_ID=gmail-client-id:latest,GMAIL_CLIENT_SECRET=gmail-client-secret:latest,GMAIL_REFRESH_TOKEN=gmail-refresh-token:latest,TWO_CAPTCHA_API_KEY=two-captcha-api-key:latest" \
  --allow-unauthenticated \
  --region=us-central1 \
  --project=reboost-hub
```

**Note:** `--allow-unauthenticated` is needed for the `/health` endpoint. If you want to lock it down, use Cloud Tasks or similar to invoke it instead.

### 3. Get Cloud Run URL

```bash
gcloud run services describe reboost-citations-engine --region=us-central1 --project=reboost-hub --format='value(status.url)'
```

Save this URL. You'll need it for the Cloud Functions env var.

## Update Cloud Functions

Set the `CLOUD_RUN_URL` environment variable in Firebase Cloud Functions:

```bash
# Via Firebase Console → Functions → reboost-hub → select function → Edit runtime settings
# Or via CLI:

firebase functions:config:set citations.cloud_run_url="https://your-cloud-run-url-here.a.run.app"
firebase deploy --only functions:startCitationsJob
```

## Testing

### 1. Check Cloud Run Health

```bash
curl https://your-cloud-run-url.a.run.app/health
```

Expected response:
```json
{ "status": "ok", "running": true }
```

### 2. Test Manual Trigger

```bash
curl -X POST https://your-cloud-run-url.a.run.app/trigger
```

### 3. Check Logs

```bash
gcloud run logs read reboost-citations-engine --region=us-central1 --project=reboost-hub --limit=50
```

## Monitoring

### View Logs

```bash
# Streaming logs
gcloud run logs read reboost-citations-engine --region=us-central1 --project=reboost-hub --follow

# Search for specific job
gcloud run logs read reboost-citations-engine --region=us-central1 --project=reboost-hub --filter="BATCH_ID"
```

### View Metrics in Cloud Console

1. Navigate to **Cloud Run** → **reboost-citations-engine**
2. Click **Metrics** tab
3. Monitor CPU, memory, request count, latency

## Troubleshooting

### Cloud Run won't start

1. Check logs: `gcloud run logs read reboost-citations-engine --region=us-central1 --project=reboost-hub --limit=100`
2. Verify all secrets are set correctly
3. Check that the service account has Firestore permissions

### Playwright fails to launch

- Make sure Dockerfile installs all Chromium dependencies (libnss3, libgconf, etc.)
- Increase memory/CPU allocation if needed

### Gmail API errors

- Verify refresh token is valid (tokens expire after 6 months of disuse)
- Check that Gmail scopes are correct
- Test manually with the client ID/secret

### 2Captcha not working

- Verify API key is correct
- Check account balance on 2captcha.com
- Test manually: `curl "http://2captcha.com/api/user?apikey=YOUR_KEY&action=getbalance&json=1"`

## Cost Estimation

- **Cloud Run:** ~$0.0000025 per CPU-second
- **Firestore:** ~$0.06 per 100k reads + writes
- **2Captcha:** ~$2-3 per 1000 solves ($0.003 per solve)
- **Gmail API:** Free (included with Google Cloud)

For a job with 300 directories at ~30s per directory = 9000s = ~2.25 CPU-seconds = negligible cost.

## Next Steps

1. Deploy Cloud Functions with `CLOUD_RUN_URL` set
2. Deploy Cloud Run with all secrets configured
3. Create a test citations batch and monitor logs
4. Implement directory handlers one by one (Yelp, Yellow Pages, Manta, etc.)
