from enum import Enum


class AuditAction(str, Enum):
    TRANSITION = "TRANSITION"
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"