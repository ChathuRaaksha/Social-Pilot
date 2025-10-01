# x_activities.py
import os
from typing import Dict, Optional
from temporalio import activity
from pydantic import BaseModel
from requests_oauthlib import OAuth1Session

# X API endpoints
X_API_BASE = "https://api.twitter.com/2"
X_CREATE_TWEET_URL = f"{X_API_BASE}/tweets"

# X credentials from environment (OAuth 1.0a)
X_API_KEY = os.getenv("X_API_KEY", "")
X_API_KEY_SECRET = os.getenv("X_API_KEY_SECRET", "")
X_ACCESS_TOKEN = os.getenv("X_ACCESS_TOKEN", "")
X_ACCESS_TOKEN_SECRET = os.getenv("X_ACCESS_TOKEN_SECRET", "")


class XPostRequest(BaseModel):
    access_token: str
    access_token_secret: str
    content: str
    image_url: Optional[str] = None


@activity.defn
async def post_to_x(request: XPostRequest) -> Dict[str, str]:
    """
    Post content to X (Twitter) using the v2 API with OAuth 1.0a.
    
    Args:
        request: XPostRequest with access_token, access_token_secret, content, and optional image_url
    
    Returns:
        Dict with 'post_id', 'url', and 'status' of the created post
    """
    try:
        # Create OAuth1Session with user credentials
        oauth = OAuth1Session(
            X_API_KEY,
            client_secret=X_API_KEY_SECRET,
            resource_owner_key=request.access_token,
            resource_owner_secret=request.access_token_secret,
        )

        # Build the tweet payload
        payload = {
            "text": request.content
        }

        # TODO: If there's an image, we'd need to upload it first using media upload endpoint
        # For now, we'll just post text

        # Make the API request
        response = oauth.post(X_CREATE_TWEET_URL, json=payload)
        
        if response.status_code != 201:
            error_msg = f"X API error: {response.status_code}"
            try:
                error_data = response.json()
                error_msg += f" - {error_data.get('detail', error_data.get('title', response.text))}"
            except:
                error_msg += f" - {response.text}"
            raise Exception(error_msg)
        
        result = response.json()
        
        # Extract tweet ID from response
        tweet_data = result.get("data", {})
        tweet_id = tweet_data.get("id", "")
        
        return {
            "post_id": tweet_id,
            "url": f"https://twitter.com/i/web/status/{tweet_id}",
            "status": "published"
        }
    
    except Exception as e:
        raise Exception(f"Failed to post to X: {str(e)}")


@activity.defn
async def get_x_profile(access_token: str, access_token_secret: str) -> Dict[str, str]:
    """
    Get X profile information to retrieve the user details.
    
    Args:
        access_token: X OAuth access token
        access_token_secret: X OAuth access token secret
    
    Returns:
        Dict with 'user_id', 'username', 'name'
    """
    try:
        # Create OAuth1Session
        oauth = OAuth1Session(
            X_API_KEY,
            client_secret=X_API_KEY_SECRET,
            resource_owner_key=access_token,
            resource_owner_secret=access_token_secret,
        )

        # Get user profile using v2 API
        response = oauth.get(
            f"{X_API_BASE}/users/me",
            params={"user.fields": "id,username,name"}
        )
        response.raise_for_status()
        
        result = response.json()
        user_data = result.get("data", {})
        
        return {
            "user_id": user_data.get("id", ""),
            "username": user_data.get("username", ""),
            "name": user_data.get("name", "")
        }
    
    except Exception as e:
        raise Exception(f"Failed to get X profile: {str(e)}")


# Mock activity for testing without real X API
@activity.defn
async def mock_post_to_x(request: XPostRequest) -> Dict[str, str]:
    """
    Mock X posting for testing purposes.
    """
    import time
    import hashlib
    
    # Simulate API delay
    await activity.asyncio.sleep(1)
    
    # Generate a fake post ID
    post_id = hashlib.md5(f"{request.content}{time.time()}".encode()).hexdigest()[:16]
    
    return {
        "post_id": post_id,
        "url": f"https://twitter.com/i/web/status/{post_id}",
        "status": "published"
    }
