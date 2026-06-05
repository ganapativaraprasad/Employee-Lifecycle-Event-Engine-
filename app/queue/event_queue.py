import asyncio
from typing import Any

event_queue: asyncio.Queue[Any] = asyncio.Queue()


async def publish_event(
    event_name: str,
    payload: dict
):

    await event_queue.put(
        {
            "event_name": event_name,
            "payload": payload
        }
    )