# worker.py
import os
import asyncio
from temporalio.client import Client
from temporalio.worker import Worker

from workflows import SocialPostWorkflow
from activities import generate_base_draft, curate_for_platform

TASK_QUEUE = os.getenv("TEMPORAL_TASK_QUEUE", "social-post-queue")
NAMESPACE = os.getenv("TEMPORAL_NAMESPACE", "default")
HOST = os.getenv("TEMPORAL_HOST", "localhost")
PORT = int(os.getenv("TEMPORAL_PORT", "7233"))

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
        workflows=[SocialPostWorkflow],
        activities=[generate_base_draft, curate_for_platform],
    )
    print(f"Worker ready on task queue '{TASK_QUEUE}' (namespace='{NAMESPACE}')")
    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())