from app.core.enums.user_role import UserRole


def can_transition(role):

    return role in [
        UserRole.ADMIN,
        UserRole.HR_MANAGER
    ]


def can_delete(role):

    return role == UserRole.ADMIN


def test_admin_can_transition():

    assert can_transition(
        UserRole.ADMIN
    )


def test_hr_can_transition():

    assert can_transition(
        UserRole.HR_MANAGER
    )


def test_employee_cannot_transition():

    assert not can_transition(
        UserRole.EMPLOYEE
    )


def test_admin_can_delete():

    assert can_delete(
        UserRole.ADMIN
    )


def test_hr_cannot_delete():

    assert not can_delete(
        UserRole.HR_MANAGER
    )


def test_employee_cannot_delete():

    assert not can_delete(
        UserRole.EMPLOYEE
    )