# workflows.py
from typing import Dict, List, Optional, Any
from temporalio import workflow
from datetime import timedelta

with workflow.unsafe.imports_passed_through():
    from activities import generate_base_draft, curate_for_platform, DraftInput, PlatformRequest

# NEW: param container
from pydantic import BaseModel

class PostParams(BaseModel):
    idea: str
    audience: Optional[str] = None
    tone: Optional[str] = None
    image: Optional[str] = None
    platforms: Optional[List[str]] = None

SUPPORTED_PLATFORMS = ["linkedin", "twitter", "facebook", "instagram"]

@workflow.defn
class SocialPostWorkflow:

    @workflow.run
    async def run(
        self,
        params_or_idea: Any,
        audience: Optional[str] = None,
        tone: Optional[str] = None,
        image: Optional[str] = None,
        platforms: Optional[List[str]] = None,
    ) -> Dict[str, str]:
        """
        Accepts either:
        - Single payload (dict/PostParams), OR
        - Legacy multi-args: idea, audience, tone, image, platforms
        Returns: { platform_name: final_post_text }
        """
        # Normalize inputs to PostParams
        if isinstance(params_or_idea, dict):
            params = PostParams(**params_or_idea)
        elif isinstance(params_or_idea, PostParams):
            params = params_or_idea
        else:
            # legacy multi-arg path (params_or_idea is the idea string)
            params = PostParams(
                idea=str(params_or_idea),
                audience=audience,
                tone=tone,
                image=image,
                platforms=platforms,
            )

        effective_platforms = params.platforms or SUPPORTED_PLATFORMS

        draft = await workflow.execute_activity(
            generate_base_draft,
            DraftInput(idea=params.idea, audience=params.audience, tone=params.tone),
            schedule_to_close_timeout=timedelta(seconds=60),   # <-- was 60
        )

        results: Dict[str, str] = {}
        for p in effective_platforms:
            text = await workflow.execute_activity(
                curate_for_platform,
                PlatformRequest(
                    platform=p,
                    draft_text=draft,
                    idea=params.idea,
                    audience=params.audience,
                    tone=params.tone,
                    image=params.image,
                ),
                schedule_to_close_timeout=timedelta(seconds=90),   # <-- was 90
            )
            results[p.capitalize()] = text

        return results