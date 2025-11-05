# Temporal Integration Guide

## Overview

This application integrates with Temporal Cloud for workflow orchestration to schedule and publish social media posts. Temporal handles the reliable scheduling and execution of post publishing workflows.

## What Was Implemented

### 1. Database Changes
- **Removed authentication requirements**: All RLS policies updated to allow public access
- **Added Temporal tracking columns** to `posts` table:
  - `temporal_workflow_id`: Stores the Temporal workflow ID
  - `temporal_run_id`: Stores the Temporal run ID
  - `scheduled_for`: Timestamp when post should be published
- **Created utility function** `update_post_status()` for status updates

### 2. Edge Functions

#### `temporal-webhook` 
- **Purpose**: Receives webhook callbacks from Temporal when workflows complete
- **URL**: `https://vgaqliwcwnwkkaeunfec.supabase.co/functions/v1/temporal-webhook`
- **Method**: POST
- **Payload**:
```json
{
  "workflowId": "string",
  "runId": "string", 
  "status": "completed|failed|terminated",
  "result": {},
  "error": "string (optional)"
}
```
- **Actions**:
  - Updates post status based on workflow result
  - Logs events for audit trail
  - Handles workflow failures

#### `schedule-post`
- **Purpose**: Schedules a post for future publication via Temporal
- **URL**: `https://vgaqliwcwnwkkaeunfec.supabase.co/functions/v1/schedule-post`
- **Method**: POST
- **Payload**:
```json
{
  "postId": "uuid",
  "scheduledFor": "2025-10-01T12:00:00Z",
  "platform": "linkedin|x|instagram"
}
```
- **Actions**:
  - Validates scheduling time (must be future)
  - Creates Temporal workflow execution
  - Updates post with workflow tracking info
  - Logs scheduling event

### 3. Frontend Changes
- **Removed authentication**: App now works without login
- **Updated `CampaignNew.tsx`**: Removed user authentication checks
- **Updated `Dashboard.tsx`**: Loads all campaigns without user filter
- **Simplified `Index.tsx`**: Removed auth state management
- **Simplified `App.tsx`**: Kept simple routing without auth guards

## Integration Steps

### Step 1: Set Up Temporal Cloud Account

