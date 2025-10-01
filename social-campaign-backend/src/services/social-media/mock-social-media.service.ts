import { SocialPlatform, PublishPostInput } from '../../types';
import logger from '../../utils/logger';

interface SocialMediaPost {
  id: string;
  platform: SocialPlatform;
  content: string;
  mediaUrls?: string[];
  hashtags?: string[];
  publishedAt: Date;
  externalId?: string;
  url?: string;
}

interface SocialMediaMetrics {
  postId: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  clicks: number;
  reach: number;
}

/**
 * Mock Social Media Service
 * Simulates social media API interactions for development
 */
class MockSocialMediaService {
  private posts: Map<string, SocialMediaPost> = new Map();
  private metrics: Map<string, SocialMediaMetrics> = new Map();

  /**
   * Publish a post to a social media platform
   */
  async publishPost(input: PublishPostInput): Promise<SocialMediaPost> {
    const { postId, platform, content, mediaUrls, hashtags } = input;

    logger.info(`[MOCK] Publishing to ${platform}`, { postId, contentLength: content.length });

    // Simulate API delay
    await this.simulateApiDelay();

    // Generate mock external ID and URL
    const externalId = this.generateMockExternalId(platform);
    const url = this.generateMockPostUrl(platform, externalId);

    const post: SocialMediaPost = {
      id: postId,
      platform,
      content,
      mediaUrls,
      hashtags,
      publishedAt: new Date(),
      externalId,
      url,
    };

    this.posts.set(postId, post);

    // Initialize metrics
    this.initializeMetrics(postId);

    logger.info(`[MOCK] Successfully published to ${platform}`, { postId, url });

    return post;
  }

  /**
   * Fetch engagement metrics for a post
   */
  async fetchMetrics(postId: string, platform: SocialPlatform): Promise<SocialMediaMetrics> {
    logger.info(`[MOCK] Fetching metrics for ${platform}`, { postId });

    await this.simulateApiDelay();

    let metrics = this.metrics.get(postId);
    
    if (!metrics) {
      // If metrics don't exist, initialize them
      this.initializeMetrics(postId);
      metrics = this.metrics.get(postId)!;
    } else {
      // Simulate organic growth
      metrics = this.simulateMetricGrowth(metrics);
      this.metrics.set(postId, metrics);
    }

    logger.info(`[MOCK] Metrics fetched for ${platform}`, { postId, metrics });

    return metrics;
  }

  /**
   * Delete a post from a platform
   */
  async deletePost(postId: string, platform: SocialPlatform): Promise<boolean> {
    logger.info(`[MOCK] Deleting post from ${platform}`, { postId });

    await this.simulateApiDelay();

    const post = this.posts.get(postId);
    if (!post || post.platform !== platform) {
      logger.warn(`[MOCK] Post not found for deletion`, { postId, platform });
      return false;
    }

    this.posts.delete(postId);
    this.metrics.delete(postId);

    logger.info(`[MOCK] Successfully deleted post from ${platform}`, { postId });

    return true;
  }

  /**
   * Get post details
   */
  async getPost(postId: string, platform: SocialPlatform): Promise<SocialMediaPost | null> {
    logger.info(`[MOCK] Getting post details from ${platform}`, { postId });

    await this.simulateApiDelay();

    const post = this.posts.get(postId);
    if (!post || post.platform !== platform) {
      logger.warn(`[MOCK] Post not found`, { postId, platform });
      return null;
    }

    return post;
  }

  /**
   * Simulate API delay
   */
  private async simulateApiDelay(): Promise<void> {
    const delay = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Generate mock external ID based on platform
   */
  private generateMockExternalId(platform: SocialPlatform): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    
    switch (platform) {
      case SocialPlatform.LINKEDIN:
        return `urn:li:share:${timestamp}${random}`;
      case SocialPlatform.TWITTER:
        return `${timestamp}${random}`;
      case SocialPlatform.INSTAGRAM:
        return `${timestamp}_${random}`;
      default:
        return `${platform}-${timestamp}-${random}`;
    }
  }

  /**
   * Generate mock post URL based on platform
   */
  private generateMockPostUrl(platform: SocialPlatform, externalId: string): string {
    switch (platform) {
      case SocialPlatform.LINKEDIN:
        return `https://www.linkedin.com/feed/update/${externalId}`;
      case SocialPlatform.TWITTER:
        return `https://twitter.com/mockuser/status/${externalId}`;
      case SocialPlatform.INSTAGRAM:
        return `https://www.instagram.com/p/${externalId}/`;
      default:
        return `https://${platform}.com/posts/${externalId}`;
    }
  }

  /**
   * Initialize metrics for a new post
   */
  private initializeMetrics(postId: string): void {
    const metrics: SocialMediaMetrics = {
      postId,
      likes: Math.floor(Math.random() * 50),
      comments: Math.floor(Math.random() * 10),
      shares: Math.floor(Math.random() * 5),
      impressions: Math.floor(Math.random() * 500) + 100,
      clicks: Math.floor(Math.random() * 50),
      reach: Math.floor(Math.random() * 300) + 50,
    };

    this.metrics.set(postId, metrics);
  }

  /**
   * Simulate organic metric growth
   */
  private simulateMetricGrowth(metrics: SocialMediaMetrics): SocialMediaMetrics {
    // Simulate organic growth with some randomness
    const growthFactor = 1 + Math.random() * 0.2; // 0-20% growth
    
    return {
      ...metrics,
      likes: Math.floor(metrics.likes * growthFactor),
      comments: Math.floor(metrics.comments * (1 + Math.random() * 0.1)),
      shares: Math.floor(metrics.shares * (1 + Math.random() * 0.05)),
      impressions: Math.floor(metrics.impressions * growthFactor),
      clicks: Math.floor(metrics.clicks * (1 + Math.random() * 0.15)),
      reach: Math.floor(metrics.reach * growthFactor),
    };
  }
}

// Platform-specific mock services
export class MockLinkedInService extends MockSocialMediaService {
  async publishPost(input: PublishPostInput): Promise<SocialMediaPost> {
    // LinkedIn-specific validation
    if (input.content.length > 3000) {
      throw new Error('LinkedIn posts cannot exceed 3000 characters');
    }
    
    return super.publishPost(input);
  }
}

export class MockTwitterService extends MockSocialMediaService {
  async publishPost(input: PublishPostInput): Promise<SocialMediaPost> {
    // Twitter-specific validation
    if (input.content.length > 280) {
      throw new Error('Tweets cannot exceed 280 characters');
    }
    
    return super.publishPost(input);
  }
}

export class MockInstagramService extends MockSocialMediaService {
  async publishPost(input: PublishPostInput): Promise<SocialMediaPost> {
    // Instagram-specific validation
    if (input.content.length > 2200) {
      throw new Error('Instagram captions cannot exceed 2200 characters');
    }
    
    if (!input.mediaUrls || input.mediaUrls.length === 0) {
      logger.warn('[MOCK] Instagram posts typically require media, but proceeding without it for mock');
    }
    
    return super.publishPost(input);
  }
}

// Export singleton instances
export const mockLinkedInService = new MockLinkedInService();
export const mockTwitterService = new MockTwitterService();
export const mockInstagramService = new MockInstagramService();

// Factory function to get the appropriate service
export function getMockSocialMediaService(platform: SocialPlatform): MockSocialMediaService {
  switch (platform) {
    case SocialPlatform.LINKEDIN:
      return mockLinkedInService;
    case SocialPlatform.TWITTER:
      return mockTwitterService;
    case SocialPlatform.INSTAGRAM:
      return mockInstagramService;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}
