from enum import Enum


class UserRole(str, Enum):
    EMPLOYEE = "EMPLOYEE"
    HR_MANAGER = "HR_MANAGER"
    ADMIN = "ADMIN"