1. Go to [Temporal Cloud](https://cloud.temporal.io/)
2. Create a new account or sign in
3. Create a new namespace (e.g., `social-media-app`)
4. Generate API credentials:
   - Navigate to Settings → API Keys
   - Create new API key
   - Save the key securely

### Step 2: Configure Secrets in Lovable Cloud

Add the following secrets to your backend:

```bash
# Temporal Cloud endpoint (usually looks like: namespace.account.tmprl.cloud:7233)
TEMPORAL_ADDRESS=your-namespace.account.tmprl.cloud:7233

# Your namespace name
TEMPORAL_NAMESPACE=your-namespace

# API key from Temporal Cloud
TEMPORAL_API_KEY=your-api-key-here
```

To add secrets:
1. Open your Lovable Cloud dashboard
2. Navigate to Secrets
3. Add each secret with the exact names above

### Step 3: Create Temporal Worker

Create a Temporal worker application that will execute your workflows. Here's a basic structure:

```typescript
// worker/src/workflows.ts
import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from './activities';

const { publishPost } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
});

export async function PublishPostWorkflow(input: {
  postId: string;
  platform: string;
  content: string;
  imageUrl?: string;
  delaySeconds: number;
}): Promise<void> {
  // Wait until scheduled time
  await sleep(input.delaySeconds * 1000);
  
  // Publish the post
  await publishPost(input);
}
```

```typescript
// worker/src/activities.ts
export async function publishPost(input: {
  postId: string;
  platform: string;
  content: string;
  imageUrl?: string;
}): Promise<void> {
  // Implementation depends on which platform:
  // - For LinkedIn: Use LinkedIn API
  // - For X (Twitter): Use X API  
  // - For Instagram: Use Instagram Graph API
  
  console.log(`Publishing post ${input.postId} to ${input.platform}`);
  
  // Call the appropriate platform API here
  // Throw error if publishing fails
}
```

```typescript
// worker/src/worker.ts
import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS!,
    tls: {
      // Configure TLS for Temporal Cloud
    },
  });

  const worker = await Worker.create({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE!,
    taskQueue: 'social-media-posts',
    workflowsPath: require.resolve('./workflows'),
    activities,
  });

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### Step 4: Configure Webhook in Temporal Cloud

1. In Temporal Cloud dashboard, go to Settings → Webhooks
2. Add new webhook:
   - **URL**: `https://vgaqliwcwnwkkaeunfec.supabase.co/functions/v1/temporal-webhook`
   - **Events**: Select `WorkflowCompleted`, `WorkflowFailed`, `WorkflowTerminated`
   - **Secret**: Generate a webhook secret (optional, for validation)

### Step 5: Deploy Temporal Worker

Deploy your worker application to a hosting service:
- **AWS ECS/Fargate**: Recommended for production
- **Google Cloud Run**: Good for auto-scaling
- **Kubernetes**: For complex deployments
- **Railway/Render**: Simpler options for smaller scale

The worker must run continuously to process workflows.

## Usage Flow

### Scheduling a Post

```typescript
// From your frontend
const schedulePost = async (postId: string, scheduledFor: Date) => {
  const response = await supabase.functions.invoke('schedule-post', {
    body: {
      postId,
      scheduledFor: scheduledFor.toISOString(),
      platform: 'linkedin' // or 'x' or 'instagram'
    }
  });
  
  if (response.error) {
    console.error('Failed to schedule:', response.error);
  } else {
    console.log('Scheduled:', response.data);
  }
};
```

### Workflow Execution

1. User schedules a post via frontend
2. `schedule-post` edge function creates Temporal workflow
3. Post status updated to `scheduled` in database
4. Temporal workflow waits until scheduled time
5. Worker executes `publishPost` activity at scheduled time
6. Post is published to social media platform
7. Temporal sends webhook to `temporal-webhook` edge function
8. Post status updated to `published` or `failed` in database

## Monitoring

### View Workflow Status
- Log into Temporal Cloud dashboard
- Navigate to Workflows
- Search by workflow ID (stored in `posts.temporal_workflow_id`)

### View Post Status
Query the database:
```sql
SELECT 
  id,
  platform,
  status,
  scheduled_at,
  temporal_workflow_id,
  last_error
FROM posts
WHERE status IN ('scheduled', 'published', 'failed');
```

### View Events
```sql
SELECT 
  created_at,
  type,
  data
FROM events
WHERE entity_type = 'post'
ORDER BY created_at DESC;
```

## Error Handling

### Workflow Failures
- Temporal automatically retries activities with exponential backoff
- After max retries, workflow fails
- Webhook updates post status to `failed`
- Error message stored in `posts.last_error`

### Common Issues

**Issue**: "Temporal integration not configured"
- **Solution**: Ensure `TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE`, and `TEMPORAL_API_KEY` secrets are set

**Issue**: Workflow not starting
- **Solution**: Check Temporal Cloud logs and verify worker is running

**Issue**: Webhook not receiving callbacks
- **Solution**: Verify webhook URL is configured correctly in Temporal Cloud

**Issue**: Posts not publishing
- **Solution**: Check worker logs and verify platform API credentials

## Security Notes

- All edge functions are public (no JWT verification needed)
- Temporal API key should be kept secret
- Consider adding webhook signature verification
- Use HTTPS for all webhook endpoints
- Store social media API credentials securely in Temporal worker environment

## Testing

### Test Scheduling (Local)
```bash
# Schedule a post 5 minutes in the future
curl -X POST https://vgaqliwcwnwkkaeunfec.supabase.co/functions/v1/schedule-post \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "your-post-uuid",
    "scheduledFor": "2025-10-01T12:00:00Z",
    "platform": "linkedin"
  }'
```

### Test Webhook (Local)
```bash
# Simulate Temporal webhook callback
curl -X POST https://vgaqliwcwnwkkaeunfec.supabase.co/functions/v1/temporal-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "publish-post-123",
    "runId": "abc-def-ghi",
    "status": "completed"
  }'
```

## Next Steps

1. **Implement Platform APIs**: Add LinkedIn, X, and Instagram API integrations to worker
2. **Add OAuth Flow**: For users to connect their social media accounts
3. **Store Provider Tokens**: Securely store access tokens in `providers` table
4. **Add Retry Logic**: Implement exponential backoff for API failures
5. **Add Analytics**: Track post performance metrics
6. **Add Scheduling UI**: Build UI for users to schedule posts
7. **Add Bulk Scheduling**: Allow scheduling multiple posts at once

## Resources

- [Temporal Documentation](https://docs.temporal.io/)
- [Temporal TypeScript SDK](https://docs.temporal.io/typescript)
- [LinkedIn API](https://docs.microsoft.com/en-us/linkedin/)
- [X (Twitter) API](https://developer.twitter.com/en/docs)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
