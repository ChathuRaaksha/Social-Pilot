import { Campaign, Post, Approval, EngagementMetrics, CampaignStatus, PostStatus, ApprovalStatus, SocialPlatform } from '../types';
import geminiService from '../services/gemini.service';
import { getMockSocialMediaService } from '../services/social-media/mock-social-media.service';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Activity interfaces
interface CreateCampaignInput {
  campaignId: string;
  userId: string;
  title: string;
  description: string;
  status: CampaignStatus;
}

interface GenerateContentInput {
  campaignId: string;
  title: string;
  description: string;
  platform: SocialPlatform;
}

interface CreatePostInput {
  campaignId: string;
  platform: SocialPlatform;
  content: string;
  status: PostStatus;
}

interface WaitForApprovalInput {
  campaignId: string;
  userId: string;
  timeout: string;
}

interface SchedulePostInput {
  postId: string;
  scheduledAt: Date;
}

interface PublishPostInput {
  postId: string;
  platform: SocialPlatform;
  content: string;
  mediaUrls?: string[];
  hashtags?: string[];
}

interface UpdateCampaignStatusInput {
  campaignId: string;
  status: CampaignStatus;
}

interface CollectMetricsInput {
  postId: string;
  platform: SocialPlatform;
}

interface NotifyUserInput {
  userId: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

// Mock database (in production, this would use actual database)
const mockDatabase = {
  campaigns: new Map<string, Campaign>(),
  posts: new Map<string, Post>(),
  approvals: new Map<string, Approval>(),
  metrics: new Map<string, EngagementMetrics>(),
};

// Activity implementations
export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  const campaign: Campaign = {
    id: input.campaignId || uuidv4(),
    userId: input.userId,
    title: input.title,
    description: input.description,
    status: input.status,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockDatabase.campaigns.set(campaign.id, campaign);
  logger.info('Campaign created', { campaignId: campaign.id });
  return campaign;
}

export async function generateContentForPlatform(input: GenerateContentInput): Promise<string> {
  logger.info('Generating content', { platform: input.platform, campaignId: input.campaignId });
  
  const content = await geminiService.generateContent({
    campaignId: input.campaignId,
    title: input.title,
    description: input.description,
    platform: input.platform,
  });

  return geminiService.optimizeContent(content, input.platform);
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  const content = input.content;
  const hashtags = geminiService.extractHashtags(content);
  
  const post: Post = {
    id: uuidv4(),
    campaignId: input.campaignId,
    platform: input.platform,
    content,
    hashtags,
    status: input.status,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockDatabase.posts.set(post.id, post);
  logger.info('Post created', { postId: post.id, platform: input.platform });
  return post;
}

export async function waitForApproval(input: WaitForApprovalInput): Promise<Approval> {
  logger.info('Waiting for approval', { campaignId: input.campaignId });
  
  // In production, this would listen for actual approval events
  // For now, we'll simulate approval after a short delay
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const approval: Approval = {
    id: uuidv4(),
    campaignId: input.campaignId,
    userId: input.userId,
    status: ApprovalStatus.APPROVED, // Auto-approve for demo
    comments: 'Auto-approved for demo purposes',
    approvedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockDatabase.approvals.set(approval.id, approval);
  return approval;
}

export async function schedulePost(input: SchedulePostInput): Promise<Post> {
  const post = mockDatabase.posts.get(input.postId);
  if (!post) {
    throw new Error(`Post ${input.postId} not found`);
  }

  post.scheduledAt = input.scheduledAt;
  post.status = PostStatus.SCHEDULED;
  post.updatedAt = new Date();

  logger.info('Post scheduled', { postId: post.id, scheduledAt: input.scheduledAt });
  return post;
}

export async function publishPost(input: PublishPostInput): Promise<Post> {
  const post = mockDatabase.posts.get(input.postId);
  if (!post) {
    throw new Error(`Post ${input.postId} not found`);
  }

  try {
    // Use mock social media service to publish
    const socialMediaService = getMockSocialMediaService(input.platform);
    const publishedPost = await socialMediaService.publishPost(input);

    // Update post with external information
    post.publishedAt = publishedPost.publishedAt;
    post.status = PostStatus.PUBLISHED;
    post.metadata = {
      externalId: publishedPost.externalId,
      url: publishedPost.url,
    };
    post.updatedAt = new Date();

    logger.info('Post published successfully', { 
      postId: post.id, 
      platform: input.platform,
      url: publishedPost.url 
    });
    
    return post;
  } catch (error) {
    // Update post status to failed
    post.status = PostStatus.FAILED;
    post.updatedAt = new Date();
    
    logger.error('Failed to publish post', { 
      postId: input.postId, 
      platform: input.platform, 
      error 
    });
    
    throw error;
  }
}

export async function updateCampaignStatus(input: UpdateCampaignStatusInput): Promise<void> {
  const campaign = mockDatabase.campaigns.get(input.campaignId);
  if (!campaign) {
    throw new Error(`Campaign ${input.campaignId} not found`);
  }

  campaign.status = input.status;
  campaign.updatedAt = new Date();

  logger.info('Campaign status updated', { campaignId: input.campaignId, status: input.status });
}

export async function collectEngagementMetrics(input: CollectMetricsInput): Promise<EngagementMetrics> {
  logger.info('Collecting engagement metrics', { postId: input.postId, platform: input.platform });

  try {
    // Use mock social media service to fetch metrics
    const socialMediaService = getMockSocialMediaService(input.platform);
    const socialMetrics = await socialMediaService.fetchMetrics(input.postId, input.platform);

    // Create engagement metrics record
    const metrics: EngagementMetrics = {
      id: uuidv4(),
      postId: input.postId,
      platform: input.platform,
      likes: socialMetrics.likes,
      comments: socialMetrics.comments,
      shares: socialMetrics.shares,
      impressions: socialMetrics.impressions,
      clicks: socialMetrics.clicks,
      reach: socialMetrics.reach,
      engagement_rate: socialMetrics.impressions > 0 
        ? ((socialMetrics.likes + socialMetrics.comments + socialMetrics.shares) / socialMetrics.impressions) * 100
        : 0,
      fetchedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockDatabase.metrics.set(metrics.id, metrics);
    logger.info('Metrics collected', { postId: input.postId, metrics });
    return metrics;
  } catch (error) {
    logger.error('Failed to collect metrics', { 
      postId: input.postId, 
      platform: input.platform, 
      error 
    });
    
    // Return zero metrics on error
    const zeroMetrics: EngagementMetrics = {
      id: uuidv4(),
      postId: input.postId,
      platform: input.platform,
      likes: 0,
      comments: 0,
      shares: 0,
      impressions: 0,
      clicks: 0,
      reach: 0,
      engagement_rate: 0,
      fetchedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockDatabase.metrics.set(zeroMetrics.id, zeroMetrics);
    return zeroMetrics;
  }
}

export async function notifyUser(input: NotifyUserInput): Promise<void> {
  logger.info('Notifying user', { userId: input.userId, type: input.type, message: input.message });
  
  // In production, this would send actual notifications (email, push, etc.)
  // For now, we'll just log it
  console.log(`[${input.type.toUpperCase()}] User ${input.userId}: ${input.message}`);
}

// Export mock database for testing/debugging
export { mockDatabase };
