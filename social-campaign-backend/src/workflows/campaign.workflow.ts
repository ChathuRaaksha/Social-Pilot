import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from './activities';
import { 
  CampaignWorkflowInput, 
  SocialPlatform, 
  CampaignStatus,
  PostStatus,
  ApprovalStatus
} from '../types';

// Import activities with proper typing
const { 
  createCampaign,
  generateContentForPlatform,
  createPost,
  waitForApproval,
  schedulePost,
  publishPost,
  updateCampaignStatus,
  collectEngagementMetrics,
  notifyUser
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    initialInterval: '1s',
    backoffCoefficient: 2,
    maximumAttempts: 5,
  },
});

export async function campaignWorkflow(input: CampaignWorkflowInput): Promise<void> {
  // Step 1: Create campaign record
  await createCampaign({
    campaignId: input.campaignId,
    userId: input.userId,
    title: input.title,
    description: input.description,
    status: CampaignStatus.DRAFT,
  });

  // Step 2: Generate content for each platform
  const generatedPosts = [];
  for (const platform of input.platforms) {
    try {
      const content = await generateContentForPlatform({
        campaignId: input.campaignId,
        title: input.title,
        description: input.description,
        platform,
      });

      const post = await createPost({
        campaignId: input.campaignId,
        platform,
        content,
        status: PostStatus.DRAFT,
      });

      generatedPosts.push(post);
    } catch (error) {
      await notifyUser({
        userId: input.userId,
        message: `Failed to generate content for ${platform}: ${error}`,
        type: 'error',
      });
    }
  }

  // Step 3: Update campaign status to pending approval
  await updateCampaignStatus({
    campaignId: input.campaignId,
    status: CampaignStatus.PENDING_APPROVAL,
  });

  // Step 4: Wait for human approval
  const approvalResult = await waitForApproval({
    campaignId: input.campaignId,
    userId: input.userId,
    timeout: '24h', // 24 hour timeout for approval
  });

  if (approvalResult.status === ApprovalStatus.REJECTED) {
    await updateCampaignStatus({
      campaignId: input.campaignId,
      status: CampaignStatus.FAILED,
    });
    
    await notifyUser({
      userId: input.userId,
      message: `Campaign rejected: ${approvalResult.comments || 'No comments provided'}`,
      type: 'info',
    });
    
    return; // End workflow if rejected
  }

  // Step 5: Schedule and publish approved posts
  await updateCampaignStatus({
    campaignId: input.campaignId,
    status: CampaignStatus.APPROVED,
  });

  const publishedPosts = [];
  for (const post of generatedPosts) {
    try {
      // Schedule the post (could be immediate or future)
      const scheduledPost = await schedulePost({
        postId: post.id,
        scheduledAt: post.scheduledAt || new Date(),
      });

      // Wait until scheduled time if needed
      if (scheduledPost.scheduledAt > new Date()) {
        const waitTime = scheduledPost.scheduledAt.getTime() - Date.now();
        await sleep(waitTime);
      }

      // Publish the post
      const publishedPost = await publishPost({
        postId: post.id,
        platform: post.platform,
        content: post.content,
        mediaUrls: post.mediaUrls,
        hashtags: post.hashtags,
      });

      publishedPosts.push(publishedPost);
    } catch (error) {
      await notifyUser({
        userId: input.userId,
        message: `Failed to publish post for ${post.platform}: ${error}`,
        type: 'error',
      });
    }
  }

  // Step 6: Update campaign status to published
  await updateCampaignStatus({
    campaignId: input.campaignId,
    status: CampaignStatus.PUBLISHED,
  });

  // Step 7: Start metrics collection (runs periodically)
  for (let i = 0; i < 7; i++) { // Collect metrics for 7 days
    await sleep('24h'); // Wait 24 hours between collections
    
    for (const post of publishedPosts) {
      try {
        await collectEngagementMetrics({
          postId: post.id,
          platform: post.platform,
        });
      } catch (error) {
        // Log error but don't fail the workflow
        console.error(`Failed to collect metrics for post ${post.id}:`, error);
      }
    }
  }

  // Final notification
  await notifyUser({
    userId: input.userId,
    message: `Campaign "${input.title}" completed successfully! Check the dashboard for metrics.`,
    type: 'success',
  });
}

// Workflow for immediate post publishing (without campaign)
export async function publishSinglePostWorkflow(input: {
  userId: string;
  platform: SocialPlatform;
  content: string;
  mediaUrls?: string[];
  hashtags?: string[];
}): Promise<void> {
  try {
    // Create a simple post
    const post = await createPost({
      campaignId: 'single-post',
      platform: input.platform,
      content: input.content,
      status: PostStatus.APPROVED,
    });

    // Publish immediately
    await publishPost({
      postId: post.id,
      platform: input.platform,
      content: input.content,
      mediaUrls: input.mediaUrls,
      hashtags: input.hashtags,
    });

    // Collect initial metrics after 1 hour
    await sleep('1h');
    await collectEngagementMetrics({
      postId: post.id,
      platform: input.platform,
    });

    await notifyUser({
      userId: input.userId,
      message: `Post published successfully on ${input.platform}!`,
      type: 'success',
    });
  } catch (error) {
    await notifyUser({
      userId: input.userId,
      message: `Failed to publish post: ${error}`,
      type: 'error',
    });
    throw error;
  }
}
