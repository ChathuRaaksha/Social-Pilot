# posting_workflows.py
from typing import Dict, Optional, Any
from temporalio import workflow
from datetime import timedelta
from pydantic import BaseModel

with workflow.unsafe.imports_passed_through():
    from linkedin_activities import (
        post_to_linkedin,
        get_linkedin_profile,
        mock_post_to_linkedin,
        LinkedInPostRequest
    )
    from x_activities import (
        post_to_x,
        get_x_profile,
        mock_post_to_x,
        XPostRequest
    )

class PostToSocialMediaRequest(BaseModel):
    platform: str  # 'linkedin', 'x', 'instagram'
    post_id: str  # Database post ID
    content: str
    access_token: str
    author_urn: Optional[str] = None  # For LinkedIn
    image_url: Optional[str] = None
    use_mock: bool = False  # For testing

@workflow.defn
class PostToSocialMediaWorkflow:
    """
    Workflow to post content to social media platforms and update database.
    """

    @workflow.run
    async def run(self, request: PostToSocialMediaRequest) -> Dict[str, Any]:
        """
        Post to social media and return result.
        
        Args:
            request: PostToSocialMediaRequest with platform, content, credentials
        
        Returns:
            Dict with 'success', 'post_url', 'platform_post_id', 'error' (if any)
        """
        result = {
            "success": False,
            "platform": request.platform,
            "post_id": request.post_id,
            "post_url": None,
            "platform_post_id": None,
            "error": None
        }

        try:
            if request.platform.lower() == "linkedin":
                # Post to LinkedIn
                linkedin_request = LinkedInPostRequest(
                    access_token=request.access_token,
                    author_urn=request.author_urn or "",
                    content=request.content,
                    image_url=request.image_url
                )
                
                if request.use_mock:
                    # Use mock for testing
                    linkedin_result = await workflow.execute_activity(
                        mock_post_to_linkedin,
                        linkedin_request,
                        schedule_to_close_timeout=timedelta(seconds=30)
                    )
                else:
                    # Real LinkedIn posting
                    linkedin_result = await workflow.execute_activity(
                        post_to_linkedin,
                        linkedin_request,
                        schedule_to_close_timeout=timedelta(seconds=60)
                    )
                
                result["success"] = True
                result["post_url"] = linkedin_result.get("url")
                result["platform_post_id"] = linkedin_result.get("post_id")
                
            elif request.platform.lower() == "x" or request.platform.lower() == "twitter":
                # Post to X/Twitter using OAuth 1.0a
                x_request = XPostRequest(
                    access_token=request.access_token,
                    access_token_secret=request.author_urn or "",  # Reusing author_urn field for access_token_secret
                    content=request.content,
                    image_url=request.image_url
                )
                
                if request.use_mock:
                    # Use mock for testing
                    x_result = await workflow.execute_activity(
                        mock_post_to_x,
                        x_request,
                        schedule_to_close_timeout=timedelta(seconds=30)
                    )
                else:
                    # Real X posting
                    x_result = await workflow.execute_activity(
                        post_to_x,
                        x_request,
                        schedule_to_close_timeout=timedelta(seconds=60)
                    )
                
                result["success"] = True
                result["post_url"] = x_result.get("url")
                result["platform_post_id"] = x_result.get("post_id")
                
            elif request.platform.lower() == "instagram":
                # TODO: Implement Instagram posting
                result["error"] = "Instagram posting not yet implemented"
                
            else:
                result["error"] = f"Unsupported platform: {request.platform}"
        
        except Exception as e:
            result["success"] = False
            result["error"] = str(e)
        
        return result
