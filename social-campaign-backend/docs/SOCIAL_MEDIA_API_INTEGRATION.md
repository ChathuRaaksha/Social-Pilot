# Social Media API Integration Guide

This guide provides step-by-step instructions for setting up real social media API integrations for LinkedIn, X (Twitter), and Instagram.

## Table of Contents
- [LinkedIn API Integration](#linkedin-api-integration)
- [X (Twitter) API Integration](#x-twitter-api-integration)
- [Instagram API Integration](#instagram-api-integration)
- [Implementation Guide](#implementation-guide)
- [Security Best Practices](#security-best-practices)

---

## LinkedIn API Integration

### Prerequisites
1. LinkedIn account with a Company Page (for organizational posting)
2. LinkedIn Developer account

### Setup Steps

1. **Create a LinkedIn App**
   - Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
   - Click "Create app"
   - Fill in required information:
     - App name
     - LinkedIn Page (select your company page)
     - Privacy policy URL
     - App logo
   - Submit for approval

2. **Configure OAuth 2.0**
   - In your app settings, go to "Auth" tab
   - Add redirect URLs:
     ```
     http://localhost:3000/auth/linkedin/callback
     https://yourdomain.com/auth/linkedin/callback
     ```
   - Note your:
     - Client ID
     - Client Secret

3. **Request API Access**
   - Apply for Marketing Developer Platform access
   - Required products:
     - Share on LinkedIn
     - Marketing Developer Platform
   - This may take several days for approval

4. **API Permissions Needed**
   - `r_liteprofile` - Read member's lite profile
   - `r_emailaddress` - Read member's email
   - `w_member_social` - Post on behalf of member
   - `r_organization_social` - Read organization data
   - `w_organization_social` - Post on behalf of organization

### Implementation

```typescript
// src/services/social-media/linkedin.service.ts
import axios from 'axios';
import config from '../../config';

class LinkedInService {
  private accessToken: string;
  
  async authenticate(): Promise<void> {
    // OAuth 2.0 flow implementation
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&` +
      `client_id=${config.socialMedia.linkedin.clientId}&` +
      `redirect_uri=${config.socialMedia.linkedin.redirectUri}&` +
      `scope=r_liteprofile%20r_emailaddress%20w_member_social`;
    
    // Redirect user to authUrl
    // Handle callback to exchange code for access token
  }
  
  async publishPost(content: string, mediaUrls?: string[]): Promise<any> {
    const endpoint = 'https://api.linkedin.com/v2/ugcPosts';
    
    const postData = {
      author: `urn:li:person:${this.userId}`, // or organization URN
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: mediaUrls ? 'IMAGE' : 'NONE',
          media: mediaUrls ? this.formatMedia(mediaUrls) : []
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };
    
    const response = await axios.post(endpoint, postData, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });
    
    return response.data;
  }
  
  async getMetrics(postId: string): Promise<any> {
    const endpoint = `https://api.linkedin.com/v2/socialActions/${postId}`;
    
    const response = await axios.get(endpoint, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });
    
    return response.data;
  }
}
```

---

## X (Twitter) API Integration

### Prerequisites
1. X (Twitter) Developer Account
2. Elevated access for v2 API

### Setup Steps

1. **Create a Twitter App**
   - Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
   - Create a new Project and App
   - Choose appropriate environment (Development/Production)

2. **Generate Credentials**
   - In your app settings, generate:
     - API Key (Consumer Key)
     - API Secret (Consumer Secret)
     - Bearer Token
     - Access Token and Secret (for user context)

3. **Configure OAuth 2.0**
   - Set up OAuth 2.0 with PKCE
   - Add callback URLs:
     ```
     http://localhost:3000/auth/twitter/callback
     https://yourdomain.com/auth/twitter/callback
     ```

4. **API Access Level**
   - Free tier: 1,500 posts/month
   - Basic tier: 3,000 posts/month, analytics access
   - Pro tier: 1M posts/month, advanced features

### Implementation

```typescript
// src/services/social-media/twitter.service.ts
import { TwitterApi } from 'twitter-api-v2';
import config from '../../config';

class TwitterService {
  private client: TwitterApi;
  
  constructor() {
    this.client = new TwitterApi({
      appKey: config.socialMedia.twitter.apiKey,
      appSecret: config.socialMedia.twitter.apiSecret,
      accessToken: config.socialMedia.twitter.accessToken,
      accessSecret: config.socialMedia.twitter.accessTokenSecret,
    });
  }
  
  async publishTweet(content: string, mediaUrls?: string[]): Promise<any> {
    let mediaIds: string[] = [];
    
    // Upload media if provided
    if (mediaUrls && mediaUrls.length > 0) {
      for (const url of mediaUrls) {
        const mediaId = await this.client.v1.uploadMedia(url);
        mediaIds.push(mediaId);
      }
    }
    
    // Create tweet
    const tweet = await this.client.v2.tweet({
      text: content,
      media: mediaIds.length > 0 ? { media_ids: mediaIds } : undefined
    });
    
    return tweet;
  }
  
  async getTweetMetrics(tweetId: string): Promise<any> {
    const tweet = await this.client.v2.singleTweet(tweetId, {
      'tweet.fields': ['public_metrics', 'created_at'],
    });
    
    return {
      likes: tweet.data.public_metrics.like_count,
      retweets: tweet.data.public_metrics.retweet_count,
      replies: tweet.data.public_metrics.reply_count,
      impressions: tweet.data.public_metrics.impression_count,
    };
  }
}
```

---

## Instagram API Integration

### Prerequisites
1. Facebook Developer Account
2. Instagram Business Account
3. Facebook Page connected to Instagram Account

### Setup Steps

1. **Create a Facebook App**
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a new app
   - Choose "Business" as the app type

2. **Add Instagram Basic Display**
   - In your app dashboard, add "Instagram Basic Display" product
   - Configure OAuth Redirect URIs:
     ```
     https://localhost:3000/auth/instagram/callback
     https://yourdomain.com/auth/instagram/callback
     ```

3. **Get Instagram Business Account ID**
   - Use Facebook Graph API Explorer
   - Request: `GET /me/accounts`
   - Find your Facebook Page ID
   - Request: `GET /{page-id}?fields=instagram_business_account`

4. **Required Permissions**
   - `instagram_basic` - Basic profile info
   - `instagram_content_publish` - Create content
   - `instagram_manage_comments` - Manage comments
   - `instagram_manage_insights` - View insights
   - `pages_read_engagement` - Read page metrics

### Implementation

```typescript
// src/services/social-media/instagram.service.ts
import axios from 'axios';
import config from '../../config';

class InstagramService {
  private accessToken: string;
  private businessAccountId: string;
  
  constructor() {
    this.accessToken = config.socialMedia.instagram.accessToken;
    this.businessAccountId = config.socialMedia.instagram.businessAccountId;
  }
  
  async publishPost(caption: string, imageUrl: string): Promise<any> {
    // Step 1: Create media container
    const createMediaUrl = `https://graph.facebook.com/v17.0/${this.businessAccountId}/media`;
    
    const mediaResponse = await axios.post(createMediaUrl, {
      image_url: imageUrl,
      caption: caption,
      access_token: this.accessToken
    });
    
    const creationId = mediaResponse.data.id;
    
    // Step 2: Publish the media container
    const publishUrl = `https://graph.facebook.com/v17.0/${this.businessAccountId}/media_publish`;
    
    const publishResponse = await axios.post(publishUrl, {
      creation_id: creationId,
      access_token: this.accessToken
    });
    
    return publishResponse.data;
  }
  
  async getPostMetrics(mediaId: string): Promise<any> {
    const metricsUrl = `https://graph.facebook.com/v17.0/${mediaId}/insights`;
    
    const response = await axios.get(metricsUrl, {
      params: {
        metric: 'engagement,impressions,reach,saved',
        access_token: this.accessToken
      }
    });
    
    return this.parseMetrics(response.data);
  }
  
  private parseMetrics(data: any): any {
    const metrics: any = {};
    
    data.data.forEach((metric: any) => {
      metrics[metric.name] = metric.values[0].value;
    });
    
    return metrics;
  }
}
```

---

## Implementation Guide

### 1. Update Environment Variables

Add the following to your `.env` file:

```env
# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/linkedin/callback

# X (Twitter)
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret

# Instagram (via Facebook)
INSTAGRAM_ACCESS_TOKEN=your_access_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_account_id
```

### 2. Create Service Factory

```typescript
// src/services/social-media/index.ts
import { SocialPlatform } from '../../types';
import { LinkedInService } from './linkedin.service';
import { TwitterService } from './twitter.service';
import { InstagramService } from './instagram.service';
import { getMockSocialMediaService } from './mock-social-media.service';
import config from '../../config';

export function getSocialMediaService(platform: SocialPlatform) {
  // Use mock services if API keys are not configured
  const isProduction = config.nodeEnv === 'production';
  
  switch (platform) {
    case SocialPlatform.LINKEDIN:
      return isProduction && config.socialMedia.linkedin.clientId 
        ? new LinkedInService()
        : getMockSocialMediaService(platform);
        
    case SocialPlatform.TWITTER:
      return isProduction && config.socialMedia.twitter.apiKey
        ? new TwitterService()
        : getMockSocialMediaService(platform);
        
    case SocialPlatform.INSTAGRAM:
      return isProduction && config.socialMedia.instagram.accessToken
        ? new InstagramService()
        : getMockSocialMediaService(platform);
        
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}
```

### 3. Update Workflow Activities

Replace mock service calls with the factory:

```typescript
// src/workflows/activities.ts
import { getSocialMediaService } from '../services/social-media';

export async function publishPost(input: PublishPostInput): Promise<Post> {
  // ... existing code ...
  
  const socialMediaService = getSocialMediaService(input.platform);
  const publishedPost = await socialMediaService.publishPost(input);
  
  // ... rest of the code ...
}
```

---

## Security Best Practices

1. **Never commit credentials**
   - Use environment variables
   - Add `.env` to `.gitignore`
   - Use secrets management in production

2. **Implement token refresh**
   - LinkedIn tokens expire in 60 days
   - Twitter tokens don't expire but can be revoked
   - Instagram tokens expire in 60 days

3. **Rate limiting**
   - LinkedIn: 1000 requests/day for sharing
   - Twitter: Varies by endpoint and tier
   - Instagram: 200 requests/hour

4. **Error handling**
   - Implement exponential backoff
   - Handle rate limit errors gracefully
   - Log all API errors for debugging

5. **Data privacy**
   - Only request necessary permissions
   - Implement data retention policies
   - Allow users to revoke access

6. **Webhook security**
   - Validate webhook signatures
   - Use HTTPS endpoints only
   - Implement replay attack protection

---

## Testing

1. **Use sandbox environments**
   - LinkedIn: Test with test company pages
   - Twitter: Use development environment
   - Instagram: Test with test users

2. **Mock external calls in tests**
   ```typescript
   jest.mock('../services/social-media', () => ({
     getSocialMediaService: jest.fn(() => mockService)
   }));
   ```

3. **Integration tests**
   - Test OAuth flows
   - Test API error scenarios
   - Test rate limiting behavior

---

## Troubleshooting

### Common Issues

1. **LinkedIn "Access denied"**
   - Ensure Marketing Developer Platform access
   - Check if permissions are approved
   - Verify organization admin role

2. **Twitter "Unauthorized"**
   - Regenerate tokens
   - Check API access level
   - Verify OAuth signature

3. **Instagram "Invalid media"**
   - Ensure image URLs are publicly accessible
   - Check image format (JPEG, PNG)
   - Verify image dimensions

### Debug Tips

1. Use API explorers:
   - LinkedIn: [API Console](https://www.linkedin.com/developers/tools/api-console)
   - Twitter: [Postman Collection](https://www.postman.com/twitter/workspace/twitter-public-workspace/collection/9956214-784efcda-ed4c-4491-a4c0-a26470a67400)
   - Instagram: [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

2. Enable verbose logging:
   ```typescript
   if (config.nodeEnv === 'development') {
     axios.interceptors.request.use(request => {
       logger.debug('API Request:', request);
       return request;
     });
   }
   ```

3. Monitor rate limits:
   - Check response headers
   - Implement rate limit tracking
   - Alert on approaching limits
