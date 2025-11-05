# worker.py
import os
import asyncio
from temporalio.client import Client
from temporalio.worker import Worker

# Load .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("✓ Loaded .env file")
except ImportError:
    print("⚠ python-dotenv not installed, using system environment variables")

from workflows import SocialPostWorkflow
from posting_workflows import PostToSocialMediaWorkflow
from activities import generate_base_draft, curate_for_platform
from linkedin_activities import post_to_linkedin, get_linkedin_profile, mock_post_to_linkedin
from x_activities import post_to_x, get_x_profile, mock_post_to_x
import activities

TASK_QUEUE = os.getenv("TEMPORAL_TASK_QUEUE", "social-post-queue")
NAMESPACE = os.getenv("TEMPORAL_NAMESPACE", "default")
HOST = os.getenv("TEMPORAL_HOST", "localhost")
PORT = int(os.getenv("TEMPORAL_PORT", "7233"))

# Debug: Check if API key is loaded
print("\n=== Environment Check ===")
print(f"OPENROUTER_API_KEY from os.getenv: {bool(os.getenv('OPENROUTER_API_KEY'))}")
print(f"OPENROUTER_API_KEY length: {len(os.getenv('OPENROUTER_API_KEY', ''))}")
print(f"OPENROUTER_API_KEY value: {repr(os.getenv('OPENROUTER_API_KEY', ''))[:50]}")
print(f"activities.OPENROUTER_API_KEY: {bool(activities.OPENROUTER_API_KEY)}")
print(f"activities.OPENROUTER_API_KEY length: {len(activities.OPENROUTER_API_KEY)}")
print(f"activities.OPENROUTER_API_KEY value: {repr(activities.OPENROUTER_API_KEY)[:50]}")
print("========================\n")

async def connect_client():
    """
    Be tolerant to SDK signature differences:
    - Newer SDKs accept address="host:port"
    - Some builds expect target_host + target_port
    """
    try:
        # Most common signature
        return await Client.connect(f"{HOST}:{PORT}", namespace=NAMESPACE)
    except TypeError:
        # Fallback signature
        return await Client.connect(target_host=HOST, target_port=PORT, namespace=NAMESPACE)

async def main():
    client = await connect_client()
    worker = Worker(
        client=client,
        task_queue=TASK_QUEUE,
        workflows=[SocialPostWorkflow, PostToSocialMediaWorkflow],
        activities=[
            generate_base_draft, 
            curate_for_platform,
            post_to_linkedin,
            get_linkedin_profile,
            mock_post_to_linkedin,
            post_to_x,
            get_x_profile,
            mock_post_to_x
        ],
    )
    print(f"Worker ready on task queue '{TASK_QUEUE}' (namespace='{NAMESPACE}')")
    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())
