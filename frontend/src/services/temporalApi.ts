// Temporal API Service
// Handles communication with the Flask API that orchestrates Temporal workflows

const TEMPORAL_API_URL = import.meta.env.VITE_TEMPORAL_API_URL || 'http://localhost:8080';

export interface GeneratePostsRequest {
  idea: string;
  audience?: string;
  tone?: string;
  image?: string;
  platforms?: string[];
  wait?: boolean;
  timeout_seconds?: number;
}

export interface Post {
  platform: string;
  content: string;
  hashtags?: string[];
}

export interface WorkflowResponse {
  workflow_id: string;
  run_id?: string;
  status: 'completed' | 'running' | 'started' | 'failed';
  result?: Record<string, string>; // API returns { Platform: content } format
  message?: string;
  error?: string;
}

/**
 * Generate social media posts using Temporal workflow
 */
export async function generatePosts(
  request: GeneratePostsRequest
): Promise<WorkflowResponse> {
  try {
    console.log('Calling Temporal API at:', `${TEMPORAL_API_URL}/api/v1/social-posts`);
    
    const response = await fetch(`${TEMPORAL_API_URL}/api/v1/social-posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        wait: request.wait ?? true,
        timeout_seconds: request.timeout_seconds ?? 30,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling Temporal API:', error);
    
    // Provide more specific error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to Temporal API at ${TEMPORAL_API_URL}. ` +
        `Please ensure the Flask API is running. ` +
        `Start it with: cd hackathon_kolomolo_temporal/social-campaign-backend/social-posts-temporal && python api.py`
      );
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Unknown error occurred while calling Temporal API');
  }
}

/**
 * Poll workflow status by workflow ID
 */
export async function pollWorkflowStatus(
  workflowId: string,
  runId?: string,
  timeoutSeconds: number = 1
): Promise<WorkflowResponse> {
  try {
    const params = new URLSearchParams({
      timeout_seconds: timeoutSeconds.toString(),
    });
    
    if (runId) {
      params.append('run_id', runId);
    }

    const response = await fetch(
      `${TEMPORAL_API_URL}/api/v1/social-posts/${workflowId}?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error polling workflow status:', error);
    throw error;
  }
}

/**
 * Check if Temporal API is healthy
 */
export async function checkHealth(): Promise<{ ok: boolean; namespace?: string; task_queue?: string; error?: string }> {
  try {
    const response = await fetch(`${TEMPORAL_API_URL}/healthz`, {
      method: 'GET',
    });

    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export interface PublishPostRequest {
  post_id: string;
  platform: string;
  content: string;
  access_token: string;
  author_urn?: string;
  image_url?: string;
  use_mock?: boolean;
  wait?: boolean;
}

export interface PublishPostResponse {
  workflow_id: string;
  run_id?: string;
  status: 'completed' | 'running' | 'started' | 'failed';
  result?: {
    success: boolean;
    platform: string;
    post_id: string;
    post_url?: string;
    platform_post_id?: string;
    error?: string;
  };
  message?: string;
  error?: string;
}

/**
 * Publish a post to social media using Temporal workflow
 */
export async function publishPost(
  request: PublishPostRequest
): Promise<PublishPostResponse> {
  try {
    console.log('Publishing post via Temporal API:', request.platform);
    
    const response = await fetch(`${TEMPORAL_API_URL}/api/v1/social-posts/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        wait: request.wait ?? true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error publishing post:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to Temporal API at ${TEMPORAL_API_URL}. ` +
        `Please ensure the Flask API is running.`
      );
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Unknown error occurred while publishing post');
  }
}
