import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: any;
}

// Get dashboard overview metrics
export const getDashboardMetrics = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Return mock dashboard metrics
    const dashboardMetrics = {
      totalCampaigns: Math.floor(Math.random() * 20),
      activeCampaigns: Math.floor(Math.random() * 10),
      totalPosts: Math.floor(Math.random() * 60),
      publishedPosts: Math.floor(Math.random() * 30),
      totalEngagement: Math.floor(Math.random() * 5000),
      averageEngagementRate: (Math.random() * 5).toFixed(2),
      platformMetrics: [
        {
          platform: 'linkedin',
          posts: Math.floor(Math.random() * 20),
          engagement: Math.floor(Math.random() * 2000),
        },
        {
          platform: 'twitter',
          posts: Math.floor(Math.random() * 20),
          engagement: Math.floor(Math.random() * 1500),
        },
        {
          platform: 'instagram',
          posts: Math.floor(Math.random() * 20),
          engagement: Math.floor(Math.random() * 1500),
        },
      ],
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
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Return mock activities
    const activities = [
      {
        type: 'campaign_created',
        title: 'Campaign "Summer Sale 2024" created',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        data: { campaignId: '123', status: 'draft' },
      },
      {
        type: 'post_published',
        title: 'Post published on LinkedIn',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        data: { postId: '456', platform: 'linkedin' },
      },
      {
        type: 'campaign_approved',
        title: 'Campaign approved',
        timestamp: new Date(Date.now() - 10800000), // 3 hours ago
        data: { campaignId: '789', status: 'approved' },
      },
    ];

    res.json({
      success: true,
      data: {
        activities,
        total: activities.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get platform performance breakdown
export const getPlatformPerformance = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Return mock platform performance
    const platformPerformance = [
      {
        platform: 'linkedin',
        totalPosts: Math.floor(Math.random() * 20),
        totalLikes: Math.floor(Math.random() * 1000),
        totalComments: Math.floor(Math.random() * 200),
        totalShares: Math.floor(Math.random() * 100),
        totalImpressions: Math.floor(Math.random() * 10000),
        totalClicks: Math.floor(Math.random() * 500),
        totalReach: Math.floor(Math.random() * 8000),
        avgEngagementRate: (Math.random() * 5).toFixed(2),
      },
      {
        platform: 'twitter',
        totalPosts: Math.floor(Math.random() * 20),
        totalLikes: Math.floor(Math.random() * 800),
        totalComments: Math.floor(Math.random() * 150),
        totalShares: Math.floor(Math.random() * 200),
        totalImpressions: Math.floor(Math.random() * 8000),
        totalClicks: Math.floor(Math.random() * 300),
        totalReach: Math.floor(Math.random() * 6000),
        avgEngagementRate: (Math.random() * 4).toFixed(2),
      },
      {
        platform: 'instagram',
        totalPosts: Math.floor(Math.random() * 20),
        totalLikes: Math.floor(Math.random() * 1200),
        totalComments: Math.floor(Math.random() * 100),
        totalShares: Math.floor(Math.random() * 50),
        totalImpressions: Math.floor(Math.random() * 12000),
        totalClicks: Math.floor(Math.random() * 200),
        totalReach: Math.floor(Math.random() * 10000),
        avgEngagementRate: (Math.random() * 6).toFixed(2),
      },
    ];

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
    const { period = '7d' } = req.query;
    
    // Generate mock trend data
    const days = period === '24h' ? 24 : 
                period === '7d' ? 7 : 
                period === '30d' ? 30 : 90;
                
    const trends = [];
    for (let i = 0; i < Math.min(days, 30); i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        likes: Math.floor(Math.random() * 500),
        comments: Math.floor(Math.random() * 100),
        shares: Math.floor(Math.random() * 50),
        impressions: Math.floor(Math.random() * 5000),
        engagementRate: (Math.random() * 5).toFixed(2),
      });
    }

    trends.reverse(); // Oldest first

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
