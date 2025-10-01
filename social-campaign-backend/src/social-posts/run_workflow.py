# run_workflow.py
import os
import asyncio
from temporalio.client import Client
from workflows import SocialPostWorkflow  # (no need to import PostParams)

NAMESPACE = os.getenv("TEMPORAL_NAMESPACE", "default")
HOST = os.getenv("TEMPORAL_HOST", "localhost")
PORT = int(os.getenv("TEMPORAL_PORT", "7233"))
TASK_QUEUE = os.getenv("TEMPORAL_TASK_QUEUE", "social-post-queue")

async def connect_client():
    try:
        return await Client.connect(f"{HOST}:{PORT}", namespace=NAMESPACE)
    except TypeError:
        return await Client.connect(target_host=HOST, target_port=PORT, namespace=NAMESPACE)

async def main():
    client = await connect_client()

    payload = {
        "idea": "Announce our new AI-powered analytics dashboard that identifies revenue drivers for SMBs.",
        "audience": "Startup founders and growth leads",
        "tone": "confident, helpful",
        "image": None,
        "platforms": ["linkedin", "twitter", "facebook", "instagram"],
    }

    handle = await client.start_workflow(
        SocialPostWorkflow.run,
        payload,  # <- single arg for legacy SDKs
        id="social-post-wf-001",
        task_queue=TASK_QUEUE,
    )

    result = await handle.result()
    print("\n=== Final Posts ===")
    for platform, text in result.items():
        print(f"\n[{platform}]\n{text}\n")

if __name__ == "__main__":
    asyncio.run(main())