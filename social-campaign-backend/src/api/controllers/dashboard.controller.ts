import { Request, Response, NextFunction } from 'express';
import { mockDatabase } from '../../workflows/activities';
import { 
  DashboardMetrics,
  SocialPlatform,
  CampaignStatus,
  PostStatus
} from '../../types';
import logger from '../../utils/logger';

interface AuthRequest extends Request {
  user?: any;
}

// Get dashboard overview metrics
export const getDashboardMetrics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.id;

    // Get user's campaigns
    const userCampaigns = Array.from(mockDatabase.campaigns.values()).filter(
      campaign => campaign.userId === userId
    );

    // Get all posts for user's campaigns
    const campaignIds = userCampaigns.map(c => c.id);
    const userPosts = Array.from(mockDatabase.posts.values()).filter(
      post => campaignIds.includes(post.campaignId)
    );

    // Calculate campaign metrics
    const totalCampaigns = userCampaigns.length;
    const activeCampaigns = userCampaigns.filter(
      c => c.status === CampaignStatus.APPROVED || 
           c.status === CampaignStatus.SCHEDULED || 
           c.status === CampaignStatus.PUBLISHED
    ).length;

    // Calculate post metrics
    const totalPosts = userPosts.length;
    const publishedPosts = userPosts.filter(
      p => p.status === PostStatus.PUBLISHED
    ).length;

    // Get all metrics for published posts
    const publishedPostIds = userPosts
      .filter(p => p.status === PostStatus.PUBLISHED)
      .map(p => p.id);
    
    const allMetrics = Array.from(mockDatabase.metrics.values()).filter(
      metric => publishedPostIds.includes(metric.postId)
    );

    // Get latest metrics for each post
    const latestMetricsMap = new Map();
    allMetrics.forEach(metric => {
      const existing = latestMetricsMap.get(metric.postId);
      if (!existing || metric.fetchedAt > existing.fetchedAt) {
        latestMetricsMap.set(metric.postId, metric);
      }
    });

    // Calculate total engagement
    let totalEngagement = 0;
    let totalImpressions = 0;
    const platformMetricsMap = new Map<SocialPlatform, { posts: number; engagement: number }>();

    // Initialize platform metrics
    Object.values(SocialPlatform).forEach(platform => {
      platformMetricsMap.set(platform, { posts: 0, engagement: 0 });
    });

    // Calculate metrics
    latestMetricsMap.forEach(metric => {
      const engagement = metric.likes + metric.comments + metric.shares;
      totalEngagement += engagement;
      totalImpressions += metric.impressions;

      // Update platform metrics
      const platformData = platformMetricsMap.get(metric.platform);
      if (platformData) {
        platformData.posts += 1;
        platformData.engagement += engagement;
      }
    });

    // Calculate average engagement rate
    const averageEngagementRate = totalImpressions > 0 
      ? (totalEngagement / totalImpressions) * 100 
      : 0;

    // Convert platform metrics to array
    const platformMetrics = Array.from(platformMetricsMap.entries()).map(
      ([platform, data]) => ({
        platform,
        posts: data.posts,
        engagement: data.engagement,
      })
    );

    const dashboardMetrics: DashboardMetrics = {
      totalCampaigns,
      activeCampaigns,
      totalPosts,
      publishedPosts,
      totalEngagement,
      averageEngagementRate,
      platformMetrics,
    };

    res.json({
      success: true,
      data: dashboardMetrics,
    });
  } catch (error) {
    next(error);
  }
};

