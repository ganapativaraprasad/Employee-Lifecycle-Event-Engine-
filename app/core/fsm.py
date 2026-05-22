from app.core.enums.employee_state import (
    EmployeeState
)


ALLOWED_TRANSITIONS = {

    EmployeeState.HIRED: [
        EmployeeState.ONBOARDING
    ],

    EmployeeState.ONBOARDING: [
        EmployeeState.ACTIVE
    ],

    EmployeeState.ACTIVE: [
        EmployeeState.ON_LEAVE,
        EmployeeState.TRANSFERRED,
        EmployeeState.SUSPENDED,
        EmployeeState.OFFBOARDED
    ],

    EmployeeState.ON_LEAVE: [
        EmployeeState.ACTIVE,
        EmployeeState.OFFBOARDED
    ],

    EmployeeState.TRANSFERRED: [
        EmployeeState.ACTIVE
    ],

    EmployeeState.SUSPENDED: [
        EmployeeState.ACTIVE,
        EmployeeState.OFFBOARDED
    ],

    EmployeeState.OFFBOARDED: [
        EmployeeState.ACTIVE
    ]
}

def is_transition_allowed(
    current_state: EmployeeState,
    new_state: EmployeeState
) -> bool:

    allowed_states = ALLOWED_TRANSITIONS.get(
        current_state,
        []
    )

    return new_state in allowed_states