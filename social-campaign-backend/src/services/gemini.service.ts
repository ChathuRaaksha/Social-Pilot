import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config';
import logger from '../utils/logger';
import { SocialPlatform, GenerateContentInput } from '../types';

class GeminiService {
  private genAI?: GoogleGenerativeAI;
  private model?: any;

  constructor() {
    if (!config.googleGemini.apiKey) {
      logger.warn('Google Gemini API key not configured. Using mock responses.');
    } else {
      this.genAI = new GoogleGenerativeAI(config.googleGemini.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    }
  }

  /**
   * Generate platform-specific content for a campaign
   */
  async generateContent(input: GenerateContentInput): Promise<string> {
    const { title, description, platform } = input;

    // Mock response for development when API key is not set
    if (!config.googleGemini.apiKey) {
      return this.getMockContent(platform, title, description);
    }

    try {
      const prompt = this.buildPrompt(platform, title, description);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      logger.info('Generated content for platform', { platform, campaignId: input.campaignId });
      return text;
    } catch (error) {
      logger.error('Error generating content with Gemini', error);
      // Fallback to mock content on error
      return this.getMockContent(platform, title, description);
    }
  }

  /**
   * Build platform-specific prompts for content generation
   */
  private buildPrompt(platform: SocialPlatform, title: string, description: string): string {
    const baseContext = `Create a social media post for a campaign titled "${title}". Campaign description: ${description}`;
    
    switch (platform) {
      case SocialPlatform.LINKEDIN:
        return `${baseContext}
        
        Create a professional LinkedIn post that:
        - Is between 1200-1500 characters
        - Uses a professional tone
        - Includes 3-5 relevant hashtags
        - Has a clear call-to-action
        - Engages with industry professionals
        - Format the post to be visually appealing with line breaks
        
        Return only the post content, no additional commentary.`;

      case SocialPlatform.TWITTER:
        return `${baseContext}
        
        Create an engaging Twitter/X post that:
        - Is under 280 characters
        - Uses a conversational tone
        - Includes 2-3 trending hashtags
        - Is attention-grabbing and shareable
        - May include emojis where appropriate
        
        Return only the tweet content, no additional commentary.`;

      case SocialPlatform.INSTAGRAM:
        return `${baseContext}
        
        Create an Instagram caption that:
        - Starts with an engaging hook
        - Is between 150-300 characters for the main message
        - Includes 10-15 relevant hashtags at the end
        - Has a conversational, visual-focused tone
        - Includes emojis to break up text
        - Has a clear call-to-action
        
        Return only the caption content, no additional commentary.`;

      default:
        return baseContext;
    }
  }

  /**
   * Generate mock content for development/testing
   */
  private getMockContent(platform: SocialPlatform, title: string, description: string): string {
    const mockContents = {
      [SocialPlatform.LINKEDIN]: `🚀 Exciting News: ${title}

${description}

At our company, we believe in pushing boundaries and creating innovative solutions that make a real difference. This campaign represents our commitment to excellence and our vision for the future.

Key highlights:
✅ Innovation at its core
✅ Customer-centric approach
✅ Sustainable practices
✅ Team collaboration

We're thrilled to share this journey with our professional network. What are your thoughts on this initiative?

#Innovation #Leadership #BusinessGrowth #FutureOfWork #ProfessionalDevelopment`,

      [SocialPlatform.TWITTER]: `🎯 ${title} is here! ${description.substring(0, 100)}... 

Join us in making a difference! 🌟

#Innovation #TechNews #Trending`,

      [SocialPlatform.INSTAGRAM]: `✨ ${title} ✨

${description.substring(0, 200)}...

Drop a 💙 if you're as excited as we are!

👉 Learn more at the link in bio

#${title.replace(/\s+/g, '')} #InstaDaily #Innovation #TechLife #Startup #Entrepreneur #DigitalMarketing #Success #Motivation #BusinessGrowth #CreativeLife #InstaGood #TechCommunity #FutureIsNow #GoalGetter`
    };

    return mockContents[platform] || `Check out our new campaign: ${title} - ${description}`;
  }

  /**
   * Generate multiple content variations for A/B testing
   */
  async generateContentVariations(
    input: GenerateContentInput,
    count: number = 3
  ): Promise<string[]> {
    const variations: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const content = await this.generateContent(input);
      variations.push(content);
      
      // Add small delay to avoid rate limiting
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return variations;
  }

  /**
   * Extract hashtags from generated content
   */
  extractHashtags(content: string): string[] {
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    const matches = content.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  }

  /**
   * Optimize content for platform-specific requirements
   */
  optimizeContent(content: string, platform: SocialPlatform): string {
    switch (platform) {
      case SocialPlatform.TWITTER:
        // Ensure content fits within Twitter's character limit
        if (content.length > 280) {
          return content.substring(0, 277) + '...';
        }
        return content;

      case SocialPlatform.LINKEDIN:
        // LinkedIn has a 3000 character limit
        if (content.length > 3000) {
          return content.substring(0, 2997) + '...';
        }
        return content;

      case SocialPlatform.INSTAGRAM:
        // Instagram has a 2200 character limit
        if (content.length > 2200) {
          return content.substring(0, 2197) + '...';
        }
        return content;

      default:
        return content;
    }
  }
}

export default new GeminiService();
