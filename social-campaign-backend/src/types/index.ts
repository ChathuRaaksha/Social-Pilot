// Campaign Types
export interface Campaign {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: CampaignStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum CampaignStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  FAILED = 'failed',
}

// Post Types
export interface Post {
  id: string;
  campaignId: string;
  platform: SocialPlatform;
  content: string;
  mediaUrls?: string[];
  hashtags?: string[];
  scheduledAt?: Date;
  publishedAt?: Date;
  status: PostStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum SocialPlatform {
  LINKEDIN = 'linkedin',
  TWITTER = 'twitter',
  INSTAGRAM = 'instagram',
}

export enum PostStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  FAILED = 'failed',
}

// Approval Types
export interface Approval {
  id: string;
  campaignId: string;
  userId: string;
  status: ApprovalStatus;
  comments?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// Engagement Metrics Types
export interface EngagementMetrics {
  id: string;
  postId: string;
  platform: SocialPlatform;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  clicks: number;
  reach: number;
  engagement_rate: number;
  fetchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

// API Request/Response Types
export interface CreateCampaignRequest {
  title: string;
  description: string;
  platforms: SocialPlatform[];
}

export interface CreateCampaignResponse {
  campaign: Campaign;
  posts: Post[];
}

export interface ApproveCampaignRequest {
  approved: boolean;
  comments?: string;
}

export interface DashboardMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalPosts: number;
  publishedPosts: number;
  totalEngagement: number;
  averageEngagementRate: number;
  platformMetrics: {
    platform: SocialPlatform;
    posts: number;
    engagement: number;
  }[];
}

// Workflow Types
export interface CampaignWorkflowInput {
  campaignId: string;
  userId: string;
  title: string;
  description: string;
  platforms: SocialPlatform[];
}

export interface GenerateContentInput {
  campaignId: string;
  title: string;
  description: string;
  platform: SocialPlatform;
}

export interface PublishPostInput {
  postId: string;
  platform: SocialPlatform;
  content: string;
  mediaUrls?: string[];
  hashtags?: string[];
}

// Error Types
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
