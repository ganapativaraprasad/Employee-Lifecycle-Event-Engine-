async def publish_event(
    event_name: str,
    payload: dict
):

    print("\n================ EVENT PUBLISHED ================")

    print(f"Event: {event_name}")

    print(f"Payload: {payload}")

    print("=================================================\n")