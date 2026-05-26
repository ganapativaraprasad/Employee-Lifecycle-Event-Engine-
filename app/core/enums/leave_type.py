from enum import Enum


class LeaveType(str, Enum):
    SICK = "SICK"
    PLANNED = "PLANNED"
    OPTIONAL = "OPTIONAL"
    LOP = "LOP"
    EARLY_LOGOUT = "EARLY_LOGOUT"
