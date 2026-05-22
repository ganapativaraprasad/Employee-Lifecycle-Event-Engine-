from enum import Enum


class EmployeeState(str, Enum):
    HIRED = "HIRED"
    ONBOARDING = "ONBOARDING"
    ACTIVE = "ACTIVE"
    ON_LEAVE = "ON_LEAVE"
    TRANSFERRED = "TRANSFERRED"
    SUSPENDED = "SUSPENDED"
    OFFBOARDED = "OFFBOARDED"