# linkedin_activities.py
import os
import httpx
from typing import Dict, Optional
from temporalio import activity
from pydantic import BaseModel

# LinkedIn OAuth and API endpoints
LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/accessToken"
LINKEDIN_API_BASE = "https://api.linkedin.com/v2"
LINKEDIN_UGC_POST_URL = f"{LINKEDIN_API_BASE}/ugcPosts"

# LinkedIn credentials from environment
LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID", "86cyxkas3cp4ik")
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET", "WPL_AP1.7hgNgtxNyohE1ebP.Nn/iLQ==")
LINKEDIN_REDIRECT_URI = os.getenv("LINKEDIN_REDIRECT_URI", "http://localhost:3000/auth/linkedin/callback")

class LinkedInPostRequest(BaseModel):
    access_token: str
    author_urn: str  # LinkedIn person URN (urn:li:person:XXXXX)
    content: str
    image_url: Optional[str] = None

@activity.defn
async def post_to_linkedin(request: LinkedInPostRequest) -> Dict[str, str]:
    """
    Post content to LinkedIn using the v2 UGC Posts API.
    
    Args:
        request: LinkedInPostRequest with access_token, author_urn, content, and optional image_url
    
    Returns:
        Dict with 'post_id' and 'url' of the created post
    """
    try:
        headers = {
            "Authorization": f"Bearer {request.access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
        }

        # Build the post payload
        post_data = {
            "author": request.author_urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {
                        "text": request.content
                    },
                    "shareMediaCategory": "NONE"
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        }

        # If there's an image, we'd need to upload it first
        # For now, we'll just post text
        # TODO: Implement image upload if needed

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                LINKEDIN_UGC_POST_URL,
                headers=headers,
                json=post_data
            )
            
            response.raise_for_status()
            result = response.json()
            
            # Extract post ID from response
            post_id = result.get("id", "")
            
            return {
                "post_id": post_id,
                "url": f"https://www.linkedin.com/feed/update/{post_id}",
                "status": "published"
            }
    
    except httpx.HTTPError as e:
        error_msg = f"LinkedIn API error: {str(e)}"
        if hasattr(e, 'response') and e.response:
            error_msg += f" - Response: {e.response.text}"
        raise Exception(error_msg)
    except Exception as e:
        raise Exception(f"Failed to post to LinkedIn: {str(e)}")


@activity.defn
async def get_linkedin_profile(access_token: str) -> Dict[str, str]:
    """
    Get LinkedIn profile information to retrieve the author URN.
    
    Args:
        access_token: LinkedIn OAuth access token
    
    Returns:
        Dict with 'person_urn', 'first_name', 'last_name'
    """
    try:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=30) as client:
            # Get user profile
            response = await client.get(
                f"{LINKEDIN_API_BASE}/me",
                headers=headers
            )
            response.raise_for_status()
            profile = response.json()
            
            person_id = profile.get("id", "")
            person_urn = f"urn:li:person:{person_id}"
            
            # Get profile details
            response = await client.get(
                f"{LINKEDIN_API_BASE}/me?projection=(id,firstName,lastName)",
                headers=headers
            )
            response.raise_for_status()
            details = response.json()
            
            first_name = details.get("firstName", {}).get("localized", {}).get("en_US", "")
            last_name = details.get("lastName", {}).get("localized", {}).get("en_US", "")
            
            return {
                "person_urn": person_urn,
                "person_id": person_id,
                "first_name": first_name,
                "last_name": last_name
            }
    
    except Exception as e:
        raise Exception(f"Failed to get LinkedIn profile: {str(e)}")


@activity.defn
async def get_linkedin_organization(access_token: str, vanity_name: str) -> Dict[str, str]:
    """
    Get LinkedIn organization information from vanity name.
    
    Args:
        access_token: LinkedIn OAuth access token
        vanity_name: Organization vanity name (e.g., 'social-pilot-labs')
    
    Returns:
        Dict with 'organization_urn', 'organization_id', 'name'
    """
    try:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=30) as client:
            # Search for organization by vanity name
            response = await client.get(
                f"{LINKEDIN_API_BASE}/organizations",
                headers=headers,
                params={"q": "vanityName", "vanityName": vanity_name}
            )
            response.raise_for_status()
            data = response.json()
            
            if "elements" in data and len(data["elements"]) > 0:
                org = data["elements"][0]
                org_id = org.get("id", "")
                org_urn = f"urn:li:organization:{org_id}"
                org_name = org.get("localizedName", vanity_name)
                
                return {
                    "organization_urn": org_urn,
                    "organization_id": org_id,
                    "name": org_name
                }
            else:
                raise Exception(f"Organization not found: {vanity_name}")
    
    except Exception as e:
        raise Exception(f"Failed to get LinkedIn organization: {str(e)}")


# Mock activity for testing without real LinkedIn API
@activity.defn
async def mock_post_to_linkedin(request: LinkedInPostRequest) -> Dict[str, str]:
    """
    Mock LinkedIn posting for testing purposes.
    """
    import time
    import hashlib
    
    # Simulate API delay
    await activity.asyncio.sleep(1)
    
    # Generate a fake post ID
    post_id = hashlib.md5(f"{request.content}{time.time()}".encode()).hexdigest()[:12]
    
    return {
        "post_id": f"urn:li:share:{post_id}",
        "url": f"https://www.linkedin.com/feed/update/urn:li:share:{post_id}",
        "status": "published"
    }
