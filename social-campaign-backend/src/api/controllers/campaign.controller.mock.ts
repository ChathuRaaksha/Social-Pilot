import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';

interface AuthRequest extends Request {
  user?: any;
}

// Mock database
const mockCampaigns = new Map<string, any>();
const mockPosts = new Map<string, any>();

// Create a new campaign
export const createCampaign = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description, platforms, targetAudience, tone, imageUrl } = req.body;
    const userId = req.user?.id || 'anonymous';

    // Generate campaign ID
    const campaignId = uuidv4();
    
    const campaign = {
      id: campaignId,
      userId,
      title,
      description,
      platforms,
      targetAudience,
      tone,
      imageUrl,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockCampaigns.set(campaignId, campaign);

    // Generate mock posts for each platform
    const posts = platforms.map((platform: string) => ({
      id: uuidv4(),
      campaignId,
      platform,
      content: `Mock ${platform} post for: ${title}`,
      status: 'draft',
      createdAt: new Date().toISOString(),
    }));

    posts.forEach((post: any) => mockPosts.set(post.id, post));

    logger.info('Campaign created', { campaignId });

    res.status(201).json({
      ...campaign,
      posts
    });
  } catch (error) {
    next(error);
  }
};

// Get campaign details
export const getCampaign = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const campaign = mockCampaigns.get(id);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    // Get associated posts
    const posts = Array.from(mockPosts.values()).filter(
      post => post.campaignId === id
    );

    res.json({
      ...campaign,
      posts,
    });
  } catch (error) {
    next(error);
  }
};

// Get all campaigns
export const getCampaigns = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const campaigns = Array.from(mockCampaigns.values());

    res.json({
      campaigns,
      pagination: {
        total: campaigns.length,
        limit: 100,
        offset: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Approve or reject a campaign
export const approveCampaign = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { approved, comments } = req.body;

    const campaign = mockCampaigns.get(id);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    campaign.status = approved ? 'approved' : 'rejected';
    campaign.updatedAt = new Date().toISOString();
    campaign.approvalComments = comments;

    mockCampaigns.set(id, campaign);

    res.json({
      campaign,
      message: `Campaign ${approved ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// Get campaign metrics
export const getCampaignMetrics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const campaign = mockCampaigns.get(id);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    // Return mock metrics
    res.json({
      campaignId: id,
      metrics: {
        totalImpressions: Math.floor(Math.random() * 10000),
        totalEngagements: Math.floor(Math.random() * 1000),
        totalClicks: Math.floor(Math.random() * 500),
        engagementRate: (Math.random() * 10).toFixed(2) + '%',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete a campaign
export const deleteCampaign = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mockCampaigns.has(id)) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    mockCampaigns.delete(id);
    
    // Delete associated posts
    Array.from(mockPosts.entries()).forEach(([postId, post]) => {
      if (post.campaignId === id) {
        mockPosts.delete(postId);
      }
    });

    res.json({
      message: 'Campaign deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
