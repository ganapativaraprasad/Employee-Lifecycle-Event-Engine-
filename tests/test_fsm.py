import sys
import os

sys.path.insert(
    0,
    os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            ".."
        )
    )
)
from app.core.fsm import is_transition_allowed
from app.core.enums.employee_state import EmployeeState

from app.core.fsm import (
    is_transition_allowed
)

from app.core.enums.employee_state import (
    EmployeeState
)


# VALID TRANSITIONS

def test_hired_to_onboarding():

    assert is_transition_allowed(

        EmployeeState.HIRED,

        EmployeeState.ONBOARDING

    ) is True


def test_onboarding_to_active():

    assert is_transition_allowed(

        EmployeeState.ONBOARDING,

        EmployeeState.ACTIVE

    ) is True


def test_active_to_on_leave():

    assert is_transition_allowed(

        EmployeeState.ACTIVE,

        EmployeeState.ON_LEAVE

    ) is True


def test_active_to_transferred():

    assert is_transition_allowed(

        EmployeeState.ACTIVE,

        EmployeeState.TRANSFERRED

    ) is True


def test_active_to_suspended():

    assert is_transition_allowed(

        EmployeeState.ACTIVE,

        EmployeeState.SUSPENDED

    ) is True


def test_active_to_offboarded():

    assert is_transition_allowed(

        EmployeeState.ACTIVE,

        EmployeeState.OFFBOARDED

    ) is True


def test_on_leave_to_active():

    assert is_transition_allowed(

        EmployeeState.ON_LEAVE,

        EmployeeState.ACTIVE

    ) is True


def test_on_leave_to_offboarded():

    assert is_transition_allowed(

        EmployeeState.ON_LEAVE,

        EmployeeState.OFFBOARDED

    ) is True


# INVALID TRANSITIONS

def test_hired_to_active():

    assert is_transition_allowed(

        EmployeeState.HIRED,

        EmployeeState.ACTIVE

    ) is False


def test_hired_to_offboarded():

    assert is_transition_allowed(

        EmployeeState.HIRED,

        EmployeeState.OFFBOARDED

    ) is False


def test_onboarding_to_offboarded():

    assert is_transition_allowed(

        EmployeeState.ONBOARDING,

        EmployeeState.OFFBOARDED

    ) is False


def test_active_to_hired():

    assert is_transition_allowed(

        EmployeeState.ACTIVE,

        EmployeeState.HIRED

    ) is False


def test_transferred_to_offboarded():

    assert is_transition_allowed(

        EmployeeState.TRANSFERRED,

        EmployeeState.OFFBOARDED

    ) is False


def test_suspended_to_hired():

    assert is_transition_allowed(

        EmployeeState.SUSPENDED,

        EmployeeState.HIRED

    ) is False


def test_offboarded_to_on_leave():

    assert is_transition_allowed(

        EmployeeState.OFFBOARDED,

        EmployeeState.ON_LEAVE

    ) is False

# EXTRA VALID TRANSITIONS

def test_transferred_to_active():

    assert is_transition_allowed(
        EmployeeState.TRANSFERRED,
        EmployeeState.ACTIVE
    ) is True


def test_suspended_to_active():

    assert is_transition_allowed(
        EmployeeState.SUSPENDED,
        EmployeeState.ACTIVE
    ) is True


def test_suspended_to_offboarded():

    assert is_transition_allowed(
        EmployeeState.SUSPENDED,
        EmployeeState.OFFBOARDED
    ) is True


def test_offboarded_to_active():

    assert is_transition_allowed(
        EmployeeState.OFFBOARDED,
        EmployeeState.ACTIVE
    ) is True


# SAME STATE TESTS

def test_hired_to_hired():

    assert is_transition_allowed(
        EmployeeState.HIRED,
        EmployeeState.HIRED
    ) is False


def test_onboarding_to_onboarding():

    assert is_transition_allowed(
        EmployeeState.ONBOARDING,
        EmployeeState.ONBOARDING
    ) is False


def test_active_to_active():

    assert is_transition_allowed(
        EmployeeState.ACTIVE,
        EmployeeState.ACTIVE
    ) is False


def test_on_leave_to_on_leave():

    assert is_transition_allowed(
        EmployeeState.ON_LEAVE,
        EmployeeState.ON_LEAVE
    ) is False


def test_transferred_to_transferred():

    assert is_transition_allowed(
        EmployeeState.TRANSFERRED,
        EmployeeState.TRANSFERRED
    ) is False


def test_suspended_to_suspended():

    assert is_transition_allowed(
        EmployeeState.SUSPENDED,
        EmployeeState.SUSPENDED
    ) is False


def test_offboarded_to_offboarded():

    assert is_transition_allowed(
        EmployeeState.OFFBOARDED,
        EmployeeState.OFFBOARDED
    ) is False


# EXTRA INVALID TRANSITIONS

def test_hired_to_on_leave():

    assert is_transition_allowed(
        EmployeeState.HIRED,
        EmployeeState.ON_LEAVE
    ) is False


def test_hired_to_transferred():

    assert is_transition_allowed(
        EmployeeState.HIRED,
        EmployeeState.TRANSFERRED
    ) is False


def test_onboarding_to_on_leave():

    assert is_transition_allowed(
        EmployeeState.ONBOARDING,
        EmployeeState.ON_LEAVE
    ) is False


def test_onboarding_to_suspended():

    assert is_transition_allowed(
        EmployeeState.ONBOARDING,
        EmployeeState.SUSPENDED
    ) is False


def test_transferred_to_on_leave():

    assert is_transition_allowed(
        EmployeeState.TRANSFERRED,
        EmployeeState.ON_LEAVE
    ) is False


def test_transferred_to_suspended():

    assert is_transition_allowed(
        EmployeeState.TRANSFERRED,
        EmployeeState.SUSPENDED
    ) is False


def test_suspended_to_transferred():

    assert is_transition_allowed(
        EmployeeState.SUSPENDED,
        EmployeeState.TRANSFERRED
    ) is False


def test_offboarded_to_transferred():

    assert is_transition_allowed(
        EmployeeState.OFFBOARDED,
        EmployeeState.TRANSFERRED
    ) is False


def test_offboarded_to_suspended():

    assert is_transition_allowed(
        EmployeeState.OFFBOARDED,
        EmployeeState.SUSPENDED
    ) is False