// Get recent activities
export const getRecentActivities = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    // Get user's campaigns
    const userCampaigns = Array.from(mockDatabase.campaigns.values()).filter(
      campaign => campaign.userId === userId
    );
    const campaignIds = userCampaigns.map(c => c.id);

    // Collect all activities
    const activities: any[] = [];

    // Add campaign activities
    userCampaigns.forEach(campaign => {
      activities.push({
        type: 'campaign_created',
        title: `Campaign "${campaign.title}" created`,
        timestamp: campaign.createdAt,
        data: { campaignId: campaign.id, status: campaign.status },
      });
    });

    // Add post activities
    const userPosts = Array.from(mockDatabase.posts.values()).filter(
      post => campaignIds.includes(post.campaignId)
    );
    
    userPosts.forEach(post => {
      if (post.publishedAt) {
        activities.push({
          type: 'post_published',
          title: `Post published on ${post.platform}`,
          timestamp: post.publishedAt,
          data: { postId: post.id, platform: post.platform },
        });
      }
    });

    // Add approval activities
    const approvals = Array.from(mockDatabase.approvals.values()).filter(
      approval => campaignIds.includes(approval.campaignId)
    );
    
    approvals.forEach(approval => {
      const timestamp = approval.approvedAt || approval.rejectedAt || approval.createdAt;
      activities.push({
        type: `campaign_${approval.status}`,
        title: `Campaign ${approval.status}`,
        timestamp,
        data: { campaignId: approval.campaignId, status: approval.status },
      });
    });

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    const limitedActivities = activities.slice(0, Number(limit));

    res.json({
      success: true,
      data: {
        activities: limitedActivities,
        total: activities.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get platform performance breakdown
export const getPlatformPerformance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.id;
    const { platform } = req.query;

    // Get user's campaigns
    const userCampaigns = Array.from(mockDatabase.campaigns.values()).filter(
      campaign => campaign.userId === userId
    );
    const campaignIds = userCampaigns.map(c => c.id);

    // Get published posts
    let userPosts = Array.from(mockDatabase.posts.values()).filter(
      post => campaignIds.includes(post.campaignId) && 
              post.status === PostStatus.PUBLISHED
    );

    // Filter by platform if specified
    if (platform) {
      userPosts = userPosts.filter(post => post.platform === platform);
    }

    const postIds = userPosts.map(p => p.id);

    // Get metrics for these posts
    const metrics = Array.from(mockDatabase.metrics.values()).filter(
      metric => postIds.includes(metric.postId)
    );

    // Group metrics by platform and calculate averages
    const platformData = new Map<SocialPlatform, {
      totalPosts: number;
      totalLikes: number;
      totalComments: number;
      totalShares: number;
      totalImpressions: number;
      totalClicks: number;
      totalReach: number;
      avgEngagementRate: number;
    }>();

    // Initialize platform data
    Object.values(SocialPlatform).forEach(p => {
      platformData.set(p, {
        totalPosts: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalReach: 0,
        avgEngagementRate: 0,
      });
    });

    // Get latest metrics for each post
    const latestMetricsMap = new Map();
    metrics.forEach(metric => {
      const existing = latestMetricsMap.get(metric.postId);
      if (!existing || metric.fetchedAt > existing.fetchedAt) {
        latestMetricsMap.set(metric.postId, metric);
      }
    });

    // Aggregate metrics by platform
    latestMetricsMap.forEach(metric => {
      const data = platformData.get(metric.platform);
      if (data) {
        data.totalPosts += 1;
        data.totalLikes += metric.likes;
        data.totalComments += metric.comments;
        data.totalShares += metric.shares;
        data.totalImpressions += metric.impressions;
        data.totalClicks += metric.clicks;
        data.totalReach += metric.reach;
      }
    });

    // Calculate average engagement rates
    platformData.forEach((data, platform) => {
      if (data.totalImpressions > 0) {
        const totalEngagement = data.totalLikes + data.totalComments + data.totalShares;
        data.avgEngagementRate = (totalEngagement / data.totalImpressions) * 100;
      }
    });

    // Convert to array format
    const platformPerformance = Array.from(platformData.entries()).map(
      ([platform, data]) => ({ platform, ...data })
    );

    res.json({
      success: true,
      data: platformPerformance,
    });
  } catch (error) {
    next(error);
  }
};

// Get engagement trends over time
export const getEngagementTrends = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.id;
    const { period = '7d', platform } = req.query;

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get user's campaigns
    const userCampaigns = Array.from(mockDatabase.campaigns.values()).filter(
      campaign => campaign.userId === userId
    );
    const campaignIds = userCampaigns.map(c => c.id);

    // Get published posts
    let userPosts = Array.from(mockDatabase.posts.values()).filter(
      post => campaignIds.includes(post.campaignId) && 
              post.status === PostStatus.PUBLISHED &&
              post.publishedAt && 
              post.publishedAt >= startDate &&
              post.publishedAt <= endDate
    );

    // Filter by platform if specified
    if (platform) {
      userPosts = userPosts.filter(post => post.platform === platform);
    }

    const postIds = userPosts.map(p => p.id);

    // Get all metrics for these posts
    const metrics = Array.from(mockDatabase.metrics.values()).filter(
      metric => postIds.includes(metric.postId) &&
                metric.fetchedAt >= startDate &&
                metric.fetchedAt <= endDate
    );

    // Group metrics by date
    const trendData = new Map<string, {
      date: string;
      likes: number;
      comments: number;
      shares: number;
      impressions: number;
      engagementRate: number;
    }>();

    metrics.forEach(metric => {
      const dateKey = metric.fetchedAt.toISOString().split('T')[0];
      
      if (!trendData.has(dateKey)) {
        trendData.set(dateKey, {
          date: dateKey,
          likes: 0,
          comments: 0,
          shares: 0,
          impressions: 0,
          engagementRate: 0,
        });
      }

      const data = trendData.get(dateKey)!;
      data.likes += metric.likes;
      data.comments += metric.comments;
      data.shares += metric.shares;
      data.impressions += metric.impressions;
    });

    // Calculate engagement rates
    trendData.forEach(data => {
      if (data.impressions > 0) {
        const totalEngagement = data.likes + data.comments + data.shares;
        data.engagementRate = (totalEngagement / data.impressions) * 100;
      }
    });

    // Convert to array and sort by date
    const trends = Array.from(trendData.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    res.json({
      success: true,
      data: {
        period,
        trends,
      },
    });
  } catch (error) {
    next(error);
  }
};
