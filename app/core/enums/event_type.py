from enum import Enum


class EventType(str, Enum):
    COMPANY = "COMPANY"
    TEAM = "TEAM"
    PERSONAL = "PERSONAL"
