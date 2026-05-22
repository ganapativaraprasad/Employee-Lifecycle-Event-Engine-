class EmployeeNotFoundException(Exception):

    def __init__(self):
        self.message = "Employee not found"


class InvalidTransitionException(Exception):

    def __init__(self, current_state, new_state):

        self.message = (
            f"Invalid transition from "
            f"{current_state} to {new_state}"
        )


class PermissionDeniedException(Exception):

    def __init__(self):
        self.message = "Permission denied"