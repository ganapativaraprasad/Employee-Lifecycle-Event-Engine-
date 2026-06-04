import asyncio

event_queue = asyncio.Queue()


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