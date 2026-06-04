class EmployeeNotFoundException(Exception):

    def __init__(self):

        super().__init__("Employee not found")

        self.message = "Employee not found"


class InvalidTransitionException(Exception):

    def __init__(self, current_state, new_state):

        message = (
            f"Invalid transition from "
            f"{current_state} to {new_state}"
        )

        super().__init__(message)

        self.message = message


class PermissionDeniedException(Exception):

    def __init__(self):

        super().__init__("Permission denied")

        self.message = "Permission denied"